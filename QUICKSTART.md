# ⚡ الخطوات السريعة - Quick Start

## 5 دقائق للبدء!

### 1️⃣ نسخ الملفات (1 دقيقة)
```bash
# اتبع هيكل المجلدات أدناه:

convex/
├── adminNotifications.ts
├── appointmentLimits.ts
├── cancellationAlerts.ts
└── doctorSecretaryMessages.ts

components/
├── AdminNotificationsPanel.tsx
├── AppointmentLimitDisplay.tsx
└── MessagePanel.tsx
```

### 2️⃣ تحديث البيانات (1 دقيقة)
```bash
npx convex dev
```

### 3️⃣ تحديث الصفحات (2 دقيقة)

#### صفحة الأدمن (`app/admin/page.tsx`):
أضف في الأعلى:
```typescript
import AdminNotificationsPanel from '@/components/AdminNotificationsPanel'
import { useState } from 'react'

// في المكون:
const [notifOpen, setNotifOpen] = useState(false)

// في JSX - أضف الزر:
<button onClick={() => setNotifOpen(true)}>📊 الإشعارات</button>
<AdminNotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
```

#### صفحة الدكتور (`app/doctor/page.tsx`):
أضف في الأعلى:
```typescript
import MessagePanel from '@/components/MessagePanel'
import { useState } from 'react'

// في المكون:
const [msgOpen, setMsgOpen] = useState(false)

// في JSX - أضف الزر:
<button onClick={() => setMsgOpen(true)}>💬 الرسائل</button>
<MessagePanel userRole="doctor" isOpen={msgOpen} onClose={() => setMsgOpen(false)} />
```

#### صفحة السكرتيرة (`app/secretary/page.tsx`):
أضف نفس الخطوات مع تغيير `userRole` إلى `"secretary"`

#### صفحة الحجوزات (`app/appointments/page.tsx`):
أضف في الأعلى:
```typescript
import AppointmentLimitDisplay from '@/components/AppointmentLimitDisplay'

// في JSX - أضف في أعلى الصفحة:
<AppointmentLimitDisplay patientId={patientId} />
```

### 4️⃣ اختبر (1 دقيقة)
```bash
npm run dev
```

---

## ✨ ماذا تم إضافة؟

| الميزة | الموقع | الوصف |
|--------|--------|--------|
| 📊 إشعارات مالية | لوحة الأدمن | إشعارات عن الفواتير والتقارير |
| 💬 رسائل | الدكتور/السكرتيرة | تواصل مباشر بينهم |
| ⚠️ تنبيه إلغاء | المريض | عند إلغاء الحجز |
| 🚫 حد الحجوزات | جميع المرضى | 3 حجوزات كحد أقصى |

---

## 🎯 الاستخدام

### الأدمن:
1. اضغط على زر "الإشعارات المالية"
2. شاهد جميع الفواتير والتقارير
3. اضغط على الإشعار لتوسيعه

### الدكتور:
1. اضغط على زر "الرسائل"
2. اقرأ رسائل السكرتيرة
3. ستقدر ترد من خلال نفس اللوحة

### السكرتيرة:
1. اضغط على زر "الرسائل"
2. اقرأ رسائل الأطباء
3. ستقدر ترد من خلال نفس اللوحة

### المريض:
1. اذهب لصفحة "المواعيد"
2. شاهد عدد مواعيدك النشطة
3. لا تستطيع حجز أكثر من 3 حجوزات

---

## 🐛 إذا حصل خطأ

### "API not found"
```bash
npx convex dev
# أعد التشغيل
```

### "Component not found"
تأكد من:
- اسم الملف صحيح
- المسار صحيح (`components/` وليس `component/`)
- لا توجد مسافات إضافية

### الإشعارات لا تظهر
1. سجل دخول بحساب مختلف
2. أنشئ فاتورة جديدة
3. الإشعار يجب أن يظهر فوراً

---

## 📚 المزيد من المعلومات

اقرأ `UPDATES.md` لمعرفة كل التفاصيل
اقرأ `INSTALLATION.md` للتثبيت الكامل

---

**استمتع! 🚀**
