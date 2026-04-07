import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Called createUser without authentication present");

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (user !== null) return user._id;

        const newUserId = await ctx.db.insert("patients", {
            name: args.name,
            email: args.email,
            tokenIdentifier: identity.tokenIdentifier,
            role: "guest",
        });

        return newUserId;
    },
});

export const getUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
    },
});

// ✅ setRole محمية: فقط أدمن يمكنه تغيير دور مستخدم آخر
// الاستثناء الوحيد: bootstrapFirstAdmin لأول مستخدم
export const setRole = mutation({
    args: {
        userId: v.id("patients"),
        role: v.union(v.literal("admin"), v.literal("guest")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "admin") {
            throw new Error("Unauthorized: Only admins can change roles");
        }

        await ctx.db.patch(args.userId, { role: args.role });
    },
});

// ✅ Bootstrap: يجعل المستخدم الحالي أدمن — يعمل فقط إذا لم يكن هناك أدمن آخر
export const bootstrapAdmin = mutation({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const existingAdmin = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .first();

        if (existingAdmin) {
            throw new Error("An admin already exists. Contact them to promote you.");
        }

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found. Please sign in first.");

        await ctx.db.patch(user._id, { role: "admin" });
        return { success: true, message: "You are now an admin!" };
    },
});

export const getAllUsers = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "admin") return [];

        return await ctx.db.query("patients").collect();
    },
});
