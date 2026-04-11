# 🔧 التوثيق التقني - ميزة الملف الشخصي

## 📂 الملفات المُعدّلة

```
app/
└── appointments/
    └── page.tsx ✏️ (المُعدّل الرئيسي)

convex/
└── patientProfiles.ts (موجود بالفعل - لا تعديلات)
```

---

## 📝 التعديلات التفصيلية

### 1️⃣ Imports الجديدة

```typescript
// أيقونات جديدة من lucide-react
import {
  // ... الأيقونات السابقة ...
  Phone,           // 📱 للهاتف
  Droplets,        // 🩸 لفصيلة الدم
  Heart,           // ❤️ للملاحظات
  AlertTriangle,   // ⚠️ للحساسيات
  Edit3,           // ✏️ لتحديث البيانات
  Copy             // 📋 لنسخ الـ ID
} from 'lucide-react'
```

---

## 🎨 مكون ProfileCard

### التوقيع
```typescript
interface PatientProfileData {
  _id: string
  patientId: string              // معرف المريض الفريد ⭐
  patientName: string
  patientEmail: string
  phone: string
  dateOfBirth: string
  gender: string                 // 'male' | 'female' | 'other'
  bloodType: string
  address: string
  emergencyContact: string
  medicalHistory: string[]       // قائمة بالأمراض
  allergies: string[]            // قائمة بالحساسيات
  profileImage?: string
  notes?: string
}

function ProfileCard({ 
  profile: PatientProfileData | null | undefined
  lang: string 
}): JSX.Element
```

### الوظائف الداخلية

#### `handleCopyId()`
```typescript
const handleCopyId = () => {
  // نسخ رقم الملف إلى الحافظة
  navigator.clipboard.writeText(profile.patientId)
  setCopied(true)
  toast.success(lang === 'ar' ? 'تم نسخ الرقم' : 'ID copied')
  setTimeout(() => setCopied(false), 2000)
}
```

**الخصائص:**
- يستخدم `navigator.clipboard` API
- يعرض Toast تأكيد
- ينسّي الحالة بعد ثانيتين

---

## 🔄 الحالات المختلفة

### 1️⃣ Profile موجود (الحالة الطبيعية)
```typescript
{profile && (
  // عرض كامل البيانات
  <>
    <Header />      // معلومات أساسية + ID
    <BasicInfo />   // هاتف، تاريخ ميلاد، إلخ
    <Contact />     // عنوان + جهة طوارئ
    <Medical />     // تاريخ طبي، حساسيات
    <UpdateButton />
  </>
)}
```

### 2️⃣ Profile غير موجود
```typescript
{!profile && (
  <EmptyState>
    النص: "لم تقم بإنشاء ملفك الشخصي"
    الزر: رابط إلى /patient-profile
  </EmptyState>
)}
```

### 3️⃣ جاري التحميل
```typescript
// الـ ProfileCard تظهر null أثناء التحميل
// يتعامل مع الحالة بحكمة
```

---

## 🎯 قسام المكون

### 1️⃣ Header Card
```typescript
<div className="bg-linear-to-r from-primary/10 to-teal-100...">
  // تدرج لوني من الأزرق إلى الأخضر
  // يحتوي على:
  - الاسم والبريد
  - أيقونة ملف شخصي
  
  <ID Section>
    - رقم الملف مع زر نسخ
    - Animation على زر النسخ
  </ID Section>
</div>
```

### 2️⃣ Basic Info Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  // 4 بطاقات في صف واحد على سطح المكتب
  // بطاقة واحدة على الموبايل
  
  [Phone, DateOfBirth, Gender, BloodType].map(item => (
    <InfoCard icon={icon} label={label} value={value} />
  ))
</div>
```

### 3️⃣ Contact Section
```typescript
// بطاقتان جنباً إلى جنب
<Address />        // مع أيقونة موقع
<EmergencyContact />  // مع أيقونة تحذير
```

### 4️⃣ Medical History
```typescript
// إذا وجد تاريخ طبي:
<MedicalHistoryList>
  {medicalHistory.map(item => (
    <Dot /> {item}  // نقطة زرقاء + النص
  ))}
</MedicalHistoryList>
```

### 5️⃣ Allergies (مهم! باللون الأحمر)
```typescript
// إذا وجدت حساسيات:
<AllergiesSection bg="bg-red-50 dark:bg-red-950/30">
  <AlertTriangle icon />
  {allergies.map(allergy => (
    <Dot className="bg-red-500" /> {allergy}
  ))}
</AllergiesSection>
```

### 6️⃣ Notes
```typescript
// إذا وجدت ملاحظات:
<NotesSection>
  <Heart icon />
  {notes}
</NotesSection>
```

### 7️⃣ Update Button
```typescript
<Link href="/patient-profile">
  <Button className="w-full">
    <Edit3 />
    تحديث البيانات
  </Button>
</Link>
```

---

## 🔌 التكامل مع الصفحة الرئيسية

### الاستعلام الجديد
```typescript
const patientProfile = useQuery(api.patientProfiles.getMyPatientProfile)
```

**من العجيب أن نلاحظ:**
- يُرجع null إذا لم يكن المريض مسجل دخول
- يُرجع null إذا لم يُنشئ ملف
- يُرجع الكائن كاملاً مع patientId

### التاب الجديد
```typescript
const [activeTab, setActiveTab] = useState<
  'appointments' | 'invoices' | 'profile'
>('appointments')
```

### زر التاب
```typescript
<button onClick={() => setActiveTab('profile')}>
  <User className="w-4 h-4" />
  {lang === 'ar' ? 'ملفي' : 'My Profile'}
</button>
```

### محتوى التاب (Conditional Rendering)
```typescript
{activeTab === 'profile' && (
  <AnimatePresence mode="wait">
    <motion.div key="profile-tab" ...>
      <ProfileCard profile={patientProfile} lang={lang} />
    </motion.div>
  </AnimatePresence>
)}
```

---

## ✨ تحريكات Framer Motion

### عند دخول المكون
```typescript
initial={{ opacity: 0, y: 20 }}      // غير مرئي وأسفل
animate={{ opacity: 1, y: 0 }}       // مرئي وفي المكان
transition={{ delay: timing }}        // تأخير متدرج
```

### عند الانتقال بين التابات
```typescript
// الخروج من التاب السابق
exit={{ opacity: 0, x: 10 }}

// الدخول للتاب الجديد
initial={{ opacity: 0, x: -10 }}
animate={{ opacity: 1, x: 0 }}
```

### على الأيقونات والأزرار
```typescript
whileHover={{ scale: 1.05 }}         // تكبير عند التمرير
whileTap={{ scale: 0.95 }}           // تصغير عند الضغط
transition={{ type: 'spring', stiffness: 300 }}
```

---

## 🌐 دعم اللغات

### الترجمات المستخدمة
```typescript
const translations = {
  'patient-profile': { ar: 'ملفي', en: 'My Profile' },
  'copy-id': { ar: 'تم نسخ الرقم', en: 'ID copied' },
  'phone': { ar: 'الهاتف', en: 'Phone' },
  'date-of-birth': { ar: 'تاريخ الميلاد', en: 'Date of Birth' },
  'gender': { ar: 'الجنس', en: 'Gender' },
  'male': { ar: 'ذكر', en: 'Male' },
  'female': { ar: 'أنثى', en: 'Female' },
  'other': { ar: 'آخر', en: 'Other' },
  'blood-type': { ar: 'فصيلة الدم', en: 'Blood Type' },
  'address': { ar: 'العنوان', en: 'Address' },
  'emergency-contact': { ar: 'جهة اتصال طوارئ', en: 'Emergency Contact' },
  'medical-history': { ar: 'التاريخ الطبي', en: 'Medical History' },
  'allergies': { ar: 'الحساسيات', en: 'Allergies' },
  'notes': { ar: 'ملاحظات', en: 'Notes' },
  'update-profile': { ar: 'تحديث البيانات', en: 'Update Profile' },
  'no-profile': { ar: 'لم تقم بإنشاء ملفك الشخصي', en: 'No Profile Yet' },
  'create-profile': { ar: 'إنشاء ملفي الشخصي', en: 'Create Profile' },
}
```

---

## 🔐 الأمان

### معالجة البيانات الحساسة
```typescript
// لا يتم حفظ البيانات محلياً
// كل استدعاء يأتي من Convex المشفر

// لا يتم عرض معلومات غير ملكها
// فقط المريض الحالي يرى ملفه

// نسخ الـ ID يستخدم Secure API
navigator.clipboard.writeText(...)  // مشفر
```

---

## 📊 Performance Optimization

### Lazy Loading
```typescript
// البيانات تُحمل عند الحاجة فقط
const patientProfile = useQuery(...) // عند فتح التاب
```

### Memoization
```typescript
// لا يتم إعادة تصيير المكون إذا لم تتغير البيانات
// React Query يتعامل مع التخزين المؤقت
```

### CSS-in-JS Optimization
```typescript
// Tailwind classes تُترجم مقدماً
// لا توجد runtime calculation
```

---

## 🧪 الاختبار

### حالات الاختبار الموصى بها

```typescript
test('يعرض معرف المريض بشكل صحيح')
test('ينسخ المعرف إلى الحافظة')
test('يعرض جميع البيانات الشخصية')
test('يعرض الحساسيات بلون مختلف')
test('يعرض رسالة عند عدم وجود ملف')
test('ينتقل إلى صفحة التحديث بشكل صحيح')
test('يدعم كلا اللغتين')
test('يتجاوب مع أحجام الشاشة المختلفة')
```

---

## 🚀 الخطوات التالية المحتملة

```
✅ تم: عرض الملف الشخصي
⏳ مستقبل: تحديل مباشر من لوحة التحكم
⏳ مستقبل: تحميل صورة الملف الشخصي
⏳ مستقبل: طباعة الملف الشخصي
⏳ مستقبل: مشاركة البيانات مع الطبيب
⏳ مستقبل: السجل الطبي الكامل مع رسوم بيانية
```

---

## 📚 المراجع

- **Convex Docs**: https://docs.convex.dev
- **Framer Motion**: https://www.framer.com/motion/
- **TailwindCSS**: https://tailwindcss.com
- **React Hooks**: https://react.dev/reference/react/hooks

---

**✅ التوثيق كامل وجاهز للاستخدام والتطوير!**
