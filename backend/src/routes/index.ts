import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contestantsRouter from "./contestants";
import splitsRouter from "./splits";
import tasksRouter from "./tasks";
import votesRouter from "./votes";
import compatibilityRouter from "./compatibility";
import geminiRouter from "./gemini";
import eventsRouter from "./events";
import cupidRouter from "./cupid/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/contestants", contestantsRouter);
router.use("/splits", splitsRouter);
router.use("/tasks", tasksRouter);
router.use("/votes", votesRouter);
router.use("/compatibility", compatibilityRouter);
router.use("/gemini", geminiRouter);
router.use("/events", eventsRouter);
router.use("/cupid", cupidRouter);

export default router;
