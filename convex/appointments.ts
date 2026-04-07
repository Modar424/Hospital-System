import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const createAppointment = mutation({
    args: {
        department: v.string(),
        doctorId: v.optional(v.id("doctors")),
        date: v.string(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // تحقق أن التاريخ في المستقبل
        if (new Date(args.date).getTime() <= Date.now()) {
            throw new Error("Please select a future date");
        }

        // ✅ تحقق من تعارض المواعيد
        if (args.doctorId) {
            const requestedTime = new Date(args.date).getTime();
            const existingAppts = await ctx.db
                .query("appointments")
                .withIndex("by_doctor", (q) => q.eq("doctorId", args.doctorId))
                .collect();

            const conflict = existingAppts.find((apt) => {
                if (apt.status === "cancelled") return false;
                const diff = Math.abs(apt.date - requestedTime);
                return diff < 30 * 60 * 1000; // 30 دقيقة
            });

            if (conflict) {
                throw new Error("Doctor already booked at this time. Please choose a different slot.");
            }
        }

        // الحصول على المريض أو إنشاؤه
        let patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!patient) {
            const id = await ctx.db.insert("patients", {
                name: identity.name || "User",
                email: identity.email || "",
                tokenIdentifier: identity.tokenIdentifier,
                role: "guest",
            });
            patient = await ctx.db.get(id);
        }
        if (!patient) throw new Error("Could not create patient");

        const appointmentId = await ctx.db.insert("appointments", {
            department: args.department,
            patientId: patient._id,
            doctorId: args.doctorId,
            date: new Date(args.date).getTime(),
            status: "pending",
            notes: args.notes,
        });

        return appointmentId;
    },
});

export const updateStatus = mutation({
    args: {
        appointmentId: v.id("appointments"),
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("cancelled"),
            v.literal("completed")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const appointment = await ctx.db.get(args.appointmentId);
        if (!appointment) throw new Error("Appointment not found");

        // ✅ حماية الـ backend: المريض يمكنه فقط إلغاء موعده، الأدمن يمكنه كل شيء
        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!patient) throw new Error("User not found");

        const isAdmin = patient.role === "admin";
        const isOwner = appointment.patientId === patient._id;

        if (!isAdmin && !isOwner) {
            throw new Error("Unauthorized: You can only modify your own appointments");
        }

        // المريض العادي يمكنه فقط الإلغاء
        if (!isAdmin && args.status !== "cancelled") {
            throw new Error("Unauthorized: Patients can only cancel appointments");
        }

        await ctx.db.patch(args.appointmentId, { status: args.status });

        if (args.status === "confirmed" && appointment.status !== "confirmed") {
            const apptPatient = await ctx.db.get(appointment.patientId);
            const doctor = appointment.doctorId
                ? await ctx.db.get(appointment.doctorId)
                : null;

            if (apptPatient && apptPatient.email && doctor) {
                await ctx.scheduler.runAfter(0, internal.actions.sendAppointmentConfirmationEmail, {
                    to: apptPatient.email,
                    patientName: apptPatient.name,
                    doctorName: doctor.name,
                    date: new Date(appointment.date).toLocaleString(),
                    appointmentId: appointment._id,
                });
            }
        }
    },
});

export const getAppointments = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // ✅ التحقق من أن المستخدم أدمن
        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user || user.role !== "admin") return [];

        const appointments = await ctx.db.query("appointments").order("desc").collect();
        return Promise.all(
            appointments.map(async (appointment) => {
                const doctor = appointment.doctorId ? await ctx.db.get(appointment.doctorId) : null;
                const patient = await ctx.db.get(appointment.patientId);
                return { ...appointment, doctor, patient };
            })
        );
    },
});

export const myAppointments = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!patient) return [];

        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
            .collect();

        return Promise.all(
            appointments.map(async (app) => {
                const doctor = app.doctorId ? await ctx.db.get(app.doctorId) : null;
                return { ...app, doctor };
            })
        );
    },
});
