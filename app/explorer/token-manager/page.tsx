'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TokenManager from '../_components/TokenManager'

export default function TokenManagerPage() {
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem('sovd.token')
    if (!storedToken) {
      router.push('/login')
      return
    }

    setToken(storedToken)
    setLoading(false)
  }, [router])

  function handleTokenUpdate(newToken: string) {
    setToken(newToken)
    localStorage.setItem('sovd.token', newToken)
  }

  function handleClose() {
    router.push('/explorer')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-xl">🚗</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SOVD Token Manager</h1>
              <p className="text-gray-600 text-sm">Manage JWT tokens: decrypt, edit, encrypt, and generate</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Explorer
          </button>
        </div>

        {/* Token Manager */}
        <div className="bg-white rounded-lg shadow-lg">
          <TokenManager
            isOpen={true}
            onClose={handleClose}
            currentToken={token}
            onTokenUpdate={handleTokenUpdate}
          />
        </div>
      </div>
    </div>
  )
}