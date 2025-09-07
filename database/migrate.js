// database/migrate.js - 数据库迁移管理器（修复版）
const path = require('path');

// 动态添加backend的node_modules到模块搜索路径
const backendPath = path.resolve(__dirname, '../backend');
const backendNodeModules = path.join(backendPath, 'node_modules');
require('module').globalPaths.push(backendNodeModules);

const mysql = require('mysql2/promise');
const fs = require('fs').promises;

// 配置信息
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'classroom_system',
  charset: 'utf8mb4'
};

/**
 * 创建迁移记录表
 */
async function createMigrationsTable() {
  const connection = await mysql.createConnection(config);
  
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  
  await connection.end();
}

/**
 * 获取已执行的迁移
 */
async function getExecutedMigrations() {
  const connection = await mysql.createConnection(config);
  
  try {
    const [rows] = await connection.execute('SELECT filename FROM migrations ORDER BY id');
    return rows.map(row => row.filename);
  } catch (error) {
    // 如果表不存在，返回空数组
    return [];
  } finally {
    await connection.end();
  }
}

/**
 * 记录迁移执行
 */
async function recordMigration(filename) {
  const connection = await mysql.createConnection(config);
  
  await connection.execute(
    'INSERT INTO migrations (filename) VALUES (?)',
    [filename]
  );
  
  await connection.end();
}

/**
 * 删除迁移记录
 */
async function removeMigrationRecord(filename) {
  const connection = await mysql.createConnection(config);
  
  await connection.execute(
    'DELETE FROM migrations WHERE filename = ?',
    [filename]
  );
  
  await connection.end();
}

/**
 * 获取所有迁移文件
 */
async function getAllMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    const files = await fs.readdir(migrationsDir);
    return files
      .filter(file => file.endsWith('.js'))
      .sort();
  } catch (error) {
    console.log('⚠️  migrations文件夹不存在或为空');
    return [];
  }
}

/**
 * 执行向上迁移
 */
async function migrateUp() {
  console.log('⬆️  执行数据库迁移...');
  
  await createMigrationsTable();
  
  const allMigrations = await getAllMigrations();
  const executedMigrations = await getExecutedMigrations();
  
  const pendingMigrations = allMigrations.filter(
    migration => !executedMigrations.includes(migration)
  );
  
  if (pendingMigrations.length === 0) {
    console.log('✅ 没有待执行的迁移');
    return;
  }
  
  console.log(`📋 发现 ${pendingMigrations.length} 个待执行的迁移:`);
  
  for (const migration of pendingMigrations) {
    console.log(`  🔄 执行: ${migration}`);
    
    try {
      const migrationPath = path.join(__dirname, 'migrations', migration);
      const migrationModule = require(migrationPath);
      
      if (typeof migrationModule.up === 'function') {
        await migrationModule.up();
        await recordMigration(migration);
        console.log(`  ✅ 完成: ${migration}`);
      } else {
        console.log(`  ⚠️  跳过: ${migration} (没有up函数)`);
      }
    } catch (error) {
      console.error(`  ❌ 失败: ${migration}`, error.message);
      break;
    }
  }
  
  console.log('🎉 迁移执行完成');
}

/**
 * 执行向下迁移
 */
async function migrateDown() {
  console.log('⬇️  回滚数据库迁移...');
  
  const executedMigrations = await getExecutedMigrations();
  
  if (executedMigrations.length === 0) {
    console.log('✅ 没有可回滚的迁移');
    return;
  }
  
  // 获取最后执行的迁移
  const lastMigration = executedMigrations[executedMigrations.length - 1];
  console.log(`🔄 回滚: ${lastMigration}`);
  
  try {
    const migrationPath = path.join(__dirname, 'migrations', lastMigration);
    const migrationModule = require(migrationPath);
    
    if (typeof migrationModule.down === 'function') {
      await migrationModule.down();
      await removeMigrationRecord(lastMigration);
      console.log(`✅ 回滚完成: ${lastMigration}`);
    } else {
      console.log(`⚠️  无法回滚: ${lastMigration} (没有down函数)`);
    }
  } catch (error) {
    console.error(`❌ 回滚失败: ${lastMigration}`, error.message);
  }
}

/**
 * 查看迁移状态
 */
async function migrateStatus() {
  console.log('📊 迁移状态');
  console.log('='.repeat(30));
  
  const allMigrations = await getAllMigrations();
  const executedMigrations = await getExecutedMigrations();
  
  if (allMigrations.length === 0) {
    console.log('⚠️  没有找到迁移文件');
    return;
  }
  
  console.log('📋 迁移文件状态:');
  
  for (const migration of allMigrations) {
    const status = executedMigrations.includes(migration) ? '✅ 已执行' : '⏳ 待执行';
    console.log(`  ${status} ${migration}`);
  }
  
  console.log('');
  console.log(`📈 统计: ${executedMigrations.length}/${allMigrations.length} 已执行`);
}

/**
 * 重置所有迁移
 */
async function migrateReset() {
  console.log('🗑️  重置所有迁移...');
  
  const connection = await mysql.createConnection(config);
  
  try {
    await connection.execute('DELETE FROM migrations');
    console.log('✅ 迁移记录已清空');
  } catch (error) {
    console.log('⚠️  无法清空迁移记录:', error.message);
  } finally {
    await connection.end();
  }
}

/**
 * 主函数
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      await migrateUp();
      break;
    case 'down':
      await migrateDown();
      break;
    case 'status':
      await migrateStatus();
      break;
    case 'reset':
      await migrateReset();
      break;
    default:
      console.log('🗂️  数据库迁移工具');
      console.log('='.repeat(20));
      console.log('可用命令:');
      console.log('  up       - 执行待处理的迁移');
      console.log('  down     - 回滚最后一个迁移');
      console.log('  status   - 查看迁移状态');
      console.log('  reset    - 重置迁移记录');
      break;
  }
}

module.exports = {
  migrateUp,
  migrateDown,
  migrateStatus,
  migrateReset
};

// 如果直接执行该文件
if (require.main === module) {
  main().catch(console.error);
}