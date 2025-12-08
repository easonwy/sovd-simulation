"use client"
import { useState, useEffect } from 'react'
import { parseEnhancedToken, generateEnhancedToken, verifyEnhancedToken } from '@/lib/enhanced-jwt'
import { parseTokenBrowser, parseHeaderBrowser, isValidJWTFormat, normalizeToken, decodeSignature } from '@/lib/browser-token-utils'
import type { EnhancedTokenPayload } from '@/lib/enhanced-jwt'

interface TokenManagerProps {
  isOpen: boolean
  onClose: () => void
  currentToken?: string
  onTokenUpdate?: (newToken: string) => void
}

interface TokenData {
  header: any
  payload: EnhancedTokenPayload | null
  signature: string
  signatureDecoded?: string
  signatureLength?: number
  isValid: boolean
  error?: string
}

export default function TokenManager({ isOpen, onClose, currentToken, onTokenUpdate }: TokenManagerProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'edit' | 'generate'>('view')
  const [tokenInput, setTokenInput] = useState('')
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [editedPayload, setEditedPayload] = useState('')
  const [generatedToken, setGeneratedToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  // Initialize with current token if provided
  useEffect(() => {
    if (isOpen && currentToken) {
      setTokenInput(currentToken)
      decodeToken(currentToken)
    } else if (isOpen && !currentToken) {
      // Set a proper sample token for testing (with all 3 parts)
      const sampleToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZW1vLXVzZXItMTIzIiwiZW1haWwiOiJkZW1vQHNvdmQtZXhwbG9yZXIuY29tIiwicm9sZSI6IkRldmVsb3BlciIsIm9pZCI6ImRlbW8tb3JnLTEiLCJwZXJtaXNzaW9ucyI6WyJyZWFkOmRhdGEiLCJ3cml0ZTpkYXRhIiwicmVhZDpmYXVsdHMiXSwic2NvcGUiOiJhcGkiLCJqdGkiOiJkZW1vLXRva2VuLTEyMzQ1IiwiaWF0IjoxNzY1MjAyNjQzLCJleHAiOjE3NjUyODkwNDN9.ZHVtbXktc2lnbmF0dXJlLWZvci1kZW1v'
      setTokenInput(sampleToken)
      decodeToken(sampleToken)
    }
  }, [isOpen, currentToken])

  // Decode token and verify
  const decodeToken = async (token: string) => {
    if (!token.trim()) {
      setTokenData(null)
      return
    }

    setLoading(true)
    try {
      // First validate the JWT format
      const normalized = normalizeToken(token)
      if (!isValidJWTFormat(normalized)) {
        setTokenData({
          header: null,
          payload: null,
          signature: '',
          isValid: false,
          error: 'Invalid JWT format - must have 3 base64url parts separated by dots'
        })
        return
      }

      // Parse token using browser-compatible function
      const payload = parseTokenBrowser(normalized)
      if (!payload) {
        setTokenData({
          header: null,
          payload: null,
          signature: '',
          isValid: false,
          error: 'Failed to parse token payload'
        })
        return
      }

      // Parse header using browser-compatible function
      const header = parseHeaderBrowser(normalized)

      const parts = normalized.split('.')
      const sig = decodeSignature(normalized)

      // Verify token
      const verification = await verifyEnhancedToken(normalized)

      setTokenData({
        header,
        payload,
        signature: parts[2] || '',
        signatureDecoded: sig ? sig.hex : '',
        signatureLength: sig ? sig.bytes.length : 0,
        isValid: verification.valid,
        error: verification.error
      })

      // Set edited payload with proper formatting
      setEditedPayload(JSON.stringify(payload, null, 2))
    } catch (error) {
      console.error('Token decode error:', error)
      setTokenData({
        header: null,
        payload: null,
        signature: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to decode token'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle token input change with debouncing
  const handleTokenChange = (token: string) => {
    setTokenInput(token)
    // Clear previous data immediately
    if (!token.trim()) {
      setTokenData(null)
      return
    }
    
    // Add small delay to avoid excessive API calls
    setTimeout(() => {
      try {
        decodeToken(token)
      } catch (error) {
        console.error('Token change error:', error)
        setTokenData({
          header: null,
          payload: null,
          signature: '',
          isValid: false,
          error: 'Failed to process token change'
        })
      }
    }, 300)
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'token' | 'payload') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(type === 'token' ? 'Token copied!' : 'Payload copied!')
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Save edited token
  const saveEditedToken = async () => {
    if (!tokenData?.payload) return

    setLoading(true)
    try {
      // Parse edited payload
      const editedData = JSON.parse(editedPayload)
      
      // Validate required fields
      const requiredFields = ['userId', 'email', 'role', 'oid', 'permissions', 'scope']
      const missingFields = requiredFields.filter(field => !editedData[field])
      
      if (missingFields.length > 0) {
        alert(`Missing required fields: ${missingFields.join(', ')}`)
        return
      }

      // Generate new token with edited payload
      const result = await generateEnhancedToken({
        userId: editedData.userId,
        email: editedData.email,
        role: editedData.role,
        oid: editedData.oid,
        permissions: editedData.permissions,
        scope: editedData.scope,
        clientId: editedData.clientId
      })

      setGeneratedToken(result.token)
      setSaveSuccess('Token updated successfully!')
      
      // Update the main token if callback provided
      if (onTokenUpdate) {
        onTokenUpdate(result.token)
      }
      
      // Refresh the view with new token
      handleTokenChange(result.token)
      
      setTimeout(() => setSaveSuccess(''), 3000)
    } catch (error) {
      alert(`Failed to save token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Generate new token
  const generateNewToken = async () => {
    setLoading(true)
    try {
      const result = await generateEnhancedToken({
        userId: 'user-' + Date.now(),
        email: 'user@example.com',
        role: 'Viewer',
        oid: 'org-1',
        permissions: ['read:data'],
        scope: 'api'
      })

      setGeneratedToken(result.token)
      handleTokenChange(result.token)
    } catch (error) {
      alert(`Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Format JSON for display
  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return 'Invalid JSON'
    }
  }

  // Syntax highlight JSON
  const syntaxHighlightJSON = (json: string) => {
    return json.replace(/"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, (match) => {
      let cls = 'token-json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'token-json-key';
        } else {
          cls = 'token-json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'token-json-boolean';
      } else if (/null/.test(match)) {
        cls = 'token-json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Token Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'view' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            View & Decode
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Edit & Encrypt
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'generate' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Generate New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {/* View & Decode Tab */}
          {activeTab === 'view' && (
            <div className="h-full flex flex-col space-y-4">
              {/* Token Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">JWT Token</label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={tokenInput}
                      onChange={(e) => handleTokenChange(e.target.value)}
                      placeholder="Paste your JWT token here... (Format: header.payload.signature)"
                    className={`w-full h-20 p-3 border rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        tokenInput && !isValidJWTFormat(normalizeToken(tokenInput)) 
                          ? 'border-red-300 bg-red-50' 
                          : tokenInput && isValidJWTFormat(normalizeToken(tokenInput))
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    />
                    {tokenInput && !isValidJWTFormat(normalizeToken(tokenInput)) && (
                      <p className="text-red-600 text-xs mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Invalid format - must be header.payload.signature
                      </p>
                    )}
                    {tokenInput && isValidJWTFormat(normalizeToken(tokenInput)) && (
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Valid format
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => copyToClipboard(tokenInput, 'token')}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleTokenChange('')}
                      className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {copySuccess && (
                  <p className="text-green-600 text-sm mt-1">{copySuccess}</p>
                )}
              </div>

              {/* Token Info */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Decoding token...</span>
                </div>
              )}

              {tokenData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                  {/* Header */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      Header
                      {tokenData.isValid && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Verified</span>
                      )}
                      {!tokenData.isValid && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Unverified</span>
                      )}
                    </h3>
                    <pre 
                      className="text-xs font-mono text-gray-700 bg-white p-3 rounded border max-h-32 overflow-auto custom-scrollbar"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlightJSON(formatJSON(tokenData.header)) }}
                    />
                  </div>

                  {/* Payload */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Payload</h3>
                    <pre 
                      className="text-xs font-mono text-gray-700 bg-white p-3 rounded border max-h-32 overflow-auto custom-scrollbar"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlightJSON(formatJSON(tokenData.payload)) }}
                    />
                  </div>

                  {/* Signature */}
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Signature</h3>
                    <div className="space-y-2">
                      <div className="text-xs font-mono text-gray-700 bg-white p-3 rounded border max-h-20 overflow-auto custom-scrollbar break-all">
                        Raw: {tokenData.signature}
                      </div>
                      {tokenData.signatureDecoded !== undefined && (
                        <div className="text-xs font-mono text-gray-700 bg-white p-3 rounded border max-h-28 overflow-auto custom-scrollbar break-all">
                          Decoded (HEX{tokenData.signatureLength ? `, ${tokenData.signatureLength} bytes` : ''}): {tokenData.signatureDecoded}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error */}
                  {tokenData.error && (
                    <div className="bg-red-50 rounded-lg p-4 md:col-span-2 border border-red-200">
                      <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Error
                      </h3>
                      <p className="text-red-700 text-sm mb-2">{tokenData.error}</p>
                      <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                        <strong>Common issues:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          <li>Token must have 3 parts separated by dots (header.payload.signature)</li>
                          <li>Each part must be base64url encoded</li>
                          <li>Token should not contain spaces or special characters</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Edit & Encrypt Tab */}
          {activeTab === 'edit' && (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex-1 flex flex-col space-y-4 min-h-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Edit Payload</label>
                  <textarea
                    value={editedPayload}
                    onChange={(e) => setEditedPayload(e.target.value)}
                    className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 custom-scrollbar"
                    placeholder="Edit the token payload here..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={saveEditedToken}
                    disabled={loading || !tokenData?.payload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Encrypting...' : 'Encrypt & Save'}
                  </button>
                  <button
                    onClick={() => setEditedPayload(formatJSON(tokenData?.payload))}
                    disabled={!tokenData?.payload}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => copyToClipboard(editedPayload, 'payload')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Copy Payload
                  </button>
                </div>

                {saveSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-800 text-sm">{saveSuccess}</p>
                  </div>
                )}

                {generatedToken && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generated Token</label>
                    <div className="flex space-x-2">
                      <textarea
                        value={generatedToken}
                        readOnly
                        className="flex-1 h-20 p-3 border border-gray-300 rounded-md font-mono text-xs bg-gray-50 custom-scrollbar"
                      />
                      <button
                        onClick={() => copyToClipboard(generatedToken, 'token')}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate New Tab */}
          {activeTab === 'generate' && (
            <div className="h-full flex flex-col space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Generate New Token</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Create a new token with default values. You can customize the payload in the Edit tab after generation.
                </p>
                <button
                  onClick={generateNewToken}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate Token'}
                </button>
              </div>

              {generatedToken && (
                <div className="flex-1 flex flex-col space-y-4 min-h-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Token</label>
                    <div className="flex space-x-2">
                      <textarea
                        value={generatedToken}
                        readOnly
                        className="flex-1 h-24 p-3 border border-gray-300 rounded-md font-mono text-xs bg-gray-50 custom-scrollbar"
                      />
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => copyToClipboard(generatedToken, 'token')}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => {
                            if (onTokenUpdate) {
                              onTokenUpdate(generatedToken)
                              setSaveSuccess('Token applied successfully!')
                              setTimeout(() => setSaveSuccess(''), 3000)
                            }
                          }}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>

                  {saveSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-green-800 text-sm">{saveSuccess}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {tokenData?.payload && (
              <span>
                Expires: {new Date(tokenData.payload.exp * 1000).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
