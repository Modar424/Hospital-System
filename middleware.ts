import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { NextResponse } from "next/server"

const isAdminRoute     = createRouteMatcher(['/admin(.*)'])
const isProtectedRoute = createRouteMatcher(['/appointments(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, getToken } = await auth()

    if (!userId) {
      return NextResponse.redirect(new URL('/?error=unauthenticated', req.url))
    }

    const token = await getToken({ template: "convex" })
    const user  = token
      ? await fetchQuery(api.patients.getUser, {}, { token })
      : null

    if (!user || user.role !== "admin") {
      return NextResponse.redirect(new URL('/?error=unauthorized', req.url))
    }
  }

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
