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
