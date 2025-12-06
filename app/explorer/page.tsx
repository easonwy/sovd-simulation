'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Tree from './_components/Tree'
import RequestConsole from './_components/RequestConsole'

export default function Page() {
  const router = useRouter()
  const [selectedPath, setSelectedPath] = useState('/v1/Component')
  const [selectedMethod, setSelectedMethod] = useState('GET')
  const [token, setToken] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const t = localStorage.getItem('sovd.token')
    if (!t) {
      // No token, redirect to login
      router.push('/login')
      return
    }

    try {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(t.split('.')[1]))
      setToken(t)
      setUserEmail(payload.email || '')
      setUserRole(payload.role || '')
      setLoading(false)
    } catch (error) {
      // Invalid token, redirect to login
      console.error('Invalid token:', error)
      localStorage.removeItem('sovd.token')
      router.push('/login')
    }
  }, [router])

  function handleLogout() {
    localStorage.removeItem('sovd.token')
    router.push('/login')
  }

  function handleSelect(path: string, method: string) {
    setSelectedPath(path)
    setSelectedMethod(method)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden relative">
      {/* Header Bar */}
      <div className="h-12 bg-gray-900 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold text-lg tracking-tight">SOVD Explorer</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">•</span>
            <span className="text-gray-300">{userEmail}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${userRole === 'Admin' ? 'bg-red-600 text-white' :
                userRole === 'Developer' ? 'bg-blue-600 text-white' :
                  'bg-gray-600 text-white'
              }`}>
              {userRole}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'Admin' && (
            <a
              href="/admin"
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Admin Panel
            </a>
          )}
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar: Tree */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-2 bg-gray-100 border-b text-xs font-bold text-gray-600 uppercase">
            SOVD Tree
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <Tree onSelect={handleSelect} token={token} />
          </div>
        </div>

        {/* Right Content: Console */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          <div className="p-4 h-full">
            <RequestConsole
              key={`${selectedPath}-${selectedMethod}`}
              initialPath={selectedPath}
              initialMethod={selectedMethod}
              token={token}
            />
          </div>
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className="h-6 bg-gray-200 border-t text-xs flex items-center px-2 text-gray-600 shrink-0">
        <span>Ready</span>
      </div>
    </div>
  )
}
