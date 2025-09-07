// test-password.js - 测试密码验证
const bcrypt = require('bcryptjs');

async function testPasswordVerification() {
    console.log('🔐 测试密码验证');
    console.log('=================');
    
    const testPassword = 'secret';
    const dbHash = '$2b$10$EixZaYVK1fsbw1ZfKPKtueRbNGF9cEo.POz2cX1RPXL6HoQGHnJO.';
    
    try {
        // 测试1: 直接验证
        console.log('📝 测试数据:');
        console.log('  输入密码:', testPassword);
        console.log('  数据库hash:', dbHash);
        console.log('');
        
        const isValid = await bcrypt.compare(testPassword, dbHash);
        console.log('✅ bcrypt.compare 结果:', isValid);
        
        // 测试2: 生成新的hash进行对比
        console.log('\n🔄 生成新hash进行对比:');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('  新生成的hash:', newHash);
        
        const newValidation = await bcrypt.compare(testPassword, newHash);
        console.log('  新hash验证结果:', newValidation);
        
        // 测试3: 测试常见密码
        console.log('\n🔍 测试其他可能的密码:');
        const possiblePasswords = ['secret', 'teacher001', '123456', 'password', 'admin'];
        
        for (const pwd of possiblePasswords) {
            const result = await bcrypt.compare(pwd, dbHash);
            console.log(`  "${pwd}" -> ${result}`);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 运行测试
testPasswordVerification();