import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

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
      <body className={inter.className}>
        <ThemeProvider>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
