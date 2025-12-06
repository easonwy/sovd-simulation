import '@testing-library/jest-dom'
import { prisma } from '../lib/prisma'

// Setup and teardown
beforeAll(async () => {
  // Ensure database is ready
  await prisma.$connect()
})

afterAll(async () => {
  // Close database connection
  await prisma.$disconnect()
})

// Reset database before each test
beforeEach(async () => {
  // Delete all records in order to respect foreign keys
  await prisma.auditLog.deleteMany({})
  await prisma.dataSnapshot.deleteMany({})
  await prisma.operationExecution.deleteMany({})
  await prisma.permission.deleteMany({})
  await prisma.updatePackage.deleteMany({})
  await prisma.configuration.deleteMany({})
  await prisma.mode.deleteMany({})
  await prisma.operation.deleteMany({})
  await prisma.logEntry.deleteMany({})
  await prisma.lock.deleteMany({})
  await prisma.fault.deleteMany({})
  await prisma.dataValue.deleteMany({})
  await prisma.sOVDEntity.deleteMany({})
  await prisma.user.deleteMany({})
})
