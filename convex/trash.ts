import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ TRASH - سلة المحذوفات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** نقل إشعار إلى سلة المحذوفات */
export const deleteNotification = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const notif = await ctx.db.get(args.notificationId);
        if (!notif) throw new Error("Not found");
        await ctx.db.patch(args.notificationId, { isDeleted: true });
    },
});

/** استعادة إشعار من سلة المحذوفات */
export const restoreNotification = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        await ctx.db.patch(args.notificationId, { isDeleted: false });
    },
});

/** حذف نهائي للإشعار */
export const permanentDeleteNotification = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        await ctx.db.delete(args.notificationId);
    },
});

/** الحصول على سلة المحذوفات للمستخدم الحالي */
export const getMyTrash = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const deleted = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", user._id))
            .collect();

        return deleted
            .filter((n) => n.isDeleted === true)
            .sort((a, b) => b._creationTime - a._creationTime);
    },
});

/** الحصول على سلة المحذوفات للأدمن (الإشعارات المالية + التقارير المحذوفة) */
export const getAdminTrash = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") return [];

        const deleted = await ctx.db
            .query("notifications")
            .withIndex("by_recipient", (q) => q.eq("toUserId", user._id))
            .collect();

        return deleted
            .filter((n) => n.isDeleted === true)
            .sort((a, b) => b._creationTime - a._creationTime);
    },
});

/** المواعيد في سلة المحذوفات (المواعيد المكنسلة المنقولة للـ Trash) */
export const getCancelledAppointments = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || (user.role !== "secretary" && user.role !== "admin" && user.role !== "doctor")) return [];

        // احصل على جميع المواعيد وصفّ فقط المكنسلة والمكتملة التي نُقلت للـ Trash (trashedAt موجود)
        const allAppointments = await ctx.db.query("appointments").collect();
        let trashed = allAppointments.filter((apt) => (apt.status === "cancelled" || apt.status === "completed") && apt.trashedAt);

        // إذا كان الدكتور، عرّض فقط مواعيده الخاصة
        if (user.role === "doctor" && user.doctorId) {
            trashed = trashed.filter((apt) => apt.doctorId === user.doctorId);
        }

        return await Promise.all(
            trashed.map(async (apt) => {
                const patient = await ctx.db.get(apt.patientId);
                const doctor = apt.doctorId ? await ctx.db.get(apt.doctorId) : null;
                
                // الحصول على ملف المريض من patientProfiles
                const patientProfile = patient ? await ctx.db
                    .query("patientProfiles")
                    .withIndex("by_patient", (q) => q.eq("patientId", apt.patientId))
                    .unique() : null;

                // هل يوجد فاتورة لهذا الموعد؟
                const invoice = await ctx.db
                    .query("invoices")
                    .withIndex("by_appointment", (q) => q.eq("appointmentId", apt._id))
                    .first();

                // هل يوجد تقرير لهذا الموعد؟
                const report = await ctx.db
                    .query("reports")
                    .withIndex("by_appointment", (q) => q.eq("appointmentId", apt._id))
                    .first();

                return { 
                    ...apt,
                    hasInvoice: !!invoice,
                    hasReport: !!report,
                    patient: {
                        _id: patient?._id,
                        name: patient?.name,
                        email: patient?.email,
                    },
                    patientProfile: {
                        phone: patientProfile?.phone,
                        dateOfBirth: patientProfile?.dateOfBirth,
                        gender: patientProfile?.gender,
                        bloodType: patientProfile?.bloodType,
                        address: patientProfile?.address,
                        medicalHistory: patientProfile?.medicalHistory,
                        allergies: patientProfile?.allergies,
                        notes: patientProfile?.notes,
                    },
                    doctor: {
                        _id: doctor?._id,
                        name: doctor?.name,
                        category: doctor?.category,
                        expertise: doctor?.expertise,
                        experience: doctor?.experience,
                        contact: doctor?.contact,
                        bio: doctor?.bio,
                    }
                };
            })
        );
    },
});

/** الفواتير المدفوعة */
export const getPaidInvoices = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || (user.role !== "secretary" && user.role !== "admin")) return [];

        const invoices = await ctx.db.query("invoices").collect();
        return invoices.filter((inv) => inv.status === "paid");
    },
});

/** نقل الموعد إلى سلة المحذوفات (soft delete - بدون حذف نهائي) */
export const moveAppointmentToTrash = mutation({
    args: { appointmentId: v.id("appointments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || (user.role !== "secretary" && user.role !== "admin" && user.role !== "doctor")) {
            throw new Error("You do not have permission");
        }

        // نقل الموعد للـ Trash بوضع timestamp - الموعد سيبقى في قاعدة البيانات
        await ctx.db.patch(args.appointmentId, { trashedAt: Date.now() });
    },
});

/** حذف نهائي للموعد من سلة المحذوفات */
export const permanentDeleteAppointment = mutation({
    args: { appointmentId: v.id("appointments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || (user.role !== "secretary" && user.role !== "admin" && user.role !== "doctor")) {
            throw new Error("You do not have permission to delete appointments");
        }

        await ctx.db.delete(args.appointmentId);
    },
});

/** استعادة موعد من سلة المحذوفات إلى Appointments */
export const restoreAppointment = mutation({
    args: { 
        appointmentId: v.id("appointments"), 
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("completed"),
            v.literal("cancelled")
        )
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || (user.role !== "secretary" && user.role !== "admin" && user.role !== "doctor")) {
            throw new Error("You do not have permission to restore appointments");
        }

        // استعادة الموعد بحذف trashedAt وتعديل الحالة
        await ctx.db.patch(args.appointmentId, { 
            status: args.status as "pending" | "confirmed" | "completed" | "cancelled",
            trashedAt: undefined
        });
    },
});

