import { RateLimiterPrisma } from "rate-limiter-flexible"; 
import { prisma } from "./prisma"; 
import { auth } from "@clerk/nextjs/server";

const FREE_USAGE_POINTS = 3; 
const PRO_USAGE_POINTS = 100; 
const DURATION = 30 * 24 * 60 * 60; // 30 days 
const GENERATION_COST = 1; 



/** ********** Get Usage Tracker ********** 
 * Creates and returns a rate limiter instance configured for user usage tracking.
 * Uses Prisma as the storage backend with the Usage table.
 * 
 * If the user has pro access, they will have unlimited credits.
 * @returns {Promise<RateLimiterPrisma>} A configured rate limiter instance
 */
export async function getUsageTracker() {
    const { has } = await auth(); 
    const hasProAccess = has({ plan: "pro"});  

    const usageTracker = new RateLimiterPrisma({
        storeClient: prisma,
        tableName: "Usage", 
        points: hasProAccess ? PRO_USAGE_POINTS : FREE_USAGE_POINTS,
        duration: DURATION,
    });

    return usageTracker;
}
/** ********** Consumer Credits **********
 * Consumes credits for the authenticated user when they perform a generation action.
 * Deducts GENERATION_COST points from the user's available credits.
 * 
 * @throws {Error} When user is not authenticated
 * @returns {Promise<any>} Rate limiter result containing remaining points and reset time
 */
export async function consumerCredits() {
    const { userId } = await auth(); 

    if(!userId) {
        throw new Error("User not authenticated"); 
    }

    const usageTracker = await getUsageTracker();  
    const result = await usageTracker.consume(userId, GENERATION_COST); 

    return result; 
}
/** ********** Get Usage Status **********
 * Retrieves the current usage status for the authenticated user.
 * Shows remaining credits and when they will reset.
 * 
 * @throws {Error} When user is not authenticated  
 * @returns {Promise<any>} Rate limiter result with current usage information
 */

export async function getUsageStatus() {
    const { userId } = await auth(); 

    if(!userId) {
        throw new Error("User not authenticated");  
    }

    const usageTracker = await getUsageTracker(); 
    const result = await usageTracker.get(userId); 

    return result;  
}