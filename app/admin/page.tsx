'use client'
import { useState, useEffect } from 'react'
import UsersTab from './_components/UsersTab'
import RolesTab from './_components/RolesTab'
import PermissionsTab from './_components/PermissionsTab'
import ToastContainer from './_components/ToastContainer'

type Tab = 'users' | 'roles' | 'permissions'

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>('users')
    const [userRole, setUserRole] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is admin
        const checkAdminAccess = async () => {
            try {
                const token = localStorage.getItem('sovd.token')
                if (!token) {
                    window.location.href = '/explorer'
                    return
                }

                // Decode token to check role (in a real app, verify with backend)
                const payload = JSON.parse(atob(token.split('.')[1]))
                if (payload.role !== 'Admin') {
                    alert('Access denied. Admin role required.')
                    window.location.href = '/explorer'
                    return
                }

                setUserRole(payload.role)
                setLoading(false)
            } catch (error) {
                console.error('Auth check failed:', error)
                window.location.href = '/explorer'
            }
        }

        checkAdminAccess()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ToastContainer />

            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">🔐 Admin Panel</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                Role: <span className="font-semibold text-blue-600">{userRole}</span>
                            </span>
                            <a
                                href="/explorer"
                                className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                            >
                                Back to Explorer
                            </a>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'users'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                }`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'roles'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                }`}
                        >
                            Roles
                        </button>
                        <button
                            onClick={() => setActiveTab('permissions')}
                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'permissions'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                }`}
                        >
                            Permissions
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'roles' && <RolesTab />}
                {activeTab === 'permissions' && <PermissionsTab />}
            </div>
        </div>
    )
}
