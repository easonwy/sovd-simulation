
/**
 * Check permission list (Pure function, safe for Edge Runtime)
 */
export function checkPermissions(userPermissions: string[], method: string, path: string): boolean {
    // Check for wildcard permissions
    if (userPermissions.includes('*')) {
        return true;
    }

    // Build the requested permission string
    const requestedPermission = `${method}:${path}`;

    // Check for exact match
    if (userPermissions.includes(requestedPermission)) {
        return true;
    }

    // Check for wildcard match
    for (const permission of userPermissions) {
        if (permission.includes('*')) {
            const pattern = permission.replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`);
            if (regex.test(requestedPermission)) {
                return true;
            }
        }
    }

    return false;
}
