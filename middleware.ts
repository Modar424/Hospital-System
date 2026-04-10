import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { NextResponse } from "next/server"

const isAdminRoute     = createRouteMatcher(['/admin(.*)'])
const isSecretaryRoute = createRouteMatcher(['/secretary(.*)'])
const isDoctorRoute    = createRouteMatcher(['/doctor(.*)'])
const isProtectedRoute = createRouteMatcher(['/appointments(.*)'])

export default clerkMiddleware(async (auth, req) => {

  // ── Admin routes ──────────────────────────────────────────
  if (isAdminRoute(req)) {
    const { userId, getToken } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/?error=unauthenticated', req.url))
    }
    const token = await getToken({ template: "convex" })
    const user  = token ? await fetchQuery(api.patients.getUser, {}, { token }) : null
    if (!user || user.role !== "admin") {
      return NextResponse.redirect(new URL('/?error=unauthorized', req.url))
    }
  }

  // ── Secretary routes ──────────────────────────────────────
  if (isSecretaryRoute(req)) {
    const { userId, getToken } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/?error=unauthenticated', req.url))
    }
    const token = await getToken({ template: "convex" })
    const user  = token ? await fetchQuery(api.patients.getUser, {}, { token }) : null
    if (!user || user.role !== "secretary") {
      return NextResponse.redirect(new URL('/?error=unauthorized', req.url))
    }
  }

  // ── Doctor routes ─────────────────────────────────────────
  if (isDoctorRoute(req)) {
    const { userId, getToken } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/?error=unauthenticated', req.url))
    }
    const token = await getToken({ template: "convex" })
    const user  = token ? await fetchQuery(api.patients.getUser, {}, { token }) : null
    if (!user || user.role !== "doctor") {
      return NextResponse.redirect(new URL('/?error=unauthorized', req.url))
    }
  }

  // ── Patient appointments (requires login) ─────────────────
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
