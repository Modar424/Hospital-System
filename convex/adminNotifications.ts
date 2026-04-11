import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔔 Admin Notifications - إشعارات الأدمن
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * إرسال إشعار للأدمن عند إنشاء تقرير جديد
 */
export const notifyAdminNewReport = mutation({
    args: {
        reportId: v.id("reports"),
        patientName: v.string(),
        doctorName: v.string(),
        diagnosis: v.string(),
    },
    handler: async (ctx, args) => {
        // البحث عن جميع المسؤولين
        const admins = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();

        // إرسال إخطار لكل مسؤول
        for (const admin of admins) {
            const identity = await ctx.auth.getUserIdentity();
            const fromUserId = identity
                ? (await ctx.db
                    .query("patients")
                    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                    .unique())
                : null;

            if (fromUserId) {
                await ctx.db.insert("notifications", {
                    fromUserId: fromUserId._id,
                    toUserId: admin._id,
                    type: "admin_report_notification",
                    message: `تقرير طبي جديد: المريض ${args.patientName} - التشخيص: ${args.diagnosis}`,
                    isRead: false,
                });
            }
        }
    },
});

/**
 * إرسال إشعار للأدمن عند إنشاء فاتورة جديدة
 */
export const notifyAdminNewInvoice = mutation({
    args: {
        invoiceId: v.id("invoices"),
        patientName: v.string(),
        doctorName: v.string(),
        totalAmount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const admins = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();

        for (const admin of admins) {
            const identity = await ctx.auth.getUserIdentity();
            const fromUserId = identity
                ? (await ctx.db
                    .query("patients")
                    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
                    .unique())
                : null;

            if (fromUserId) {
                const amountStr = args.totalAmount ? ` - المبلغ: ${args.totalAmount}` : "";
                await ctx.db.insert("notifications", {
                    fromUserId: fromUserId._id,
                    toUserId: admin._id,
                    type: "financial_report",
                    message: `فاتورة جديدة: المريض ${args.patientName} - الدكتور ${args.doctorName}${amountStr}`,
                    isRead: false,
                });
            }
        }
    },
});

/**
 * الحصول على إشعارات الأدمن المالية والتقارير
 */
export const getAdminNotifications = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") return [];

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", user._id))
            .collect();

        // تصفية الإشعارات المالية والتقارير فقط
        return notifications
            .filter(
                (n) =>
                    n.type === "financial_report" ||
                    n.type === "invoice_paid" ||
                    n.type === "admin_report_notification"
            )
            .sort((a, b) => b._creationTime - a._creationTime);
    },
});

/**
 * الحصول على عدد الإشعارات غير المقروءة للأدمن
 */
export const getAdminUnreadCount = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") return 0;

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", user._id))
            .collect();

        return notifications.filter(
            (n) =>
                !n.isRead &&
                (n.type === "financial_report" ||
                    n.type === "invoice_paid" ||
                    n.type === "admin_report_notification")
        ).length;
    },
});

/**
 * تعيين إشعار كمقروء
 */
export const markAdminNotificationAsRead = mutation({
    args: {
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) throw new Error("Notification not found");

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user._id !== notification.toUserId) {
            throw new Error("Unauthorized to mark this notification");
        }

        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});
