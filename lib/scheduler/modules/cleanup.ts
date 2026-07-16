import { connectDB } from "@/lib/mongodb";
import { ScheduledTask } from "@/lib/models/ScheduledTask";
import type { SchedulerModule } from "../registry";

const mod: SchedulerModule = {
  name: "cleanup",
  taskTypes: ["cleanup"],

  async execute() {
    await connectDB();

    const maxAge = 30 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - maxAge);

    const result = await ScheduledTask.deleteMany({
      status: { $in: ["done", "failed"] },
      updatedAt: { $lt: cutoff },
    });

    return {
      success: true,
      message: `Cleaned up ${result.deletedCount} old tasks`,
    };
  },
};

export default mod;
