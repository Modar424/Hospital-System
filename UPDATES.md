# تعديلات نظام إدارة المستشفى - Hospital System Updates

## نظرة عامة على التعديلات

تم إضافة 5 ميزات رئيسية جديدة لتحسين تجربة المستخدمين والإدارة في نظام إدارة المستشفى:

---

## 1️⃣ إشعارات الأدمن عن التقارير والأمور المالية

### الملفات الجديدة:
- **Backend**: `convex/adminNotifications.ts`
- **Frontend**: `components/AdminNotificationsPanel.tsx`

### الميزات:
- ✅ إرسال إشعارات تلقائية للأدمن عند إنشاء تقرير طبي جديد
- ✅ إرسال إشعارات تلقائية للأدمن عند إنشاء فاتورة جديدة
- ✅ عرض جميع الإشعارات المالية والتقارير في لوحة خاصة
- ✅ عداد للإشعارات غير المقروءة
- ✅ ميزة تحديد الإشعار كمقروء

### API Functions:
```typescript
// في convex/adminNotifications.ts
- notifyAdminNewReport() // إرسال إشعار تقرير جديد
- notifyAdminNewInvoice() // إرسال إشعار فاتورة جديدة
- getAdminNotifications() // جلب الإشعارات
- getAdminUnreadCount() // عدد الإشعارات غير المقروءة
- markAdminNotificationAsRead() // تحديد كمقروء
```

---

## 2️⃣ تنبيه المريض عند إلغاء الحجز من قبل السكرتيرة

### الملفات الجديدة:
- **Backend**: `convex/cancellationAlerts.ts`

### الميزات:
- ✅ إرسال إشعار فوري للمريض عند إلغاء حجزه
- ✅ الإشعار يحتوي على تفاصيل كاملة (الطبيب، التاريخ، القسم، السكرتيرة)
- ✅ تنبيه تلقائي دون تدخل يدوي
- ✅ إمكانية حجز موعد جديد فوراً بعد الإلغاء

### API Functions:
```typescript
// في convex/cancellationAlerts.ts
- notifyPatientAppointmentCancellation() // إرسال التنبيه
- cancelAppointmentWithNotification() // إلغاء مع إرسال التنبيه
```

---

## 3️⃣ نظام الرسائل بين الدكتور والسكرتيرة

### الملفات الجديدة:
- **Backend**: `convex/doctorSecretaryMessages.ts`
- **Frontend**: `components/MessagePanel.tsx`

### الميزات:
- ✅ الدكتور يمكنه إرسال رسائل للسكرتيرة
- ✅ السكرتيرة يمكنها إرسال رسائل للدكتور
- ✅ لوحة رسائل منفصلة لكل دور
- ✅ عداد الرسائل غير المقروءة
- ✅ معلومات المرسل (الاسم والبريد الإلكتروني)
- ✅ عرض التاريخ والوقت

### API Functions:
```typescript
// في convex/doctorSecretaryMessages.ts
- doctorSendToSecretary() // الدكتور يرسل للسكرتيرة
- secretarySendToDoctor() // السكرتيرة ترسل للدكتور
- getDoctorMessages() // جلب رسائل الدكتور
- getSecretaryMessages() // جلب رسائل السكرتيرة
- getDoctorUnreadMessageCount() // عداد الدكتور
- getSecretaryUnreadMessageCount() // عداد السكرتيرة
- markMessageAsRead() // تحديد الرسالة كمقروءة
```

---

## 4️⃣ نظام حد أقصى للحجوزات (3 حجوزات نشطة)

### الملفات الجديدة:
- **Backend**: `convex/appointmentLimits.ts` + تعديلات في `convex/appointments.ts`
- **Frontend**: `components/AppointmentLimitDisplay.tsx`

### الميزات:
- ✅ الحد الأقصى: 3 حجوزات نشطة (pending أو confirmed)
- ✅ منع حجز موعد رابع إذا كان لديه 3 حجوزات نشطة
- ✅ إمكانية الحجز بعد إلغاء أحد الحجوزات أو اكتمالها
- ✅ عرض بصري واضح لعدد الحجوزات النشطة
- ✅ شريط تقدم يوضح نسبة الاستخدام

### API Functions:
```typescript
// في convex/appointmentLimits.ts
- getActiveAppointmentCount() // عدد الحجوزات النشطة
- canBookAppointment() // هل يمكن الحجز
- updateAppointmentLimit() // تحديث الحد
- validateAppointmentBooking() // التحقق من الصحة
- getActiveAppointments() // جلب الحجوزات النشطة

// تعديل في convex/appointments.ts
// إضافة التحقق من الحد قبل إنشاء موعد جديد
```

---

## 📊 تعديلات الـ Schema

### إضافة أنواع إشعارات جديدة:
```typescript
v.literal("appointment_cancellation_alert"), // تنبيه إلغاء الحجز
v.literal("financial_report"),               // تقرير مالي
v.literal("admin_report_notification"),      // إشعار تقرير للأدمن
v.literal("doctor_to_secretary_message"),    // رسالة دكتور للسكرتيرة
v.literal("secretary_to_doctor_message")     // رسالة سكرتيرة للدكتور
```

### إضافة جدول جديد:
```typescript
appointmentLimits: defineTable({
    patientId: v.id("patients"),
    activeCount: v.number(),
    lastUpdated: v.number(),
})
.index("by_patient", ["patientId"]),
```

---

## 🔧 كيفية الاستخدام

### 1️⃣ لوحة الإشعارات - الأدمن:
```tsx
import AdminNotificationsPanel from '@/components/AdminNotificationsPanel'

<AdminNotificationsPanel isOpen={isOpen} onClose={onClose} />
```

### 2️⃣ لوحة الرسائل - الدكتور/السكرتيرة:
```tsx
import MessagePanel from '@/components/MessagePanel'

<MessagePanel userRole="doctor" isOpen={isOpen} onClose={onClose} />
```

### 3️⃣ عرض حد الحجوزات:
```tsx
import AppointmentLimitDisplay from '@/components/AppointmentLimitDisplay'

<AppointmentLimitDisplay 
  patientId={patientId} 
  onLimitReached={() => console.log('Limit reached')}
/>
```

---

## 📱 التكامل مع الصفحات الموجودة

### صفحة الأدمن (`/admin`):
- إضافة زر في الـ Navigation للإشعارات المالية والتقارير
- عداد الإشعارات غير المقروءة بجانب الزر

### صفحة الدكتور (`/doctor`):
- إضافة تبويب جديد "الرسائل" في الـ Navigation
- عداد الرسائل غير المقروءة من السكرتيرات

### صفحة السكرتيرة (`/secretary`):
- إضافة تبويب جديد "الرسائل" في الـ Navigation
- عداد الرسائل غير المقروءة من الأطباء

### صفحة الحجوزات (`/appointments`):
- إضافة عرض حد الحجوزات في أعلى الصفحة
- تعطيل زر الحجز إذا وصل للحد الأقصى

---

## ⚙️ متطلبات التثبيت

لا توجد متطلبات خارجية جديدة. جميع الملفات الجديدة تستخدم:
- `convex/react` - للاستعلامات والطفرات
- `framer-motion` - للتأثيرات المرئية
- `sonner` - لإظهار التنبيهات
- `lucide-react` - للأيقونات

---

## 🧪 الاختبار

### للأدمن:
1. أنشئ فاتورة جديدة
2. تحقق من ظهور الإشعار في لوحة الإشعارات
3. جرب تحديد الإشعار كمقروء

### للدكتور والسكرتيرة:
1. سجل دخول كدكتور
2. أرسل رسالة للسكرتيرة
3. سجل دخول كسكرتيرة
4. تحقق من استقبال الرسالة وظهور العداد

### لحد الحجوزات:
1. احجز 3 مواعيد
2. حاول حجز الرابع - يجب أن يظهر رسالة خطأ
3. ألغ أحد المواعيد
4. حاول الحجز مرة أخرى - يجب أن ينجح

---

## 📝 ملاحظات مهمة

- جميع الإشعارات يتم حفظها في قاعدة البيانات
- يمكن استرجاع سجل الإشعارات والرسائل في أي وقت
- عداد الحجوزات يتم تحديثه تلقائياً عند تغيير حالة الحجز
- يتم إرسال الإشعارات فوراً بعد إجراء الفعل

---

## 🐛 استكشاف الأخطاء

إذا لم تظهر الإشعارات:
1. تأكد من أن قاعدة البيانات محدثة (Push the schema)
2. تحقق من Convex Console للأخطاء
3. تأكد من تسجيل المستخدم بشكل صحيح

إذا لم تشتغل الرسائل:
1. تحقق من أن الدور صحيح (doctor أو secretary)
2. تأكد من أن المستقبل موجود في قاعدة البيانات

---

## 📚 ملفات المشروع الجديدة

```
convex/
  ├── adminNotifications.ts          ✅ إشعارات الأدمن
  ├── appointmentLimits.ts            ✅ حد الحجوزات
  ├── cancellationAlerts.ts           ✅ تنبيه الإلغاء
  └── doctorSecretaryMessages.ts      ✅ رسائل الدكتور والسكرتيرة

components/
  ├── AdminNotificationsPanel.tsx     ✅ لوحة إشعارات الأدمن
  ├── AppointmentLimitDisplay.tsx     ✅ عرض حد الحجوزات
  └── MessagePanel.tsx                ✅ لوحة الرسائل

modifications/
  ├── convex/schema.ts                ✅ تعديلات الـ schema
  └── convex/appointments.ts          ✅ تعديلات الحجوزات
```

---

**آخر تحديث**: 2024
**الإصدار**: 2.0
