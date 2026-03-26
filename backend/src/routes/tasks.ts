import { Router, type IRouter } from "express";
import { db } from "../lib/db/src/index";
import { tasksTable, eventsTable } from "../lib/db/src/schema/index";
import { eq } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
} from "../lib/api-zod/src/generated/api";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
  res.json(tasks);
});

router.post("/", async (req, res) => {
  const body = CreateTaskBody.parse(req.body);
  const [task] = await db.insert(tasksTable).values({
    title: body.title,
    description: body.description,
    taskType: body.taskType,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    status: "upcoming",
  }).returning();

  await db.insert(eventsTable).values({
    type: "task_created",
    title: `New task: ${task.title}`,
    description: `A ${task.taskType} task has been added: ${task.description}`,
    relatedTaskId: task.id,
  });

  res.status(201).json(task);
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateTaskParams.parse(req.params);
  const body = UpdateTaskBody.parse(req.body);
  const [task] = await db.update(tasksTable)
    .set({
      status: body.status,
      winnerIds: body.winnerIds ?? null,
    })
    .where(eq(tasksTable.id, id))
    .returning();
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (body.status === "completed") {
    await db.insert(eventsTable).values({
      type: "task_completed",
      title: `Task completed: ${task.title}`,
      description: `The ${task.taskType} task "${task.title}" has been completed!`,
      relatedTaskId: task.id,
    });
  }

  return res.json(task);
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteTaskParams.parse(req.params);
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.status(204).send();
});

export default router;
