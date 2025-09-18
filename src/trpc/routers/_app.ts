import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';



/**
 * Main tRPC router that combines all sub-routers.
 * This is the entry point for all API routes in the application.
 */
export const appRouter = createTRPCRouter({
  /**
   * Hello procedure that accepts a text input and returns a greeting.
   * 
   * @param input - Object containing the text to greet
   * @param input.text - The text string to include in the greeting
   * @returns Object with a greeting message
   */
  hello: baseProcedure // <-- base procedure is a helper function that creates a procedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => { // <-- query procedure that returns a greeting message based on the input text
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;