import type { external } from '../src/generated/sovd'

type EntityCollection = 'Area' | 'Component' | 'App' | 'Function'

type Entity = { id: string; name: string; collection: EntityCollection }

const areas: Entity[] = [{ id: 'Body', name: 'Body', collection: 'Area' }, { id: 'Doors', name: 'Doors', collection: 'Area' }]
const components: Entity[] = [{ id: 'DrivingComputer', name: 'Driving Computer', collection: 'Component' }, { id: 'ComputeUnit', name: 'Compute Unit', collection: 'Component' }]
const apps: Entity[] = [{ id: 'WindowControl', name: 'Window Control', collection: 'App' }]
const functions: Entity[] = []

function getEntitiesByCollection(collection: EntityCollection) {
  if (collection === 'Area') return areas
  if (collection === 'Component') return components
  if (collection === 'App') return apps
  return functions
}

export function listEntities(collection: EntityCollection, origin: string) {
  const items = getEntitiesByCollection(collection).map(e => ({ id: e.id, name: e.name, href: `${origin}/v1/${collection}/${e.id}` }))
  return { items }
}

export function getEntity(collection: EntityCollection, id: string) {
  return getEntitiesByCollection(collection).find(e => e.id === id) || null
}

type ValueMetadata = external['commons/types.yaml']['components']['schemas']['ValueMetadata']

const valueMetadatas: Record<string, ValueMetadata[]> = {
  'App:WindowControl': [
    { id: 'DriverWindow', name: 'Position of driver window', category: 'currentData', groups: ['front'] },
    { id: 'PassengerWindow', name: 'Position of passenger window', category: 'currentData', groups: ['front'] },
    { id: 'RearWindows', name: 'Position of rear windows', category: 'currentData', groups: ['rear'] },
    { id: 'AppInfo', name: 'Window Control Version Numbers', category: 'identData' }
  ]
}

type ReadValue = external['commons/types.yaml']['components']['schemas']['ReadValue']
type DataValue = unknown

const values = new Map<string, DataValue>()

values.set('App:WindowControl:DriverWindow', { Position: 100 })
values.set('App:WindowControl:PassengerWindow', { Position: 100 })
values.set('App:WindowControl:RearWindows', { PositionLeft: 100, PositionRight: 0 })

function key(collection: EntityCollection, entityId: string, dataId: string) {
  return `${collection}:${entityId}:${dataId}`
}

export function listData(collection: EntityCollection, entityId: string) {
  const metas = valueMetadatas[`${collection}:${entityId}`] || []
  return { items: metas }
}

export function readData(collection: EntityCollection, entityId: string, dataId: string): ReadValue | null {
  const k = key(collection, entityId, dataId)
  const data = values.get(k) as ReadValue['data'] | undefined
  if (data === undefined) return null
  return { id: dataId, data }
}

export function writeData(collection: EntityCollection, entityId: string, dataId: string, data: any) {
  const k = key(collection, entityId, dataId)
  values.set(k, data as unknown)
  return { id: dataId, data }
}

type DataList = { ids: string[] }

const dataLists = new Map<string, DataList>()

function dlKey(collection: EntityCollection, entityId: string) {
  return `${collection}:${entityId}`
}

export function createDataList(collection: EntityCollection, entityId: string, ids: string[]) {
  const listId = Math.random().toString(36).slice(2)
  const base = dlKey(collection, entityId)
  dataLists.set(`${base}:${listId}`, { ids })
  return listId
}

export function getDataList(collection: EntityCollection, entityId: string, listId: string) {
  const dl = dataLists.get(`${dlKey(collection, entityId)}:${listId}`)
  if (!dl) return null
  const items = dl.ids.map(id => readData(collection, entityId, id)).filter(Boolean) as { id: string; data: any }[]
  return { items }
}

export function listSubareas(origin: string, areaId: string) {
  const items = areas.filter(a => a.id !== areaId && a.collection === 'Area').map(e => ({ id: e.id, name: e.name, href: `${origin}/v1/areas/${areaId}/subareas` }))
  return { items }
}

export function listSubcomponents(origin: string, componentId: string) {
  const items = components.filter(c => c.id !== componentId && c.collection === 'Component').map(e => ({ id: e.id, name: e.name, href: `${origin}/v1/components/${componentId}/subcomponents` }))
  return { items }
}

export function listRelatedComponents(origin: string, areaId: string) {
  const items = components.map(e => ({ id: e.id, name: e.name, href: `${origin}/v1/areas/${areaId}/related-components` }))
  return { items }
}

export function listRelatedApps(origin: string, componentId: string) {
  const items = apps.map(e => ({ id: e.id, name: e.name, href: `${origin}/v1/components/${componentId}/related-apps` }))
  return { items }
}

export function listDataCategories(collection: EntityCollection, entityId: string) {
  const metas = valueMetadatas[`${collection}:${entityId}`] || []
  const set = new Set(metas.map(m => m.category))
  return { items: Array.from(set) }
}

export function listDataGroups(collection: EntityCollection, entityId: string) {
  const metas = valueMetadatas[`${collection}:${entityId}`] || []
  const groups: { id: string; category: string }[] = []
  const seen = new Set<string>()
  for (const m of metas) {
    for (const g of m.groups || []) {
      const k = `${g}:${m.category}`
      if (seen.has(k)) continue
      seen.add(k)
      groups.push({ id: g, category: m.category })
    }
  }
  return { items: groups }
}

type LogEntry = external['logs/types.yaml']['components']['schemas']['LogEntry']

const logs = new Map<string, LogEntry[]>()

function nowRFC3339() {
  return new Date().toISOString()
}

logs.set('App:WindowControl', [
  { timestamp: nowRFC3339(), context: { type: 'RFC5424', host: 'Linux', process: 'systemd', pid: 1 }, severity: 'info', msg: 'WindowControl started' }
])

export function listLogEntries(collection: EntityCollection, entityId: string) {
  const arr = logs.get(`${collection}:${entityId}`) || []
  return { items: arr }
}

export function getLogConfig(collection: EntityCollection, entityId: string) {
  return { context: { type: 'RFC5424' }, severity: 'info' }
}

type Lock = { id: string; createdAt: string }

const locks = new Map<string, Lock[]>()

export function listLocks(collection: EntityCollection, entityId: string) {
  const arr = locks.get(`${collection}:${entityId}`) || []
  return { items: arr }
}

export function createLock(collection: EntityCollection, entityId: string) {
  const id = Math.random().toString(36).slice(2)
  const l: Lock = { id, createdAt: nowRFC3339() }
  const key = `${collection}:${entityId}`
  const arr = locks.get(key) || []
  arr.push(l)
  locks.set(key, arr)
  return l
}

export function releaseLock(collection: EntityCollection, entityId: string, lockId: string) {
  const key = `${collection}:${entityId}`
  const arr = locks.get(key) || []
  const next = arr.filter(l => l.id !== lockId)
  locks.set(key, next)
  return arr.length !== next.length
}

type Fault = { code: string; status: 'active' | 'confirmed' }

const faults = new Map<string, Fault[]>()

faults.set('App:WindowControl', [{ code: 'DTC-001', status: 'active' }])

export function listFaults(collection: EntityCollection, entityId: string) {
  const arr = faults.get(`${collection}:${entityId}`) || []
  return { items: arr }
}

export function readFault(collection: EntityCollection, entityId: string, code: string) {
  const arr = faults.get(`${collection}:${entityId}`) || []
  return arr.find(f => f.code === code) || null
}

export function confirmFault(collection: EntityCollection, entityId: string, code: string) {
  const arr = faults.get(`${collection}:${entityId}`) || []
  const f = arr.find(x => x.code === code)
  if (f) f.status = 'confirmed'
  return f || null
}

export function clearFault(collection: EntityCollection, entityId: string, code?: string) {
  const key = `${collection}:${entityId}`
  const arr = faults.get(key) || []
  if (code) {
    faults.set(key, arr.filter(f => f.code !== code))
  } else {
    faults.set(key, [])
  }
  return true
}

type Operation = { id: string; name: string }
type Execution = { id: string; status: 'queued' | 'running' | 'done'; startedAt: string; finishedAt?: string }

const operations = new Map<string, Operation[]>()
const executions = new Map<string, Execution[]>()

operations.set('App:WindowControl', [{ id: 'OpenDriverWindow', name: 'Open Driver Window' }])

export function listOperations(collection: EntityCollection, entityId: string) {
  const arr = operations.get(`${collection}:${entityId}`) || []
  return { items: arr }
}

export function getOperation(collection: EntityCollection, entityId: string, opId: string) {
  const arr = operations.get(`${collection}:${entityId}`) || []
  return arr.find(o => o.id === opId) || null
}

export function executeOperation(collection: EntityCollection, entityId: string, opId: string) {
  const ex: Execution = { id: Math.random().toString(36).slice(2), status: 'done', startedAt: nowRFC3339(), finishedAt: nowRFC3339() }
  const key = `${collection}:${entityId}:${opId}`
  const arr = executions.get(key) || []
  arr.push(ex)
  executions.set(key, arr)
  return ex
}

export function listExecutions(collection: EntityCollection, entityId: string, opId: string) {
  const key = `${collection}:${entityId}:${opId}`
  const arr = executions.get(key) || []
  return { items: arr }
}

export function getExecution(collection: EntityCollection, entityId: string, opId: string, execId: string) {
  const key = `${collection}:${entityId}:${opId}`
  const arr = executions.get(key) || []
  return arr.find(e => e.id === execId) || null
}

type Mode = { id: string; name: string }
const modes = new Map<string, Mode[]>()
modes.set('App:WindowControl', [{ id: 'Maintenance', name: 'Maintenance' }])

export function listModes(collection: EntityCollection, entityId: string) {
  const arr = modes.get(`${collection}:${entityId}`) || []
  return { items: arr }
}

export function getMode(collection: EntityCollection, entityId: string, modeId: string) {
  const arr = modes.get(`${collection}:${entityId}`) || []
  return arr.find(m => m.id === modeId) || null
}

type UpdateDetail = {
  id?: string
  update_name: string
  automated?: boolean
  origin?: string[]
  update_translation_id?: string
  notes?: string
  notes_translation_id?: string
  user_activity?: string
  user_activity_translation_id?: string
  preconditions?: string
  preconditions_transaltion_id?: string
  execution_conditions?: string
  duration?: number
  size: number
  updated_components?: string[]
  affected_components?: string[]
  schema?: Record<string, unknown>
}

type UpdateStatus = {
  phase: 'prepare' | 'execute'
  status: 'pending' | 'inProgress' | 'failed' | 'completed'
  progress?: number
  subprogress?: { entity: string; status: 'pending' | 'inProgress' | 'failed' | 'completed'; progress?: number; error?: any }[]
  step?: string
  step_translation_id?: string
  error?: any
}

const updatesByEntity = new Map<string, string[]>()
const updateDetails = new Map<string, UpdateDetail>()
const updateStatuses = new Map<string, UpdateStatus>()

function entityKey(collection: EntityCollection, entityId: string) {
  return `${collection}:${entityId}`
}

updatesByEntity.set('App:WindowControl', ['autonomous', 'ADAS-v2.03.2154'])
updateDetails.set('autonomous', { id: 'autonomous', update_name: 'Autonomous Driving Patch', size: 2048 })
updateDetails.set('ADAS-v2.03.2154', { id: 'ADAS-v2.03.2154', update_name: 'ADAS 2.03.2154', size: 8192 })
updateStatuses.set('autonomous', { phase: 'prepare', status: 'pending', progress: 0 })
updateStatuses.set('ADAS-v2.03.2154', { phase: 'prepare', status: 'pending', progress: 0 })

export function listAvailableUpdates(collection: EntityCollection, entityId: string) {
  const ids = updatesByEntity.get(entityKey(collection, entityId)) || []
  return { items: ids }
}

export function registerUpdate(id?: string) {
  const newId = id || Math.random().toString(36).slice(2)
  updateDetails.set(newId, { id: newId, update_name: newId, size: 1024 })
  updateStatuses.set(newId, { phase: 'prepare', status: 'pending', progress: 0 })
  const key = entityKey('App', 'WindowControl')
  const arr = updatesByEntity.get(key) || []
  if (!arr.includes(newId)) arr.push(newId)
  updatesByEntity.set(key, arr)
  return newId
}

export function getUpdateDetail(id: string) {
  return updateDetails.get(id) || null
}

export function getUpdateStatus(id: string) {
  return updateStatuses.get(id) || null
}

export function prepareUpdate(collection: EntityCollection, entityId: string, id: string) {
  const st = updateStatuses.get(id) || { phase: 'prepare', status: 'pending' }
  st.phase = 'prepare'
  st.status = 'inProgress'
  st.progress = 50
  updateStatuses.set(id, st)
  return st
}

export function executeUpdate(collection: EntityCollection, entityId: string, id: string) {
  const st = updateStatuses.get(id) || { phase: 'execute', status: 'pending' }
  st.phase = 'execute'
  st.status = 'inProgress'
  st.progress = 10
  updateStatuses.set(id, st)
  return st
}

export function automatedUpdate(collection: EntityCollection, entityId: string, id: string) {
  return executeUpdate(collection, entityId, id)
}

export function deleteUpdate(collection: EntityCollection, entityId: string, id: string) {
  const arr = updatesByEntity.get(entityKey(collection, entityId)) || []
  updatesByEntity.set(entityKey(collection, entityId), arr.filter(x => x !== id))
  updateDetails.delete(id)
  updateStatuses.delete(id)
  return true
}

type ConfigurationMetaData = { id: string; name: string; type: 'parameter' | 'bulk'; version?: string; content_type?: string }

const configurations = new Map<string, ConfigurationMetaData[]>()
const configurationValues = new Map<string, any>()

configurations.set(entityKey('App', 'WindowControl'), [
  { id: 'ALKConfig', name: 'Advanced Lane Keeping Config', type: 'parameter' },
  { id: 'ObjectRecognitionModel', name: 'Object Recognition Model', type: 'bulk', version: '1.45.2107', content_type: 'application/octet-stream' }
])

configurationValues.set(`${entityKey('App', 'WindowControl')}:ALKConfig`, {
  MaximumSpeed: 150,
  MinimumDistanceToLine: 15,
  EmergencyLaneDistanceToLine: 5
})

configurationValues.set(`${entityKey('App', 'WindowControl')}:ObjectRecognitionModel`, 'BINARY')

export function listConfigurations(collection: EntityCollection, entityId: string) {
  const items = configurations.get(entityKey(collection, entityId)) || []
  return { items }
}

export function readConfiguration(collection: EntityCollection, entityId: string, configId: string) {
  const key = `${entityKey(collection, entityId)}:${configId}`
  const val = configurationValues.get(key)
  if (val === undefined) return null
  return { id: configId, data: val }
}

export async function writeConfiguration(collection: EntityCollection, entityId: string, configId: string, contentType: string | null, raw: string) {
  const key = `${entityKey(collection, entityId)}:${configId}`
  if (contentType && contentType.includes('application/json')) {
    try {
      const obj = JSON.parse(raw)
      configurationValues.set(key, obj)
      return true
    } catch {
      return false
    }
  } else {
    configurationValues.set(key, raw)
    return true
  }
}

type BulkDataDescriptor = { id: string; mimetype: string; name?: string; size?: number }

const bulkCategories = new Map<string, string[]>()
const bulkDescriptors = new Map<string, BulkDataDescriptor[]>()
const bulkStorage = new Map<string, string>()

bulkCategories.set(entityKey('App', 'WindowControl'), ['maps', 'pois', 'logs'])
bulkDescriptors.set(`${entityKey('App', 'WindowControl')}:maps`, [
  { id: 'EU', name: 'OSM data for Europe', mimetype: 'application/vnd.osm+xml' },
  { id: 'US', name: 'OSM data for United States', mimetype: 'application/vnd.osm+xml' }
])
bulkDescriptors.set(`${entityKey('App', 'WindowControl')}:pois`, [
  { id: 'GasStations', name: 'Gas Stations', mimetype: 'application/octet-stream' }
])

export function listBulkDataCategories(collection: EntityCollection, entityId: string) {
  const items = bulkCategories.get(entityKey(collection, entityId)) || []
  return { items }
}

export function listBulkDataDescriptors(collection: EntityCollection, entityId: string, category: string) {
  const items = bulkDescriptors.get(`${entityKey(collection, entityId)}:${category}`) || []
  return { items }
}

export function uploadBulkData(collection: EntityCollection, entityId: string, category: string, id: string | null, content: string) {
  const assignedId = id || Math.random().toString(36).slice(2)
  const key = `${entityKey(collection, entityId)}:${category}`
  const arr = bulkDescriptors.get(key) || []
  arr.push({ id: assignedId, mimetype: 'application/octet-stream', size: content.length })
  bulkDescriptors.set(key, arr)
  bulkStorage.set(`${key}:${assignedId}`, content)
  return assignedId
}

export function downloadBulkData(collection: EntityCollection, entityId: string, category: string, bulkId: string) {
  const key = `${entityKey(collection, entityId)}:${category}:${bulkId}`
  const content = bulkStorage.get(key) || ''
  return content
}

export function deleteBulkDataCategory(collection: EntityCollection, entityId: string, category: string) {
  const key = `${entityKey(collection, entityId)}:${category}`
  const arr = bulkDescriptors.get(key) || []
  const deleted_ids = arr.map(d => d.id)
  bulkDescriptors.set(key, [])
  for (const id of deleted_ids) bulkStorage.delete(`${key}:${id}`)
  return { deleted_ids, errors: [] as { id: string; error: any }[] }
}

export function deleteBulkData(collection: EntityCollection, entityId: string, category: string, bulkId: string) {
  const key = `${entityKey(collection, entityId)}:${category}`
  const arr = bulkDescriptors.get(key) || []
  bulkDescriptors.set(key, arr.filter(d => d.id !== bulkId))
  bulkStorage.delete(`${key}:${bulkId}`)
  return true
}
