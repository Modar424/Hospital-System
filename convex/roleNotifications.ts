import { sendNotification } from "./notifications";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👤 ROLE NOTIFICATIONS - إشعارات تعيين الأدوار
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 👤 إشعار تعيين دور جديد
export async function notifyRoleAssigned(
  ctx: MutationCtx,
  fromAdminId: Id<"patients">,
  toUserId: Id<"patients">,
  userName: string,
  newRole: "admin" | "guest" | "doctor" | "secretary"
) {
  const roleLabel: Record<string, string> = {
    admin: "مسؤول النظام",
    doctor: "طبيب",
    secretary: "سكرتارية",
    guest: "زائر"
  };

  const message = `تم تعيينك كـ ${roleLabel[newRole]} في النظام`;

  return await sendNotification(
    ctx,
    fromAdminId,
    toUserId,
    "role_assigned",
    message
  );
}

// 👤 إشعار ترقية إلى مسؤول
export async function notifyPromotedToAdmin(
  ctx: MutationCtx,
  fromAdminId: Id<"patients">,
  toUserId: Id<"patients">,
  userName: string
) {
  const message = `تمت ترقيتك إلى مسؤول النظام! يمكنك الآن إدارة جميع المستخدمين والأنظمة`;

  return await sendNotification(
    ctx,
    fromAdminId,
    toUserId,
    "promoted_to_admin",
    message
  );
}

// 👤 إشعار تعيين كطبيب
export async function notifyPromotedToDoctor(
  ctx: MutationCtx,
  fromAdminId: Id<"patients">,
  toUserId: Id<"patients">,
  userName: string
) {
  const message = `تمت ترقيتك إلى طبيب! يمكنك الآن إنشاء التقارير والفواتير`;

  return await sendNotification(
    ctx,
    fromAdminId,
    toUserId,
    "promoted_to_doctor",
    message
  );
}

// 👤 إشعار تعيين كسكرتارية
export async function notifyPromotedToSecretary(
  ctx: MutationCtx,
  fromAdminId: Id<"patients">,
  toUserId: Id<"patients">,
  userName: string
) {
  const message = `تمت ترقيتك إلى سكرتارية! يمكنك الآن إدارة المواعيد والفواتير`;

  return await sendNotification(
    ctx,
    fromAdminId,
    toUserId,
    "promoted_to_secretary",
    message
  );
}

// 👤 إشعار تراجع في الدور
export async function notifyDemoted(
  ctx: MutationCtx,
  fromAdminId: Id<"patients">,
  toUserId: Id<"patients">,
  userName: string,
  previousRole: string
) {
  const message = `تم إزالة دورك كـ ${previousRole}. أنت الآن لديك صلاحيات محدودة`;

  return await sendNotification(
    ctx,
    fromAdminId,
    toUserId,
    "demoted",
    message
  );
}
