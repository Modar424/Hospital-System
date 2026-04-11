import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 Appointment Limits - حدود الحجوزات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const APPOINTMENT_LIMIT = 3; // الحد الأقصى للحجوزات النشطة

/**
 * الحصول على عدد الحجوزات النشطة للمريض
 */
export const getActiveAppointmentCount = query({
    args: {
        patientId: v.id("patients"),
    },
    handler: async (ctx, args) => {
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .collect();

        // حساب الحجوزات النشطة (pending أو confirmed)
        const activeAppointments = appointments.filter(
            (apt) => apt.status === "pending" || apt.status === "confirmed"
        );

        return activeAppointments.length;
    },
});

/**
 * التحقق من إمكانية حجز موعد جديد
 */
export const canBookAppointment = query({
    args: {
        patientId: v.id("patients"),
    },
    handler: async (ctx, args) => {
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .collect();

        // حساب الحجوزات النشطة
        const activeAppointments = appointments.filter(
            (apt) => apt.status === "pending" || apt.status === "confirmed"
        );

        return {
            canBook: activeAppointments.length < APPOINTMENT_LIMIT,
            currentCount: activeAppointments.length,
            maxAllowed: APPOINTMENT_LIMIT,
            remaining: Math.max(0, APPOINTMENT_LIMIT - activeAppointments.length),
        };
    },
});

/**
 * إنشاء أو تحديث سجل حدود الحجوزات
 */
export const updateAppointmentLimit = mutation({
    args: {
        patientId: v.id("patients"),
    },
    handler: async (ctx, args) => {
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .collect();

        const activeCount = appointments.filter(
            (apt) => apt.status === "pending" || apt.status === "confirmed"
        ).length;

        // البحث عن سجل موجود
        const existingLimit = await ctx.db
            .query("appointmentLimits")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .unique();

        if (existingLimit) {
            await ctx.db.patch(existingLimit._id, {
                activeCount,
                lastUpdated: Date.now(),
            });
        } else {
            await ctx.db.insert("appointmentLimits", {
                patientId: args.patientId,
                activeCount,
                lastUpdated: Date.now(),
            });
        }

        return activeCount;
    },
});

/**
 * التحقق من صحة الحجز وإمكانيته
 */
export const validateAppointmentBooking = query({
    args: {
        patientId: v.id("patients"),
    },
    handler: async (ctx, args) => {
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .collect();

        const activeAppointments = appointments.filter(
            (apt) => apt.status === "pending" || apt.status === "confirmed"
        );

        const canBook = activeAppointments.length < APPOINTMENT_LIMIT;

        return {
            isAllowed: canBook,
            activeCount: activeAppointments.length,
            maxLimit: APPOINTMENT_LIMIT,
            message: canBook
                ? "يمكنك حجز موعد جديد"
                : `لقد وصلت للحد الأقصى (${APPOINTMENT_LIMIT} حجوزات). يرجى إلغاء أحد الحجوزات أو انتظار اكتمال موعد لحجز موعد جديد.`,
        };
    },
});

/**
 * الحصول على تفاصيل الحجوزات النشطة
 */
export const getActiveAppointments = query({
    args: {
        patientId: v.id("patients"),
    },
    handler: async (ctx, args) => {
        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .collect();

        const activeAppointments = appointments.filter(
            (apt) => apt.status === "pending" || apt.status === "confirmed"
        );

        return Promise.all(
            activeAppointments.map(async (apt) => {
                const doctor = apt.doctorId ? await ctx.db.get(apt.doctorId) : null;
                return {
                    ...apt,
                    doctor,
                };
            })
        );
    },
});
