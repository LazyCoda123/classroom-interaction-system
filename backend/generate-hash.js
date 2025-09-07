// backend/generate-hash.js - 生成正确的密码hash
const bcrypt = require('bcryptjs');

async function generateAndTestHash() {
  console.log('🔐 生成和测试密码hash');
  console.log('=========================');
  
  const password = 'secret';
  
  try {
    // 生成新的hash
    console.log('🔧 正在生成新的hash...');
    const newHash = await bcrypt.hash(password, 10);
    console.log('✅ 新hash生成成功:');
    console.log(newHash);
    
    // 立即验证新hash
    console.log('\n🧪 验证新hash...');
    const isValid = await bcrypt.compare(password, newHash);
    console.log('验证结果:', isValid ? '✅ 正确' : '❌ 错误');
    
    // 测试现有的错误hash
    console.log('\n🔍 测试现有hash...');
    const existingHash = '$2b$10$C7xnJRyPLZSCW0BO7jf8WOxKyprOVmdQKyFdjZfE1/rQYYn.aVWCC';
    const existingResult = await bcrypt.compare(password, existingHash);
    console.log('现有hash验证结果:', existingResult ? '✅ 正确' : '❌ 错误');
    
    // 生成SQL更新语句
    console.log('\n📝 SQL更新语句:');
    console.log(`UPDATE users SET password = '${newHash}' WHERE role IN ('student', 'teacher');`);
    
    // 生成多个hash供选择
    console.log('\n🎲 生成5个不同的hash供选择:');
    for (let i = 1; i <= 5; i++) {
      const hash = await bcrypt.hash(password, 10);
      const test = await bcrypt.compare(password, hash);
      console.log(`${i}. ${hash} (验证: ${test ? '✅' : '❌'})`);
    }
    
  } catch (error) {
    console.error('💥 生成hash失败:', error);
  }
}

generateAndTestHash();