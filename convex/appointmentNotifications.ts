import { sendNotification, sendNotificationToMany } from "./notifications";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📅 APPOINTMENT NOTIFICATIONS - إشعارات المواعيد
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📅 إشعار موعد جديد - للسكرتارية
export async function notifyAppointmentCreated(
  ctx: MutationCtx,
  patientId: Id<"patients">,
  patientName: string,
  department: string,
  appointmentDate: Date,
  secretaryIds: Id<"patients">[]
) {
  const dateStr = appointmentDate.toLocaleString("ar-EG");
  const message = `موعد جديد من ${patientName} في قسم ${department} - ${dateStr}`;

  // إخطار السكرتاريات
  await sendNotificationToMany(
    ctx,
    patientId,
    secretaryIds,
    "appointment_created",
    message
  );
}

// ✅ إشعار تأكيد موعد - للمريض
export async function notifyAppointmentConfirmed(
  ctx: MutationCtx,
  secretaryId: Id<"patients">,
  patientId: Id<"patients">,
  doctorName: string,
  appointmentDate: Date,
  department: string
) {
  const dateStr = appointmentDate.toLocaleString("ar-EG");
  const message = `تم تأكيد موعدك مع ${doctorName} في قسم ${department} - ${dateStr}`;

  return await sendNotification(
    ctx,
    secretaryId,
    patientId,
    "appointment_confirmed",
    message
  );
}

// ❌ إشعار إلغاء موعد - للسكرتارية
export async function notifyAppointmentCancelled(
  ctx: MutationCtx,
  patientId: Id<"patients">,
  patientName: string,
  department: string,
  appointmentDate: Date,
  secretaryIds: Id<"patients">[]
) {
  const dateStr = appointmentDate.toLocaleString("ar-EG");
  const message = `تم إلغاء موعد ${patientName} في قسم ${department} - ${dateStr}`;

  // إخطار السكرتاريات
  await sendNotificationToMany(
    ctx,
    patientId,
    secretaryIds,
    "appointment_cancelled",
    message
  );
}

// ✅ إشعار إكمال موعد - للمريض
export async function notifyAppointmentCompleted(
  ctx: MutationCtx,
  doctorId: Id<"patients">,
  patientId: Id<"patients">,
  doctorName: string,
  department: string
) {
  const message = `تم إكمال موعدك مع ${doctorName} في قسم ${department}. يمكنك الآن الاطلاع على التقرير الطبي`;

  return await sendNotification(
    ctx,
    doctorId,
    patientId,
    "appointment_completed",
    message
  );
}
