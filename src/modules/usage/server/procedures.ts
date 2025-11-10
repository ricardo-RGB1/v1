import { getUsageStatus } from "@/lib/usage"; 
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"; 


/**
 * Usage router for handling user credit and rate limiting operations.
 * 
 * This router provides procedures for:
 * - Checking current usage status and remaining credits
 * - Managing user rate limits based on the FREE_USAGE_POINTS system
 * 
 * All procedures are protected and require user authentication.
 */

export const usageRouter = createTRPCRouter({
    status: protectedProcedure.query(async () => { 
        try {
            const result = await getUsageStatus();
            return result; 
        } catch {
            return null; 
        }
    })
})