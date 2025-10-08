import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { z } from "zod";

export const messagesRouter = createTRPCRouter({
  // Return all the messages from the AI
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
        value: z.string().min(1, { message: "Message is required" }),
      })
    )
    .mutation(async ({ input }) => {
      const newMessage = await prisma.message.create({
        data: {
          // <-- create a new message with the input value
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      });

      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value, // send the input value to the inngest
        },
      });

      return newMessage; // return the new message ex: { id: "1", content: "Hello, world!", role: "USER", type: "RESULT" }
    }),
});
