"use client"

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Users, X, User,
  AlertCircle, Heart, Download, Eye, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PatientProfile {
  _id: string
  patientId: string
  patientName?: string
  patientEmail?: string
  phone: string
  dateOfBirth: string
  gender: "male" | "female" | "other"
  bloodType: string
  address: string
  emergencyContact: string
  medicalHistory: string[]
  allergies: string[]
  profileImage?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

interface PatientFilesProps {
  isOpen: boolean
  onClose: () => void
}

export default function PatientFilesPanel({ isOpen, onClose }: PatientFilesProps) {
  const profiles = useQuery(api.patientProfiles.getAllPatientProfiles)
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGender, setFilterGender] = useState<"all" | "male" | "female" | "other">("all")

  const filteredProfiles = profiles?.filter((profile: PatientProfile) => {
    const matchesSearch =
      profile.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.patientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.phone?.includes(searchTerm)
    const matchesGender = filterGender === "all" || profile.gender === filterGender
    return matchesSearch && matchesGender
  }) || []

  const downloadProfile = (profile: PatientProfile) => {
    const profileText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              ملف المريض الشخصي
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 المعلومات الأساسية:
────────────────────────────────────────────────
الاسم: ${profile.patientName}
البريد الإلكتروني: ${profile.patientEmail}
الهاتف: ${profile.phone}
تاريخ الميلاد: ${profile.dateOfBirth}
الجنس: ${profile.gender === "male" ? "ذكر" : profile.gender === "female" ? "أنثى" : "آخر"}

🏥 معلومات طبية:
────────────────────────────────────────────────
فصيلة الدم: ${profile.bloodType}
العنوان: ${profile.address}
جهة اتصال الطوارئ: ${profile.emergencyContact}

📑 السجل الطبي:
────────────────────────────────────────────────
${profile.medicalHistory?.length > 0
  ? "الحالات الطبية:\n" + profile.medicalHistory.map((h: string) => `  • ${h}`).join("\n")
  : "لا توجد حالات طبية مسجلة"
}

⚠️ الحساسيات:
────────────────────────────────────────────────
${profile.allergies?.length > 0
  ? profile.allergies.map((a: string) => `  • ${a}`).join("\n")
  : "لا توجد حساسيات مسجلة"
}

📝 ملاحظات:
────────────────────────────────────────────────
${profile.notes || "لا توجد ملاحظات"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
تم إنشاء هذا الملف في: ${new Date(profile.createdAt).toLocaleString("ar-SA")}
آخر تحديث: ${new Date(profile.updatedAt).toLocaleString("ar-SA")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `

    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(profileText))
    element.setAttribute("download", `patient_profile_${profile.patientName}_${Date.now()}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="bg-card rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-border flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-linear-to-r from-slate-900 to-slate-800 text-white p-6 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">ملفات المرضى</h2>
                <p className="text-sm text-slate-300">
                  {filteredProfiles?.length} ملف متاح
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 overflow-hidden flex-1">
            {/* Left: Patient List */}
            <div className="lg:w-96 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
              {/* Search & Filter */}
              <div className="sticky top-0 bg-card/80 backdrop-blur p-4 border-b border-border space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="بحث عن مريض..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>

                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value as "all" | "male" | "female" | "other")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                >
                  <option value="all">الكل</option>
                  <option value="male">ذكور</option>
                  <option value="female">إناث</option>
                  <option value="other">آخر</option>
                </select>
              </div>

              {/* Patient List */}
              <div className="space-y-2 p-4">
                {filteredProfiles && filteredProfiles.length > 0 ? (
                  filteredProfiles.map((profile: PatientProfile) => (
                    <motion.button
                      key={profile._id}
                      onClick={() => setSelectedPatient(profile)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all",
                        selectedPatient?._id === profile._id
                          ? "bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800"
                          : "border-border hover:border-blue-600/40 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {profile.profileImage ? (
                          <Image
                            src={profile.profileImage}
                            alt={profile.patientName ?? "Patient"}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{profile.patientName}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.phone}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">لا توجد ملفات</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Patient Details */}
            <div className="flex-1 overflow-y-auto">
              {selectedPatient ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 space-y-6"
                >
                  {/* Header with Image */}
                  <div className="flex items-start gap-4 pb-6 border-b border-border">
                    {selectedPatient.profileImage ? (
                      <Image
                        src={selectedPatient.profileImage}
                        alt={selectedPatient.patientName ?? "Patient"}
                        width={80}
                        height={80}
                        className="rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                        <User className="w-10 h-10 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{selectedPatient.patientName}</h3>
                      <p className="text-muted-foreground">{selectedPatient.patientEmail}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => downloadProfile(selectedPatient)}
                        >
                          <Download className="w-4 h-4" />
                          تحميل الملف
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      المعلومات الأساسية
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">الهاتف</p>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">تاريخ الميلاد</p>
                        <p className="font-medium">{selectedPatient.dateOfBirth}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">الجنس</p>
                        <p className="font-medium">
                          {selectedPatient.gender === "male" ? "ذكر" : selectedPatient.gender === "female" ? "أنثى" : "آخر"}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">فصيلة الدم</p>
                        <p className="font-medium">{selectedPatient.bloodType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Info */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-600" />
                      معلومات طبية
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">العنوان</p>
                        <p className="font-medium">{selectedPatient.address}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">جهة اتصال الطوارئ</p>
                        <p className="font-medium">{selectedPatient.emergencyContact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical History */}
                  {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        السجل الطبي
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.medicalHistory.map((item: string, idx: number) => (
                          <div
                            key={idx}
                            className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allergies */}
                  {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        الحساسيات
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.allergies.map((item: string, idx: number) => (
                          <div
                            key={idx}
                            className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-sm"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedPatient.notes && (
                    <div>
                      <h4 className="font-semibold mb-3">ملاحظات</h4>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm">
                        {selectedPatient.notes}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Eye className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">اختر مريضاً لعرض ملفه</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
