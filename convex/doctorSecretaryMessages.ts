import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 Doctor-Secretary Messages - الرسائل بين الدكتور والسكرتيرة
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * إرسال رسالة من الدكتور إلى السكرتيرة
 */
export const doctorSendToSecretary = mutation({
    args: {
        toSecretaryUserId: v.id("patients"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const doctor = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!doctor || doctor.role !== "doctor") {
            throw new Error("Only doctors can send messages");
        }

        const secretary = await ctx.db.get(args.toSecretaryUserId);
        if (!secretary || secretary.role !== "secretary") {
            throw new Error("Recipient must be a secretary");
        }

        await ctx.db.insert("notifications", {
            fromUserId: doctor._id,
            toUserId: args.toSecretaryUserId,
            type: "doctor_to_secretary_message",
            message: args.message,
            isRead: false,
        });
    },
});

/**
 * إرسال رسالة من السكرتيرة إلى الدكتور
 */
export const secretarySendToDoctor = mutation({
    args: {
        toDoctorUserId: v.id("patients"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const secretary = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!secretary || secretary.role !== "secretary") {
            throw new Error("Only secretaries can send messages");
        }

        const doctor = await ctx.db.get(args.toDoctorUserId);
        if (!doctor || doctor.role !== "doctor") {
            throw new Error("Recipient must be a doctor");
        }

        await ctx.db.insert("notifications", {
            fromUserId: secretary._id,
            toUserId: args.toDoctorUserId,
            type: "secretary_to_doctor_message",
            message: args.message,
            isRead: false,
        });
    },
});

/**
 * الحصول على الرسائل المستقبلة للدكتور من السكرتيرات
 */
export const getDoctorMessages = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const doctor = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!doctor || doctor.role !== "doctor") return [];

        const messages = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", doctor._id))
            .collect();

        // تصفية الرسائل من السكرتيرات فقط
        const fromSecretaries = messages
            .filter((m) => m.type === "secretary_to_doctor_message")
            .sort((a, b) => b._creationTime - a._creationTime);

        // إضافة بيانات المرسل
        return Promise.all(
            fromSecretaries.map(async (msg) => {
                const sender = await ctx.db.get(msg.fromUserId);
                return {
                    ...msg,
                    senderName: sender?.name || "Unknown",
                    senderEmail: sender?.email || "Unknown",
                };
            })
        );
    },
});

/**
 * الحصول على الرسائل المستقبلة للسكرتيرة من الأطباء
 */
export const getSecretaryMessages = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const secretary = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!secretary || secretary.role !== "secretary") return [];

        const messages = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", secretary._id))
            .collect();

        // تصفية الرسائل من الأطباء فقط
        const fromDoctors = messages
            .filter((m) => m.type === "doctor_to_secretary_message")
            .sort((a, b) => b._creationTime - a._creationTime);

        // إضافة بيانات المرسل
        return Promise.all(
            fromDoctors.map(async (msg) => {
                const sender = await ctx.db.get(msg.fromUserId);
                return {
                    ...msg,
                    senderName: sender?.name || "Unknown",
                    senderEmail: sender?.email || "Unknown",
                };
            })
        );
    },
});

/**
 * الحصول على عدد الرسائل غير المقروءة للدكتور
 */
export const getDoctorUnreadMessageCount = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;

        const doctor = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!doctor || doctor.role !== "doctor") return 0;

        const messages = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", doctor._id))
            .collect();

        return messages.filter(
            (m) =>
                !m.isRead && m.type === "secretary_to_doctor_message"
        ).length;
    },
});

/**
 * الحصول على عدد الرسائل غير المقروءة للسكرتيرة
 */
export const getSecretaryUnreadMessageCount = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;

        const secretary = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!secretary || secretary.role !== "secretary") return 0;

        const messages = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", secretary._id))
            .collect();

        return messages.filter(
            (m) =>
                !m.isRead && m.type === "doctor_to_secretary_message"
        ).length;
    },
});

/**
 * تعيين رسالة كمقروءة
 */
export const markMessageAsRead = mutation({
    args: {
        messageId: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user._id !== message.toUserId) {
            throw new Error("Unauthorized to mark this message");
        }

        await ctx.db.patch(args.messageId, { isRead: true });
    },
});

/**
 * الحصول على قائمة جميع السكرتيرات (للأطباء)
 */
export const getAllSecretaries = query({
    handler: async (ctx) => {
        const secretaries = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "secretary"))
            .collect();
        
        return secretaries.map(s => ({
            _id: s._id,
            name: s.name,
            email: s.email,
        }));
    },
});

/**
 * الحصول على قائمة جميع الأطباء (للسكرتيرات)
 */
export const getAllDoctors = query({
    handler: async (ctx) => {
        const doctors = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "doctor"))
            .collect();
        
        return doctors.map(d => ({
            _id: d._id,
            name: d.name,
            email: d.email,
        }));
    },
});
