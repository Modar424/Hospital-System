import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


// الدكتور ينشئ فاتورة - فقط للمواعيد المؤكدة والمنتهية
export const createInvoice = mutation({
    args: {
        appointmentId:    v.id("appointments"),
        patientCondition: v.string(),
        medications:      v.array(v.object({
            name:   v.string(),
            dosage: v.optional(v.string()),
        })),
        doctorFees: v.number(),
        notes:      v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "doctor") {
            throw new Error("Only doctors can create invoices");
        }

        const appointment = await ctx.db.get(args.appointmentId);
        if (!appointment) throw new Error("Appointment not found");

        // التحقق أن الموعد مؤكد وانتهى يومه
        if (appointment.status !== "confirmed" && appointment.status !== "completed") {
            throw new Error("Can only create invoices for confirmed or completed appointments");
        }

        const appointmentDate = new Date(appointment.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const apptDay = new Date(appointmentDate);
        apptDay.setHours(0, 0, 0, 0);

        if (apptDay > today) {
            throw new Error("Cannot create invoice before the appointment day");
        }

        const patient = await ctx.db.get(appointment.patientId);
        if (!patient) throw new Error("Patient not found");

        const doctor = appointment.doctorId ? await ctx.db.get(appointment.doctorId) : null;

        // التحقق أن الموعد لهذا الدكتور
        if (caller.doctorId && appointment.doctorId !== caller.doctorId) {
            throw new Error("You can only create invoices for your own patients");
        }

        // توليد رقم فاتورة فريد
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const invoiceId = await ctx.db.insert("invoices", {
            invoiceNumber,
            appointmentId:   args.appointmentId,
            patientId:       appointment.patientId,
            doctorId:        appointment.doctorId,
            patientName:     patient.name,
            doctorName:      doctor?.name ?? caller.name,
            patientCondition: args.patientCondition,
            medications:     args.medications,
            doctorFees:      args.doctorFees,
            status:          "pending_payment",
            notes:           args.notes,
        });

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
                message: `فاتورة جديدة من د.${doctor?.name ?? caller.name} للمريض ${patient.name} - رقم الفاتورة: ${invoiceNumber}`,
                isRead: false,
            });
        }

        return invoiceId;
    },
});

// المريض يرى فواتيره
export const myInvoices = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!patient) return [];

        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
            .collect();

        // إخفاء الفواتير التي حذفها المريض من واجهته
        return invoices.filter(inv => !inv.deletedByPatient);
    },
});

// السكرتارية ترى جميع الفواتير (مع إخفاء ما حذفته)
export const getAllInvoices = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || (caller.role !== "secretary" && caller.role !== "admin")) return [];

        const all = await ctx.db.query("invoices").order("desc").collect();
        // السكرتيرة لا ترى ما حذفته
        return all.filter(inv => !inv.deletedBySecretary);
    },
});

// ── نظام الحذف الذكي للفواتير ──────────────────────────────────────────────
// المريض يحذف الفاتورة من واجهته فقط
export const patientSoftDeleteInvoice = mutation({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!patient) throw new Error("User not found");

        const invoice = await ctx.db.get(args.invoiceId);
        if (!invoice) throw new Error("Invoice not found");
        if (invoice.patientId !== patient._id) throw new Error("Unauthorized");

        // إذا السكرتيرة حذفت وتمت موافقة الأدمن → لا شيء نهائي هنا (الأدمن يقرر)
        // نضع علامة المريض فقط + pending للأدمن إذا كانت السكرتيرة حذفت
        if (invoice.deletedBySecretary) {
            await ctx.db.patch(args.invoiceId, {
                deletedByPatient: true,
                pendingAdminApproval: true,
            });
        } else {
            await ctx.db.patch(args.invoiceId, { deletedByPatient: true });
        }
    },
});

// السكرتيرة تحذف الفاتورة - تختفي من واجهتها
export const secretarySoftDeleteInvoice = mutation({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const secretary = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!secretary || secretary.role !== "secretary") throw new Error("Unauthorized");

        const invoice = await ctx.db.get(args.invoiceId);
        if (!invoice) throw new Error("Invoice not found");

        if (invoice.deletedByPatient) {
            // كلاهما حذف → في انتظار موافقة الأدمن
            await ctx.db.patch(args.invoiceId, {
                deletedBySecretary: true,
                pendingAdminApproval: true,
            });
        } else {
            await ctx.db.patch(args.invoiceId, { deletedBySecretary: true });
        }
    },
});

// الأدمن يوافق على الحذف النهائي للفاتورة
export const adminApproveDeleteInvoice = mutation({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const admin = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!admin || admin.role !== "admin") throw new Error("Only admin can approve invoice deletion");

        const invoice = await ctx.db.get(args.invoiceId);
        if (!invoice) throw new Error("Invoice not found");

        await ctx.db.delete(args.invoiceId);
    },
});

// الأدمن يرى الفواتير التي تنتظر موافقته على الحذف
export const getPendingDeleteInvoices = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const admin = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();
        if (!admin || admin.role !== "admin") return [];

        const invoices = await ctx.db.query("invoices").collect();
        return invoices.filter(inv => inv.pendingAdminApproval === true);
    },
});
