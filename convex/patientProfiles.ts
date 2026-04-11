import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 Patient Profiles - ملفات المريض الشخصية
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * إنشاء أو تحديث ملف المريض الشخصي
 */
export const upsertPatientProfile = mutation({
    args: {
        phone: v.string(),
        dateOfBirth: v.string(),
        gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
        bloodType: v.string(),
        address: v.string(),
        emergencyContact: v.string(),
        medicalHistory: v.array(v.string()),
        allergies: v.array(v.string()),
        profileImage: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!patient) throw new Error("Patient not found");

        // البحث عن ملف موجود
        const existingProfile = await ctx.db
            .query("patientProfiles")
            .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
            .unique();

        const now = Date.now();

        if (existingProfile) {
            // تحديث الملف الموجود
            await ctx.db.patch(existingProfile._id, {
                phone: args.phone,
                dateOfBirth: args.dateOfBirth,
                gender: args.gender,
                bloodType: args.bloodType,
                address: args.address,
                emergencyContact: args.emergencyContact,
                medicalHistory: args.medicalHistory,
                allergies: args.allergies,
                profileImage: args.profileImage,
                notes: args.notes,
                updatedAt: now,
            });
            return existingProfile._id;
        } else {
            // إنشاء ملف جديد
            return await ctx.db.insert("patientProfiles", {
                patientId: patient._id,
                phone: args.phone,
                dateOfBirth: args.dateOfBirth,
                gender: args.gender,
                bloodType: args.bloodType,
                address: args.address,
                emergencyContact: args.emergencyContact,
                medicalHistory: args.medicalHistory,
                allergies: args.allergies,
                profileImage: args.profileImage,
                notes: args.notes,
                createdAt: now,
                updatedAt: now,
            });
        }
    },
});

/**
 * الحصول على ملف المريض الشخصي
 */
export const getPatientProfile = query({
    args: {
        patientId: v.id("patients"),
    },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("patientProfiles")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .unique();

        if (!profile) return null;

        // الحصول على بيانات المريض الأساسية
        const patient = await ctx.db.get(args.patientId);

        return {
            ...profile,
            patientName: patient?.name,
            patientEmail: patient?.email,
        };
    },
});

/**
 * الحصول على ملف المريض الخاص بي
 */
export const getMyPatientProfile = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!patient) return null;

        const profile = await ctx.db
            .query("patientProfiles")
            .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
            .unique();

        if (!profile) return null;

        return {
            ...profile,
            patientId: patient._id,
            patientName: patient.name,
            patientEmail: patient.email,
        };
    },
});

/**
 * الحصول على جميع ملفات المرضى (للأدمن والسكرتيرة والدكتور)
 */
export const getAllPatientProfiles = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || (user.role !== "admin" && user.role !== "secretary" && user.role !== "doctor")) {
            return [];
        }

        const profiles = await ctx.db
            .query("patientProfiles")
            .collect();

        return Promise.all(
            profiles.map(async (profile) => {
                const patient = await ctx.db.get(profile.patientId);
                return {
                    ...profile,
                    patientName: patient?.name,
                    patientEmail: patient?.email,
                };
            })
        );
    },
});

/**
 * حذف صورة المريض
 */
export const removeProfileImage = mutation({
    args: {
        profileId: v.id("patientProfiles"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const profile = await ctx.db.get(args.profileId);
        if (!profile) throw new Error("Profile not found");

        // التحقق من أن المريض يعديل ملفه الخاص
        const patient = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!patient || patient._id !== profile.patientId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.profileId, {
            profileImage: undefined,
            updatedAt: Date.now(),
        });
    },
});

/**
 * الحصول على ملف المريض للدكتور أو السكرتيرة
 */
export const getPatientProfileForStaff = query({
    args: {
        patientId: v.id("patients"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("patients")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || (user.role !== "admin" && user.role !== "secretary" && user.role !== "doctor")) {
            return null;
        }

        const profile = await ctx.db
            .query("patientProfiles")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .unique();

        if (!profile) return null;

        const patient = await ctx.db.get(args.patientId);

        return {
            ...profile,
            patientName: patient?.name,
            patientEmail: patient?.email,
        };
    },
});
