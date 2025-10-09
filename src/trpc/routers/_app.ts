import { projectsRouter } from "@/modules/projects/server/procedures";
import { createTRPCRouter } from "../init";
import { messagesRouter } from "@/modules/messages/server/procedures";

/**
 * Main tRPC router that combines all sub-routers.
 * This is the entry point for all API routes in the application.
 */
export const appRouter = createTRPCRouter({
  messages: messagesRouter, 
  projects: projectsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
