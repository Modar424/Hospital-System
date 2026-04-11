import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔔 Cancellation Alert - تنبيه إلغاء الحجز
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * إرسال تنبيه للمريض عند إلغاء حجزه من قبل السكرتيرة
 */
export async function notifyPatientAppointmentCancellation(
    ctx: MutationCtx,
    patientId: Id<"patients">,
    patientName: string,
    doctorName: string,
    appointmentDate: Date,
    department: string,
    cancelledBySecretaryId: Id<"patients">
) {
    // الحصول على بيانات السكرتيرة
    const secretary = await ctx.db.get(cancelledBySecretaryId);

    const message = `تم إلغاء حجزك عند الدكتور ${doctorName} في قسم ${department} في ${appointmentDate.toLocaleString(
        "ar-SA"
    )} بواسطة ${secretary?.name || "السكرتيرة"}. يمكنك حجز موعد جديد متى رغبت.`;

    await ctx.db.insert("notifications", {
        fromUserId: cancelledBySecretaryId,
        toUserId: patientId,
        type: "appointment_cancellation_alert",
        message: message,
        isRead: false,
    });
}

/**
 * Mutation لإلغاء الحجز مع إرسال تنبيه للمريض
 */
export const cancelAppointmentWithNotification = mutation({
    args: {
        appointmentId: v.id("appointments"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const appointment = await ctx.db.get(args.appointmentId);
        if (!appointment) throw new Error("Appointment not found");

        const secretary = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!secretary || secretary.role !== "secretary") {
            throw new Error("Only secretaries can cancel appointments");
        }

        // إلغاء الحجز
        await ctx.db.patch(args.appointmentId, { status: "cancelled" });

        // الحصول على بيانات المريض والدكتور
        const patient = await ctx.db.get(appointment.patientId);
        const doctor = appointment.doctorId ? await ctx.db.get(appointment.doctorId) : null;

        if (patient && doctor) {
            // إرسال التنبيه للمريض
            await notifyPatientAppointmentCancellation(
                ctx,
                appointment.patientId,
                patient.name,
                doctor.name,
                new Date(appointment.date),
                appointment.department,
                secretary._id
            );
        }

        return appointment._id;
    },
});
