import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { cupidAuthMiddleware } from "./middlewares/cupidAuthMiddleware";
import router from "./routes";

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cupidAuthMiddleware);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", router);

export default app;
