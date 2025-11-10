import { generateSlug } from "random-word-slugs";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { consumerCredits } from "@/lib/usage";




/**
 * Projects router - handles all project-related operations
 * Each project represents a code generation workspace that contains messages and fragments
 */
export const projectsRouter = createTRPCRouter({
  /**
   * getOne - Retrieves a single project by its ID
   * 
   * Input:
   * - id: string (required) - The unique identifier of the project to fetch
   * 
   * Returns: Project object with all project details (id, name, createdAt, updatedAt, etc.)
   * 
   * Throws: TRPCError with "NOT_FOUND" code if project doesn't exist
   */
  getOne: protectedProcedure
  .input(
    z.object({
      id: z.string().min(1, { message: "Project ID is required" }),
    })
  )
  .query(async ({ input, ctx }) => {
    const existingProject = await prisma.project.findUnique({
      where: {
        id: input.id,
        userId: ctx.auth.userId, // get the project for the user
      },
    });

    if (!existingProject) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
    }

    return existingProject;
  }),

  /**
   * getMany - Retrieves all projects for the current user
   * 
   * Input: None
   * 
   * Returns: Array of all projects ordered by updatedAt (ascending)
   * Each project includes: id, name, createdAt, updatedAt, and other project metadata
   */
  getMany: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.project.findMany({
      where: {
        userId: ctx.auth.userId, // get all the projects for the user
      },
      orderBy: {
        updatedAt: "asc", // order by updatedAt in ascending order
      },
    });
    return projects;
  }),

  /**
   * create - Creates a new project with an initial user message and triggers AI code generation
   * 
   * Input:
   * - value: string (1-10000 chars) - The initial prompt/message content for the project
   * 
   * Process:
   * 1. Creates a new project with a randomly generated kebab-case name
   * 2. Creates an initial USER message with the provided prompt content
   * 3. Triggers the "code-agent/run" Inngest event to begin AI code generation
   * 4. Returns the created project object
   * 
   * Returns: The newly created project object with id, name, createdAt, updatedAt, etc.
   */
  create: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Prompt is required" })
          .max(10000, { message: "Prompt is too long" }),
      })
    )
    .mutation(async ({ input, ctx }) => {

           // ********** Consume credits **********
           try { 
            await consumerCredits(); 
          } catch (error ) {
            if (error instanceof Error) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Something went wrong with your request. Please try again."});
            } else {
              throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: "You have reached the maximum number of requests. Please upgrade to a paid plan.",
              })
            }
          }
      const createdProject = await prisma.project.create({
        data: {
          userId: ctx.auth.userId, // 
          name: generateSlug(2, { format: "kebab" }),
          messages: {
            create: {
              content: input.value,
              role: "USER",
              type: "RESULT",
            },
          },
        },
      });

      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value, // send the input value to the inngest
          projectId: createdProject.id,
        },
      });

      return createdProject;
    }),
});
