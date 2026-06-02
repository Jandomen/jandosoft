import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Store } from "@/lib/models/Store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const users = await User.find({}, "-password")
      .sort({ createdAt: -1 })
      .lean();

    const usersWithStoreCount = await Promise.all(
      (users as any[]).map(async (u) => {
        const storeCount = await Store.countDocuments({ ownerEmail: u.email });
        return { ...u, storeCount };
      })
    );

    return Response.json({ users: usersWithStoreCount });
  } catch (error) {
    console.error("Admin users error:", error);
    return Response.json({ error: "Error loading users" }, { status: 500 });
  }
}
