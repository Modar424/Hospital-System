import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    doctors: defineTable({
        name: v.string(),
        category: v.string(),
        image: v.string(),
        bio: v.string(),
        expertise: v.array(v.string()),
        experience: v.number(),
        location: v.string(),
        contact: v.string(),
        password: v.optional(v.string()), // كلمة السر الخاصة بالدكتور للدخول للداشبورد
    })
        .searchIndex("search_name", { searchField: "name" })
        .index("by_category", ["category"]),

    categories: defineTable({
        name: v.string(),
        icon: v.string(),
        description: v.optional(v.string()),
    }).index("by_name", ["name"]),

    patients: defineTable({
        name:            v.string(),
        email:           v.string(),
        tokenIdentifier: v.string(),
        role:            v.union(
            v.literal("admin"),
            v.literal("guest"),
            v.literal("doctor"),
            v.literal("secretary")
        ),
        doctorId: v.optional(v.id("doctors")), // للربط بين user الدكتور وبيانات الدكتور
    })
        .index("by_token", ["tokenIdentifier"])
        .index("by_role",  ["role"]),

    patientProfiles: defineTable({
        patientId:        v.id("patients"),
        phone:            v.string(),
        dateOfBirth:      v.string(),
        gender:           v.union(v.literal("male"), v.literal("female"), v.literal("other")),
        bloodType:        v.string(),
        address:          v.string(),
        emergencyContact: v.string(),
        medicalHistory:   v.array(v.string()), // حالات طبية سابقة
        allergies:        v.array(v.string()), // الحساسيات
        profileImage:     v.optional(v.string()), // صورة المريض (Storage ID)
        notes:            v.optional(v.string()),
        createdAt:        v.number(),
        updatedAt:        v.number(),
    })
        .index("by_patient", ["patientId"]),

    appointments: defineTable({
        doctorId: v.optional(v.id("doctors")),
        patientId: v.id("patients"),
        department: v.string(),
        date: v.number(),
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("cancelled"),
            v.literal("completed")
        ),
        notes: v.optional(v.string()),
        reportId: v.optional(v.id("reports")), // ربط التقرير الطبي بالموعد
    })
        .index("by_doctor", ["doctorId"])
        .index("by_patient", ["patientId"])
        .index("by_department", ["department"])
        .index("by_status", ["status"]),

    reports: defineTable({
        appointmentId:   v.id("appointments"),
        patientId:       v.id("patients"),
        doctorId:        v.optional(v.id("doctors")),
        patientName:     v.string(),
        doctorName:      v.string(),
        diagnosis:       v.string(),         // التشخيص
        medications:     v.array(v.object({
            name:        v.string(),
            dosage:      v.optional(v.string()),
            frequency:   v.optional(v.string()), // الجرعة: 3 مرات يوميًا
        })),
        notes:           v.optional(v.string()),
        createdAt:       v.number(),
    })
        .index("by_patient", ["patientId"])
        .index("by_appointment", ["appointmentId"])
        .index("by_doctor", ["doctorId"]),

    invoices: defineTable({
        invoiceNumber:   v.string(),
        appointmentId:   v.id("appointments"),
        patientId:       v.id("patients"),
        doctorId:        v.optional(v.id("doctors")),
        patientName:     v.string(),
        doctorName:      v.string(),
        patientCondition: v.string(),
        medications:     v.array(v.object({
            name:  v.string(),
            dosage: v.optional(v.string()),
        })),
        doctorFees:      v.number(),
        medicationFees:  v.optional(v.number()), // تُترك فارغة ليكملها المحاسب
        totalAmount:     v.optional(v.number()),
        status:          v.union(
            v.literal("pending_payment"),
            v.literal("paid")
        ),
        notes:           v.optional(v.string()),
    })
        .index("by_patient", ["patientId"])
        .index("by_appointment", ["appointmentId"])
        .index("by_doctor", ["doctorId"]),

    pharmacy: defineTable({
        name: v.string(),
        nameAr: v.optional(v.string()),
        price: v.number(),
        available: v.boolean(),
        category: v.optional(v.string()),
        description: v.optional(v.string()),
    })
        .index("by_available", ["available"])
        .index("by_category", ["category"]),

    appointmentLimits: defineTable({
        patientId: v.id("patients"),
        activeCount: v.number(), // عدد الحجوزات النشطة (pending, confirmed)
        lastUpdated: v.number(),
    })
        .index("by_patient", ["patientId"]),

    notifications: defineTable({
        fromUserId:  v.id("patients"),
        toUserId:    v.id("patients"),
        type:        v.union(
            v.literal("meeting_request"),
            v.literal("general"),
            v.literal("invoice_created"),
            v.literal("patient_message_to_secretary"),
            v.literal("secretary_message_to_patient"),
            v.literal("secretary_message_to_doctor"),
            v.literal("doctor_message_to_secretary"),
            v.literal("appointment_created"),
            v.literal("appointment_confirmed"),
            v.literal("appointment_cancelled"),
            v.literal("appointment_completed"),
            v.literal("report_created"),
            v.literal("report_available"),
            v.literal("role_assigned"),
            v.literal("promoted_to_admin"),
            v.literal("promoted_to_doctor"),
            v.literal("promoted_to_secretary"),
            v.literal("demoted"),
            v.literal("appointment_cancellation_alert"),
            v.literal("financial_report"),
            v.literal("admin_report_notification"),
            v.literal("doctor_to_secretary_message"),
            v.literal("secretary_to_doctor_message")
        ),
        message:     v.string(),
        isRead:      v.boolean(),
        scheduledAt: v.optional(v.number()),
    })
        .index("by_recipient", ["toUserId"])
        .index("by_read", ["isRead"]),
});
