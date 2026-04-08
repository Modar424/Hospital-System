import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import ConvexClientProvider from "@/app/._components/ConvexClientProvider"
import HeaderWrapper from "@/components/HeaderWrapper"
import { Toaster } from "sonner"
import AIChatSidebar from "@/components/AiSidebar"
import Footer from "@/components/Footer"
import { I18nProvider } from "@/lib/i18n"

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head />
      <body className="min-h-full flex flex-col">
        <Script id="init-theme-lang" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
                var lang = localStorage.getItem('lang');
                if (lang === 'ar') {
                  document.documentElement.dir = 'rtl';
                  document.documentElement.lang = 'ar';
                }
              } catch(e) {}
            })();
          `}
        </Script>
        <I18nProvider>
          <ConvexClientProvider>
            <HeaderWrapper />
            <main className="flex-1">
              {children}
            </main>
            <AIChatSidebar />
            <Footer />
          </ConvexClientProvider>
        </I18nProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
