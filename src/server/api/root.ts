
import { createCallerFactory, createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { campaignRouter } from "./routers/campaign";
import { creativeRouter } from "./routers/creative";
import { projectRouter } from "./routers/project";
import { schedulerRouter } from "./routers/scheduler";
import { adminRouter } from "./routers/admin";


/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  project: projectRouter,
  campaign: campaignRouter,
  creative: creativeRouter,
  scheduler: schedulerRouter,
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
