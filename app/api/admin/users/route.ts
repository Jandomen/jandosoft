import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Store } from "@/lib/models/Store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query, "-password")
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
