import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔔 BASE HELPERS - أدوات أساسية لكل الإشعارات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ✅ Helper - إرسال إشعار واحد
export async function sendNotification(
  ctx: MutationCtx,
  fromUserId: Id<"patients">,
  toUserId: Id<"patients">,
  type: "meeting_request" | "general" | "invoice_created" | "patient_message_to_secretary" | "secretary_message_to_patient" | "secretary_message_to_doctor" | "doctor_message_to_secretary" | "appointment_created" | "appointment_confirmed" | "appointment_cancelled" | "appointment_completed" | "report_created" | "report_available" | "role_assigned" | "promoted_to_admin" | "promoted_to_doctor" | "promoted_to_secretary" | "demoted" | "invoice_paid",
  message: string
) {
  return await ctx.db.insert("notifications", {
    fromUserId,
    toUserId,
    type,
    message,
    isRead: false,
  });
}

// ✅ Helper - إرسال لعدة أشخاص
export async function sendNotificationToMany(
  ctx: MutationCtx,
  fromUserId: Id<"patients">,
  toUserIds: Id<"patients">[],
  type: "meeting_request" | "general" | "invoice_created" | "patient_message_to_secretary" | "secretary_message_to_patient" | "secretary_message_to_doctor" | "doctor_message_to_secretary" | "appointment_created" | "appointment_confirmed" | "appointment_cancelled" | "appointment_completed" | "report_created" | "report_available" | "role_assigned" | "promoted_to_admin" | "promoted_to_doctor" | "promoted_to_secretary" | "demoted" | "invoice_paid",
  message: string
) {
  return Promise.all(
    toUserIds.map((toUserId) =>
      sendNotification(ctx, fromUserId, toUserId, type, message)
    )
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📬 QUERIES & MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// الأدمن يرسل إشعار لقاء للدكتور
export const sendMeetingRequest = mutation({
    args: {
        toDoctorUserId: v.id("patients"),
        message:        v.string(),
        scheduledAt:    v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "admin") {
            throw new Error("Only admins can send meeting requests");
        }

        const target = await ctx.db.get(args.toDoctorUserId);
        if (!target || target.role !== "doctor") {
            throw new Error("Target user is not a doctor");
        }

        await ctx.db.insert("notifications", {
            fromUserId:  caller._id,
            toUserId:    args.toDoctorUserId,
            type:        "meeting_request",
            message:     args.message,
            isRead:      false,
            scheduledAt: args.scheduledAt,
        });
    },
});

// الدكتور يرى إشعاراته
export const myNotifications = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller) return [];

        return await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", caller._id))
            .order("desc")
            .collect()
            .then(results => results.filter(n => !n.isDeleted));
    },
});

export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const notif = await ctx.db.get(args.notificationId);
        if (!notif) throw new Error("Not found");

        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

export const deleteNotification = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const notif = await ctx.db.get(args.notificationId);
        if (!notif) throw new Error("Notification not found");

        // حذف الإشعار بوضع isDeleted = true (soft delete)
        await ctx.db.patch(args.notificationId, { isDeleted: true });
    },
});

export const getUnreadCount = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller) return 0;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", caller._id))
            .collect();

        return unread.filter(n => !n.isRead && !n.isDeleted).length;
    },
});
