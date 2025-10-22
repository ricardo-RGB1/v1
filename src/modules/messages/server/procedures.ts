import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { z } from "zod";


/**
 * Messages router - handles all message-related operations for projects
 * Each message is associated with an individual project and represents either user input or AI responses
 */
export const messagesRouter = createTRPCRouter({ 
  /**
   * getMany - Retrieves all messages for a specific project
   * 
   * Input: 
   * - projectId: string (required) - The ID of the project to fetch messages for
   * 
   * Returns: Array of messages with their associated fragments, ordered by updatedAt (ascending)
   * Each message includes: id, content, role, type, createdAt, updatedAt, and fragment data
   */
  getMany: baseProcedure
  .input(
    z.object({
      projectId: z.string().min(1, { message: "Project ID is required" }),
    })
  )
  .query(async ({ input }) => { 
    const messages = await prisma.message.findMany({
      where: {
        projectId: input.projectId, // get all the messages for the project 
      },
      include: {
        fragment: true,
      },
      orderBy: {
        updatedAt: "asc", // order by updatedAt in ascending order
      },
    });
    return messages;
  }), 

  /**
   * create - Creates a new user message and triggers the AI code generation process
   * 
   * Input:
   * - value: string (1-10000 chars) - The user's message/prompt content
   * - projectId: string (required) - The ID of the project this message belongs to
   * 
   * Process:
   * 1. Creates a new USER message in the database with type "RESULT"
   * 2. Triggers the "code-agent/run" Inngest event to process the user's request
   * 3. Returns the created message object
   * 
   * Returns: The newly created message object with id, content, role, type, etc.
   */
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
