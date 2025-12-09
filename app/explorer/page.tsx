'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Tree from './_components/Tree'
import RequestConsole from './_components/RequestConsole'
import TokenManager from './_components/TokenManager'

export default function Page() {
  const router = useRouter()
  const [selectedPath, setSelectedPath] = useState('/sovd/v1/Component')
  const [selectedMethod, setSelectedMethod] = useState('GET')
  const [token, setToken] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isTokenManagerOpen, setIsTokenManagerOpen] = useState(false)

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

  function handleTokenUpdate(newToken: string) {
    setToken(newToken)
    localStorage.setItem('sovd.token', newToken)
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
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative font-sans">
      {/* Header Bar */}
      <div className="h-14 bg-slate-900 flex items-center px-6 justify-between shrink-0 shadow-md z-20 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-lg">🚗</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SOVD <span className="text-slate-400 font-light">Explorer</span></span>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-2"></div>

          <div className="flex items-center gap-2 text-sm">
            <div className="flex flex-col">
              <span className="text-slate-300 font-medium text-xs leading-none">{userEmail}</span>
              <span className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${userRole === 'Admin' ? 'text-red-400' :
                  userRole === 'Developer' ? 'text-blue-400' :
                    'text-green-400'
                }`}>
                {userRole}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTokenManagerOpen(true)}
            className="text-xs px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded-lg transition-all border border-purple-500/20 hover:border-purple-500/30 font-medium flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
              <path d="M2 17L12 22L22 17"/>
              <path d="M2 12L12 17L22 12"/>
            </svg>
            Token Manager
          </button>
          {userRole === 'Admin' && (
            <a
              href="/admin"
              className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700 hover:border-slate-600 font-medium"
            >
              Admin Panel
            </a>
          )}
          <button
            onClick={handleLogout}
            className="text-xs px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg transition-all border border-red-500/20 hover:border-red-500/30 font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content - Optimized layout with collapsible sidebar */}
      <div className="flex flex-1 min-h-0 bg-slate-50" style={{ height: 'calc(100vh - 5.25rem)' }}>
        {/* Left Sidebar: Tree - Collapsible */}
        <div className={`bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 transition-all duration-300 ${isSidebarCollapsed ? 'w-12' : 'w-72'}`}>
          {/* Sidebar Header - More compact */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resources</span>
            )}
            {!isSidebarCollapsed && (
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">v1.0</span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-slate-50 rounded-md transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`}>
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          </div>
          
          {/* Tree Content - Only show when expanded */}
          {!isSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              <Tree onSelect={handleSelect} token={token} isCollapsed={isSidebarCollapsed} />
            </div>
          )}
          
          {/* Tree Content - Compact view when collapsed */}
          {isSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
              <Tree onSelect={handleSelect} token={token} isCollapsed={isSidebarCollapsed} />
            </div>
          )}
          
          {/* Collapsed state - Show minimal info */}
          {isSidebarCollapsed && (
            <div className="flex-1 flex flex-col items-center justify-start pt-4 gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-violet-600 rounded flex items-center justify-center">
                <span className="text-xs">🚗</span>
              </div>
              <div className="writing-mode-vertical text-xs text-slate-400 font-medium tracking-wider">
                SOVD
              </div>
            </div>
          )}
        </div>

        {/* Right Content: Console - Maximized area with dynamic width */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50" style={{ height: '100%' }}>
          <div className="p-4 h-full" style={{ height: '100%' }}>
            <RequestConsole
              key={`${selectedPath}-${selectedMethod}`}
              initialPath={selectedPath}
              initialMethod={selectedMethod}
              token={token}
              onTokenManagerOpen={() => setIsTokenManagerOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className="h-7 bg-white border-t border-slate-200 text-xs flex items-center px-4 text-slate-500 shrink-0 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="font-medium">System Ready</span>
        </div>
        <div className="font-mono text-[10px] opacity-70">
          ASAM Service-Oriented Vehicle Diagnostics
        </div>
      </div>

      {/* Token Manager Dialog */}
      <TokenManager
        isOpen={isTokenManagerOpen}
        onClose={() => setIsTokenManagerOpen(false)}
        currentToken={token}
        onTokenUpdate={handleTokenUpdate}
      />
    </div>
  )
}
