'use client'
import { useState, useEffect } from 'react'

interface PermissionModalProps {
    permission: { id: string; role: string; pathPattern: string; method: string; access: string } | null
    initialRole?: string
    onClose: () => void
    onSave: () => void
}

export default function PermissionModal({ permission, initialRole, onClose, onSave }: PermissionModalProps) {
    const [role, setRole] = useState<string>(initialRole || 'Viewer')
    const [pathPattern, setPathPattern] = useState('')
    const [method, setMethod] = useState('GET')
    const [allowed, setAllowed] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (permission) {
            setRole(permission.role)
            setPathPattern(permission.pathPattern)
            setMethod(permission.method)
            try {
                const access = JSON.parse(permission.access)
                setAllowed(access.allowed || false)
            } catch {
                setAllowed(true)
            }
        }
    }, [permission])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const token = localStorage.getItem('sovd.token')
            const url = permission ? `/api/admin/permissions/${permission.id}` : '/api/admin/permissions'
            const method_http = permission ? 'PUT' : 'POST'

            const body = {
                role,
                pathPattern,
                method,
                access: JSON.stringify({ allowed })
            }

            const res = await fetch(url, {
                method: method_http,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to save permission')
                setLoading(false)
                return
            }

            onSave()
            onClose()
        } catch (err) {
            setError('Failed to save permission')
            setLoading(false)
        }
    }

    const pathExamples = [
        '/v1/*',
        '/v1/Component/*',
        '/v1/Component/*/faults',
        '/v1/App/*/data/*',
        '/admin/*'
    ]

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {permission ? 'Edit Permission' : 'Add New Permission'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!!permission}
                        >
                            <option value="Admin">Admin</option>
                            <option value="Developer">Developer</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                        {permission && (
                            <p className="text-xs text-gray-500 mt-1">Role cannot be changed after creation</p>
                        )}
                    </div>

                    {/* Path Pattern */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Path Pattern
                        </label>
                        <input
                            type="text"
                            value={pathPattern}
                            onChange={(e) => setPathPattern(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="/v1/*"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Use * as wildcard. Examples:
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {pathExamples.map((example) => (
                                <button
                                    key={example}
                                    type="button"
                                    onClick={() => setPathPattern(example)}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-mono"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* HTTP Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            HTTP Method
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m)}
                                    className={`px-3 py-2 rounded-lg font-medium text-sm ${method === m
                                            ? m === 'GET' ? 'bg-green-600 text-white' :
                                                m === 'POST' ? 'bg-blue-600 text-white' :
                                                    m === 'DELETE' ? 'bg-red-600 text-white' :
                                                        'bg-yellow-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Access */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Access
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setAllowed(true)}
                                className={`px-4 py-3 rounded-lg font-medium ${allowed
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                ✓ Allow
                            </button>
                            <button
                                type="button"
                                onClick={() => setAllowed(false)}
                                className={`px-4 py-3 rounded-lg font-medium ${!allowed
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                ✕ Deny
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : permission ? 'Save Changes' : 'Create Permission'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
