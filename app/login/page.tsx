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

            localStorage.setItem('sovd.token', data.token)
            router.push('/explorer')
        } catch (err) {
            setError('Login failed. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative w-full flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Dynamic Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-20 w-[40rem] h-[40rem] bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 w-full max-w-xl p-6">
                {/* Glass Card */}
                <div className="glass-dark rounded-2xl shadow-2xl overflow-hidden p-10 border border-white/10">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                            <span className="text-4xl">🚗</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                            SOVD <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Explorer</span>
                        </h1>
                        <p className="text-slate-400">Access the next-gen vehicle diagnostics</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* Email Input */}
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="peer w-full px-5 py-4 bg-slate-800/50 text-white border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-transparent"
                                    placeholder="Email"
                                    id="email"
                                    required
                                />
                                <label
                                    htmlFor="email"
                                    className="absolute left-5 -top-2.5 bg-slate-900 px-2 text-sm text-slate-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-500 peer-focus:-top-2.5 peer-focus:text-blue-400 pointer-events-none"
                                >
                                    Email Address
                                </label>
                            </div>

                            {/* Password Input */}
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="peer w-full px-5 py-4 bg-slate-800/50 text-white border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-transparent"
                                    placeholder="Password"
                                    id="password"
                                    required
                                />
                                <label
                                    htmlFor="password"
                                    className="absolute left-5 -top-2.5 bg-slate-900 px-2 text-sm text-slate-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-500 peer-focus:-top-2.5 peer-focus:text-blue-400 pointer-events-none"
                                >
                                    Password
                                </label>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                'Sign In to Dashboard'
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider text-center">Development Access</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => { setEmail('admin@sovd.com'); setPassword('admin123'); }}
                                className="group flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer text-center"
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors mb-2">👑</span>
                                <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Admin</div>
                                <div className="text-[10px] text-slate-500">Full Access</div>
                            </button>

                            <button
                                onClick={() => { setEmail('dev@sovd.com'); setPassword('dev123'); }}
                                className="group flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer text-center"
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors mb-2">🔧</span>
                                <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Developer</div>
                                <div className="text-[10px] text-slate-500">Read/Write</div>
                            </button>

                            <button
                                onClick={() => { setEmail('viewer@sovd.local'); setPassword('viewer123'); }}
                                className="group flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer text-center"
                            >
                                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors mb-2">👁️</span>
                                <div className="text-xs font-semibold text-slate-300 group-hover:text-white">Viewer</div>
                                <div className="text-[10px] text-slate-500">Read Only</div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-slate-600 text-sm">
                        Powered by NTDS &copy; 2025
                    </p>
                </div>
            </div>
        </div>
    )
}
