import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with SOVD entities...')

  // Clear existing data
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
      password: 'admin123', // In production, use hashed passwords
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

  console.log('✅ Created users:')
  console.log(`  - Admin: ${adminUser.email}`)
  console.log(`  - Developer: ${devUser.email}`)
  console.log(`  - Viewer: ${viewerUser.email}`)

  // Create SOVD Entities
  const windowControlApp = await prisma.sOVDEntity.create({
    data: {
      entityId: 'WindowControl',
      collection: 'App',
      name: 'Window Control Application',
      metadata: JSON.stringify({
        version: '1.0.0',
        description: 'Controls vehicle windows'
      })
    }
  })

  const bodyArea = await prisma.sOVDEntity.create({
    data: {
      entityId: 'Body',
      collection: 'Area',
      name: 'Vehicle Body',
      metadata: JSON.stringify({
        description: 'Main vehicle body area'
      })
    }
  })

  const drivingComponent = await prisma.sOVDEntity.create({
    data: {
      entityId: 'DrivingComputer',
      collection: 'Component',
      name: 'Driving Computer',
      metadata: JSON.stringify({
        version: '2.1.0',
        description: 'Main driving control unit'
      })
    }
  })

  console.log('✅ Created SOVD Entities:')
  console.log(`  - ${windowControlApp.name} (App)`)
  console.log(`  - ${bodyArea.name} (Area)`)
  console.log(`  - ${drivingComponent.name} (Component)`)

  // Create Data Values for WindowControl
  await prisma.dataValue.create({
    data: {
      entityId: windowControlApp.id,
      dataId: 'DriverWindow',
      value: JSON.stringify({ Position: 100 }),
      category: 'currentData',
      groups: JSON.stringify(['front'])
    }
  })

  await prisma.dataValue.create({
    data: {
      entityId: windowControlApp.id,
      dataId: 'PassengerWindow',
      value: JSON.stringify({ Position: 100 }),
      category: 'currentData',
      groups: JSON.stringify(['front'])
    }
  })

  await prisma.dataValue.create({
    data: {
      entityId: windowControlApp.id,
      dataId: 'RearWindows',
      value: JSON.stringify({ PositionLeft: 100, PositionRight: 0 }),
      category: 'currentData',
      groups: JSON.stringify(['rear'])
    }
  })

  console.log('✅ Created data values for WindowControl')

  // Create a Fault
  await prisma.fault.create({
    data: {
      entityId: windowControlApp.id,
      code: 'DTC-001',
      status: 'active',
      severity: 'warning'
    }
  })

  console.log('✅ Created fault DTC-001')

  // Create an Operation
  const restartOp = await prisma.operation.create({
    data: {
      entityId: drivingComponent.id,
      operationId: 'restart',
      name: 'Restart Component',
      metadata: JSON.stringify({
        description: 'Restarts the driving computer',
        estimatedDuration: 5000
      })
    }
  })

  // Create an Operation Execution
  await prisma.operationExecution.create({
    data: {
      operationId: restartOp.id,
      status: 'completed',
      result: JSON.stringify({ message: 'Component restarted successfully' })
    }
  })

  console.log('✅ Created operation: restart')

  // Create a Mode
  await prisma.mode.create({
    data: {
      entityId: drivingComponent.id,
      modeId: 'test-mode',
      name: 'Test Mode',
      metadata: JSON.stringify({
        description: 'Special mode for testing'
      })
    }
  })

  console.log('✅ Created mode: test-mode')

  // Create Permissions for RBAC
  const permissions = [
    // Viewer permissions - read only
    { role: 'Viewer', pathPattern: '/v1/*/*', method: 'GET', canRead: true },
    { role: 'Viewer', pathPattern: '/v1/*/*/data', method: 'GET', canRead: true },
    { role: 'Viewer', pathPattern: '/v1/*/*/data/*', method: 'GET', canRead: true },
    { role: 'Viewer', pathPattern: '/v1/*/*/faults', method: 'GET', canRead: true },

    // Developer permissions - read/write operations
    { role: 'Developer', pathPattern: '/v1/*/*', method: 'GET', canRead: true },
    { role: 'Developer', pathPattern: '/v1/*/*/data', method: 'GET', canRead: true },
    { role: 'Developer', pathPattern: '/v1/*/*/data/*', method: 'GET', canRead: true },
    { role: 'Developer', pathPattern: '/v1/*/*/data/*', method: 'POST', canWrite: true },
    { role: 'Developer', pathPattern: '/v1/*/*/faults', method: 'GET', canRead: true },
    { role: 'Developer', pathPattern: '/v1/*/*/faults/*', method: 'POST', canWrite: true },
    { role: 'Developer', pathPattern: '/v1/*/*/faults/*', method: 'DELETE', canDelete: true },
    { role: 'Developer', pathPattern: '/v1/*/*/operations/*', method: 'POST', canWrite: true },

    // Admin permissions - full access
    { role: 'Admin', pathPattern: '/v1/*/*', method: 'GET', canRead: true },
    { role: 'Admin', pathPattern: '/v1/*/*', method: 'POST', canWrite: true },
    { role: 'Admin', pathPattern: '/v1/*/*', method: 'PUT', canWrite: true },
    { role: 'Admin', pathPattern: '/v1/*/*', method: 'DELETE', canDelete: true },
    { role: 'Admin', pathPattern: '/admin/*', method: 'GET', canRead: true },
    { role: 'Admin', pathPattern: '/admin/*', method: 'POST', canWrite: true },
    { role: 'Admin', pathPattern: '/admin/*', method: 'DELETE', canDelete: true }
  ]

  for (const perm of permissions) {
    await prisma.permission.create({ data: perm })
  }

  console.log('✅ Created RBAC permissions')

  console.log('🎉 Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
