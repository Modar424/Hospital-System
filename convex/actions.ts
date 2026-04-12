import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { Resend } from "resend";
import OpenAI from "openai";
import { api } from "./_generated/api";

// Type definitions
interface Medication {
    name: string;
    nameAr?: string;
    price: number;
    available: boolean;
    description?: string;
    category?: string;
}

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

// دالة لتصفية الردود وضمان نقاء اللغة
function purifyLanguageResponse(response: string, isArabic: boolean): string {
    if (isArabic) {
        // Keep only Arabic text and digits
        // Remove any non-Arabic, non-digit, non-punctuation characters
        // Arabic block: U+0600-U+06FF
        // Keep emojis and basic punctuation
        let purified = "";
        for (const char of response) {
            const code = char.charCodeAt(0);
            // Arabic characters (U+0600-U+06FF)
            const isArabicChar = code >= 0x0600 && code <= 0x06FF;
            // Arabic extensions (U+0750-U+077F)
            const isArabicExt = code >= 0x0750 && code <= 0x077F;
            // Latin digits (0-9)
            const isLatinDigit = code >= 0x0030 && code <= 0x0039;
            // Arabic-Indic digits (٠-٩)
            const isArabicDigit = code >= 0x0660 && code <= 0x0669;
            // Common punctuation and spaces
            const isCommon = " .,;:!؟'ـــ\n☑✓✓✔🏥📌١٢٣٤٥٦٧٨٩٠".includes(char);
            
            if (isArabicChar || isArabicExt || isLatinDigit || isArabicDigit || isCommon) {
                purified += char;
            }
        }
        return purified;
    } else {
        // For English: remove Arabic text but keep English
        let purified = "";
        for (const char of response) {
            const code = char.charCodeAt(0);
            // Remove Arabic characters (U+0600-U+06FF and U+0750-U+077F)
            const isArabicChar = (code >= 0x0600 && code <= 0x06FF) || 
                                (code >= 0x0750 && code <= 0x077F);
            
            if (!isArabicChar) {
                purified += char;
            }
        }
        // Clean up excessive whitespace from removed Arabic
        return purified.replace(/\n\n\n+/g, '\n\n').trim();
    }
}

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

        // 2. Detect the language of the user's message FIRST
        const arabicRegex = /[\u0600-\u06FF]/;
        const isArabic = arabicRegex.test(args.message);

        // 3. Fetch user's appointments to give AI context
        // Arabic numerals mapping
        const arabicNumerals = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠'];

let appointmentContext = "";
try {
    const appointments = await ctx.runQuery(api.appointments.myAppointments, {});
    if (appointments && appointments.length > 0) {
        // English format
        let appointmentTextEn = "📅 Your Appointments:\n\n";
        appointments.forEach((app, index) => {
            const date = new Date(app.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            const doctorName = app.doctor?.name || 'To be assigned';
            const statusLabel = app.status === 'confirmed' ? '✅ Confirmed' : 
                              app.status === 'pending' ? '⏳ Pending' :
                              app.status === 'cancelled' ? '❌ Cancelled' : app.status;
            
            appointmentTextEn += `${index + 1}) ${doctorName} | ${formattedDate} | ${formattedTime} | ${statusLabel}`;
            if (index < appointments.length - 1) appointmentTextEn += "\n\n";
        });

        // Arabic format
        let appointmentTextAr = "📅 مواعيدك:\n\n";
        appointments.forEach((app, index) => {
            const date = new Date(app.date);
            const formattedDate = date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            const doctorName = app.doctor?.name || 'سيتم تحديده';
            const statusLabel = app.status === 'confirmed' ? '✅ مؤكد' :
                              app.status === 'pending' ? '⏳ قيد الانتظار' :
                              app.status === 'cancelled' ? '❌ ملغي' : app.status;
            
            const arabicNum = arabicNumerals[index] || `${index + 1}`;
            appointmentTextAr += `${arabicNum}) ${doctorName} | ${formattedDate} | ${formattedTime} | ${statusLabel}`;
            if (index < appointments.length - 1) appointmentTextAr += "\n\n";
        });

        appointmentContext = isArabic ? appointmentTextAr : appointmentTextEn;
    } else {
        appointmentContext = isArabic 
            ? "📅 لا توجد مواعيد قادمة لديك."
            : "📅 You have no upcoming appointments.";
    }
} catch (e) {
    console.error("Failed to fetch appointments for AI context", e);
}

        // 3. Fetch pharmacy data from pharmacy query
        let pharmacyContext = "";
        try {
            const medications = await ctx.runQuery(api.pharmacy.get, {});
            if (medications && medications.length > 0) {
                // Group medications by category for better organization
                const medicationsByCategory = medications.reduce((acc: Record<string, Medication[]>, med: Medication) => {
                    const cat = med.category || "Other";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(med);
                    return acc;
                }, {} as Record<string, Medication[]>);

                // Arabic numerals mapping
                const arabicNumerals = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', 
                                       '١١', '١٢', '١٣', '١٤', '١٥', '١٦', '١٧', '١٨', '١٩', '٢٠'];

                let pharmText = "\n🏥 Available Medications in our Pharmacy:\n\n";
                
                Object.entries(medicationsByCategory).forEach(([category, meds]: [string, Medication[]]) => {
                    pharmText += `📌 ${category}:\n`;
                    
                    meds.forEach((med: Medication, index: number) => {
                        const availability = med.available ? "✅ Available" : "❌ Out of Stock";
                        const arabicName = med.nameAr ? ` (${med.nameAr})` : "";
                        const desc = med.description ? ` • ${med.description}` : "";
                        
                        // Professional single-line format without extra separators
                        pharmText += `${index + 1}) ${med.name}${arabicName} | ${med.price} SAR | ${availability}${desc}\n`;
                    });
                    pharmText += "\n";
                });
                
                // Arabic version with Arabic numerals
                let pharmTextAr = "\n🏥 الأدوية المتوفرة في صيدلية HealWell:\n\n";
                
                Object.entries(medicationsByCategory).forEach(([category, meds]: [string, Medication[]]) => {
                    pharmTextAr += `📌 ${category}:\n`;
                    
                    meds.forEach((med: Medication, index: number) => {
                        const availability = med.available ? "✅ متوفر" : "❌ غير متوفر";
                        const englishName = med.name ? ` (${med.name})` : "";
                        const desc = med.description ? ` • ${med.description}` : "";
                        
                        // Arabic format with Arabic numerals
                        const arabicNum = arabicNumerals[index] || `${index + 1}`;
                        pharmTextAr += `${arabicNum}) ${med.nameAr || med.name}${englishName} | ${med.price} ريال | ${availability}${desc}\n`;
                    });
                    pharmTextAr += "\n";
                });
                
                // Detect language and use appropriate format
                pharmacyContext = isArabic ? pharmTextAr : pharmText;
            }
        } catch (e) {
            console.error("Failed to fetch pharmacy data for AI context", e);
        }

        const systemPrompt = `You are a helpful medical assistant for MedCare Hospital (HealWell).
You can help users check their appointments, find doctors, get general medical info, and check medication availability and prices.
Important: You are not a doctor. Do not give medical diagnoses. Always advise users to consult their doctor before taking any medication.
If asked about appointments, you have access to their list below.

**LANGUAGE PURITY RULE - VERY IMPORTANT:**
${isArabic 
  ? `🇸🇦 اللغة: عربي فقط
- اجب باللغة العربية بشكل كامل 100%
- لا تستخدم أي كلمات إنجليزية على الإطلاق
- لا استثناءات، حتى للأسماء الدوائية - ترجمها كاملة أو استخدم الاسم العربي فقط
- تجنب أي أحرف أو كلمات غير عربية
- تأكد من النقاء الكامل للغة العربية`
  : `🇬🇧 LANGUAGE: English Only
- Respond entirely in English - 100% English only
- Do NOT use any Arabic words whatsoever
- No exceptions, use only English equivalents
- Maintain complete linguistic purity
- Avoid any Arabic or foreign characters`
}

**MEDICATION RESPONSE FORMAT:**
When answering about medications, FORMAT the response clearly with numbered lists:
${isArabic
  ? `١) اسم الدواء | السعر | الحالة | الوصف
٢) دواء آخر | السعر | الحالة | الوصف`
  : `1) Medication Name | Price | Status | Description
2) Another Medication | Price | Status | Description`
}

Current user: ${identity.name || "Guest"}.

${appointmentContext}
${pharmacyContext}
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
                const rawResponse = completion.choices[0].message.content;
                const purifiedResponse = purifyLanguageResponse(rawResponse || "", isArabic);
                return purifiedResponse;
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
                    <p>Your appointment with <strong>${args.doctorName}</strong> has been confirmed.</p>
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