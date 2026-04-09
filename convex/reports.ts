import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// الدكتور ينشئ تقرير طبي - بعد انتهاء الموعد مباشرة
// الدكتور ينشئ تقرير طبي - بعد انتهاء الموعد مباشرة
export const createReport = mutation({
    args: {
        appointmentId: v.id("appointments"),
        diagnosis: v.string(),
        medications: v.array(v.object({
            name: v.string(),
            dosage: v.optional(v.string()),
            frequency: v.optional(v.string()),
        })),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "doctor") {
            throw new Error("Only doctors can create reports");
        }

        const appointment = await ctx.db.get(args.appointmentId);
        if (!appointment) throw new Error("Appointment not found");

        // التحقق أن الموعد مؤكد أو مكتمل
        if (appointment.status !== "confirmed" && appointment.status !== "completed") {
            throw new Error("Can only create reports for confirmed or completed appointments");
        }

        // التحقق من أن الموعد لهذا الدكتور
        if (caller.doctorId && appointment.doctorId !== caller.doctorId) {
            throw new Error("You can only create reports for your own patients");
        }

        const patient = await ctx.db.get(appointment.patientId);
        if (!patient) throw new Error("Patient not found");

        const doctor = appointment.doctorId ? await ctx.db.get(appointment.doctorId) : null;

        // إنشاء التقرير
        const reportId = await ctx.db.insert("reports", {
            appointmentId: args.appointmentId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            patientName: patient.name,
            doctorName: doctor?.name ?? caller.name,
            diagnosis: args.diagnosis,
            medications: args.medications,
            notes: args.notes,
            createdAt: Date.now(),
        });

        // ربط التقرير بالموعد
        await ctx.db.patch(args.appointmentId, { reportId });

        // البحث عن السكرتاريين والمديرين لإرسال الإشعار
        const secretaries = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "secretary"))
            .collect();

        const admins = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .collect();

        const recipients = [...secretaries, ...admins];

        // إرسال إشعار لكل سكرتارية/مدير
        for (const recipient of recipients) {
            await ctx.db.insert("notifications", {
                fromUserId: caller._id,
                toUserId: recipient._id,
                type: "general",
                message: `تقرير طبي جديد من د.${doctor?.name ?? caller.name} للمريض ${patient.name}`,
                isRead: false,
            });
        }

        return reportId;
    },
});

// هل يوجد تقرير لهذا الموعد؟
export const getReportByAppointment = query({
    args: {
        appointmentId: v.id("appointments"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("reports")
            .withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
            .first();
    },
});

// المريض يشاهد تقاريره الطبية
export const myReports = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!patient) return [];

        const reports = await ctx.db
            .query("reports")
            .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
            .order("desc")
            .collect();

        // إخفاء التقارير التي حذفها المريض
        const visible = reports.filter(r => !r.deletedByPatient);

        return Promise.all(
            visible.map(async (report) => {
                const doctor = report.doctorId ? await ctx.db.get(report.doctorId) : null;
                const appointment = await ctx.db.get(report.appointmentId);
                return { ...report, doctor, appointment };
            })
        );
    },
});

// الدكتور يشاهد التقارير التي أنشأها
export const myReportsByDoctor = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "doctor") return [];

        if (!caller.doctorId) return [];

        const reports = await ctx.db
            .query("reports")
            .withIndex("by_doctor", (q) => q.eq("doctorId", caller.doctorId))
            .order("desc")
            .collect();

        return Promise.all(
            reports.map(async (report) => {
                const patient = await ctx.db.get(report.patientId);
                const appointment = await ctx.db.get(report.appointmentId);
                return { ...report, patient, appointment };
            })
        );
    },
});

// السكرتيرة والإدمن يشاهدان جميع التقارير
export const allReports = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        // فقط السكرتيرة والإدمن يمكنهم رؤية جميع التقارير
        if (!caller || (caller.role !== "secretary" && caller.role !== "admin")) return [];

        const reports = await ctx.db
            .query("reports")
            .order("desc")
            .collect();

        // إخفاء التقارير التي حذفتها السكرتيرة من واجهتها
        const visible = reports.filter(r => !r.deletedBySecretary);

        return Promise.all(
            visible.map(async (report) => {
                const patient = await ctx.db.get(report.patientId);
                const doctor = report.doctorId ? await ctx.db.get(report.doctorId) : null;
                const appointment = await ctx.db.get(report.appointmentId);
                return { ...report, patient, doctor, appointment };
            })
        );
    },
});

// تحديث التقرير
export const updateReport = mutation({
    args: {
        reportId: v.id("reports"),
        diagnosis: v.optional(v.string()),
        medications: v.optional(v.array(v.object({
            name: v.string(),
            dosage: v.optional(v.string()),
            frequency: v.optional(v.string()),
        }))),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "doctor") {
            throw new Error("Only doctors can update reports");
        }

        const report = await ctx.db.get(args.reportId);
        if (!report) throw new Error("Report not found");

        if (caller.doctorId && report.doctorId !== caller.doctorId) {
            throw new Error("You can only update your own reports");
        }

        const updates: Partial<typeof report> = {};
        if (args.diagnosis !== undefined) updates.diagnosis = args.diagnosis;
        if (args.medications !== undefined) updates.medications = args.medications;
        if (args.notes !== undefined) updates.notes = args.notes;

        await ctx.db.patch(args.reportId, updates);
    },
});

// حذف التقرير (للدكتور فقط)
export const deleteReport = mutation({
    args: {
        reportId: v.id("reports"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "doctor") {
            throw new Error("Only doctors can delete reports");
        }

        const report = await ctx.db.get(args.reportId);
        if (!report) throw new Error("Report not found");

        if (caller.doctorId && report.doctorId !== caller.doctorId) {
            throw new Error("You can only delete your own reports");
        }

        // فصل التقرير عن الموعد
        await ctx.db.patch(report.appointmentId, { reportId: undefined });

        // حذف التقرير
        await ctx.db.delete(args.reportId);
    },
});

// ── نظام الحذف الذكي للتقارير (نفس منطق المواعيد) ──────────────────────
// المريض يحذف التقرير من واجهته فقط
export const patientSoftDeleteReport = mutation({
    args: { reportId: v.id("reports") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!patient) throw new Error("User not found");

        const report = await ctx.db.get(args.reportId);
        if (!report) throw new Error("Report not found");
        if (report.patientId !== patient._id) throw new Error("Unauthorized");

        if (report.deletedBySecretary) {
            // كلاهما حذف → حذف نهائي
            await ctx.db.patch(report.appointmentId, { reportId: undefined });
            await ctx.db.delete(args.reportId);
        } else {
            await ctx.db.patch(args.reportId, { deletedByPatient: true });
        }
    },
});

// السكرتيرة تحذف التقرير - يختفي من واجهتها
export const secretarySoftDeleteReport = mutation({
    args: { reportId: v.id("reports") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const secretary = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!secretary || secretary.role !== "secretary") throw new Error("Unauthorized");

        const report = await ctx.db.get(args.reportId);
        if (!report) throw new Error("Report not found");

        if (report.deletedByPatient) {
            // كلاهما حذف → حذف نهائي
            await ctx.db.patch(report.appointmentId, { reportId: undefined });
            await ctx.db.delete(args.reportId);
        } else {
            await ctx.db.patch(args.reportId, { deletedBySecretary: true });
        }
    },
});
