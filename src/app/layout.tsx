import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Zuva Command Center',
  description: 'Founder Operations Dashboard for Zuva Media Inc.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0A0A0A] text-[#F0F0F0]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
