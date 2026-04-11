import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { notifyAppointmentCreated, notifyAppointmentConfirmed, notifyAppointmentCancelled, notifyAppointmentCompleted } from "./appointmentNotifications";

const APPOINTMENT_LIMIT = 3; // الحد الأقصى للحجوزات النشطة

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

        if (new Date(args.date).getTime() <= Date.now()) {
            throw new Error("Please select a future date");
        }

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

        // ✅ التحقق من وجود ملف شخصي قبل الحجز
        const patientProfile = await ctx.db
            .query("patientProfiles")
            .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
            .unique();

        if (!patientProfile) {
            throw new Error("يجب ملء ملفك الشخصي أولاً قبل حجز موعد / You must complete your profile first before booking an appointment");
        }

        // ✅ التحقق من حد الحجوزات النشطة
        const existingPatientAppts = await ctx.db
            .query("appointments")
            .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
            .collect();

        const activeAppointments = existingPatientAppts.filter(
            (apt) => apt.status === "pending" || apt.status === "confirmed"
        );

        if (activeAppointments.length >= APPOINTMENT_LIMIT) {
            throw new Error(
                `You have reached the maximum number of active bookings (${APPOINTMENT_LIMIT}). Please cancel one or wait for an appointment to complete.`
            );
        }

        if (args.doctorId) {
            const requestedTime = new Date(args.date).getTime();
            const existingAppts = await ctx.db
                .query("appointments")
                .withIndex("by_doctor", (q) => q.eq("doctorId", args.doctorId))
                .collect();

            const conflict = existingAppts.find((apt) => {
                if (apt.status === "cancelled") return false;
                const diff = Math.abs(apt.date - requestedTime);
                return diff < 30 * 60 * 1000;
            });

            if (conflict) {
                throw new Error("Its already booking try different time");
            }
        }

        const appointmentId = await ctx.db.insert("appointments", {
            department: args.department,
            patientId: patient._id,
            doctorId: args.doctorId,
            date: new Date(args.date).getTime(),
            status: "pending",
            notes: args.notes,
        });

        // البحث عن السكرتاريات لإرسال الإخطار
        const secretaries = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "secretary"))
            .collect();

        const secretaryIds = secretaries.map((s) => s._id);

        // إرسال إخطار بالموعد الجديد
        await notifyAppointmentCreated(
            ctx,
            patient._id,
            patient.name,
            args.department,
            new Date(args.date),
            secretaryIds
        );

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

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!patient) throw new Error("User not found");

        const isAdmin      = patient.role === "admin";
        const isSecretary  = patient.role === "secretary";
        const isOwner      = appointment.patientId === patient._id;
        const isDoctor     = patient.role === "doctor" && appointment.doctorId === patient.doctorId;


        if (!isAdmin && !isSecretary && !isOwner && !isDoctor) {
            throw new Error("Unauthorized");
        }

       
        if (!isAdmin && !isSecretary) {
            if (isOwner && args.status !== "cancelled") {
                throw new Error("Patients can only cancel appointments");
            }
            if (isDoctor && args.status !== "completed") {
                throw new Error("Doctors can only mark appointments as completed");
            }
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

            // إرسال إخطار تأكيد الموعد
            if (apptPatient && doctor) {
                await notifyAppointmentConfirmed(
                    ctx,
                    patient._id,
                    apptPatient._id,
                    doctor.name,
                    new Date(appointment.date),
                    appointment.department
                );
            }
        }

        // إرسال إخطار إلغاء الموعد
        if (args.status === "cancelled" && appointment.status !== "cancelled") {
            const apptPatient = await ctx.db.get(appointment.patientId);

            const secretaries = await ctx.db
                .query("patients")
                .withIndex("by_role", (q) => q.eq("role", "secretary"))
                .collect();

            const secretaryIds = secretaries.map((s) => s._id);

            // تأكد من وجود سكرتاريات قبل الإرسال
            if (apptPatient && secretaryIds.length > 0) {
                await notifyAppointmentCancelled(
                    ctx,
                    patient._id,
                    apptPatient.name,
                    appointment.department,
                    new Date(appointment.date),
                    secretaryIds
                );
            }
        }

        // إرسال إخطار إكمال الموعد
        if (args.status === "completed" && appointment.status !== "completed") {
            const apptPatient = await ctx.db.get(appointment.patientId);

            if (apptPatient && patient.role === "doctor") {
                await notifyAppointmentCompleted(
                    ctx,
                    patient._id,
                    apptPatient._id,
                    patient.name,
                    appointment.department
                );
            }
        }
    },
});

// للأدمن والسكرتارية: كل المواعيد
export const getAppointments = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user || (user.role !== "admin" && user.role !== "secretary")) return [];

        const appointments = await ctx.db.query("appointments").order("desc").collect();
        // تصفية المواعيد المنقولة للـ Trash (التي فيها trashedAt)
        const active = appointments.filter((apt) => !apt.trashedAt);
        
        return Promise.all(
            active.map(async (appointment) => {
                const doctor = appointment.doctorId ? await ctx.db.get(appointment.doctorId) : null;
                const patient = await ctx.db.get(appointment.patientId);
                // هل يوجد فاتورة لهذا الموعد؟
                const invoice = await ctx.db
                    .query("invoices")
                    .withIndex("by_appointment", (q) => q.eq("appointmentId", appointment._id))
                    .first();
                // هل يوجد تقرير لهذا الموعد؟
                const report = await ctx.db
                    .query("reports")
                    .withIndex("by_appointment", (q) => q.eq("appointmentId", appointment._id))
                    .first();
                return { ...appointment, doctor, patient, hasInvoice: !!invoice, hasReport: !!report };
            })
        );
    },
});

// للمريض: مواعيده الخاصة
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

        // تصفية المواعيد المنقولة للـ Trash
        const activeAppointments = appointments.filter((apt) => !apt.trashedAt);

        return Promise.all(
            activeAppointments.map(async (app) => {
                const doctor = app.doctorId ? await ctx.db.get(app.doctorId) : null;
                // هل يوجد تقرير لهذا الموعد؟
                const report = await ctx.db
                    .query("reports")
                    .withIndex("by_appointment", (q) => q.eq("appointmentId", app._id))
                    .first();
                return { ...app, doctor, hasReport: !!report };
            })
        );
    },
});

// للدكتور: مرضاه مع مواعيدهم
export const getMyPatientsAppointments = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "doctor") return [];

        // الدكتور يحتاج doctorId لجلب مواعيده
        if (!caller.doctorId) return [];

        const appointments = await ctx.db
            .query("appointments")
            .withIndex("by_doctor", (q) => q.eq("doctorId", caller.doctorId))
            .collect();

        // تصفية المواعيد المنقولة للـ Trash (استبعادها من My Patients)
        const activeAppointments = appointments.filter((apt) => !apt.trashedAt);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patientMap = new Map<string, any>();

        for (const apt of activeAppointments) {
            const patient = await ctx.db.get(apt.patientId);
            if (!patient) continue;

            const key = apt.patientId.toString();
            if (!patientMap.has(key)) {
                patientMap.set(key, { patient, appointments: [] });
            }

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

            patientMap.get(key)!.appointments.push({ ...apt, hasInvoice: !!invoice, invoice, hasReport: !!report, report });
        }

        return Array.from(patientMap.values());
    },
});
