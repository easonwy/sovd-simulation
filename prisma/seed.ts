import { PrismaClient } from '@prisma/client'

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

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sovd.local',
      password: 'admin123',
      role: 'Admin'
    }
  })

  const devUser = await prisma.user.create({
    data: {
      email: 'developer@sovd.local',
      password: 'dev123',
      role: 'Developer'
    }
  })

  const viewerUser = await prisma.user.create({
    data: {
      email: 'viewer@sovd.local',
      password: 'viewer123',
      role: 'Viewer'
    }
  })

  console.log('✅ Created users')

  // ==================== COMPONENTS ====================
  const powertrainComp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'pcu',
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
      entityId: 'am',
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
      entityId: 'ihu',
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
      entityId: 'bcm',
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
      entityId: 'na',
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
      entityId: 'cc',
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
      entityId: 'da',
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
      entityId: 'mp',
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
      entityId: 'alb',
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
      entityId: 'acc',
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
      entityId: 'lka',
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
      entityId: 'cg',
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
      entityId: 'fl',
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
        stationInfo: 'ECU-PCU-01'
      })
    }
  })

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
        stationInfo: 'ECU-ADAS-01'
      })
    }
  })

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
        stationInfo: 'BCM-01'
      })
    }
  })

  console.log('✅ Created Faults (3)')

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
  console.log('  - Faults: 3 (P0301, U0126, B1318)')
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
