'use client'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    message: string
    type: ToastType
}

let toastIdCounter = 0
const toastListeners: Array<(toast: Toast) => void> = []

export function showToast(message: string, type: ToastType = 'info') {
    const toast: Toast = {
        id: `toast-${toastIdCounter++}`,
        message,
        type
    }
    toastListeners.forEach(listener => listener(toast))
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([])

    useEffect(() => {
        const listener = (toast: Toast) => {
            setToasts(prev => [...prev, toast])
            // Auto-remove after 4 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id))
            }, 4000)
        }

        toastListeners.push(listener)
        return () => {
            const index = toastListeners.indexOf(listener)
            if (index > -1) toastListeners.splice(index, 1)
        }
    }, [])

    function removeToast(id: string) {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] animate-slide-in ${toast.type === 'success' ? 'bg-green-600 text-white' :
                        toast.type === 'error' ? 'bg-red-600 text-white' :
                            toast.type === 'warning' ? 'bg-yellow-600 text-white' :
                                'bg-blue-600 text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">
                            {toast.type === 'success' ? '✓' :
                                toast.type === 'error' ? '✕' :
                                    toast.type === 'warning' ? '⚠' :
                                        'ℹ'}
                        </span>
                        <span className="font-medium">{toast.message}</span>
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-4 text-white hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    )
}
