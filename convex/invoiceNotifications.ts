import { sendNotificationToMany } from "./notifications";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💵 INVOICE NOTIFICATIONS - إشعارات الفواتير
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 💵 إشعار فاتورة جديدة
export async function notifyInvoiceCreated(
  ctx: MutationCtx,
  doctorId: Id<"patients">,  
  doctorName: string,
  patientName: string,
  invoiceNumber: string,
  recipientIds: Id<"patients">[]
) {
  const message = `فاتورة جديدة من د.${doctorName} للمريض ${patientName} - رقم الفاتورة: ${invoiceNumber}`;

  return await sendNotificationToMany(
    ctx,
    doctorId,
    recipientIds,
    "invoice_created",
    message
  );
}
