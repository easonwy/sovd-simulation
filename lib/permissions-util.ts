
/**
 * Check permission list (Pure function, safe for Edge Runtime)
 */
export function checkPermissions(
    allow: string[],
    method: string,
    path: string,
    deny?: string[],
    defaultPolicy: 'allow' | 'deny' = 'deny'
): boolean {
    const candidates = buildRequestedCandidates(method, path)

    if (Array.isArray(deny) && deny.length > 0) {
        if (deny.includes('*')) {
            return false
        }
        // exact matches across variants
        if (candidates.some(c => deny.includes(c))) {
            return false
        }
        // wildcard matches across variants and normalized patterns
        for (const p of deny) {
            if (p.includes('*')) {
                const patterns = buildPatternVariants(p)
                const regexes = patterns.map(toRegex)
                if (regexes.some(rx => candidates.some(c => rx.test(c)))) {
                    return false
                }
            }
        }
    }

    if (allow.includes('*')) {
        return true
    }
    if (candidates.some(c => allow.includes(c))) {
        return true
    }
    for (const p of allow) {
        if (p.includes('*')) {
            const patterns = buildPatternVariants(p)
            const regexes = patterns.map(toRegex)
            if (regexes.some(rx => candidates.some(c => rx.test(c)))) {
                return true
            }
        }
    }

    return defaultPolicy === 'allow'
}

function buildRequestedCandidates(method: string, path: string): string[] {
    const r1 = `${method}:${path}`
    const r2 = `${method}:${path.replace(/^\/sovd\/v1/, '/v1')}`
    const r3 = `${method}:${path.replace(/^\/v1/, '/sovd/v1')}`
    return Array.from(new Set([r1, r2, r3]))
}

function buildPatternVariants(pattern: string): string[] {
    const p1 = pattern
    const p2 = pattern.replace(/^([A-Z]+):\/sovd\/v1/, (m, g1) => `${g1}:/v1`)
    const p3 = pattern.replace(/^([A-Z]+):\/v1/, (m, g1) => `${g1}:/sovd/v1`)
    return Array.from(new Set([p1, p2, p3]))
}

function toRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|\[\]\\]/g, '\\$&').replace(/\*/g, '.*')
    return new RegExp(`^${escaped}$`)
}
