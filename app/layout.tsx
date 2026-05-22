import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import GoogleAnalytics from "@/components/analytics"

const geist = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ZEND - Secure Payments Right Inside WhatsApp",
  description:
    "ZEND is the easiest way for vendors and buyers in Nigeria to send, receive, and protect payments — all without leaving WhatsApp.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Facebook Domain Verification */}
        <meta name="facebook-domain-verification" content="asi9lykxtj8gd3mxh1uwh42vsrsv12" />
        <GoogleAnalytics />
      </head>
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  )
}
