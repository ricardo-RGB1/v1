import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { cache } from "react";

export const createTRPCContext = cache(async () => {
  return { auth: await auth() }; // pass the auth object to the context to access the user id
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  // pass the context to the TRPC server
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

/**
 * Middleware that ensures the user is authenticated before proceeding with the request.
 *
 * This middleware checks if the user has a valid userId in the authentication context.
 * If the user is not authenticated (no userId), it throws an UNAUTHORIZED error.
 * If the user is authenticated, it passes the auth object to the next middleware/procedure.
 *
 * @throws {TRPCError} UNAUTHORIZED - When the user is not logged in
 */
const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      auth: ctx.auth, // pass the auth object to the context to access the user id
    },
  });
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed); // use the isAuthed middleware to protect the procedure