import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { z } from "zod";


// Each message will be associated with an individual project 
export const messagesRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => { 
    const messages = await prisma.message.findMany({
      orderBy: {
        updatedAt: "asc", // order by updatedAt in ascending order
      },
    });
    return messages;
  }),

  create: baseProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: "Message is required" })
        .max(10000, { message: "Prompt is too long" }),
        projectId: z.string().min(1, { message: "Project ID is required" }),
      })
    )
    .mutation(async ({ input }) => {
      const newMessage = await prisma.message.create({ // create a new message with the input value
        data: {
          projectId: input.projectId,
          content: input.value, 
          role: "USER",
          type: "RESULT",
        },
      });

      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value, // send the input value to the inngest
          projectId: input.projectId, 
        },
      });

      return newMessage; // return the new message ex: { id: "1", content: "Hello, world!", role: "USER", type: "RESULT" }
    }),
});
