'use client'

import { useState, useEffect } from 'react'

interface TokenPayload {
  userId: string
  email: string
  role: string
  oid: string
  permissions: string[]
  scope: string
  clientId?: string
  jti: string
  iat: number
  exp: number
  nbf?: number
}

interface TokenResult {
  token: string
  payload: TokenPayload
  expiresAt: Date
}

export default function TokenTool() {
  const [token, setToken] = useState('')
  const [parsedToken, setParsedToken] = useState<TokenPayload | null>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Token generation form
  const [formData, setFormData] = useState({
    role: 'Viewer',
    email: 'user@example.com',
    userId: 'user123',
    oid: 'default',
    scope: 'api:access',
    clientId: '',
    expiresIn: '24h',
    permissions: ''
  })

  // Permission check
  const [checkData, setCheckData] = useState({
    method: 'GET',
    path: '/v1/App'
  })

  useEffect(() => {
    // Clear messages
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const generateToken = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const permissions = formData.permissions 
        ? formData.permissions.split(',').map(p => p.trim()).filter(p => p)
        : getDefaultPermissions(formData.role)

      const response = await fetch('/api/admin/token-tool/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          permissions
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Token generation failed')
      }

      setToken(result.token)
      setParsedToken(result.payload)
      setSuccess('Token generated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token generation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyToken = async () => {
    if (!token) {
      setError('Please input or generate token first')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/token-tool/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      const result = await response.json()
      setVerificationResult(result)
      
      if (result.valid) {
        setSuccess('Token verification successful!')
      } else {
        setError(`Token verification failed: ${result.error}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const parseToken = () => {
    if (!token) {
      setError('Please input or generate token first')
      return
    }

    setError('')
    setSuccess('')

    try {
      // 这里简化处理，实际应该调用API
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid token format')
      }

      const payloadJson = atob(parts[1])
      const payload = JSON.parse(payloadJson)
      setParsedToken(payload)
        setSuccess('Token parsing successful!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token parsing failed')
    }
  }

  const checkPermissions = async () => {
    if (!token) {
      setError('Please input or generate token first')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/token-tool/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          method: checkData.method,
          path: checkData.path
        })
      })

      const result = await response.json()
      setVerificationResult(result)
      
      if (result.allowed) {
        setSuccess('Access granted!')
      } else {
        setError(`Access denied: ${result.reason}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Permission check failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getDefaultPermissions = (role: string): string[] => {
    const permissions = {
      'Viewer': [
        'GET:/v1/App',
        'GET:/v1/App/*/data',
        'GET:/v1/App/*/faults'
      ],
      'Developer': [
        'GET:/v1/App',
        'POST:/v1/App',
        'GET:/v1/App/*/data',
        'POST:/v1/App/*/data',
        'PUT:/v1/App/*/data',
        'GET:/v1/App/*/faults',
        'POST:/v1/App/*/faults',
        'DELETE:/v1/App/*/faults',
        'GET:/v1/App/*/lock'
      ],
      'Admin': ['*']
    }
    return permissions[role as keyof typeof permissions] || []
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">🛡️ Token Management Tool</h1>
      
      {/* 消息显示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Token generator */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🔑 Token Generator</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Viewer">Viewer (Observer)</option>
                <option value="Developer">Developer (Developer)</option>
                <option value="Admin">Admin (Administrator)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input 
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({...formData, userId: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
              <input 
                type="text"
                value={formData.oid}
                onChange={(e) => setFormData({...formData, oid: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Time</label>
              <select 
                value={formData.expiresIn}
                onChange={(e) => setFormData({...formData, expiresIn: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1h">1 hour</option>
                <option value="6h">6 hours</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom permissions (optional, comma-separated)</label>
              <textarea 
                value={formData.permissions}
                onChange={(e) => setFormData({...formData, permissions: e.target.value})}
                placeholder="Example: GET:/v1/App, POST:/v1/App/*/data"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
              />
            </div>
            
            <button 
              onClick={generateToken}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate Token'}
            </button>
          </div>
        </div>

        {/* Token operations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">🔧 Token Operations</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
              <textarea 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter JWT token or generate from above"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 font-mono text-xs"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={verifyToken}
                disabled={isLoading || !token}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Verify Token
              </button>
              
              <button 
                onClick={parseToken}
                disabled={!token}
                className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Parse Token
              </button>
            </div>
            
            {/* Permission check */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-3 text-gray-800">🔍 Permission Check</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
                  <select 
                    value={checkData.method}
                    onChange={(e) => setCheckData({...checkData, method: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Path</label>
                  <input 
                    type="text"
                    value={checkData.path}
                    onChange={(e) => setCheckData({...checkData, path: e.target.value})}
                    placeholder="Example: /v1/App or /v1/App/*/data"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button 
                  onClick={checkPermissions}
                  disabled={isLoading || !token}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Check Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token信息展示 */}
      {(parsedToken || verificationResult) && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📋 Token Information</h2>
          
          {parsedToken && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-700">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">User ID:</span> {parsedToken.userId}</div>
                  <div><span className="font-medium">Email:</span> {parsedToken.email}</div>
                  <div><span className="font-medium">Role:</span> 
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      parsedToken.role === 'Admin' ? 'bg-red-100 text-red-800' :
                      parsedToken.role === 'Developer' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {parsedToken.role}
                    </span>
                  </div>
                  <div><span className="font-medium">Organization ID:</span> {parsedToken.oid}</div>
                  <div><span className="font-medium">Scope:</span> {parsedToken.scope}</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-700">Time Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">JWT ID:</span> {parsedToken.jti}</div>
                  <div><span className="font-medium">Issue Time:</span> {formatTime(parsedToken.iat)}</div>
                  <div><span className="font-medium">Expiration Time:</span> {formatTime(parsedToken.exp)}</div>
                  <div><span className="font-medium">Permission Count:</span> {parsedToken.permissions.length}</div>
                </div>
              </div>
            </div>
          )}
          
          {verificationResult && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3 text-gray-700">Verification Result</h3>
              <div className={`p-3 rounded-md ${
                verificationResult.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className="font-medium">
                  {verificationResult.valid ? '✅ Token valid' : '❌ Token invalid'}
                </div>
                {verificationResult.error && (
                  <div className="text-sm mt-1">Error: {verificationResult.error}</div>
                )}
                {verificationResult.code && (
                  <div className="text-sm">Error Code: {verificationResult.code}</div>
                )}
              </div>
              
              {verificationResult.details && (
                <div className="mt-3 p-3 bg-gray-100 rounded-md">
                  <h4 className="font-medium mb-2">Detailed Information:</h4>
                  <div className="text-sm space-y-1">
                    {verificationResult.details.requiredRole && (
                      <div>Required Role: {verificationResult.details.requiredRole}</div>
                    )}
                    {verificationResult.details.currentRole && (
                      <div>Current Role: {verificationResult.details.currentRole}</div>
                    )}
                    {verificationResult.details.resource && (
                      <div>Resource: {verificationResult.details.resource}</div>
                    )}
                    {verificationResult.details.action && (
                      <div>Action: {verificationResult.details.action}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {parsedToken && parsedToken.permissions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">Permission List</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {parsedToken.permissions.map((permission, index) => (
                  <div key={index} className="bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                    {permission}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
