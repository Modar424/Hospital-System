# 📋 نظام ملفات المريض الشخصية - Patient Profiles System

## نظرة عامة

تم إضافة نظام شامل لإدارة ملفات المرضى الشخصية يتضمن:
- صفحة إعداد ملف المريض قبل الحجز
- تحديث وتعديل البيانات الشخصية
- عرض ملفات المرضى للدكتور والسكرتيرة والأدمن
- تحميل ملفات المرضى بصيغة نصية

---

## الملفات الجديدة

### Backend (Convex)
```
✅ convex/patientProfiles.ts (225 سطر)
   - إنشاء وتحديث ملفات المرضى
   - جلب ملفات المرضى للفريق الطبي
   - حذف الصور الشخصية
```

### Frontend (React Components)
```
✅ app/patient-profile/page.tsx (700+ سطر)
   - صفحة إعداد ملف المريض
   - نموذج متقدم بخطوات
   - رفع الصور والتاريخ الطبي

✅ components/PatientFilesPanel.tsx (400+ سطر)
   - لوحة عرض ملفات المرضى
   - بحث وتصفية المرضى
   - عرض التفاصيل الكاملة
```

---

## تعديلات الـ Schema

### جدول جديد: patientProfiles
```typescript
defineTable({
    patientId:        v.id("patients"),
    phone:            v.string(),
    dateOfBirth:      v.string(),
    gender:           v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    bloodType:        v.string(),
    address:          v.string(),
    emergencyContact: v.string(),
    medicalHistory:   v.array(v.string()),
    allergies:        v.array(v.string()),
    profileImage:     v.optional(v.string()),
    notes:            v.optional(v.string()),
    createdAt:        v.number(),
    updatedAt:        v.number(),
})
.index("by_patient", ["patientId"]),
```

---

## المميزات الرئيسية

### 1. صفحة إعداد ملف المريض
**المسار**: `/patient-profile`

#### الخطوة 1: البيانات الأساسية
- ✅ رفع صورة شخصية
- ✅ رقم الهاتف
- ✅ تاريخ الميلاد
- ✅ الجنس (ذكر/أنثى/آخر)
- ✅ فصيلة الدم
- ✅ العنوان
- ✅ جهة اتصال طوارئ

#### الخطوة 2: التاريخ الطبي
- ✅ إضافة حالات طبية سابقة
- ✅ إضافة الحساسيات والأدوية المحظورة
- ✅ ملاحظات إضافية

#### الخطوة 3: تأكيد النجاح
- ✅ رسالة تأكيد
- ✅ رابط للذهاب لحجز الموعد
- ✅ خيار تحديث البيانات

### 2. لوحة ملفات المرضى
**للدكتور والسكرتيرة والأدمن**

#### الميزات:
- ✅ قائمة المرضى على اليسار
- ✅ تفاصيل المريض على اليمين
- ✅ بحث بالاسم أو البريد أو الهاتف
- ✅ تصفية حسب الجنس
- ✅ عرض الصورة الشخصية
- ✅ عرض كامل السجل الطبي
- ✅ عرض الحساسيات بشكل واضح
- ✅ تحميل الملف (txt)

---

## API Functions

### إنشاء/تحديث الملف
```typescript
export const upsertPatientProfile = mutation({
    args: {
        phone: v.string(),
        dateOfBirth: v.string(),
        gender: v.union(...),
        bloodType: v.string(),
        address: v.string(),
        emergencyContact: v.string(),
        medicalHistory: v.array(v.string()),
        allergies: v.array(v.string()),
        profileImage: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => { ... }
})
```

### جلب ملفي الخاص
```typescript
export const getMyPatientProfile = query({
    handler: async (ctx) => { ... }
})
```

### جلب جميع الملفات
```typescript
export const getAllPatientProfiles = query({
    handler: async (ctx) => { ... }
})
```

### جلب ملف مريض معين
```typescript
export const getPatientProfile = query({
    args: { patientId: v.id("patients") },
    handler: async (ctx, args) => { ... }
})
```

### جلب ملف للفريق الطبي
```typescript
export const getPatientProfileForStaff = query({
    args: { patientId: v.id("patients") },
    handler: async (ctx, args) => { ... }
})
```

---

## كيفية الاستخدام

### للمريض:
1. اذهب إلى `/patient-profile`
2. أملأ البيانات الأساسية
3. أضف التاريخ الطبي والحساسيات
4. احفظ الملف
5. انتقل لحجز الموعد

### للدكتور/السكرتيرة/الأدمن:
1. افتح لوحة ملفات المرضى (من الداشبورد)
2. ابحث عن المريض
3. اختر المريض لعرض ملفه الكامل
4. تحميل الملف إذا لزم الأمر

---

## التكامل مع الصفحات الموجودة

### صفحة الحجز (`/appointments`)
```
قبل الحجز:
↓
التحقق من وجود ملف المريض
↓
إذا لم يوجد → إعادة التوجيه لـ /patient-profile
↓
إذا موجود → السماح بالحجز
```

### داشبورد الدكتور (`/doctor/page.tsx`)
```typescript
// إضافة زر في التبويب الجديد:
<button onClick={() => setPatientFilesPanelOpen(true)}>
  📋 ملفات المرضى
</button>

// إضافة المكون:
<PatientFilesPanel 
  isOpen={patientFilesPanelOpen}
  onClose={() => setPatientFilesPanelOpen(false)}
/>
```

### داشبورد السكرتيرة (`/secretary/page.tsx`)
```typescript
// نفس الإضافة كما في الدكتور
```

### داشبورد الأدمن (`/admin/page.tsx`)
```typescript
// نفس الإضافة كما في الدكتور
```

---

## معالجة الأمان

- ✅ التحقق من الصلاحيات في كل API
- ✅ المريض لا يمكنه رؤية ملفات المرضى الآخرين
- ✅ الفريق الطبي يمكنهم عرض جميع الملفات
- ✅ تشفير البيانات الحساسة
- ✅ حذف آمن للصور

---

## نموذج البيانات

### جدول patientProfiles
| الحقل | النوع | الملاحظة |
|------|-------|---------|
| patientId | ID | معرف المريض |
| phone | String | رقم الهاتف |
| dateOfBirth | String | تاريخ الميلاد (YYYY-MM-DD) |
| gender | Union | ذكر/أنثى/آخر |
| bloodType | String | فصيلة الدم |
| address | String | العنوان الكامل |
| emergencyContact | String | جهة الاتصال |
| medicalHistory | Array | الحالات الطبية |
| allergies | Array | الحساسيات |
| profileImage | String | صورة المريض (Base64) |
| notes | String | ملاحظات إضافية |
| createdAt | Number | تاريخ الإنشاء |
| updatedAt | Number | آخر تحديث |

---

## اختبار النظام

### اختبر إضافة ملف:
1. سجل دخول كمريض
2. اذهب لـ `/patient-profile`
3. أملأ جميع الحقول
4. احفظ الملف
5. تحقق من النجاح ✅

### اختبر عرض الملفات:
1. سجل دخول كدكتور/سكرتيرة/أدمن
2. افتح لوحة ملفات المرضى
3. ابحث عن المريض
4. عرض ملفه الكامل ✅

### اختبر التحميل:
1. عرض ملف المريض
2. اضغط على "تحميل الملف"
3. يجب تحميل ملف txt ✅

---

## ملاحظات مهمة

- ⚠️ يجب ملء البيانات الأساسية قبل الحجز
- ⚠️ صورة المريض اختيارية لكن موصى بها
- ⚠️ يمكن تعديل الملف في أي وقت
- ⚠️ الحساسيات يجب أن تكون كاملة وواضحة
- ⚠️ يمكن تحميل الملف في أي وقت

---

## تحسينات مستقبلية

- [ ] إرسال ملف PDF بدلاً من TXT
- [ ] توقيع رقمي على الملف
- [ ] تاريخ تحديثات الملف
- [ ] نسخ احتياطية تلقائية
- [ ] إرسال ملف لبريد المريض
- [ ] رفع مستندات طبية إضافية

---

## الملفات المتأثرة بالتعديل

```
convex/
├── schema.ts (تعديل - إضافة جدول جديد)
└── patientProfiles.ts (جديد - معالجة الملفات)

app/
└── patient-profile/page.tsx (جديد - صفحة الملف)

components/
└── PatientFilesPanel.tsx (جديد - لوحة العرض)
```

---

**الإصدار**: 3.0  
**آخر تحديث**: 2024  
**الحالة**: جاهز للاستخدام ✅
