import { sendNotification } from "./notifications";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 PATIENT-SECRETARY NOTIFICATIONS - رسائل مريض ↔ سكرتارية
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 💬 رسالة من المريض للسكرتارية
export async function notifyPatientMessageToSecretary(
  ctx: MutationCtx,
  patientId: Id<"patients">,
  secretaryId: Id<"patients">,
  patientName: string,
  subject: string
) {
  const message = `رسالة من المريض ${patientName}: ${subject}`;

  return await sendNotification(
    ctx,
    patientId,
    secretaryId,
    "patient_message_to_secretary",
    message
  );
}

// 💬 رسالة من السكرتارية للمريض
export async function notifySecretaryMessageToPatient(
  ctx: MutationCtx,
  secretaryId: Id<"patients">,
  patientId: Id<"patients">,
  secretaryName: string,
  subject: string
) {
  const message = `رسالة من السكرتارية ${secretaryName}: ${subject}`;

  return await sendNotification(
    ctx,
    secretaryId,
    patientId,
    "secretary_message_to_patient",
    message
  );
}
