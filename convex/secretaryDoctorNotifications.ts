import { sendNotification } from "./notifications";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 SECRETARY-DOCTOR NOTIFICATIONS - رسائل سكرتارية ↔ دكتور
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 💬 رسالة من السكرتارية للدكتور
export async function notifySecretaryMessageToDoctor(
  ctx: MutationCtx,
  secretaryId: Id<"patients">,
  doctorId: Id<"patients">,
  secretaryName: string,
  subject: string
) {
  const message = `رسالة من السكرتارية ${secretaryName}: ${subject}`;

  return await sendNotification(
    ctx,
    secretaryId,
    doctorId,
    "secretary_message_to_doctor",
    message
  );
}

// 💬 رسالة من الدكتور للسكرتارية
export async function notifyDoctorMessageToSecretary(
  ctx: MutationCtx,
  doctorId: Id<"patients">,
  secretaryId: Id<"patients">,
  doctorName: string,
  subject: string
) {
  const message = `رسالة من ${doctorName}: ${subject}`;

  return await sendNotification(
    ctx,
    doctorId,
    secretaryId,
    "doctor_message_to_secretary",
    message
  );
}
