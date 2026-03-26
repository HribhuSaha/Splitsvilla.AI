import { Router, type IRouter } from "express";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import swipesRouter from "./swipes";
import matchesRouter from "./matches";
import messagesRouter from "./messages";
import keysRouter from "./keys";

const router: IRouter = Router();

router.use(authRouter);
router.use("/profiles", profilesRouter);
router.use(swipesRouter);
router.use(matchesRouter);
router.use(messagesRouter);
router.use(keysRouter);

export default router;
