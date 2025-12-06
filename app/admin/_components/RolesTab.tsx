'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Permission {
    id: string
    role: string
    pathPattern: string
    method: string
    access: string
}

interface RoleData {
    name: string
    icon: string
    description: string
    color: string
    permissions: Permission[]
}

export default function RolesTab() {
    const [rolesData, setRolesData] = useState<RoleData[]>([])
    const [loading, setLoading] = useState(true)

    const roleDefinitions = [
        {
            name: 'Admin',
            icon: '👑',
            description: 'Full system access with all permissions',
            color: 'red'
        },
        {
            name: 'Developer',
            icon: '🔧',
            description: 'Read/Write access to SOVD resources',
            color: 'blue'
        },
        {
            name: 'Viewer',
            icon: '👁️',
            description: 'Read-only access to SOVD data',
            color: 'gray'
        }
    ]

    useEffect(() => {
        loadRolesData()
    }, [])

    async function loadRolesData() {
        try {
            const token = localStorage.getItem('sovd.token')

            // Load permissions for all roles
            const allRolesData = await Promise.all(
                roleDefinitions.map(async (roleDef) => {
                    const res = await fetch(`/api/admin/permissions?role=${roleDef.name}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    const data = await res.json()

                    return {
                        ...roleDef,
                        permissions: data.permissions || []
                    }
                })
            )

            setRolesData(allRolesData)
        } catch (error) {
            console.error('Failed to load roles data:', error)
        } finally {
            setLoading(false)
        }
    }

    function parseAccess(accessString: string): boolean {
        try {
            const access = JSON.parse(accessString)
            return access.allowed || false
        } catch {
            return false
        }
    }

    function getCapabilitySummary(permissions: Permission[]): string[] {
        const allowedPermissions = permissions.filter(p => parseAccess(p.access))

        if (allowedPermissions.length === 0) {
            return ['No permissions configured']
        }

        const summary: string[] = []

        // Count by method
        const getCounts = allowedPermissions.filter(p => p.method === 'GET').length
        const postCounts = allowedPermissions.filter(p => p.method === 'POST').length
        const putCounts = allowedPermissions.filter(p => p.method === 'PUT').length
        const deleteCounts = allowedPermissions.filter(p => p.method === 'DELETE').length

        if (getCounts > 0) summary.push(`${getCounts} GET permission(s)`)
        if (postCounts > 0) summary.push(`${postCounts} POST permission(s)`)
        if (putCounts > 0) summary.push(`${putCounts} PUT permission(s)`)
        if (deleteCounts > 0) summary.push(`${deleteCounts} DELETE permission(s)`)

        // Check for admin paths
        const hasAdminAccess = allowedPermissions.some(p => p.pathPattern.includes('/admin'))
        if (hasAdminAccess) {
            summary.push('Admin panel access')
        }

        // Check for wildcard access
        const hasWildcard = allowedPermissions.some(p => p.pathPattern === '/v1/*' || p.pathPattern === '/*')
        if (hasWildcard) {
            summary.push('Full API access')
        }

        return summary.slice(0, 5) // Limit to 5 items
    }

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading roles...</div>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Roles & Capabilities</h2>
                <span className="text-sm text-gray-600">
                    {rolesData.reduce((acc, role) => acc + role.permissions.length, 0)} total permissions
                </span>
            </div>

            <div className="space-y-6">
                {rolesData.map((role) => {
                    const allowedPerms = role.permissions.filter(p => parseAccess(p.access))
                    const deniedPerms = role.permissions.filter(p => !parseAccess(p.access))

                    return (
                        <div key={role.name} className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl">{role.icon}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                                        <p className="text-sm text-gray-600">{role.description}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`text-xs px-3 py-1 rounded-full ${role.color === 'red' ? 'bg-red-100 text-red-700' :
                                            role.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {role.permissions.length} permission(s)
                                    </span>
                                    <Link
                                        href={`/admin?tab=permissions&role=${role.name}`}
                                        className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                                    >
                                        Manage Permissions
                                    </Link>
                                </div>
                            </div>

                            {/* Permission Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{allowedPerms.length}</div>
                                    <div className="text-xs text-gray-600">Allowed</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-600">{deniedPerms.length}</div>
                                    <div className="text-xs text-gray-600">Denied</div>
                                </div>
                            </div>

                            {/* Capabilities */}
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Capabilities:</h4>
                                <ul className="space-y-2">
                                    {getCapabilitySummary(role.permissions).map((capability, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-green-500 mr-2">✓</span>
                                            <span className="text-sm text-gray-600">{capability}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Show some example permissions */}
                            {allowedPerms.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Permissions:</h4>
                                    <div className="space-y-1">
                                        {allowedPerms.slice(0, 3).map((perm) => (
                                            <div key={perm.id} className="flex items-center text-xs font-mono text-gray-600">
                                                <span className={`px-2 py-0.5 rounded mr-2 ${perm.method === 'GET' ? 'bg-green-100 text-green-700' :
                                                        perm.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                                                            perm.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {perm.method}
                                                </span>
                                                {perm.pathPattern}
                                            </div>
                                        ))}
                                        {allowedPerms.length > 3 && (
                                            <div className="text-xs text-gray-500 italic">
                                                +{allowedPerms.length - 3} more...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Permissions are loaded from the database. Use the "Manage Permissions" button to customize access control for each role.
                </p>
            </div>
        </div>
    )
}
