'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('sovd.token')
    if (token) {
      router.replace('/explorer')
    } else {
      router.replace('/login')
    }
  }, [router])

  // Return empty or loading state to prevent flash
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <div className="text-slate-500 font-medium animate-pulse">Checking access...</div>
      </div>
    </div>
  )
}
