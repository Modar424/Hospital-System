import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 RATE LIMITING CONFIGURATION - منع الحجز المفرط
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RATE_LIMIT_CONFIG = {
  MAX_ACTIVE_APPOINTMENTS: 5,              // حد أقصى 5 مواعيد نشطة (pending/confirmed)
  MAX_BOOKINGS_PER_HOUR: 3,               // حد أقصى 3 حجوزات في الساعة الواحدة
  MAX_BOOKINGS_PER_DAY: 10,               // حد أقصى 10 حجوزات في اليوم الواحد
  MIN_TIME_BETWEEN_BOOKINGS_MS: 5 * 60 * 1000,  // فترة 5 دقائق بين كل حجز (مكافحة البوتات)
  RATE_LIMIT_WINDOW_MS: 24 * 60 * 60 * 1000,    // نافذة المراقبة 24 ساعة
  HOUR_WINDOW_MS: 60 * 60 * 1000,               // نافذة الساعة
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛡️ RATE LIMIT CHECKER - فحص شامل للحماية من الإساءة
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkAndEnforceRateLimit(ctx: any, patientId: any) {
  const now = Date.now();
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allAppts: any[] = await ctx.db
      .query("appointments")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_patient", (q: any) => q.eq("patientId", patientId))
      .collect();

    // 1️⃣ فحص المواعيد النشطة (pending + confirmed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeCount = allAppts.filter((apt: any) => apt.status === "pending" || apt.status === "confirmed").length;

    if (activeCount >= RATE_LIMIT_CONFIG.MAX_ACTIVE_APPOINTMENTS) {
      throw new Error(
        `🚫 You have reached the maximum of ${RATE_LIMIT_CONFIG.MAX_ACTIVE_APPOINTMENTS} active appointments. ` +
        `Please wait for some to be completed or cancelled before booking more.`
      );
    }

    // 2️⃣ فحص الحجوزات في آخر ساعة
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentAppts = allAppts.filter((apt: any) => now - apt._creationTime < RATE_LIMIT_CONFIG.HOUR_WINDOW_MS);

    if (recentAppts.length >= RATE_LIMIT_CONFIG.MAX_BOOKINGS_PER_HOUR) {
      throw new Error(
        `⏱️ Booking limit: Maximum ${RATE_LIMIT_CONFIG.MAX_BOOKINGS_PER_HOUR} bookings per hour. ` +
        `Please try again in a few minutes.`
      );
    }

    // 3️⃣ فحص الحجوزات في آخر 24 ساعة
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dailyAppts = allAppts.filter((apt: any) => now - apt._creationTime < RATE_LIMIT_CONFIG.RATE_LIMIT_WINDOW_MS);

    if (dailyAppts.length >= RATE_LIMIT_CONFIG.MAX_BOOKINGS_PER_DAY) {
      throw new Error(
        `📅 Daily limit exceeded: Maximum ${RATE_LIMIT_CONFIG.MAX_BOOKINGS_PER_DAY} bookings per day. ` +
        `Please try again tomorrow.`
      );
    }

    // 4️⃣ فحص الفترة الزمنية بين آخر حجز (منع البوتات)
    if (recentAppts.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastBooking = Math.max(...recentAppts.map((apt: any) => apt._creationTime));
      const timeSinceLastBooking = now - lastBooking;

      if (timeSinceLastBooking < RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_BOOKINGS_MS) {
        const remainingMs = RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_BOOKINGS_MS - timeSinceLastBooking;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        throw new Error(
          `⏳ Please wait ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''} before booking another appointment.`
        );
      }
    }

    return true;
  } catch (error) {
    throw error;
  }
}

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
        
        // ✅ Get or create patient first
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
        
        // 🛡️ RATE LIMIT CHECK - فحص شامل قبل الحجز
        await checkAndEnforceRateLimit(ctx, patient._id);

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
                throw new Error("Doctor already booked at this time. Please choose a different slot.");
            }
        }

        // الطلب الثالث: منع الحجز إذا لم يكتمل الملف الشخصي
        if (patient.role === "guest" && !patient.profileCompleted) {
            throw new Error("Please complete your profile before booking an appointment.");
        }

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

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!patient) throw new Error("User not found");

        const isAdmin      = patient.role === "admin";
        const isSecretary  = patient.role === "secretary";
        const isOwner      = appointment.patientId === patient._id;
        const isDoctor     = patient.role === "doctor" && appointment.doctorId === patient.doctorId;

        // الأدمن والسكرتارية يستطيعان تغيير أي حالة
        if (!isAdmin && !isSecretary && !isOwner && !isDoctor) {
            throw new Error("Unauthorized");
        }

        // المريض العادي يمكنه فقط الإلغاء
        // الدكتور يمكنه فقط تغيير الحالة إلى completed
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
        // إخفاء المواعيد التي حذفتها السكرتيرة من واجهة السكرتيرة والأدمن
        const visible = appointments.filter(a => !a.deletedBySecretary);
        return Promise.all(
            visible.map(async (appointment) => {
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

        // إخفاء المواعيد التي حذفها المريض من واجهته
        const visible = appointments.filter(a => !a.deletedByPatient);

        return Promise.all(
            visible.map(async (app) => {
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

        // إخفاء المواعيد التي حذفتها السكرتيرة (تختفي من الدكتور أيضاً)
        const visibleAppointments = appointments.filter(a => !a.deletedBySecretary);

        // تجميع حسب المريض
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patientMap = new Map<string, any>();

        for (const apt of visibleAppointments) {
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

// ── نظام الحذف الذكي للمواعيد ──────────────────────────────────────────────
// المريض يحذف الموعد المكنسل من واجهته فقط
export const patientSoftDelete = mutation({
    args: { appointmentId: v.id("appointments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!patient) throw new Error("User not found");

        const appointment = await ctx.db.get(args.appointmentId);
        if (!appointment) throw new Error("Appointment not found");

        // فقط صاحب الموعد
        if (appointment.patientId !== patient._id) throw new Error("Unauthorized");
        // فقط المواعيد الملغاة
        if (appointment.status !== "cancelled") throw new Error("يمكن حذف المواعيد الملغاة فقط");

        // إذا كانت السكرتيرة قد حذفت بالفعل → حذف نهائي
        if (appointment.deletedBySecretary) {
            await ctx.db.delete(args.appointmentId);
        } else {
            // وضع علامة أن المريض حذف
            await ctx.db.patch(args.appointmentId, { deletedByPatient: true });
        }
    },
});

// السكرتيرة تحذف الموعد - يختفي من داشبورد الدكتور وداشبوردها
export const secretarySoftDelete = mutation({
    args: { appointmentId: v.id("appointments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const secretary = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!secretary || secretary.role !== "secretary") throw new Error("Unauthorized");

        const appointment = await ctx.db.get(args.appointmentId);
        if (!appointment) throw new Error("Appointment not found");

        // فقط المواعيد الملغاة
        if (appointment.status !== "cancelled") throw new Error("يمكن حذف المواعيد الملغاة فقط");

        // إذا كان المريض قد حذف بالفعل → حذف نهائي
        if (appointment.deletedByPatient) {
            await ctx.db.delete(args.appointmentId);
        } else {
            // وضع علامة أن السكرتيرة حذفت (يختفي من الدكتور والسكرتيرة)
            await ctx.db.patch(args.appointmentId, { deletedBySecretary: true });
        }
    },
});

// ✨ إلغاء الموعد مع إرسال إشعارات تلقائية
export const cancelAppointmentWithNotification = mutation({
    args: {
        appointmentId: v.id("appointments"),
        reason: v.string(),  // سبب الإلغاء
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const appointment = await ctx.db.get(args.appointmentId);
        if (!appointment) throw new Error("Appointment not found");

        // اجلب المستخدم الحالي
        const currentUser = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!currentUser) throw new Error("User not found");

        // تحقق من الصلاحيات
        const isPatient = appointment.patientId === currentUser._id;
        const isSecretary = currentUser.role === "secretary";
        const isAdmin = currentUser.role === "admin";
        
        if (!isPatient && !isSecretary && !isAdmin) {
            throw new Error("Unauthorized to cancel this appointment");
        }

        // المريض يمكنه الإلغاء فقط إذا كان pending أو confirmed
        if (isPatient && appointment.status !== "pending" && appointment.status !== "confirmed") {
            throw new Error("Cannot cancel completed or already cancelled appointments");
        }

        // تحديث الموعد
        await ctx.db.patch(args.appointmentId, {
            status: "cancelled",
            cancellationReason: args.reason || undefined,
            cancelledBy: isPatient ? "patient" : "secretary",
            cancelledAt: Date.now(),
        });

        // اجلب بيانات المريض
        const patient = await ctx.db.get(appointment.patientId);
        
        // إرسال إشعار للمريض إذا ألغت السكرتارية
        if (isSecretary && patient) {
            await ctx.db.insert("notifications", {
                fromUserId: currentUser._id,
                toUserId: appointment.patientId,
                type: "appointment_cancelled",
                message: `Your appointment has been cancelled. Reason: ${args.reason || "No reason provided"}`,
                isRead: false,
            });
        }

        // إرسال إشعار للسكرتارية إذا ألغى المريض
        if (isPatient) {
            // اجلب أي سكرتارية أو أدمن
            const secretaries = await ctx.db
                .query("patients")
                .withIndex("by_role", (q) => q.eq("role", "secretary"))
                .collect();

            // أرسل إشعار لأول سكرتارية
            if (secretaries.length > 0) {
                await ctx.db.insert("notifications", {
                    fromUserId: appointment.patientId,
                    toUserId: secretaries[0]._id,
                    type: "appointment_cancelled_patient",
                    message: `Patient (${patient?.name || "Unknown"}) cancelled their appointment.`,
                    isRead: false,
                });
            }
        }

        return appointment._id;
    },
});
