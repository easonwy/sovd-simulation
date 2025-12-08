#!/usr/bin/env node

const { program } = require('commander')
const chalk = require('chalk')
const Table = require('cli-table3')
const { enhancedJWT, parseEnhancedToken } = require('../lib/enhanced-jwt')
const { keyManager } = require('../lib/key-manager')

/**
 * SOVD Token管理工具
 * 用于生成、验证、解析JWT Token
 */

// 初始化密钥管理器
async function initializeKeys() {
  try {
    await keyManager.preloadAllKeys()
    console.log(chalk.green('✅ 密钥加载成功'))
  } catch (error) {
    console.error(chalk.red('❌ 密钥加载失败:'), error.message)
    process.exit(1)
  }
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// 格式化权限列表
function formatPermissions(permissions) {
  if (!permissions || permissions.length === 0) return '无权限'
  if (permissions.includes('*')) return chalk.green('全部权限')
  
  const table = new Table({
    head: [chalk.cyan('权限')],
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
  .description('生成新的JWT Token')
  .option('-r, --role <role>', '用户角色', 'Viewer')
  .option('-e, --email <email>', '用户邮箱', 'user@example.com')
  .option('-u, --user-id <userId>', '用户ID', 'user123')
  .option('-o, --oid <oid>', '组织ID', 'default')
  .option('-s, --scope <scope>', '作用域', 'api:access')
  .option('-c, --client-id <clientId>', '客户端ID', 'sovd-cli')
  .option('-t, --expires-in <expiresIn>', '过期时间', '24h')
  .option('-p, --permissions <permissions>', '权限列表（逗号分隔）', '')
  .action(async (options) => {
    await initializeKeys()
    
    try {
      console.log(chalk.blue('🔑 生成新的JWT Token...'))
      
      // 解析权限列表
      const permissions = options.permissions 
        ? options.permissions.split(',').map(p => p.trim()).filter(p => p)
        : getDefaultPermissions(options.role)
      
      const tokenResult = await enhancedJWT.generateToken({
        userId: options.userId,
        email: options.email,
        role: options.role,
        oid: options.oid,
        permissions,
        scope: options.scope,
        clientId: options.clientId
      }, {
        expiresIn: options.expiresIn,
        issuer: 'sovd-token-cli',
        audience: 'sovd-api'
      })
      
      console.log(chalk.green('✅ Token生成成功！'))
      console.log('')
      console.log(chalk.yellow('Token:'))
      console.log(chalk.white(tokenResult.token))
      console.log('')
      
      // 显示Token详细信息
      const table = new Table({
        head: [chalk.cyan('属性'), chalk.cyan('值')],
        colWidths: [20, 60]
      })
      
      table.push(
        ['用户ID', tokenResult.payload.userId],
        ['邮箱', tokenResult.payload.email],
        ['角色', chalk.green(tokenResult.payload.role)],
        ['组织ID', tokenResult.payload.oid],
        ['作用域', tokenResult.payload.scope],
        ['客户端ID', tokenResult.payload.clientId || 'N/A'],
        ['JWT ID', tokenResult.payload.jti],
        ['签发时间', formatTime(tokenResult.payload.iat)],
        ['过期时间', formatTime(tokenResult.payload.exp)],
        ['权限数量', tokenResult.payload.permissions.length.toString()]
      )
      
      console.log(table.toString())
      console.log('')
      console.log(chalk.cyan('权限列表:'))
      console.log(formatPermissions(tokenResult.payload.permissions))
      
    } catch (error) {
      console.error(chalk.red('❌ Token生成失败:'), error.message)
      process.exit(1)
    }
  })

// 验证Token命令
program
  .command('verify')
  .description('验证JWT Token')
  .argument('<token>', '要验证的JWT Token')
  .action(async (token) => {
    await initializeKeys()
    
    try {
      console.log(chalk.blue('🔍 验证JWT Token...'))
      
      const result = await enhancedJWT.verifyToken(token)
      
      if (result.valid) {
        console.log(chalk.green('✅ Token验证成功！'))
        console.log('')
        
        if (result.payload) {
          const table = new Table({
            head: [chalk.cyan('属性'), chalk.cyan('值')],
            colWidths: [20, 60]
          })
          
          table.push(
            ['用户ID', result.payload.userId],
            ['邮箱', result.payload.email],
            ['角色', chalk.green(result.payload.role)],
            ['组织ID', result.payload.oid],
            ['作用域', result.payload.scope],
            ['JWT ID', result.payload.jti],
            ['签发时间', formatTime(result.payload.iat)],
            ['过期时间', formatTime(result.payload.exp)],
            ['权限数量', result.payload.permissions.length.toString()]
          )
          
          console.log(table.toString())
          console.log('')
          console.log(chalk.cyan('权限列表:'))
          console.log(formatPermissions(result.payload.permissions))
        }
      } else {
        console.log(chalk.red('❌ Token验证失败！'))
        console.log(chalk.red(`错误: ${result.error}`))
        console.log(chalk.red(`错误代码: ${result.code}`))
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Token验证失败:'), error.message)
      process.exit(1)
    }
  })

// 解析Token命令
program
  .command('parse')
  .description('解析JWT Token（不验证签名）')
  .argument('<token>', '要解析的JWT Token')
  .action(async (token) => {
    try {
      console.log(chalk.blue('🔍 解析JWT Token...'))
      
      const payload = parseEnhancedToken(token)
      
      if (!payload) {
        console.log(chalk.red('❌ Token格式无效'))
        return
      }
      
      console.log(chalk.green('✅ Token解析成功！'))
      console.log('')
      
      const table = new Table({
        head: [chalk.cyan('属性'), chalk.cyan('值')],
        colWidths: [20, 60]
      })
      
      table.push(
        ['用户ID', payload.userId],
        ['邮箱', payload.email],
        ['角色', chalk.green(payload.role)],
        ['组织ID', payload.oid],
        ['作用域', payload.scope],
        ['JWT ID', payload.jti],
        ['签发时间', formatTime(payload.iat)],
        ['过期时间', formatTime(payload.exp)],
        ['权限数量', payload.permissions.length.toString()]
      )
      
      console.log(table.toString())
      console.log('')
      console.log(chalk.cyan('权限列表:'))
      console.log(formatPermissions(payload.permissions))
      
    } catch (error) {
      console.error(chalk.red('❌ Token解析失败:'), error.message)
      process.exit(1)
    }
  })

// 刷新Token命令
program
  .command('refresh')
  .description('刷新JWT Token')
  .argument('<token>', '要刷新的JWT Token')
  .option('-t, --expires-in <expiresIn>', '新的过期时间', '24h')
  .action(async (token, options) => {
    await initializeKeys()
    
    try {
      console.log(chalk.blue('🔄 刷新JWT Token...'))
      
      const result = await enhancedJWT.refreshToken(token, {
        expiresIn: options.expiresIn
      })
      
      console.log(chalk.green('✅ Token刷新成功！'))
      console.log('')
      console.log(chalk.yellow('新Token:'))
      console.log(chalk.white(result.token))
      console.log('')
      console.log(chalk.cyan('新过期时间:'), formatTime(result.payload.exp))
      
    } catch (error) {
      console.error(chalk.red('❌ Token刷新失败:'), error.message)
      process.exit(1)
    }
  })

// 检查权限命令
program
  .command('check')
  .description('检查Token是否有指定权限')
  .argument('<token>', 'JWT Token')
  .argument('<method>', 'HTTP方法 (GET, POST, PUT, DELETE)')
  .argument('<path>', 'API路径')
  .action(async (token, method, path) => {
    try {
      console.log(chalk.blue('🔍 检查权限...'))
      
      const payload = parseEnhancedToken(token)
      if (!payload) {
        console.log(chalk.red('❌ Token格式无效'))
        return
      }
      
      const requestedPermission = `${method}:${path}`
      const hasPermission = checkPermissions(payload.permissions, requestedPermission)
      
      console.log(chalk.cyan('请求权限:'), requestedPermission)
      console.log(chalk.cyan('用户角色:'), chalk.green(payload.role))
      console.log(chalk.cyan('用户权限数量:'), payload.permissions.length)
      console.log('')
      
      if (hasPermission) {
        console.log(chalk.green('✅ 有权限访问'))
      } else {
        console.log(chalk.red('❌ 无权限访问'))
        console.log('')
        console.log(chalk.yellow('建议:'))
        console.log('1. 检查用户角色是否正确')
        console.log('2. 联系管理员申请所需权限')
        console.log('3. 使用更高权限的角色重新生成Token')
      }
      
    } catch (error) {
      console.error(chalk.red('❌ 权限检查失败:'), error.message)
      process.exit(1)
    }
  })

// 帮助命令
program
  .command('help')
  .description('显示帮助信息')
  .action(() => {
    console.log('')
    console.log(chalk.cyan('🛡️  SOVD Token管理工具'))
    console.log('')
    console.log(chalk.yellow('常用命令:'))
    console.log('  generate, gen    生成新的JWT Token')
    console.log('  verify           验证JWT Token')
    console.log('  parse            解析JWT Token（不验证签名）')
    console.log('  refresh          刷新JWT Token')
    console.log('  check            检查Token权限')
    console.log('')
    console.log(chalk.yellow('示例:'))
    console.log(chalk.gray('  # 生成管理员Token'))
    console.log('  sovd-token generate --role Admin --email admin@sovd.com')
    console.log('')
    console.log(chalk.gray('  # 验证Token'))
    console.log('  sovd-token verify <token>')
    console.log('')
    console.log(chalk.gray('  # 检查权限'))
    console.log('  sovd-token check <token> POST /v1/App')
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

// 配置程序信息
program
  .name('sovd-token')
  .description('SOVD Token管理工具 - 生成、验证、解析JWT Token')
  .version('1.0.0')
  .showHelpAfterError()

// 如果没有提供命令，显示帮助
if (process.argv.length === 2) {
  program.help()
}

// 解析命令行参数
program.parse()