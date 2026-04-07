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
        role:            v.union(v.literal("admin"), v.literal("guest")),
    })
        .index("by_token", ["tokenIdentifier"])
        .index("by_role",  ["role"]),

    appointments: defineTable({
        doctorId: v.optional(v.id("doctors")),
        patientId: v.id("patients"),
        department: v.string(),
        date: v.number(),
        status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled"), v.literal("completed")),
        notes: v.optional(v.string()),
    })
        .index("by_doctor", ["doctorId"])
        .index("by_patient", ["patientId"])
        .index("by_department", ["department"])
        .index("by_status", ["status"]),

});
