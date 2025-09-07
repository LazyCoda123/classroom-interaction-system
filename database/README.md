# 数据库管理系统

这是课堂互动系统的数据库管理工具，解决了密码哈希不匹配的问题，提供了完整的数据库初始化和管理功能。

## 🚀 快速开始

### 1. 环境配置

确保你的环境变量或使用默认配置：

```bash
# 环境变量（可选）
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=classroom_system
```

### 2. 一键初始化

```bash
# 完整初始化数据库（推荐）
npm run setup

# 或者使用原始命令
npm run db:init
```

### 3. 验证安装

```bash
# 测试数据库连接
npm run db:test

# 查看数据库状态
npm run db:status
```

## 📋 默认账号信息

初始化完成后，你可以使用以下账号登录：

### 教师账号
- **学号**: `teacher001`
- **密码**: `secret`
- **角色**: 教师

### 学生账号
- **学号**: `2024001` - `2024030`
- **密码**: `secret`
- **角色**: 学生

## 🛠 数据库命令

### 初始化命令

```bash
# 初始化数据库（如果数据已存在会跳过）
npm run db:init

# 重置并初始化数据库（清空所有数据重新开始）
npm run db:reset

# 快捷命令
npm run setup        # 等同于 db:init
npm run setup:clean  # 等同于 db:reset
```

### 迁移命令

```bash
# 执行所有待执行的迁移
npm run db:migrate

# 回滚最后一个迁移
npm run db:migrate:down

# 查看迁移状态
npm run db:migrate:status

# 重置所有迁移（危险操作）
npm run db:migrate:reset
```

### 数据管理命令

```bash
# 只插入种子数据（表结构必须已存在）
npm run db:seed

# 清空所有数据
npm run db:clear

# 检查数据库状态
npm run db:status

# 测试数据库连接
npm run db:test

# 修复密码哈希问题
npm run db:fix-passwords
```

## 🔧 高级用法

### 使用数据库工具脚本

```bash
# 创建新用户
node database/db-tool.js create-user 2024999 张三 student

# 创建新教师
node database/db-tool.js create-user teacher002 王老师 teacher

# 查看详细帮助
node database/db-tool.js
```

### 使用迁移工具

```bash
# 回滚指定步数的迁移
node database/migrate.js down 2

# 查看迁移帮助
node database/migrate.js
```

## 📁 目录结构

```
database/
├── init.js              # 数据库初始化脚本
├── db-tool.js           # 数据库管理工具
├── migrate.js           # 迁移管理器
├── migrations/          # 迁移文件目录
│   └── 001_create_tables.js
├── seeds/               # 种子数据目录
│   └── index.js
├── schema.sql           # 原始SQL脚本（备用）
└── README.md            # 本文档
```

## ❓ 常见问题

### Q: 学生无法登录怎么办？

**A**: 这通常是密码哈希问题，运行以下命令修复：

```bash
npm run db:fix-passwords
```

### Q: 如何重置整个数据库？

**A**: 使用重置命令：

```bash
npm run db:reset
```

### Q: 如何添加新的测试用户？

**A**: 使用创建用户命令：

```bash
node database/db-tool.js create-user 学号 姓名 角色
```

### Q: 数据库连接失败怎么办？

**A**: 检查以下内容：
1. MySQL服务是否启动
2. 数据库配置是否正确
3. 用户权限是否足够

```bash
# 测试连接
npm run db:test
```

### Q: 如何查看当前数据库状态？

**A**: 使用状态查看命令：

```bash
npm run db:status
```

## 🔐 密码安全

- 所有密码使用 bcryptjs 加密，rounds=10
- 默认密码为 `secret`，建议在生产环境中修改
- 系统会自动生成正确的密码哈希，避免手动错误

## 🌱 种子数据

系统包含以下种子数据：

- **1个教师账号**: teacher001
- **30个学生账号**: 2024001-2024030
- **6个问题分类**: 涵盖各种问题类型
- **20个测试问题**: 用于演示功能

## 🚨 注意事项

1. **重置操作**: `npm run db:reset` 会删除所有数据，请谨慎使用
2. **生产环境**: 建议修改默认密码和数据库配置
3. **备份**: 在执行重置操作前，请备份重要数据
4. **权限**: 确保数据库用户有足够的权限创建表和索引

## 📞 技术支持

如果遇到问题：

1. 查看错误日志
2. 运行 `npm run db:test` 测试连接
3. 运行 `npm run db:status` 查看状态
4. 使用 `npm run db:fix-passwords` 修复密码问题

---

**提示**: 首次使用建议运行 `npm run setup` 进行完整初始化。