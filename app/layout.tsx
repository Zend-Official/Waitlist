import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zend',
  description: 'Ai powered social media wallet',
  generator: 'COAT',
  other: {
    'facebook-domain-verification': 'asi9lykxtj8gd3mxh1uwh42vsrsv12',
  },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EV9V287KK1"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-EV9V287KK1');
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}

