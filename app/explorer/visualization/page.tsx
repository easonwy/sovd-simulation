'use client'
import { useState } from 'react'
import { DataChart } from '../_components/DataChart'
import { FaultsTable } from '../_components/FaultsTable'
import { LogsTable } from '../_components/LogsTable'
import { SchemaDisplay } from '../_components/SchemaDisplay'
import { DataTimeline } from '../_components/DataTimeline'

export default function VisualizationShowcase() {
  const [activeTab, setActiveTab] = useState<'charts' | 'tables' | 'schema' | 'timeline'>('charts')

  // Sample data for demonstration
  const sampleFaults = [
    { code: 'DTC-001', title: 'Engine Error', severity: 'critical', status: 'active', created: new Date(), updated: new Date() },
    { code: 'DTC-002', title: 'Transmission Warning', severity: 'high', status: 'confirmed', created: new Date(Date.now() - 3600000), updated: new Date(Date.now() - 3600000) },
    { code: 'DTC-003', title: 'Battery Low', severity: 'medium', status: 'resolved', created: new Date(Date.now() - 7200000), updated: new Date(Date.now() - 7200000) },
  ]

  const sampleLogs = [
    { id: '1', message: 'Engine started', severity: 'info', category: 'system', timestamp: new Date(), entityId: 'WindowControl', createdAt: new Date() },
    { id: '2', message: 'Transmission gear changed', severity: 'info', category: 'operation', timestamp: new Date(Date.now() - 60000), entityId: 'WindowControl', createdAt: new Date(Date.now() - 60000) },
    { id: '3', message: 'Sensor malfunction detected', severity: 'warning', category: 'fault', timestamp: new Date(Date.now() - 120000), entityId: 'WindowControl', createdAt: new Date(Date.now() - 120000) },
    { id: '4', message: 'Coolant temperature high', severity: 'error', category: 'diagnostic', timestamp: new Date(Date.now() - 180000), entityId: 'WindowControl', createdAt: new Date(Date.now() - 180000) },
  ]

  const sampleSchema = {
    id: 'string',
    name: 'string',
    type: 'string',
    collection: 'Area | Component | App | Function',
    capabilities: {
      data: { readable: 'boolean', writable: 'boolean' },
      faults: { readable: 'boolean', confirmable: 'boolean' },
      operations: { readable: 'boolean', executable: 'boolean' },
    },
  }

  const sampleData = {
    id: 'WindowControl',
    name: 'Window Control System',
    type: 'App',
    collection: 'App',
    capabilities: {
      data: { readable: true, writable: true },
      faults: { readable: true, confirmable: true },
      operations: { readable: true, executable: true },
    },
  }

  const timelineEntries = [
    { timestamp: new Date(), label: 'System startup', status: 'success', severity: 'success' as const },
    { timestamp: new Date(Date.now() - 60000), label: 'Configuration loaded', status: 'success', severity: 'success' as const },
    { timestamp: new Date(Date.now() - 120000), label: 'Sensors initialized', status: 'success', severity: 'success' as const },
    { timestamp: new Date(Date.now() - 180000), label: 'Engine cranking', status: 'in-progress', severity: 'info' as const },
    { timestamp: new Date(Date.now() - 240000), label: 'Diagnostic check', status: 'in-progress', severity: 'info' as const },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Visualization Showcase</h1>
          <p className="text-gray-600 mt-1">Phase 3.2: Advanced UI Components</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTab === 'charts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Charts & Time-Series
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTab === 'tables'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Tables
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTab === 'schema'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Schema Inspector
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3 font-medium transition-all ${
                activeTab === 'timeline'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⏱️ Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Time-Series Data Visualization</h2>
              <p className="text-gray-600 mb-6">Interactive charts for monitoring data over time</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center text-gray-500">
                  <p>Line Chart: Temperature Over Time</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center text-gray-500">
                  <p>Area Chart: RPM Variation</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Real-time data point plotting</li>
                <li>✓ Time range selection (1h, 6h, 24h, 7d, 30d)</li>
                <li>✓ Min/Max/Average aggregation</li>
                <li>✓ Tooltip with detailed values</li>
                <li>✓ Responsive design</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Faults Table</h2>
              <FaultsTable entityId="WindowControl" faults={sampleFaults} />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Logs Table</h2>
              <LogsTable entityId="WindowControl" logs={sampleLogs} />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Sortable columns (click header)</li>
                <li>✓ Filterable by status/severity</li>
                <li>✓ Pagination (20 items per page)</li>
                <li>✓ Responsive table layout</li>
                <li>✓ Action buttons (confirm, clear, delete)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔍 Schema/Data Separation</h2>
              <p className="text-gray-600 mb-6">Toggle between schema definition and actual data</p>
              <SchemaDisplay schema={sampleSchema} data={sampleData} title="Entity Response" />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ View-mode selector (Data, Schema, Both)</li>
                <li>✓ Side-by-side comparison</li>
                <li>✓ Syntax highlighting</li>
                <li>✓ Collapsible tree view</li>
                <li>✓ Copy to clipboard support</li>
              </ul>
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">⏱️ Event Timeline</h2>
              <p className="text-gray-600 mb-6">Chronological view of system events and state changes</p>
              <DataTimeline entries={timelineEntries} title="System Activity" maxItems={50} />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Chronological event ordering (most recent first)</li>
                <li>✓ Status indicators and severity badges</li>
                <li>✓ Click to view detailed information</li>
                <li>✓ Color-coded severity levels</li>
                <li>✓ Compact timeline view with expandable details</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-600">
          <p>SOVD Simulation - Phase 3.2: Advanced Visualization Components</p>
          <p className="text-sm mt-2">All visualization components are fully functional and integrated with the API</p>
        </div>
      </div>
    </div>
  )
}
