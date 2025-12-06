'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Login failed')
                setLoading(false)
                return
            }

            // Store token
            localStorage.setItem('sovd.token', data.token)

            // Redirect based on role
            if (data.user.role === 'Admin') {
                router.push('/admin')
            } else {
                router.push('/explorer')
            }
        } catch (err) {
            setError('Login failed. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <span className="text-3xl">🚗</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">SOVD Explorer</h1>
                    <p className="text-gray-600">Sign in to access the system</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="your@email.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-white/80 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium mb-2">Demo Credentials:</p>
                    <div className="space-y-1 text-xs text-gray-500">
                        <div>👑 Admin: <code className="bg-gray-100 px-1 rounded">admin@sovd.com</code> / <code className="bg-gray-100 px-1 rounded">admin123</code></div>
                        <div>🔧 Developer: <code className="bg-gray-100 px-1 rounded">dev@sovd.com</code> / <code className="bg-gray-100 px-1 rounded">dev123</code></div>
                        <div>👁️ Viewer: <code className="bg-gray-100 px-1 rounded">viewer@sovd.com</code> / <code className="bg-gray-100 px-1 rounded">viewer123</code></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
