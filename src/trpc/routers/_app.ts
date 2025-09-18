import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { inngest } from "@/inngest/client";

/**
 * Main tRPC router that combines all sub-routers.
 * This is the entry point for all API routes in the application.
 */
export const appRouter = createTRPCRouter({
  // invokeInngest procedure that sends a message to the Inngest function
  invokeInngest: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await inngest.send({
        // <-- send the event to the Inngest function
        name: "test/hello.world",
        data: {
          // <-- data that will be sent to the Inngest function
          email: input.text, 
        },
      });
    }),
  createAI: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      // <-- query procedure that returns a greeting message based on the input text
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
