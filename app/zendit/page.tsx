"use client"

import { useEffect } from "react"

const WHATSAPP_URL = "https://wa.me/2349018124230?text=Hi%20Zend!"

export default function ZenditPage() {
  useEffect(() => {
    window.location.href = WHATSAPP_URL
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-white">Redirecting to WhatsApp...</p>
    </div>
  )
}
