import type { Metadata, Viewport } from "next"
import { Unbounded, Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { QueryProvider } from "@/providers/QueryProvider"
import "./globals.css"

const unbounded = Unbounded({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-unbounded',
  weight: ['400', '600', '800'],
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#030712',
}

export const metadata: Metadata = {
  title: "Калькулятор ЗП - GameOver Shop",
  description: "Интерактивный калькулятор заработной платы с прогрессивной шкалой мотивации",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ЗП Калькулятор',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${unbounded.variable} ${manrope.variable} font-sans`}>
        <QueryProvider>
          <ThemeProvider>
            <main className="min-h-screen bg-bg-primary">
              {children}
            </main>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
