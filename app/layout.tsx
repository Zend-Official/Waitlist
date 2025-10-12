import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import Script from "next/script"
import { GA_MEASUREMENT_ID } from "@/lib/gtag"

const geist = Geist({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ZEND - Secure Payments Right Inside WhatsApp",
  description:
    "ZEND is the easiest way for vendors and buyers in Nigeria to send, receive, and protect payments — all without leaving WhatsApp.",
    generator: 'COAT'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  )
}
