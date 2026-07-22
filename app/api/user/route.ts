import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Store } from "@/lib/models/Store";
import bcrypt from "bcryptjs";
import { getAuthFromCookies, getAuthFromHeaders } from "@/lib/auth";
import { getPlanConfig, getPlanLimitsFromConfig } from "@/lib/plan-config";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (auth) {
      await connectDB();
      const user = await User.findById(auth.userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const now = new Date();
      if (user.suspendedUntil && user.suspendedUntil < now) {
        user.isSuspended = false;
        user.suspendedUntil = null;
        await user.save();
      }
      const config = await getPlanConfig();
      const effectivePlan = user.plan || user.subscription;
      const isExpired = !!user.subscriptionExpiry && new Date(user.subscriptionExpiry) < now;
      const planForLimits = isExpired ? null : effectivePlan;
      const planLimits = getPlanLimitsFromConfig(config, planForLimits);
      const displaySubscription = isExpired ? null : user.subscription;

      console.log("vieltaUser:", {
        email: user.email,
        subscription: user.subscription,
        plan: user.plan,
        planStatus: user.planStatus,
        subscriptionStatus: user.subscriptionStatus,
        customerId: user.customerId,
        subscriptionId: user.stripeSubscriptionId,
        billingPeriod: user.billingPeriod,
        expiresAt: user.expiresAt,
        isExpired,
        planForLimits,
        planLimits,
      });

      return NextResponse.json({
        user: {
          email: user.email,
          name: user.name,
          createdAt: (user as any).createdAt,
          subscription: displaySubscription,
          plan: isExpired ? null : user.plan,
          planStatus: isExpired ? null : user.planStatus,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiry: user.subscriptionExpiry,
          expiresAt: user.expiresAt,
          billingPeriod: user.billingPeriod,
          customerId: user.customerId,
          isSuspended: user.isSuspended,
          emailVerified: user.emailVerified ?? false,
          organizationId: user.organizationId,
          role: user.role,
          planLimits,
        }
      });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const config = await getPlanConfig();
    const planLimits = getPlanLimitsFromConfig(config, user.subscription);
    const isExpired = !!user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date();
    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        subscription: isExpired ? null : user.subscription,
        subscriptionExpiry: user.subscriptionExpiry,
        subscriptionStatus: user.subscriptionStatus,
        isSuspended: user.isSuspended,
        emailVerified: user.emailVerified ?? false,
        organizationId: user.organizationId,
        role: user.role,
        planLimits,
      }
    });
  } catch (error) {
    console.error("GET user error:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();
    const user = await User.findByIdAndUpdate(
      auth.userId,
      { $set: body },
      { new: true }
    ).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const config = await getPlanConfig();
    const planLimits = getPlanLimitsFromConfig(config, user.subscription);

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry,
        subscriptionStatus: user.subscriptionStatus,
        isSuspended: user.isSuspended,
        organizationId: user.organizationId,
        role: user.role,
        planLimits,
      }
    });
  } catch (error) {
    console.error("PATCH user error:", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthFromHeaders(req) || await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { password } = await req.json();

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 403 });
    }

    const orgId = user.organizationId;
    const userEmail = user.email;
    const userId = user._id;

    // Get all storeIds before deleting stores
    const storeIds: mongoose.Types.ObjectId[] = [];
    if (orgId) {
      const stores = await Store.find({ organizationId: orgId }, "_id").lean();
      storeIds.push(...stores.map((s: any) => s._id));
    }

    // Also find stores by ownerEmail (fallback)
    const emailStores = await Store.find({ ownerEmail: userEmail }, "_id").lean();
    for (const s of emailStores) {
      if (!storeIds.some(id => id.equals(s._id))) storeIds.push(s._id);
    }

    const storeIdStrings = storeIds.map(id => id.toString());
    const userIdStr = userId.toString();

    // Delete all store-dependent collections
    const db = mongoose.connection.db;
    if (db) {
      const cleanupPromises: Promise<any>[] = [];

      // Collections linked by storeId (ObjectId)
      if (storeIds.length > 0) {
        cleanupPromises.push(db.collection("customers").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("appointments").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("widgetconfigs").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("emailsettings").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("integrations").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("restaurants").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("smslogs").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("pageviews").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("communications").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("nowpaymentspayments").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("payments").deleteMany({ storeId: { $in: storeIds } }));

        // Anonymize payments where user was a customer (keep for admin backup)
        cleanupPromises.push(db.collection("payments").updateMany(
          { customerEmail: userEmail },
          { $set: { customerEmail: "[eliminado]", customerName: "[usuario eliminado]" } }
        ));
        cleanupPromises.push(db.collection("nowpaymentspayments").updateMany(
          { customerEmail: userEmail },
          { $set: { customerEmail: "[eliminado]", customerName: "[usuario eliminado]" } }
        ));
        cleanupPromises.push(db.collection("apikeys").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("emaillogs").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("scheduledtasks").deleteMany({ storeId: { $in: storeIds } }));

        // WhatsApp collections
        cleanupPromises.push(db.collection("whatsappaccounts").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("whatsappconversations").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("whatsappmessages").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("whatsappcontacts").deleteMany({ storeId: { $in: storeIds } }));
        cleanupPromises.push(db.collection("whatsapptemplates").deleteMany({ storeId: { $in: storeIds } }));
      }

      // Collections linked by storeId (String)
      cleanupPromises.push(db.collection("conversationmemories").deleteMany({ storeId: { $in: storeIdStrings } }));
      cleanupPromises.push(db.collection("conversationsummaries").deleteMany({ storeId: { $in: storeIdStrings } }));

      // Collections linked by userId or email
      cleanupPromises.push(db.collection("notifications").deleteMany({ $or: [{ userId: userIdStr }, { organizationId: orgId }] }));
      cleanupPromises.push(db.collection("scheduledtasks").deleteMany({ userId: userIdStr }));
      cleanupPromises.push(db.collection("chatusages").deleteMany({ email: userEmail }));
      cleanupPromises.push(db.collection("contacts").deleteMany({ $or: [{ userId: userId }, { contactUserId: userId }] }));

      // Conversations and Messages (linked via participants or senderId)
      const convDocs = await db.collection("conversations").find({ "participants.userId": userId }).toArray();
      const convIds = convDocs.map((d: any) => d._id);
      if (convIds.length > 0) {
        cleanupPromises.push(db.collection("messages").deleteMany({ conversationId: { $in: convIds } }));
        cleanupPromises.push(db.collection("conversations").deleteMany({ _id: { $in: convIds } }));
      }

      // Invoices
      cleanupPromises.push(db.collection("invoices").deleteMany({ $or: [{ organizationId: orgId }, { userEmail }] }));

      // Organization
      if (orgId) {
        cleanupPromises.push(db.collection("organizations").deleteOne({ _id: orgId }));
      }

      await Promise.all(cleanupPromises);
    }

    // Finally delete stores and user
    if (orgId) {
      await Store.deleteMany({ organizationId: orgId });
    }
    await Store.deleteMany({ ownerEmail: userEmail });
    await User.findByIdAndDelete(auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Error al eliminar la cuenta" }, { status: 500 });
  }
}
