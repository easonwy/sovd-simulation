export type Role = 'Viewer' | 'Developer' | 'Admin'

export function isAllowed(role: Role | undefined, method: string, path: string) {
  if (!role) return false
  if (role === 'Admin') return true
  if (role === 'Viewer') return method === 'GET'
  if (role === 'Developer') {
    if (method === 'PUT') return true
    if (path.includes('/locks')) {
      if (method === 'GET') return true
      return false
    }
    if (method === 'GET' || method === 'POST') return true
    if (method === 'DELETE') return path.includes('/faults')
    return false
  }
  return false
}
