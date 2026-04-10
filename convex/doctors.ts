import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getDoctorsByCategory = query({
    args: {
        category: v.string(),
    },
    handler: async (ctx, args) => {
        const doctors = await ctx.db
            .query("doctors")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .collect();
        return doctors;
    },
})

export const getDoctors = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("doctors").collect();
    },
});

export const getDoctorById = query({
    args: { id: v.id("doctors") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});


export const createDoctor = mutation({
    args: {
        name: v.string(),
        category: v.string(),
        image: v.string(),
        bio: v.string(),
        expertise: v.array(v.string()),
        experience: v.number(),
        location: v.string(),
        contact: v.string(),
    },
    handler: async (ctx, args) => {
        const newDoctorId = await ctx.db.insert("doctors", args);
        return newDoctorId;
    },
});
// الدكتور يدخل اسمه وكلمة السر ليتم ربطه بسجله
export const verifyAndLinkDoctor = mutation({
    args: {
        name: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "doctor") throw new Error("Only doctors can verify");

        // البحث عن الدكتور بالاسم وكلمة السر
        const allDoctors = await ctx.db.query("doctors").collect();
        const matched = allDoctors.find(
            d => d.name.toLowerCase().trim() === args.name.toLowerCase().trim()
                && d.password === args.password
        );

        if (!matched) throw new Error("Invalid name or password");

        // ربط المستخدم بسجل الدكتور
        await ctx.db.patch(caller._id, { doctorId: matched._id });

        return { success: true, doctorName: matched.name };
    },
});

// الأدمن يضع كلمة سر للدكتور
export const setDoctorPassword = mutation({
    args: {
        doctorId: v.id("doctors"),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "admin") throw new Error("Only admins can set passwords");

        await ctx.db.patch(args.doctorId, { password: args.password });
    },
});

// الأدمن يحدث بيانات الدكتور
export const updateDoctor = mutation({
    args: {
        doctorId: v.id("doctors"),
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        image: v.optional(v.string()),
        bio: v.optional(v.string()),
        expertise: v.optional(v.array(v.string())),
        experience: v.optional(v.number()),
        location: v.optional(v.string()),
        contact: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "admin") throw new Error("Only admins can update doctors");

        const doctor = await ctx.db.get(args.doctorId);
        if (!doctor) throw new Error("Doctor not found");

        const { doctorId, ...updateData } = args;
        
        // تصفية القيم غير المعرّفة
        const updates = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );

        await ctx.db.patch(args.doctorId, updates);
        
        return await ctx.db.get(args.doctorId);
    },
});

// الأدمن يحذف دكتور من قاعدة البيانات
export const deleteDoctor = mutation({
    args: {
        doctorId: v.id("doctors"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "admin") throw new Error("Only admins can delete doctors");

        const doctor = await ctx.db.get(args.doctorId);
        if (!doctor) throw new Error("Doctor not found");

        // حذف جميع الموعدات المرتبطة بهذا الدكتور
        const appointments = await ctx.db
            .query("appointments")
            .collect();
        
        for (const appointment of appointments) {
            if (appointment.doctorId === args.doctorId) {
                await ctx.db.delete(appointment._id);
            }
        }

        // حذف الدكتور
        await ctx.db.delete(args.doctorId);

        return { success: true, message: `Doctor ${doctor.name} deleted successfully` };
    },
});
