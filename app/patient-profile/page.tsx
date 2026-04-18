"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { motion } from "framer-motion"
import {
  User, Phone, Calendar, Droplets, MapPin, AlertCircle,
  Upload, X, CheckCircle2, ArrowRight, FileText, Heart, Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { SignInButton } from "@clerk/nextjs"
import { useI18n } from "@/lib/i18n"
import Image from "next/image"

type Gender = "male" | "female" | "other"

export default function PatientProfileSetupPage() {
  const { isSignedIn } = useAuth()
  const upsertProfile = useMutation(api.patientProfiles.upsertPatientProfile)
  const myProfile = useQuery(api.patientProfiles.getMyPatientProfile)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    phone: "",
    dateOfBirth: "",
    gender: "other" as Gender,
    bloodType: "O+",
    address: "",
    emergencyContact: "",
    medicalHistory: [] as string[],
    allergies: [] as string[],
    notes: "",
  })

  const [newMedical, setNewMedical] = useState("")
  const [newAllergy, setNewAllergy] = useState("")

  const { lang } = useI18n()

  // Load existing profile data when user wants to edit
  const loadProfileData = () => {
    if (myProfile) {
      setFormData({
        phone: myProfile.phone || "",
        dateOfBirth: myProfile.dateOfBirth || "",
        gender: (myProfile.gender as Gender) || "other",
        bloodType: myProfile.bloodType || "O+",
        address: myProfile.address || "",
        emergencyContact: myProfile.emergencyContact || "",
        medicalHistory: myProfile.medicalHistory || [],
        allergies: myProfile.allergies || [],
        notes: myProfile.notes || "",
      })
      if (myProfile.profileImage) {
        setProfileImage(myProfile.profileImage)
        setImagePreview(myProfile.profileImage)
      }
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(lang === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 5 MB' : 'Image size must be less than 5 MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setImagePreview(base64)
        setProfileImage(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const addMedicalHistory = () => {
    if (newMedical.trim()) {
      setFormData((prev) => ({
        ...prev,
        medicalHistory: [...prev.medicalHistory, newMedical.trim()],
      }))
      setNewMedical("")
    }
  }

  const removeMedicalHistory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index),
    }))
  }

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
      }))
      setNewAllergy("")
    }
  }

  const removeAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!formData.phone || !formData.dateOfBirth || !formData.address) {
      toast.error(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      await upsertProfile({
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodType: formData.bloodType,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        profileImage: profileImage || undefined,
        notes: formData.notes,
      })
      toast.success(lang === 'ar' ? 'تم حفظ ملفك الشخصي بنجاح!' : 'Profile saved successfully!')
      setStep(3)
    } catch {
      toast.error(lang === 'ar' ? 'حدث خطأ في حفظ الملف' : 'Error saving profile')
    } finally {
      setLoading(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-linear-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{lang === 'ar' ? 'سجّل دخولك أولاً' : 'Sign in first'}</h2>
          <p className="text-muted-foreground mb-8">
            {lang === 'ar' ? 'تحتاج إلى تسجيل الدخول لإعداد ملفك الشخصي' : 'You need to sign in to set up your profile'}
          </p>
          <SignInButton mode="modal">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
          </SignInButton>
        </motion.div>
      </div>
    )
  }

  if (myProfile && step !== 1 && step !== 2) {
    return (
      <div className="min-h-screen bg-linear-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border shadow-xl p-8"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">{lang === 'ar' ? 'ملفك الشخصي جاهز!' : 'Your profile is ready!'}</h1>
            <p className="text-center text-muted-foreground mb-8">
              {lang === 'ar' ? 'تم تحديث جميع بيانات ملفك الطبي' : 'All your medical data has been updated'}
            </p>

            <div className="bg-muted/50 rounded-xl p-6 mb-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                <span className="font-medium">{myProfile.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{lang === 'ar' ? 'تاريخ الميلاد:' : 'Date of Birth:'}</span>
                <span className="font-medium">{myProfile.dateOfBirth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{lang === 'ar' ? 'فصيلة الدم:' : 'Blood Type:'}</span>
                <span className="font-medium">{myProfile.bloodType}</span>
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/appointments" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full gap-2 py-6 text-lg">
                  <ArrowRight className="w-5 h-5" />
                  {lang === 'ar' ? 'اذهب إلى حجز الموعد' : 'Go to Book Appointment'}
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full rounded-full gap-2 py-6"
                onClick={() => {
                  loadProfileData()
                  setStep(1)
                }}
              >
                <FileText className="w-5 h-5" />
                {lang === 'ar' ? 'تحديث البيانات' : 'Update Profile'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-4 flex-1">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </motion.div>
                {s < 2 && (
                  <div
                    className={`h-1 flex-1 rounded-full transition-all ${
                      step > s ? "bg-blue-600" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <div>
              <h3 className="font-semibold">{lang === 'ar' ? 'البيانات الشخصية' : 'Personal Info'}</h3>
              <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'معلومات أساسية' : 'Basic information'}</p>
            </div>
            <div>
              <h3 className="font-semibold">{lang === 'ar' ? 'التاريخ الطبي' : 'Medical History'}</h3>
              <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'سجلك الطبي' : 'Your medical record'}</p>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-3xl border border-border shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              {lang === 'ar' ? 'البيانات الشخصية الأساسية' : 'Basic Personal Data'}
            </h2>

            {/* Profile Image */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-4">{lang === 'ar' ? 'صورتك الشخصية' : 'Profile Photo'}</label>
              <div className="flex gap-4 items-start">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-blue-600"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null)
                        setProfileImage(null)
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-blue-600 flex items-center justify-center cursor-pointer bg-muted/50 hover:bg-muted transition-all">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {lang === 'ar' ? 'صورة واضحة وحديثة (اختياري)' : 'Clear recent photo (optional)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'ar' ? 'الحد الأقصى 5 MB' : 'Max 5 MB'}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="05xxxxxxxxx"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'ar' ? 'تاريخ الميلاد *' : 'Date of Birth *'}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'ar' ? 'الجنس' : 'Gender'}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  >
                    <option value="male">{lang === 'ar' ? 'ذكر' : 'Male'}</option>
                    <option value="female">{lang === 'ar' ? 'أنثى' : 'Female'}</option>
                    <option value="other">{lang === 'ar' ? 'آخر' : 'Other'}</option>
                  </select>
                </div>

                {/* Blood Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'ar' ? 'فصيلة الدم' : 'Blood Type'}</label>
                  <div className="relative">
                    <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={formData.bloodType}
                      onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    >
                      <option>O+</option>
                      <option>O-</option>
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">{lang === 'ar' ? 'العنوان *' : 'Address *'}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={lang === 'ar' ? 'المدينة، الحي، الشارع' : 'City, District, Street'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">{lang === 'ar' ? 'جهة اتصال طوارئ' : 'Emergency Contact'}</label>
                  <div className="relative">
                    <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder={lang === 'ar' ? 'رقم الهاتف والاسم' : 'Phone number and name'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6 border-t border-border">
                {myProfile && (
                  <Button
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="flex-1 rounded-full"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                )}
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full gap-2"
                >
                  {lang === 'ar' ? 'التالي' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Medical History */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-3xl border border-border shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-600" />
              {lang === 'ar' ? 'التاريخ الطبي' : 'Medical History'}
            </h2>

            <div className="space-y-8">
              {/* Medical History */}
              <div>
                <label className="block text-sm font-semibold mb-4 items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {lang === 'ar' ? 'الحالات الطبية السابقة' : 'Previous Medical Conditions'}
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newMedical}
                    onChange={(e) => setNewMedical(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addMedicalHistory()}
                    placeholder={lang === 'ar' ? 'مثال: ارتفاع ضغط الدم' : 'e.g. Hypertension'}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                  <Button
                    onClick={addMedicalHistory}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    {lang === 'ar' ? 'إضافة' : 'Add'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.medicalHistory.map((item, idx) => (
                    <div key={idx} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full flex items-center gap-2">
                      <span>{item}</span>
                      <button
                        onClick={() => removeMedicalHistory(idx)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-900 rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-semibold mb-4 items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {lang === 'ar' ? 'الحساسيات والأدوية المحظورة' : 'Allergies & Banned Medications'}
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                    placeholder={lang === 'ar' ? 'مثال: البنسلين' : 'e.g. Penicillin'}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  />
                  <Button
                    onClick={addAllergy}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    {lang === 'ar' ? 'إضافة' : 'Add'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((item, idx) => (
                    <div key={idx} className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-4 py-2 rounded-full flex items-center gap-2">
                      <span>{item}</span>
                      <button
                        onClick={() => removeAllergy(idx)}
                        className="hover:bg-red-200 dark:hover:bg-red-900 rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold mb-2">{lang === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={lang === 'ar' ? 'أي معلومات طبية أخرى مهمة...' : 'Any other important medical information...'}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-600/30 resize-none"
                />
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-full"
                >
                  {lang === 'ar' ? 'السابق' : 'Back'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                >
                  {loading ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ البيانات' : 'Save Profile')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl border border-border shadow-xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </motion.div>

            <h2 className="text-3xl font-bold mb-2">{lang === 'ar' ? 'تم بنجاح!' : 'Success!'}</h2>
            <p className="text-muted-foreground mb-8">
              {lang === 'ar' ? 'تم حفظ ملفك الشخصي بنجاح. يمكنك الآن حجز موعد مع الأطباء.' : 'Your profile has been saved. You can now book appointments with doctors.'}
            </p>

            <Link href="/appointments" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full gap-2 py-6 text-lg mb-4">
                <ArrowRight className="w-5 h-5" />
                {lang === 'ar' ? 'اذهب إلى حجز الموعد' : 'Go to Book Appointment'}
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => {
                loadProfileData()
                setStep(1)
              }}
              className="w-full rounded-full"
            >
              {lang === 'ar' ? 'تحديث البيانات' : 'Update Profile'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
