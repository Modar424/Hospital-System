# 🔧 تعليمات التثبيت والتكامل - Installation & Integration Guide

## قائمة المحتويات
1. [الملفات الجديدة](#الملفات-الجديدة)
2. [خطوات التثبيت](#خطوات-التثبيت)
3. [تعديلات يدوية مطلوبة](#تعديلات-يدوية-مطلوبة)
4. [تكامل الواجهات](#تكامل-الواجهات)

---

## 📁 الملفات الجديدة

### ملفات Backend (Convex)
```
convex/
├── adminNotifications.ts          (جديد) - إشعارات الأدمن
├── appointmentLimits.ts           (جديد) - نظام حد الحجوزات
├── cancellationAlerts.ts          (جديد) - تنبيهات الإلغاء
└── doctorSecretaryMessages.ts     (جديد) - رسائل الدكتور والسكرتيرة
```

### ملفات Frontend (React Components)
```
components/
├── AdminNotificationsPanel.tsx     (جديد) - لوحة إشعارات الأدمن
├── AppointmentLimitDisplay.tsx     (جديد) - عرض حد الحجوزات
└── MessagePanel.tsx                (جديد) - لوحة الرسائل
```

### ملفات التوثيق
```
├── UPDATES.md                      (جديد) - ملخص التعديلات
└── INSTALLATION.md                 (هذا الملف)
```

---

## 🚀 خطوات التثبيت

### الخطوة 1: تحديث قاعدة البيانات (Schema)
```bash
# نسخ الملفات الجديدة من convex/
# 1. convex/adminNotifications.ts
# 2. convex/appointmentLimits.ts
# 3. convex/cancellationAlerts.ts
# 4. convex/doctorSecretaryMessages.ts

# ثم رفع التغييرات:
npx convex dev
```

### الخطوة 2: نسخ ملفات Frontend
```bash
# نسخ المكونات الجديدة:
# 1. components/AdminNotificationsPanel.tsx
# 2. components/AppointmentLimitDisplay.tsx
# 3. components/MessagePanel.tsx
```

### الخطوة 3: التحقق من الواجهات
تأكد من استيراد المكونات الجديدة في الصفحات المناسبة:
- `/app/admin/page.tsx` ← AdminNotificationsPanel
- `/app/doctor/page.tsx` ← MessagePanel
- `/app/secretary/page.tsx` ← MessagePanel
- `/app/appointments/page.tsx` ← AppointmentLimitDisplay

---

## ✏️ تعديلات يدوية مطلوبة

### 1️⃣ تعديل `/app/admin/page.tsx`

**إضافة Import:**
```typescript
import AdminNotificationsPanel from '@/components/AdminNotificationsPanel'
```

**إضافة State:**
```typescript
const [notifPanelOpen, setNotifPanelOpen] = useState(false)
```

**إضافة زر في الـ Navigation (Sidebar):**
```typescript
{
  key: 'financial_notifications',
  label: 'الإشعارات المالية',
  icon: DollarSign
}
```

**إضافة المكون:**
```typescript
<AdminNotificationsPanel 
  isOpen={notifPanelOpen} 
  onClose={() => setNotifPanelOpen(false)} 
/>
```

**إضافة عداد الإشعارات:**
```typescript
const adminUnreadCount = useQuery(api.adminNotifications.getAdminUnreadCount)

// في الزر:
<Badge variant="destructive" className="absolute -top-2 -right-2">
  {adminUnreadCount}
</Badge>
```

---

### 2️⃣ تعديل `/app/doctor/page.tsx`

**إضافة Import:**
```typescript
import MessagePanel from '@/components/MessagePanel'
```

**إضافة State:**
```typescript
const [messagePanelOpen, setMessagePanelOpen] = useState(false)
```

**تعديل NavItems:**
```typescript
const navItems: { key: NavItem; label: string; icon: React.ElementType }[] = [
  { key: 'patients', label: 'My Patients', icon: Users },
  { key: 'messages', label: 'Messages', icon: MessageSquare },  // ✅ جديد
  { key: 'notifications', label: 'Notifications', icon: Bell },
]
```

**تعديل Type NavItem:**
```typescript
type NavItem = 'patients' | 'notifications' | 'messages'  // ✅ أضف messages
```

**إضافة المكون:**
```typescript
<MessagePanel 
  userRole="doctor"
  isOpen={messagePanelOpen} 
  onClose={() => setMessagePanelOpen(false)} 
/>
```

**إضافة عداد الرسائل:**
```typescript
const doctorMessageCount = useQuery(api.doctorSecretaryMessages.getDoctorUnreadMessageCount)

// في الزر:
{doctorMessageCount > 0 && (
  <Badge variant="destructive" className="absolute -top-2 -right-2">
    {doctorMessageCount}
  </Badge>
)}
```

---

### 3️⃣ تعديل `/app/secretary/page.tsx`

**إضافة Import:**
```typescript
import MessagePanel from '@/components/MessagePanel'
```

**إضافة State:**
```typescript
const [messagePanelOpen, setMessagePanelOpen] = useState(false)
```

**تعديل NavItems:**
```typescript
const navItems: { key: NavItem; label: string; icon: React.ElementType }[] = [
  { key: 'appointments', label: 'Appointments', icon: Calendar },
  { key: 'messages', label: 'Messages', icon: MessageSquare },  // ✅ جديد
  { key: 'invoices', label: 'Invoices', icon: Receipt },
  { key: 'reports', label: 'Reports', icon: FileText },
]
```

**تعديل Type NavItem:**
```typescript
type NavItem = 'appointments' | 'invoices' | 'reports' | 'messages'  // ✅ أضف messages
```

**إضافة المكون:**
```typescript
<MessagePanel 
  userRole="secretary"
  isOpen={messagePanelOpen} 
  onClose={() => setMessagePanelOpen(false)} 
/>
```

**إضافة عداد الرسائل:**
```typescript
const secretaryMessageCount = useQuery(api.doctorSecretaryMessages.getSecretaryUnreadMessageCount)

// في الزر:
{secretaryMessageCount > 0 && (
  <Badge variant="destructive" className="absolute -top-2 -right-2">
    {secretaryMessageCount}
  </Badge>
)}
```

---

### 4️⃣ تعديل `/app/appointments/page.tsx`

**إضافة Import:**
```typescript
import AppointmentLimitDisplay from '@/components/AppointmentLimitDisplay'
```

**إضافة في أعلى قائمة الحجوزات:**
```typescript
{patient && (
  <AppointmentLimitDisplay 
    patientId={patient._id}
    onLimitReached={() => setShowAppointments(true)}
  />
)}
```

---

## 🔗 تكامل الواجهات

### إضافة أيقونات جديدة (lucide-react)
تأكد من استيراد الأيقونات التالية:
```typescript
import {
  MessageSquare,    // للرسائل
  DollarSign,       // للتقارير المالية
  AlertCircle,      // للتنبيهات
  Eye, EyeOff       // للإشارة للقراءة
} from 'lucide-react'
```

### تحديث الـ API Calls
جميع الـ API Functions موجودة في:
- `api.adminNotifications.*`
- `api.doctorSecretaryMessages.*`
- `api.appointmentLimits.*`
- `api.cancellationAlerts.*`

---

## 📋 قائمة المراجعة

- [ ] نسخ ملفات `convex/` الجديدة
- [ ] نسخ ملفات `components/` الجديدة
- [ ] تحديث `/app/admin/page.tsx`
- [ ] تحديث `/app/doctor/page.tsx`
- [ ] تحديث `/app/secretary/page.tsx`
- [ ] تحديث `/app/appointments/page.tsx`
- [ ] تشغيل `npx convex dev`
- [ ] اختبار الإشعارات
- [ ] اختبار الرسائل
- [ ] اختبار حد الحجوزات

---

## 🧪 اختبارات سريعة

### اختبار الإشعارات المالية:
1. سجل دخول كأدمن
2. اذهب لإنشاء فاتورة
3. اذهب لقسم الإشعارات
4. تحقق من ظهور الإشعار الجديد

### اختبار الرسائل:
1. سجل دخول كدكتور
2. أرسل رسالة للسكرتيرة
3. سجل دخول كسكرتيرة
4. تحقق من ظهور الرسالة والعداد

### اختبار حد الحجوزات:
1. احجز 3 مواعيد
2. حاول حجز الرابع
3. يجب أن تظهر رسالة خطأ
4. ألغ أحد المواعيد
5. حاول الحجز مرة أخرى - يجب أن ينجح

---

## ⚠️ الأخطاء الشائعة

### خطأ: "API not found"
**الحل**: تأكد من نسخ جميع ملفات `convex/` وتشغيل `npx convex dev`

### خطأ: "Unauthorized"
**الحل**: تأكد من تسجيل دخول المستخدم بشكل صحيح

### خطأ: المكونات لا تظهر
**الحل**: تأكد من استيراد المكونات بشكل صحيح والتحقق من مسار الـ path

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من Convex Console للأخطاء
2. تأكد من أن جميع الملفات موجودة
3. أعد تشغيل خادم التطوير

---

**آخر تحديث**: 2024
**الإصدار**: 1.0
