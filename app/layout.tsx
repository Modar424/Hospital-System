import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import ConvexClientProvider from "@/app/._components/ConvexClientProvider"
import HeaderWrapper from "@/components/HeaderWrapper"
import { Toaster } from "sonner"
import AIChatSidebar from "@/components/AiSidebar"
import Footer from "@/components/Footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "HealWell — Advanced Medical Care",
  description: "Experience world-class healthcare with expert doctors and state-of-the-art facilities.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>
          <HeaderWrapper />
          <main className="flex-1">
            {children}
          </main>
          <AIChatSidebar />
          <Footer />
        </ConvexClientProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
