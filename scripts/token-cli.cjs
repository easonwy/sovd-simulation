#!/usr/bin/env node

const { program } = require('commander')
const chalk = require('chalk')
const Table = require('cli-table3')

/**
 * SOVD Token Management Tool
 * Used to generate, verify, and parse JWT tokens
 * Note: This is a standalone CLI tool that requires manual key initialization
 */

// 简单的JWT解析函数（不验证签名）
function parseJWT(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    // 解码payload（第二部分）
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8')
    return JSON.parse(payloadJson)
  } catch (error) {
    return null
  }
}

// Format time
function formatTime(timestamp) {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// Format permission list
function formatPermissions(permissions) {
  if (!permissions || permissions.length === 0) return 'No permissions'
  if (permissions.includes('*')) return chalk.green('All permissions')
  
  const table = new Table({
    head: [chalk.cyan('Permissions')],
    style: { head: [], border: [] }
  })
  
  permissions.forEach(perm => {
    table.push([perm])
  })
  
  return table.toString()
}

// 生成Token命令
program
  .command('generate')
  .alias('gen')
  .description('Generate new JWT token (demo)')
  .option('-r, --role <role>', 'User role', 'Viewer')
  .option('-e, --email <email>', 'User email', 'user@example.com')
  .option('-u, --user-id <userId>', 'User ID', 'user123')
  .option('-o, --oid <oid>', 'Organization ID', 'default')
  .option('-s, --scope <scope>', 'Scope', 'api:access')
  .option('-c, --client-id <clientId>', 'Client ID', 'sovd-cli')
  .option('-t, --expires-in <expiresIn>', 'Expiration time', '24h')
  .option('-p, --permissions <permissions>', 'Permission list (comma-separated)', '')
  .action(async (options) => {
    console.log(chalk.blue('🔑 Generating demo JWT token...'))
    console.log(chalk.yellow('Note: This is a demo token, signature not verified'))
    
    try {
      // Parse permission list
      const permissions = options.permissions 
        ? options.permissions.split(',').map(p => p.trim()).filter(p => p)
        : getDefaultPermissions(options.role)
      
      // 构建payload
      const now = Math.floor(Date.now() / 1000)
      const expiresIn = parseExpiresIn(options.expiresIn)
      
      const payload = {
        userId: options.userId,
        email: options.email,
        role: options.role,
        oid: options.oid,
        permissions,
        scope: options.scope,
        clientId: options.clientId,
        jti: generateJTI(),
        iat: now,
        exp: now + expiresIn
      }
      
      // 生成模拟Token（实际应该使用JWT库签名）
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
      const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const signature = 'simulated_signature' // 模拟签名
      
      const token = `${header}.${payloadStr}.${signature}`
      
      console.log(chalk.green('✅ Demo token generated successfully!'))
      console.log('')
      console.log(chalk.yellow('Token:'))
      console.log(chalk.white(token))
      console.log('')
      
      // 显示Token详细信息
      const table = new Table({
        head: [chalk.cyan('Property'), chalk.cyan('Value')],
        colWidths: [20, 60]
      })
      
      table.push(
        ['User ID', payload.userId],
        ['Email', payload.email],
        ['Role', chalk.green(payload.role)],
        ['Organization ID', payload.oid],
        ['Scope', payload.scope],
        ['Client ID', payload.clientId || 'N/A'],
        ['JWT ID', payload.jti],
        ['Issue time', formatTime(payload.iat)],
        ['Expiration time', formatTime(payload.exp)],
        ['Permission count', payload.permissions.length.toString()]
      )
      
      console.log(table.toString())
      console.log('')
      console.log(chalk.cyan('Permission list:'))
      console.log(formatPermissions(payload.permissions))
      
    } catch (error) {
      console.error(chalk.red('❌ Token generation failed:'), error.message)
      process.exit(1)
    }
  })

// 解析Token命令
program
  .command('parse')
  .description('Parse JWT token (without signature verification)')
  .argument('<token>', 'JWT token to parse')
  .action(async (token) => {
    try {
      console.log(chalk.blue('🔍 Parsing JWT token...'))
      
      const payload = parseJWT(token)
      
      if (!payload) {
        console.log(chalk.red('❌ Invalid token format'))
        return
      }
      
      console.log(chalk.green('✅ Token parsing successful!'))
      console.log('')
      
      const table = new Table({
        head: [chalk.cyan('Property'), chalk.cyan('Value')],
        colWidths: [20, 60]
      })
      
      table.push(
        ['User ID', payload.userId || 'N/A'],
        ['Email', payload.email || 'N/A'],
        ['Role', chalk.green(payload.role || 'N/A')],
        ['Organization ID', payload.oid || 'N/A'],
        ['Scope', payload.scope || 'N/A'],
        ['JWT ID', payload.jti || 'N/A'],
        ['Issue time', formatTime(payload.iat)],
        ['Expiration time', formatTime(payload.exp)],
        ['Permission count', payload.permissions ? payload.permissions.length.toString() : '0']
      )
      
      console.log(table.toString())
      console.log('')
      
      if (payload.permissions && payload.permissions.length > 0) {
        console.log(chalk.cyan('Permission list:'))
        console.log(formatPermissions(payload.permissions))
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Token parsing failed:'), error.message)
      process.exit(1)
    }
  })

// 检查权限命令
program
  .command('check')
  .description('Check if token has specified permission (demo)')
  .argument('<token>', 'JWT Token')
  .argument('<method>', 'HTTP method (GET, POST, PUT, DELETE)')
  .argument('<path>', 'API path')
  .action(async (token, method, path) => {
    try {
      console.log(chalk.blue('🔍 Checking permissions...'))
      
      const payload = parseJWT(token)
      if (!payload) {
        console.log(chalk.red('❌ Invalid token format'))
        return
      }
      
      const requestedPermission = `${method}:${path}`
      const hasPermission = checkPermissions(payload.permissions || [], requestedPermission)
      
      console.log(chalk.cyan('Requested permission:'), requestedPermission)
      console.log(chalk.cyan('User role:'), chalk.green(payload.role || 'N/A'))
      console.log(chalk.cyan('User permission count:'), payload.permissions ? payload.permissions.length : 0)
      console.log('')
      
      if (hasPermission) {
        console.log(chalk.green('✅ Access granted'))
      } else {
        console.log(chalk.red('❌ Access denied'))
        console.log('')
        console.log(chalk.yellow('Suggestions:'))
        console.log('1. Check if user role is correct')
        console.log('2. Contact administrator to request required permissions')
        console.log('3. Regenerate token with higher privilege role')
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Permission check failed:'), error.message)
      process.exit(1)
    }
  })

// 帮助命令
program
  .command('help')
  .description('Show help information')
  .action(() => {
    console.log('')
    console.log(chalk.cyan('🛡️  SOVD Token Management Tool'))
    console.log(chalk.yellow('Demo version - for testing token structure and permissions'))
    console.log('')
    console.log(chalk.yellow('Common commands:'))
    console.log('  generate, gen    Generate demo JWT token')
    console.log('  parse            Parse JWT token (without signature verification)')
    console.log('  check            Check token permissions (demo)')
    console.log('')
    console.log(chalk.yellow('Examples:'))
    console.log(chalk.gray('  # Generate demo token'))
    console.log('  sovd-token generate --role Admin --email admin@sovd.com')
    console.log('')
    console.log(chalk.gray('  # Parse token'))
    console.log('  sovd-token parse <token>')
    console.log('')
    console.log(chalk.gray('  # Check permissions'))
    console.log('  sovd-token check <token> POST /v1/App')
    console.log('')
    console.log(chalk.red('Note: This tool is for demo only, generated tokens have no actual signature verification'))
    console.log('')
  })

// 辅助函数
function getDefaultPermissions(role) {
  const permissions = {
    'Viewer': [
      'GET:/v1/App',
      'GET:/v1/App/*/data',
      'GET:/v1/App/*/faults'
    ],
    'Developer': [
      'GET:/v1/App',
      'POST:/v1/App',
      'GET:/v1/App/*/data',
      'POST:/v1/App/*/data',
      'PUT:/v1/App/*/data',
      'GET:/v1/App/*/faults',
      'POST:/v1/App/*/faults',
      'DELETE:/v1/App/*/faults',
      'GET:/v1/App/*/lock'
    ],
    'Admin': ['*']
  }
  
  return permissions[role] || []
}

function checkPermissions(userPermissions, requestedPermission) {
  if (!userPermissions) return false
  if (userPermissions.includes('*')) {
    return true
  }
  
  if (userPermissions.includes(requestedPermission)) {
    return true
  }
  
  // 检查通配符匹配
  for (const permission of userPermissions) {
    if (permission.includes('*')) {
      const pattern = permission.replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)
      if (regex.test(requestedPermission)) {
        return true
      }
    }
  }
  
  return false
}

function generateJTI() {
  // 简单的ID生成
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

function parseExpiresIn(expiresIn) {
  if (typeof expiresIn === 'number') {
    return expiresIn
  }
  
  const match = expiresIn.match(/^(\d+)([smhd])$/)
  if (!match) {
    throw new Error(`Invalid expiresIn format: ${expiresIn}`)
  }
  
  const value = parseInt(match[1], 10)
  const unit = match[2]
  
  const multipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  }
  
  return value * multipliers[unit]
}

// 配置程序信息
program
  .name('sovd-token')
  .description('SOVD Token管理工具 - 生成、验证、解析JWT Token（演示版）')
  .version('1.0.0')
  .showHelpAfterError()

// 如果没有提供命令，显示帮助
if (process.argv.length === 2) {
  program.help()
}

// 解析命令行参数
program.parse()