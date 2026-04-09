import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
            .collect();
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

        return unread.filter(n => !n.isRead).length;
    },
});
