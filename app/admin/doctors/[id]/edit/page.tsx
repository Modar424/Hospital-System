"use client"

import React, { useEffect,  useCallback } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { getCategoryLabel } from '@/lib/category-labels'

const baseFormSchema = z.object({
  name: z.union([z.string().min(2, "Name must be at least 2 characters"), z.literal('')]),
  category: z.union([z.string().min(1, "Please select a category"), z.literal('')]),
  image: z.union([z.string().url("Please enter a valid image URL"), z.literal('')]),
  bio: z.union([z.string().min(10, "Bio must be at least 10 characters"), z.literal('')]),
  expertise: z.union([z.string().min(1, "Please enter at least one expertise"), z.literal('')]),
  experience: z.union([z.number().min(0, "Experience must be a positive number"), z.literal('')]),
  location: z.union([z.string().min(5, "Location is required"), z.literal('')]),
  contact: z.union([z.string().min(5, "Contact info is required"), z.literal('')]),
})

// جميع الحقول optional عند التعديل
const formSchema = baseFormSchema.partial()

type FormValues = z.infer<typeof formSchema>

export default function EditDoctorPage() {
  const router = useRouter()
  const params = useParams()
  const doctorId = params.id as string

  const doctor = useQuery(api.doctors.getDoctorById, { id: doctorId as Id<"doctors"> })
  const categories = useQuery(api.categories.get)
  const updateDoctor = useMutation(api.doctors.updateDoctor)
  const { lang } = useI18n()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      image: "",
      bio: "",
      expertise: "",
      experience: 0,
      location: "",
      contact: "",
    },
    mode: "onChange",
  })

  // Load doctor data when it's available
  useEffect(() => {
    if (doctor) {
      form.reset({
        name: doctor.name,
        category: doctor.category,
        image: doctor.image,
        bio: doctor.bio,
        expertise: doctor.expertise.join(", "),
        experience: doctor.experience,
        location: doctor.location,
        contact: doctor.contact,
      })
    }
  }, [doctor, form])

  const handleCategoryChange = useCallback((value: string | null) => {
    const categoryValue = value ?? ''
    form.setValue('category', categoryValue)
  }, [form])

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('image', e.target.value)
  }, [form])

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      // Parse expertise array فقط إذا تم تغييره
      let expertiseArray: string[] | undefined
      if (values.expertise && values.expertise.trim()) {
        expertiseArray = values.expertise
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0)

        if (expertiseArray.length === 0) {
          toast.error("Please enter at least one expertise")
          return
        }
      }

      // بناء object التحديثات - فقط الحقول المتغيرة
      const updatePayload: Record<string, unknown> = {}
      
      // عند التعديل: إذا كان الحقل فيه قيمة فقط، نحدثه
      if (values.name && values.name !== doctor?.name) updatePayload.name = values.name
      if (values.category && values.category !== doctor?.category) updatePayload.category = values.category
      if (values.image && values.image !== doctor?.image) updatePayload.image = values.image
      if (values.bio && values.bio !== doctor?.bio) updatePayload.bio = values.bio
      if (expertiseArray !== undefined) updatePayload.expertise = expertiseArray
      if (values.experience && values.experience !== doctor?.experience) updatePayload.experience = values.experience
      if (values.location && values.location !== doctor?.location) updatePayload.location = values.location
      if (values.contact && values.contact !== doctor?.contact) updatePayload.contact = values.contact

      // إذا لم يكن هناك تغييرات
      if (Object.keys(updatePayload).length === 0) {
        toast.info("No changes made")
        return
      }

      // Call mutation
      await updateDoctor({
        doctorId: doctorId as Id<"doctors">,
        ...updatePayload,
      })

      toast.success("Doctor updated successfully!")
      router.push('/admin')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update doctor")
      console.error(error)
    }
  }

  if (doctor === undefined || categories === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading doctor information...</p>
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">Doctor not found</p>
          <Button onClick={() => router.push('/admin')}>Go back to Admin</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Doctor</h1>
              <p className="text-muted-foreground text-sm mt-1">Update information for {doctor.name}</p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Doctor Information</CardTitle>
              <CardDescription>
                Update any details you want to change. Leave fields empty to keep the current values.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name and Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Leave empty to keep current name"
                      {...form.register('name')}
                      className={form.formState.errors.name ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Specialty</Label>
                    <Select 
                      value={form.getValues('category') || ''}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className={form.formState.errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat: { _id: string; name: string }) => (
                          <SelectItem key={cat._id} value={cat.name}>
                            {getCategoryLabel(cat.name, lang)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.category && (
                      <p className="text-red-500 text-sm">{form.formState.errors.category.message}</p>
                    )}
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="image">Profile Image URL</Label>
                  <Input
                    id="image"
                    placeholder="Leave empty to keep current image"
                    {...form.register('image')}
                    onChange={handleImageChange}
                    className={form.formState.errors.image ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.image && (
                    <p className="text-red-500 text-sm">{form.formState.errors.image.message}</p>
                  )}
                  {form.getValues('image') && (
                    <p className="text-xs text-muted-foreground">Preview: Image will be loaded from URL</p>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Leave empty to keep current bio"
                    rows={4}
                    {...form.register('bio')}
                    className={form.formState.errors.bio ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.bio && (
                    <p className="text-red-500 text-sm">{form.formState.errors.bio.message}</p>
                  )}
                </div>

                {/* Expertise */}
                <div className="space-y-2">
                  <Label htmlFor="expertise">Areas of Expertise (comma separated)</Label>
                  <Input
                    id="expertise"
                    placeholder="e.g., Cardiology, Hypertension, Heart Disease"
                    {...form.register('expertise')}
                    className={form.formState.errors.expertise ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.expertise && (
                    <p className="text-red-500 text-sm">{form.formState.errors.expertise.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Separate multiple specialties with commas</p>
                </div>

                {/* Experience and Location Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      placeholder="Leave empty to keep current value"
                      {...form.register('experience', { valueAsNumber: true })}
                      className={form.formState.errors.experience ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.experience && (
                      <p className="text-red-500 text-sm">{form.formState.errors.experience.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location/Office</Label>
                    <Input
                      id="location"
                      placeholder="Leave empty to keep current location"
                      {...form.register('location')}
                      className={form.formState.errors.location ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.location && (
                      <p className="text-red-500 text-sm">{form.formState.errors.location.message}</p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Information</Label>
                  <Input
                    id="contact"
                    placeholder="Leave empty to keep current contact"
                    {...form.register('contact')}
                    className={form.formState.errors.contact ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.contact && (
                    <p className="text-red-500 text-sm">{form.formState.errors.contact.message}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => router.back()}
                    disabled={form.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
