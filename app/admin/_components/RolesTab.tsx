'use client'

export default function RolesTab() {
    const roles = [
        {
            name: 'Admin',
            icon: '👑',
            description: 'Full system access',
            capabilities: [
                'Can manage users and permissions',
                'All CRUD operations allowed',
                'Access to admin panel',
                'Can view audit logs'
            ],
            color: 'red'
        },
        {
            name: 'Developer',
            icon: '🔧',
            description: 'Read/Write access to SOVD resources',
            capabilities: [
                'Can view and modify SOVD entities',
                'Can execute operations', 'Can view diagnostics and logs',
                'Cannot delete or manage users'
            ],
            color: 'blue'
        },
        {
            name: 'Viewer',
            icon: '👁️',
            description: 'Read-only access',
            capabilities: [
                'Can view data but cannot modify',
                'Can browse SOVD tree',
                'Can view diagnostics',
                'No access to admin features'
            ],
            color: 'gray'
        }
    ]

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Roles & Capabilities</h2>

            <div className="space-y-6">
                {roles.map((role) => (
                    <div key={role.name} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">{role.icon}</span>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                                    <p className="text-sm text-gray-600">{role.description}</p>
                                </div>
                            </div>
                            <a
                                href={`/admin?tab=permissions&role=${role.name}`}
                                className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                            >
                                Edit Permissions
                            </a>
                        </div>

                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Capabilities:</h4>
                            <ul className="space-y-2">
                                {role.capabilities.map((capability, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span className="text-sm text-gray-600">{capability}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> These are the built-in system roles. Use the Permissions tab to customize access control for each role.
                </p>
            </div>
        </div>
    )
}
