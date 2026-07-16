import { connectDB } from "@/lib/mongodb";
import { ScheduledTask } from "@/lib/models/ScheduledTask";

export interface SchedulerModule {
  name: string;
  taskTypes: string[];
  execute: (task: any) => Promise<{ success: boolean; message?: string; error?: string }>;
}

interface RunResult {
  moduleName: string;
  taskId: string;
  taskType: string;
  success: boolean;
  message?: string;
  error?: string;
  durationMs: number;
}

interface SchedulerReport {
  startedAt: Date;
  finishedAt: Date;
  totalDurationMs: number;
  totalTasks: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: RunResult[];
  errors: string[];
}

const modules: SchedulerModule[] = [];
const LOCK_KEY = "scheduler_lock";
const LOCK_TTL_MS = 4 * 60 * 1000;
const MAX_PER_RUN = 50;

let lockTimestamp = 0;

export function registerModule(mod: SchedulerModule) {
  modules.push(mod);
}

export function getModules(): SchedulerModule[] {
  return [...modules];
}

async function acquireLock(): Promise<boolean> {
  const now = Date.now();
  if (lockTimestamp && now - lockTimestamp < LOCK_TTL_MS) {
    return false;
  }
  lockTimestamp = now;
  return true;
}

function releaseLock() {
  lockTimestamp = 0;
}

function log(level: "INFO" | "WARN" | "ERROR", module: string, message: string, extra?: any) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level}] [${module}]`;
  if (level === "ERROR") {
    console.error(`${prefix} ${message}`, extra || "");
  } else if (level === "WARN") {
    console.warn(`${prefix} ${message}`, extra || "");
  } else {
    console.log(`${prefix} ${message}`, extra || "");
  }
}

function getHandler(taskType: string): SchedulerModule | undefined {
  return modules.find((m) => m.taskTypes.includes(taskType));
}

export async function runScheduler(): Promise<SchedulerReport> {
  const startedAt = new Date();
  const report: SchedulerReport = {
    startedAt,
    finishedAt: new Date(),
    totalDurationMs: 0,
    totalTasks: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    results: [],
    errors: [],
  };

  log("INFO", "scheduler", `=== Scheduler started | ${modules.length} modules registered | types: ${modules.map((m) => m.taskTypes.join(",")).join(", ")}`);

  if (!(await acquireLock())) {
    log("WARN", "scheduler", "Lock active — another run is in progress. Skipping.");
    report.errors.push("Lock active — skipped");
    report.finishedAt = new Date();
    report.totalDurationMs = report.finishedAt.getTime() - startedAt.getTime();
    return report;
  }

  try {
    await connectDB();

    const now = new Date();
    const tasks = await ScheduledTask.find({
      status: "pending",
      runAt: { $lte: now },
    })
      .sort({ runAt: 1 })
      .limit(MAX_PER_RUN)
      .lean();

    report.totalTasks = tasks.length;
    log("INFO", "scheduler", `Found ${tasks.length} pending task(s)`);

    if (tasks.length === 0) {
      log("INFO", "scheduler", "No tasks to process");
      return report;
    }

    for (const task of tasks) {
      const taskId = (task._id as any).toString();
      const taskType = task.type;
      const handler = getHandler(taskType);

      if (!handler) {
        log("WARN", "scheduler", `No handler for task type "${taskType}" (task ${taskId})`);
      await ScheduledTask.updateOne(
        { _id: task._id },
        { $set: { status: "failed" }, $inc: { attempts: 1 }, error: `No handler for type: ${taskType}` }
      );
        report.skipped++;
        report.results.push({
          moduleName: "none",
          taskId,
          taskType,
          success: false,
          error: `No handler for type: ${taskType}`,
          durationMs: 0,
        });
        continue;
      }

      await ScheduledTask.updateOne(
        { _id: task._id },
        { $set: { status: "processing" }, $inc: { attempts: 1 } }
      );

      const taskStart = Date.now();
      let result: { success: boolean; message?: string; error?: string };

      try {
        result = await handler.execute(task);
      } catch (err: any) {
        result = { success: false, error: err.message || "Unknown error" };
      }

      const durationMs = Date.now() - taskStart;
      const finalStatus = result.success ? "done" : "failed";

      await ScheduledTask.updateOne(
        { _id: task._id },
        {
          $set: { status: finalStatus, ...(result.error ? { error: result.error } : {}) },
        }
      );

      if (result.success) {
        log("INFO", handler.name, `✓ Task ${taskId} (${taskType}) — ${result.message || "done"} [${durationMs}ms]`);
        report.succeeded++;
      } else {
        log("ERROR", handler.name, `✖ Task ${taskId} (${taskType}) — ${result.error} [${durationMs}ms]`);
        report.failed++;
        report.errors.push(`${taskType}:${taskId} — ${result.error}`);
      }

      report.processed++;
      report.results.push({
        moduleName: handler.name,
        taskId,
        taskType,
        success: result.success,
        message: result.message,
        error: result.error,
        durationMs,
      });
    }
  } catch (err: any) {
    log("ERROR", "scheduler", `Fatal error: ${err.message}`, err.stack);
    report.errors.push(`Fatal: ${err.message}`);
  } finally {
    releaseLock();
    report.finishedAt = new Date();
    report.totalDurationMs = report.finishedAt.getTime() - startedAt.getTime();
    log(
      "INFO",
      "scheduler",
      `=== Scheduler finished | ${report.processed}/${report.totalTasks} processed | ${report.succeeded} ok, ${report.failed} failed, ${report.skipped} skipped | ${report.totalDurationMs}ms`
    );
  }

  return report;
}
