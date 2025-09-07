// backend/test-db.js
const db = require('./config/database');

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1');
    console.log('✅ 数据库连接成功：', rows);
  } catch (err) {
    console.error('❌ 数据库连接失败：', err.message);
  }
}

testConnection();
