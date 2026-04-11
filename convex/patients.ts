import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notifyRoleAssigned, notifyPromotedToAdmin, notifyPromotedToDoctor, notifyPromotedToSecretary, notifyDemoted } from "./roleNotifications";

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

// setRole: الأدمن يمكنه تعيين أي دور + ربط الدكتور بـ doctorId
export const setRole = mutation({
    args: {
        userId: v.id("patients"),
        role: v.union(
            v.literal("admin"),
            v.literal("guest"),
            v.literal("doctor"),
            v.literal("secretary")
        ),
        doctorId: v.optional(v.id("doctors")),
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

        // الحصول على بيانات المستخدم الحالية قبل التحديث
        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) throw new Error("User not found");

        const previousRole = targetUser.role;

        // منع خفض أو تغيير دور آخر أدمن في النظام
        if (previousRole === "admin" && args.role !== "admin") {
            const adminCandidates = await ctx.db
                .query("patients")
                .withIndex("by_role", (q) => q.eq("role", "admin"))
                .take(2);

            if (adminCandidates.length <= 1) {
                throw new Error("يجب أن يكون هناك أدمن واحد على الأقل في النظام");
            }
        }

        // عند تعيين دور doctor، يجب ربطه بسجل دكتور
        if (args.role === "doctor" && args.doctorId) {
            await ctx.db.patch(args.userId, { role: args.role, doctorId: args.doctorId });
        } else if (args.role !== "doctor") {
            // عند إزالة دور doctor، نزيل الربط
            await ctx.db.patch(args.userId, { role: args.role, doctorId: undefined });
        } else {
            await ctx.db.patch(args.userId, { role: args.role });
        }

        // إرسال الإشعارات المناسبة حسب الدور الجديد
        if (args.role === "admin") {
            await notifyPromotedToAdmin(ctx, caller._id, args.userId, targetUser.name);
        } else if (args.role === "doctor") {
            await notifyPromotedToDoctor(ctx, caller._id, args.userId, targetUser.name);
        } else if (args.role === "secretary") {
            await notifyPromotedToSecretary(ctx, caller._id, args.userId, targetUser.name);
        } else if (previousRole !== "guest" && args.role === "guest") {
            // تراجع في الدور
            await notifyDemoted(ctx, caller._id, args.userId, targetUser.name, previousRole);
        } else {
            // إشعار عام بتعيين الدور
            await notifyRoleAssigned(ctx, caller._id, args.userId, targetUser.name, args.role as any);
        }
    },
});

// Bootstrap: يجعل المستخدم الحالي أدمن — يعمل فقط إذا لم يكن هناك أدمن آخر
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

export const getPatientStats = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const caller = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!caller || caller.role !== "admin") return null;

        // احسب المرضى المسجلين (guests فقط)
        const allGuestPatients = await ctx.db
            .query("patients")
            .withIndex("by_role", (q) => q.eq("role", "guest"))
            .collect();

        // احسب عدد المواعيد لكل يوم
        const allAppointments = await ctx.db.query("appointments").collect();
        const todayStr = new Date().toDateString();
        
        // احسب المرضى المختلفين اليوم
        const todayPatientIds = new Set(
            allAppointments
                .filter(a => new Date(a.date).toDateString() === todayStr)
                .map(a => a.patientId.toString())
        );

        // احسب المواعيد لكل حالة
        const appointmentStats = {
            pending: allAppointments.filter(a => a.status === 'pending').length,
            confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
            completed: allAppointments.filter(a => a.status === 'completed').length,
            cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
            total: allAppointments.length,
        };

        return {
            totalPatients: allGuestPatients.length,
            todayPatients: todayPatientIds.size,
            todayAppointments: allAppointments.filter(a => new Date(a.date).toDateString() === todayStr).length,
            appointmentStats,
        };
    },
});
