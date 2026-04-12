import { sendNotificationToMany } from "./notifications";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 REPORT NOTIFICATIONS - إشعارات التقارير الطبية
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📋 إشعار تقرير جديد - للسكرتارية والمديرين
export async function notifyReportCreated(
  ctx: MutationCtx,
  doctorId: Id<"patients">,
  doctorName: string,
  patientName: string,
  diagnosis: string,
  recipientIds: Id<"patients">[]
) {
  const message = `تقرير طبي جديد من ${doctorName} للمريض ${patientName} - التشخيص: ${diagnosis}`;

  return await sendNotificationToMany(
    ctx,
    doctorId,
    recipientIds,
    "report_created",
    message
  );
}

// 📋 إشعار نتيجة التقرير - للمريض
export async function notifyReportAvailable(
  ctx: MutationCtx,
  secretaryId: Id<"patients">,
  patientId: Id<"patients">,
  doctorName: string
) {
  const message = `التقرير الطبي من ${doctorName} متاح الآن. يمكنك الاطلاع عليه من الملف الشخصي`;

  return await ctx.db.insert("notifications", {
    fromUserId: secretaryId,
    toUserId: patientId,
    type: "report_available",
    message,
    isRead: false,
  });
}
