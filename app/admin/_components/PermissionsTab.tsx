'use client'
import { useState, useEffect } from 'react'
import PermissionModal from './PermissionModal'
import { showToast } from './ToastContainer'

interface Permission {
    id: string
    role: string
    pathPattern: string
    method: string
    access: string
    createdAt: string
}

export default function PermissionsTab() {
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRole, setSelectedRole] = useState('Admin')
    const [showModal, setShowModal] = useState(false)
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null)

    useEffect(() => {
        loadPermissions()
    }, [selectedRole])

    async function loadPermissions() {
        try {
            const token = localStorage.getItem('sovd.token')
            const res = await fetch(`/api/admin/permissions?role=${selectedRole}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setPermissions(data.permissions || [])
        } catch (error) {
            console.error('Failed to load permissions:', error)
            showToast('Failed to load permissions', 'error')
        } finally {
            setLoading(false)
        }
    }

    async function deletePermission(id: string, pathPattern: string) {
        if (!confirm(`Are you sure you want to delete permission for "${pathPattern}"?`)) return

        try {
            const token = localStorage.getItem('sovd.token')
            const res = await fetch(`/api/admin/permissions/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                showToast('Permission deleted successfully', 'success')
                loadPermissions()
            } else {
                showToast('Failed to delete permission', 'error')
            }
        } catch (error) {
            console.error('Failed to delete permission:', error)
            showToast('Failed to delete permission', 'error')
        }
    }

    function handleAddPermission() {
        setEditingPermission(null)
        setShowModal(true)
    }

    function handleEditPermission(permission: Permission) {
        setEditingPermission(permission)
        setShowModal(true)
    }

    function handleModalClose() {
        setShowModal(false)
        setEditingPermission(null)
    }

    function handleModalSave() {
        showToast(editingPermission ? 'Permission updated successfully' : 'Permission created successfully', 'success')
        loadPermissions()
    }

    function parseAccess(accessString: string) {
        try {
            const access = JSON.parse(accessString)
            return access.allowed ? 'Allow' : 'Deny'
        } catch {
            return 'Unknown'
        }
    }

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading permissions...</div>
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Permission Management</h2>
                <button
                    onClick={handleAddPermission}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    + Add Permission
                </button>
            </div>

            {/* Role Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Role
                </label>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="Admin">Admin</option>
                    <option value="Developer">Developer</option>
                    <option value="Viewer">Viewer</option>
                </select>
            </div>

            {/* Permissions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Path Pattern
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Access
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {permissions.map((permission) => (
                            <tr key={permission.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                    {permission.pathPattern}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${permission.method === 'GET' ? 'bg-green-100 text-green-800' :
                                            permission.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                                permission.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {permission.method}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${parseAccess(permission.access) === 'Allow'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {parseAccess(permission.access)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEditPermission(permission)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deletePermission(permission.id, permission.pathPattern)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {permissions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No permissions found for this role
                    </div>
                )}
            </div>

            {/* Permission Modal */}
            {showModal && (
                <PermissionModal
                    permission={editingPermission}
                    initialRole={selectedRole}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}
        </div>
    )
}
