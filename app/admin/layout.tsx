"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useConvexAuth } from "convex/react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const user = useQuery(api.patients.getUser)
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.push("/"); return }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (user === undefined) return
    if (user === null || user.role !== "admin") router.push("/")
  }, [user, router])

  if (isLoading || user === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user || user.role !== "admin") return null

  return <>{children}</>
}
