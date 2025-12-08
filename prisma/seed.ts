import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with ASAM SOVD v1.0 compliant data...')

  // Clear existing data in correct order
  await prisma.permission.deleteMany({})
  await prisma.updatePackage.deleteMany({})
  await prisma.configuration.deleteMany({})
  await prisma.mode.deleteMany({})
  await prisma.operationExecution.deleteMany({})
  await prisma.operation.deleteMany({})
  await prisma.logEntry.deleteMany({})
  await prisma.lock.deleteMany({})
  await prisma.fault.deleteMany({})
  await prisma.dataValue.deleteMany({})
  await prisma.sOVDEntity.deleteMany({})
  await prisma.user.deleteMany({})

  // Create users (matching login page demo credentials)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sovd.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'Admin'
    }
  })

  const devUser = await prisma.user.create({
    data: {
      email: 'dev@sovd.com',
      password: await bcrypt.hash('dev123', 10),
      role: 'Developer'
    }
  })

  const viewerUser = await prisma.user.create({
    data: {
      email: 'viewer@sovd.local',
      password: await bcrypt.hash('viewer123', 10),
      role: 'Viewer'
    }
  })

  console.log('✅ Created users')

  // ==================== COMPONENTS ====================
  const powertrainComp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'powertrain-control-unit',
      collection: 'Component',
      name: 'Powertrain Control Unit',
      type: 'ECU',
      description: 'Electronic control unit for engine and transmission management',
      metadata: JSON.stringify({
        manufacturer: 'Bosch',
        partNumber: 'PCU-2024-A',
        firmwareVersion: '3.2.1'
      })
    }
  })

  const adasComp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'adas-module',
      collection: 'Component',
      name: 'ADAS Module',
      type: 'ECU',
      description: 'Advanced Driver Assistance Systems control module',
      metadata: JSON.stringify({
        manufacturer: 'Continental',
        partNumber: 'ADAS-XR-500',
        features: ['ACC', 'LKA', 'AEB']
      })
    }
  })

  const infotainmentComp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'infotainment-head-unit',
      collection: 'Component',
      name: 'Infotainment Head Unit',
      type: 'HMI',
      description: 'Central infotainment and connectivity system',
      metadata: JSON.stringify({
        manufacturer: 'Harman',
        displaySize: '12.3 inch',
        osVersion: 'Android Auto 11.2'
      })
    }
  })

  const bcmComp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'body-control-module',
      collection: 'Component',
      name: 'Body Control Module',
      type: 'ECU',
      description: 'Central body electronics and comfort control',
      metadata: JSON.stringify({
        manufacturer: 'Valeo',
        partNumber: 'BCM-2024-X1'
      })
    }
  })

  console.log('✅ Created Components (4)')

  // ==================== APPS ====================
  const navigationApp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'navigation-app',
      collection: 'App',
      name: 'Navigation System',
      type: 'Application',
      description: 'GPS navigation and route guidance',
      metadata: JSON.stringify({
        version: '5.3.0',
        mapProvider: 'HERE Maps',
        lastUpdate: '2024-11-15'
      })
    }
  })

  const climateApp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'climate-control',
      collection: 'App',
      name: 'Climate Control',
      type: 'Application',
      description: 'HVAC and cabin temperature management',
      metadata: JSON.stringify({
        version: '2.1.4',
        zones: 2
      })
    }
  })

  const driverAssistApp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'driver-assistance',
      collection: 'App',
      name: 'Driver Assistance',
      type: 'Application',
      description: 'ADAS feature control and monitoring',
      metadata: JSON.stringify({
        version: '4.0.1',
        features: ['Lane Keep', 'Adaptive Cruise', 'Emergency Brake']
      })
    }
  })

  const mediaPlayerApp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'media-player',
      collection: 'App',
      name: 'Media Player',
      type: 'Application',
      description: 'Audio and video entertainment system',
      metadata: JSON.stringify({
        version: '3.2.0',
        supportedFormats: ['MP3', 'AAC', 'FLAC']
      })
    }
  })

  console.log('✅ Created Apps (4)')

  // ==================== FUNCTIONS ====================
  const absFunction = await prisma.sOVDEntity.create({
    data: {
      entityId: 'anti-lock-braking',
      collection: 'Function',
      name: 'Anti-lock Braking System',
      type: 'SafetyFunction',
      description: 'ABS braking control and wheel slip prevention',
      metadata: JSON.stringify({
        asil: 'D',
        standard: 'ISO 26262'
      })
    }
  })

  const cruiseFunction = await prisma.sOVDEntity.create({
    data: {
      entityId: 'adaptive-cruise-control',
      collection: 'Function',
      name: 'Adaptive Cruise Control',
      type: 'ComfortFunction',
      description: 'Automatic speed and distance control',
      metadata: JSON.stringify({
        maxSpeed: 180,
        minDistance: 1.5
      })
    }
  })

  const laneKeepFunction = await prisma.sOVDEntity.create({
    data: {
      entityId: 'lane-keeping-assist',
      collection: 'Function',
      name: 'Lane Keeping Assist',
      type: 'SafetyFunction',
      description: 'Lane departure warning and correction',
      metadata: JSON.stringify({
        asil: 'B',
        cameraType: 'Stereo'
      })
    }
  })

  console.log('✅ Created Functions (3)')

  // ==================== AREAS ====================
  const centralArea = await prisma.sOVDEntity.create({
    data: {
      entityId: 'central-gateway',
      collection: 'Area',
      name: 'Central Gateway',
      type: 'NetworkZone',
      description: 'Central vehicle network gateway and routing',
      metadata: JSON.stringify({
        networkProtocol: 'CAN-FD',
        bandwidth: '5 Mbps'
      })
    }
  })

  const frontLeftArea = await prisma.sOVDEntity.create({
    data: {
      entityId: 'front-left',
      collection: 'Area',
      name: 'Front Left Zone',
      type: 'PhysicalZone',
      description: 'Front left vehicle area sensors and actuators',
      metadata: JSON.stringify({
        sensors: ['ultrasonic', 'radar'],
        actuators: ['door-lock', 'window-motor']
      })
    }
  })

  console.log('✅ Created Areas (2)')

  // ==================== DATA VALUES ====================
  // Powertrain data
  await prisma.dataValue.create({
    data: {
      entityId: powertrainComp.id,
      dataId: 'engine-speed',
      value: JSON.stringify({ current: 2400, unit: 'rpm', min: 0, max: 7000 }),
      timestamp: new Date('2025-12-06T13:00:00+08:00'),
      category: 'currentData'
    }
  })

  await prisma.dataValue.create({
    data: {
      entityId: powertrainComp.id,
      dataId: 'coolant-temperature',
      value: JSON.stringify({ current: 92, unit: '°C', threshold: 105, status: 'normal' }),
      timestamp: new Date('2025-12-06T13:00:05+08:00'),
      category: 'currentData'
    }
  })

  await prisma.dataValue.create({
    data: {
      entityId: powertrainComp.id,
      dataId: 'fuel-pressure',
      value: JSON.stringify({ current: 320, unit: 'bar', min: 280, max: 350 }),
      timestamp: new Date('2025-12-06T13:00:10+08:00'),
      category: 'currentData'
    }
  })

  // ADAS data
  await prisma.dataValue.create({
    data: {
      entityId: adasComp.id,
      dataId: 'radar-distance',
      value: JSON.stringify({ front: 45.5, unit: 'm', targetDetected: true }),
      timestamp: new Date('2025-12-06T13:00:15+08:00'),
      category: 'currentData'
    }
  })

  await prisma.dataValue.create({
    data: {
      entityId: adasComp.id,
      dataId: 'lane-position',
      value: JSON.stringify({ offset: -0.12, unit: 'm', laneWidth: 3.5 }),
      timestamp: new Date('2025-12-06T13:00:20+08:00'),
      category: 'currentData'
    }
  })

  console.log('✅ Created Data Values (5)')

  // ==================== FAULTS ====================
  // Powertrain Component Faults
  await prisma.fault.create({
    data: {
      entityId: powertrainComp.id,
      code: 'P0301',
      title: 'Cylinder 1 Misfire Detected',
      description: 'Engine cylinder 1 misfire has been detected multiple times',
      status: 'active',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T12:45:23+08:00',
        responseCode: 200,
        responseMessage: 'Fault detected and logged',
        stationInfo: 'ECU-PCU-01',
        mileage: 45230
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: powertrainComp.id,
      code: 'P0128',
      title: 'Coolant Thermostat Temperature Below Regulating Temperature',
      description: 'Engine coolant is not reaching proper operating temperature',
      status: 'active',
      severity: 'minor',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T10:22:15+08:00',
        responseCode: 200,
        responseMessage: 'Thermostat may be stuck open',
        stationInfo: 'ECU-PCU-01',
        actualTemp: 75,
        expectedTemp: 92
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: powertrainComp.id,
      code: 'P0171',
      title: 'System Too Lean (Bank 1)',
      description: 'Fuel trim too lean detected on engine bank 1',
      status: 'confirmed',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-05T16:30:42+08:00',
        responseCode: 200,
        responseMessage: 'Check for vacuum leaks or fuel pressure',
        stationInfo: 'ECU-PCU-01',
        fuelTrim: 25.5
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: powertrainComp.id,
      code: 'P0420',
      title: 'Catalyst System Efficiency Below Threshold (Bank 1)',
      description: 'Catalytic converter efficiency is below acceptable level',
      status: 'confirmed',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-04T14:18:30+08:00',
        responseCode: 200,
        responseMessage: 'Catalyst replacement may be required',
        stationInfo: 'ECU-PCU-01',
        efficiency: 68
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: powertrainComp.id,
      code: 'P0562',
      title: 'System Voltage Low',
      description: 'Charging system voltage is below normal operating range',
      status: 'active',
      severity: 'critical',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T13:10:05+08:00',
        responseCode: 200,
        responseMessage: 'Check alternator and battery',
        stationInfo: 'ECU-PCU-01',
        voltage: 11.2,
        normalRange: '13.5-14.5V'
      })
    }
  })

  // ADAS Component Faults
  await prisma.fault.create({
    data: {
      entityId: adasComp.id,
      code: 'U0126',
      title: 'Lost Communication With Steering Angle Sensor',
      description: 'CAN communication timeout with steering angle sensor module',
      status: 'active',
      severity: 'critical',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T11:20:15+08:00',
        responseCode: 200,
        responseMessage: 'Communication timeout',
        stationInfo: 'ECU-ADAS-01',
        canBus: 'CAN-FD',
        lastMessage: '11:19:58'
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: adasComp.id,
      code: 'C1234',
      title: 'Front Radar Sensor Blocked',
      description: 'Forward collision warning radar sensor obstruction detected',
      status: 'active',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T09:45:12+08:00',
        responseCode: 200,
        responseMessage: 'Clean sensor or check for physical damage',
        stationInfo: 'ECU-ADAS-01',
        sensorLocation: 'front-bumper-center'
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: adasComp.id,
      code: 'C1456',
      title: 'Lane Keep Camera Alignment Error',
      description: 'Lane keeping assist camera calibration out of specification',
      status: 'confirmed',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-05T11:30:20+08:00',
        responseCode: 200,
        responseMessage: 'Recalibration required',
        stationInfo: 'ECU-ADAS-01',
        alignmentOffset: 2.3,
        threshold: 1.5
      })
    }
  })

  // BCM Faults
  await prisma.fault.create({
    data: {
      entityId: bcmComp.id,
      code: 'B1318',
      title: 'Battery Voltage Low',
      description: 'Vehicle battery voltage below minimum threshold',
      status: 'active',
      severity: 'minor',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T10:05:42+08:00',
        responseCode: 200,
        responseMessage: 'Voltage below threshold',
        stationInfo: 'BCM-01',
        voltage: 11.8,
        threshold: 12.0
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: bcmComp.id,
      code: 'B1601',
      title: 'Ignition Key In Warning',
      description: 'Key detected in ignition with driver door open',
      status: 'resolved',
      severity: 'informational',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T08:15:30+08:00',
        responseCode: 200,
        responseMessage: 'Driver removed key',
        stationInfo: 'BCM-01',
        doorStatus: 'open'
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: bcmComp.id,
      code: 'B2141',
      title: 'Driver Door Ajar Signal Circuit Failure',
      description: 'Door ajar sensor signal incorrect or intermittent',
      status: 'active',
      severity: 'minor',
      metadata: JSON.stringify({
        timestamp: '2025-12-05T18:42:10+08:00',
        responseCode: 200,
        responseMessage: 'Check door switch and wiring',
        stationInfo: 'BCM-01',
        affectedDoor: 'driver-front'
      })
    }
  })

  // Infotainment Component Faults
  await prisma.fault.create({
    data: {
      entityId: infotainmentComp.id,
      code: 'U0100',
      title: 'Lost Communication With ECU/PCM',
      description: 'Communication lost with powertrain control module',
      status: 'active',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T12:05:18+08:00',
        responseCode: 200,
        responseMessage: 'CAN bus communication error',
        stationInfo: 'IHU-01',
        targetModule: 'PCU'
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: infotainmentComp.id,
      code: 'U0140',
      title: 'Lost Communication With Body Control Module',
      description: 'Intermittent communication with BCM detected',
      status: 'confirmed',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T11:52:45+08:00',
        responseCode: 200,
        responseMessage: 'Check CAN bus integrity',
        stationInfo: 'IHU-01',
        targetModule: 'BCM',
        packetLoss: 15.3
      })
    }
  })

  await prisma.fault.create({
    data: {
      entityId: infotainmentComp.id,
      code: 'B1425',
      title: 'GPS Antenna Circuit Open',
      description: 'GPS antenna connection failure or antenna malfunction',
      status: 'active',
      severity: 'minor',
      metadata: JSON.stringify({
        timestamp: '2025-12-05T09:20:33+08:00',
        responseCode: 200,
        responseMessage: 'Check antenna cable and connections',
        stationInfo: 'IHU-01',
        signalStrength: 0
      })
    }
  })

  // Navigation App Faults
  await prisma.fault.create({
    data: {
      entityId: navigationApp.id,
      code: 'A0001',
      title: 'Map Database Corruption',
      description: 'Navigation map data integrity check failed',
      status: 'active',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T07:30:12+08:00',
        responseCode: 500,
        responseMessage: 'Map database update required',
        stationInfo: 'NAV-APP-01',
        corruptedRegions: ['SEA', 'EUR']
      })
    }
  })

  // Climate Control App Faults
  await prisma.fault.create({
    data: {
      entityId: climateApp.id,
      code: 'A0102',
      title: 'Cabin Temperature Sensor Malfunction',
      description: 'Invalid temperature reading from cabin sensor',
      status: 'active',
      severity: 'minor',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T08:45:20+08:00',
        responseCode: 200,
        responseMessage: 'Sensor reading out of range',
        stationInfo: 'HVAC-01',
        sensorValue: -40,
        validRange: '-20 to 60°C'
      })
    }
  })

  // Driver Assistance App Faults
  await prisma.fault.create({
    data: {
      entityId: driverAssistApp.id,
      code: 'A0203',
      title: 'Adaptive Cruise Control Temporarily Unavailable',
      description: 'ACC system disabled due to sensor fault',
      status: 'active',
      severity: 'major',
      metadata: JSON.stringify({
        timestamp: '2025-12-06T10:15:44+08:00',
        responseCode: 503,
        responseMessage: 'Radar sensor fault detected',
        stationInfo: 'DA-APP-01',
        relatedDTC: 'C1234'
      })
    }
  })

  console.log('✅ Created Faults (18)')

  // ==================== OPERATIONS ====================
  const resetDtcOp = await prisma.operation.create({
    data: {
      entityId: powertrainComp.id,
      operationId: 'reset-dtc',
      name: 'Reset Diagnostic Trouble Codes',
      description: 'Clear all diagnostic trouble codes from ECU memory',
      parameters: JSON.stringify({
        scopeParameter: 'powertrain',
        confirm: false
      }),
      status: 'available'
    }
  })

  await prisma.operation.create({
    data: {
      entityId: adasComp.id,
      operationId: 'calibrate-radar',
      name: 'Calibrate Radar Sensor',
      description: 'Perform dynamic radar sensor calibration procedure',
      parameters: JSON.stringify({
        scopeParameter: 'front-radar',
        mode: 'dynamic'
      }),
      status: 'available'
    }
  })

  console.log('✅ Created Operations (2)')

  // ==================== LOGS ====================
  await prisma.logEntry.create({
    data: {
      entityId: navigationApp.id,
      severity: 'info',
      message: 'Route calculation completed',
      category: 'operation',
      timestamp: new Date('2025-12-06T13:00:30+08:00'),
      metadata: JSON.stringify({
        stationInfo: { id: 'IHU-01', location: 'Infotainment' },
        distance: 45.3,
        duration: 35
      })
    }
  })

  await prisma.logEntry.create({
    data: {
      entityId: powertrainComp.id,
      severity: 'warning',
      message: 'Engine temperature approaching limit',
      category: 'data',
      timestamp: new Date('2025-12-06T12:58:12+08:00'),
      metadata: JSON.stringify({
        stationInfo: { id: 'PCU-01', location: 'Engine Bay' },
        temperature: 102,
        threshold: 105
      })
    }
  })

  await prisma.logEntry.create({
    data: {
      entityId: adasComp.id,
      severity: 'error',
      message: 'Sensor calibration failed',
      category: 'fault',
      timestamp: new Date('2025-12-06T11:22:45+08:00'),
      metadata: JSON.stringify({
        stationInfo: { id: 'ADAS-01', location: 'Front Bumper' },
        sensor: 'radar-front',
        errorCode: 'CAL_TIMEOUT'
      })
    }
  })

  console.log('✅ Created Log Entries (3)')

  // ==================== PERMISSIONS ====================
  // Create comprehensive RBAC permissions
  const permissions = [
    // Admin - full access
    { role: 'Admin', pathPattern: '/v1/*', method: 'GET', access: JSON.stringify({ allowed: true }) },
    { role: 'Admin', pathPattern: '/v1/*', method: 'POST', access: JSON.stringify({ allowed: true }) },
    { role: 'Admin', pathPattern: '/v1/*', method: 'PUT', access: JSON.stringify({ allowed: true }) },
    { role: 'Admin', pathPattern: '/v1/*', method: 'DELETE', access: JSON.stringify({ allowed: true }) },

    // Developer - read/write but no delete
    { role: 'Developer', pathPattern: '/v1/*', method: 'GET', access: JSON.stringify({ allowed: true }) },
    { role: 'Developer', pathPattern: '/v1/*', method: 'POST', access: JSON.stringify({ allowed: true }) },
    { role: 'Developer', pathPattern: '/v1/*', method: 'PUT', access: JSON.stringify({ allowed: true }) },
    { role: 'Developer', pathPattern: '/v1/*', method: 'DELETE', access: JSON.stringify({ allowed: false }) },

    // Viewer - read only
    { role: 'Viewer', pathPattern: '/v1/*', method: 'GET', access: JSON.stringify({ allowed: true }) },
    { role: 'Viewer', pathPattern: '/v1/*', method: 'POST', access: JSON.stringify({ allowed: false }) },
    { role: 'Viewer', pathPattern: '/v1/*', method: 'PUT', access: JSON.stringify({ allowed: false }) },
    { role: 'Viewer', pathPattern: '/v1/*', method: 'DELETE', access: JSON.stringify({ allowed: false }) }
  ]

  for (const perm of permissions) {
    await prisma.permission.create({ data: perm })
  }

  console.log('✅ Created Permissions (12)')

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log('  - Components: 4 (Powertrain, ADAS, Infotainment, BCM)')
  console.log('  - Apps: 4 (Navigation, Climate, Driver Assist, Media)')
  console.log('  - Functions: 3 (ABS, ACC, Lane Keep)')
  console.log('  - Areas: 2 (Central Gateway, Front Left)')
  console.log('  - Data Values: 5')
  console.log('  - Faults: 18 (P-codes, U-codes, B-codes, C-codes, A-codes)')
  console.log('  - Operations: 2')
  console.log('  - Log Entries: 3')
  console.log('  - Permissions: 12')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
