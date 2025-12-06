'use client'
import { useState, useEffect } from 'react'
import UserModal from './UserModal'
import { showToast } from './ToastContainer'

interface User {
    id: string
    email: string
    role: string
    createdAt: string
}

export default function UsersTab() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    async function loadUsers() {
        try {
            const token = localStorage.getItem('sovd.token')
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setUsers(data.users || [])
        } catch (error) {
            console.error('Failed to load users:', error)
            showToast('Failed to load users', 'error')
        } finally {
            setLoading(false)
        }
    }

    async function deleteUser(id: string, email: string) {
        if (!confirm(`Are you sure you want to delete user "${email}"?`)) return

        try {
            const token = localStorage.getItem('sovd.token')
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                showToast('User deleted successfully', 'success')
                loadUsers()
            } else {
                showToast('Failed to delete user', 'error')
            }
        } catch (error) {
            console.error('Failed to delete user:', error)
            showToast('Failed to delete user', 'error')
        }
    }

    function handleAddUser() {
        setEditingUser(null)
        setShowModal(true)
    }

    function handleEditUser(user: User) {
        setEditingUser(user)
        setShowModal(true)
    }

    function handleModalClose() {
        setShowModal(false)
        setEditingUser(null)
    }

    function handleModalSave() {
        showToast(editingUser ? 'User updated successfully' : 'User created successfully', 'success')
        loadUsers()
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        return matchesSearch && matchesRole
    })

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading users...</div>
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <button
                    onClick={handleAddUser}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    + Add User
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Developer">Developer</option>
                    <option value="Viewer">Viewer</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                                        user.role === 'Developer' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEditUser(user)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteUser(user.id, user.email)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No users found
                    </div>
                )}
            </div>

            {/* User Modal */}
            {showModal && (
                <UserModal
                    user={editingUser}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}
        </div>
    )
}
