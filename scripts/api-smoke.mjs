const BASE = process.env.BASE_URL || 'http://localhost:3000'

async function getToken(role = 'Developer') {
  const res = await fetch(`${BASE}/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', role })
  })
  if (!res.ok) throw new Error(`token failed: ${res.status}`)
  const json = await res.json()
  return json.access_token
}

async function get(path, token) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

async function post(path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

async function main() {
  const token = await getToken('Developer')
  const apps = await get('/v1/App', token)
  if (!apps.items || !Array.isArray(apps.items)) throw new Error('apps.items missing')
  const windowDataList = await get('/v1/App/WindowControl/data', token)
  if (!windowDataList.items || windowDataList.items.length === 0) throw new Error('data items missing')
  await get('/v1/App/WindowControl/data/RearWindows', token)
  const updated = await post('/v1/App/WindowControl/data/RearWindows', token, { data: { PositionLeft: 10, PositionRight: 20 } })
  if (!updated.data || updated.data.PositionLeft !== 10) throw new Error('write did not apply')
  const after = await get('/v1/App/WindowControl/data/RearWindows', token)
  if (after.data.PositionLeft !== 10 || after.data.PositionRight !== 20) throw new Error('read after write mismatch')
  const faults = await get('/v1/App/WindowControl/faults', token)
  if (!faults.items) throw new Error('faults items missing')
  const ops = await get('/v1/App/WindowControl/operations', token)
  if (!ops.items || ops.items.length === 0) throw new Error('operations items missing')
  console.log('API smoke tests passed')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
