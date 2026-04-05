import { v } from "convex/values";
import { mutation} from "./_generated/server";  


export const createAppointment = mutation({
    args: {
        department: v.string(),
        doctorId: v.optional(v.id("doctors")),
        date: v.string(), // ISO string or timestamp passed as string from form
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Check if patient exists, if not create
        let patient = await ctx.db.query("patients").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).first();

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
    }

})