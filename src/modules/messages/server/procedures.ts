import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";


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
  getMany: protectedProcedure
  .input(
    z.object({
      projectId: z.string().min(1, { message: "Project ID is required" }),
    })
  )
  .query(async ({ input, ctx }) => { 
    const messages = await prisma.message.findMany({
      where: {
        projectId: input.projectId, // get all the messages for the project 
        project: { // get the project for the user
          userId: ctx.auth.userId, // get the messages for the user
        },
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
  create: protectedProcedure
    .input(
      z.object({
        value: z.string().min(1, { message: "Message is required" })
        .max(10000, { message: "Prompt is too long" }),
        projectId: z.string().min(1, { message: "Project ID is required" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingProject = await prisma.project.findUnique({
        where: { // get the project by id and user id
          id: input.projectId,
          userId: ctx.auth.userId,
        }
      })
      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }


      const newMessage = await prisma.message.create({ // create a new message with the input value
        data: {
          projectId: existingProject.id, // set the project id to the project id 
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
