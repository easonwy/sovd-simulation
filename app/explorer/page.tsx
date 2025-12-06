'use client'
import { useState, useEffect } from 'react'
import Tree from './_components/Tree'
import RequestConsole from './_components/RequestConsole'

export default function Page() {
  const [selectedPath, setSelectedPath] = useState('/v1/App/WindowControl/data')
  const [selectedMethod, setSelectedMethod] = useState('GET')
  const [showAuth, setShowAuth] = useState(false)
  const [role, setRole] = useState<'Viewer' | 'Developer' | 'Admin'>('Developer')
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    setToken(localStorage.getItem('sovd.token') || '')
  }, [])

  async function issueToken() {
    try {
      const res = await fetch('/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_type: 'client_credentials', role })
      })
      const json = await res.json()
      if (json.access_token) {
        localStorage.setItem('sovd.token', json.access_token)
        setToken(json.access_token)
        setShowAuth(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  function handleSelect(path: string, method: string) {
    setSelectedPath(path)
    setSelectedMethod(method)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden relative">
      {/* Auth Modal */}
      {showAuth && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Connection Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option>Viewer</option>
                  <option>Developer</option>
                  <option>Admin</option>
                </select>
              </div>
              <button
                onClick={issueToken}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
              >
                Generate & Save Token
              </button>
              {token && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Current Token</label>
                  <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all h-20 overflow-y-auto">
                    {token}
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={() => setShowAuth(false)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="h-12 bg-gray-900 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold text-lg tracking-tight">SOVD Explorer</span>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-green-600 hover:bg-green-500 text-white text-xs px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            Connection: {token ? 'Connected' : 'No Token'}
          </button>
        </div>
        <div className="flex gap-4 text-gray-400 text-sm font-medium">
          <span className="text-white border-b-2 border-white cursor-pointer">Console</span>
          <span className="hover:text-white cursor-pointer">Projects</span>
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
              initialPath={selectedPath}
              initialMethod={selectedMethod}
              token={token}
            />
          </div>
        </div>
      </div>

      {/* Footer / Status Bar if needed */}
      <div className="h-6 bg-gray-200 border-t text-xs flex items-center px-2 text-gray-600 shrink-0">
        Trace
      </div>
    </div>
  )
}
