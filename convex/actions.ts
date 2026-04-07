import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { Resend } from "resend";
import OpenAI from "openai";
import { api } from "./_generated/api";

const resend = new Resend(process.env.RESEND_API_KEY);

// إعداد عميل OpenRouter
const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        'HTTP-Referer': 'https://medcare.com',
        'X-Title': 'MedCare AI Assistant',
    }
});

// قائمة النماذج المجانية
const FREE_MODELS = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "stepfun/step-3.5-flash:free",
    "arcee-ai/trinity-large-preview:free",
    "liquid/lfm-2.5-1.2b-thinking:free",
    "openai/gpt-oss-120b:free",
    "google/gemini-3.1-flash-lite-preview:free"
];

export const chat = action({
    args: {
        message: v.string(),
        conversationHistory: v.array(
            v.object({
                role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
                content: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        console.log("KEY:", process.env.OPENROUTER_API_KEY ? "EXISTS" : "MISSING");
        
        // 1. Get the user's identity (Clerk)
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        // 2. Fetch user's appointments to give AI context
        // الكود الجديد (المعدل)
let appointmentContext = "";
try {
    const appointments = await ctx.runQuery(api.appointments.myAppointments, {});
    if (appointments && appointments.length > 0) {
        appointmentContext = "User's Appointments:\n" + appointments.map(app => {
            const date = new Date(app.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const doctorName = app.doctor?.name || 'to be assigned';
            
            return `- ${formattedDate} at ${formattedTime} with Dr. ${doctorName} (${app.status})`;
        }).join("\n");
    } else {
        appointmentContext = "User has no upcoming appointments.";
    }
} catch (e) {
    console.error("Failed to fetch appointments for AI context", e);
}

        const systemPrompt = `You are a helpful medical assistant for MedCare Hospital.
You can help users check their appointments, find doctors, and get general medical info.
Important: You are not a doctor. Do not give medical diagnoses.
If asked about appointments, you have access to their list below.
Current user: ${identity.name || "Guest"}.

${appointmentContext}
`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            ...args.conversationHistory.map(m => ({ role: m.role, content: m.content })),
            { role: "user" as const, content: args.message }
        ];

        for (const model of FREE_MODELS) {
            try {
                console.log(`Trying model: ${model}`);
                const completion = await openrouter.chat.completions.create({
                    model: model,
                    messages: messages,
                });
                console.log(`Success with model: ${model}`);
                return completion.choices[0].message.content;
            } catch (error) {
                console.log(`Model ${model} failed:`, error);
                continue;
            }
        }

        throw new Error("All models failed");
    },
})

export const sendAppointmentConfirmationEmail = internalAction({
    args: {
        to: v.string(),
        patientName: v.string(),
        doctorName: v.string(),
        date: v.string(),
        appointmentId: v.string(),
    },
    handler: async (ctx, args) => {
        if (!process.env.RESEND_API_KEY) {
            console.error("RESEND_API_KEY is not set. Cannot send email.");
            return;
        }

        try {
            await resend.emails.send({
                from: "MedCare Appointments <onboarding@resend.dev>",
                to: args.to,
                subject: "Appointment Confirmed - MedCare Hospital",
                html: `
                    <h1>Appointment Confirmed</h1>
                    <p>Dear ${args.patientName},</p>
                    <p>Your appointment with <strong>Dr. ${args.doctorName}</strong> has been confirmed.</p>
                    <p><strong>Date & Time:</strong> ${args.date}</p>
                    <p>Please arrive 15 minutes early.</p>
                    <p>Reference ID: ${args.appointmentId}</p>
                    <br/>
                    <p>Best regards,<br/>MedCare Hospital Team</p>
                `,
            });
            console.log(`Confirmation email sent to ${args.to}`);
        } catch (error) {
            console.error("Failed to send email", error);
        }
    },
});