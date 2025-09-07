# 课堂交互系统 (Classroom Interaction System)

[![GitHub license](https://img.shields.io/github/license/LazyCoda123/classroom-interaction-system)](https://github.com/LazyCoda123/classroom-interaction-system/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)](https://nodejs.org/)
[![Vue.js Version](https://img.shields.io/badge/vue-3.x-brightgreen)](https://vuejs.org/)

## 项目简介

课堂交互系统是一个基于Web的实时互动平台原型，专为提升课堂教学效率和学生参与度而设计。本项目作为概念验证(POC)开发，在有限时间内实现了核心功能，为后续完整开发提供技术基础。

**注意**: 这是一个演示版本(Demo)，在一天内快速开发完成，主要用于功能验证和技术方案展示。

## 功能特性

### 学生端功能
- **匿名提问**: 支持学生匿名提交问题，降低参与门槛
- **实时互动**: WebSocket实现实时问答交互
- **问题追踪**: 查看个人问题状态和教师回复
- **课堂加入**: 通过房间码快速进入指定课堂

### 教师端功能
- **问题管理**: 实时接收和处理学生问题
- **自动分类**: 基于关键词算法的问题分类系统
- **统计分析**: 课堂互动数据的基础统计展示
- **课堂控制**: 创建和管理课堂会话

### 智能分析服务
- **关键词提取**: 基于NLP技术的关键词识别
- **问题分类**: 通过关键词匹配算法实现问题自动分类
- **接口预留**: 为未来AI模型集成预留扩展接口

**技术说明**: 当前版本的"智能"功能主要通过传统的关键词算法和基础NLP技术实现，未集成机器学习模型。AI服务模块作为架构预留，可在后续开发中集成真正的AI模型。

## 技术架构

### 前端技术栈
- **框架**: Vue.js 3.x
- **状态管理**: Vuex
- **路由管理**: Vue Router
- **UI组件库**: Element Plus
- **构建工具**: Vite
- **样式预处理**: SCSS
- **HTTP客户端**: Axios

### 后端技术栈
- **运行环境**: Node.js
- **Web框架**: Express.js
- **数据库**: MySQL
- **身份认证**: JWT
- **实时通信**: Socket.io
- **数据验证**: Joi
- **日志记录**: Winston

### 数据处理
- **关键词处理**: 基于词频算法
- **文本预处理**: 正则表达式和字符串处理
- **分类逻辑**: 规则引擎匹配
- **数据持久化**: MySQL存储

## 项目结构

```
classroom-interaction-system/
├── frontend/                    # 前端应用目录
│   ├── student-app/            # 学生端单页应用
│   │   ├── src/
│   │   │   ├── components/     # 可复用组件
│   │   │   ├── views/          # 页面视图组件
│   │   │   ├── router/         # 前端路由配置
│   │   │   ├── store/          # Vuex状态管理
│   │   │   ├── api/            # API接口封装
│   │   │   └── utils/          # 通用工具函数
│   │   ├── public/             # 静态资源文件
│   │   └── package.json        # 项目依赖配置
│   │
│   └── teacher-app/            # 教师端管理应用
│       ├── src/
│       │   ├── components/     # 组件库
│       │   ├── views/          # 管理页面
│       │   ├── router/         # 路由配置
│       │   ├── store/          # 状态管理
│       │   ├── api/            # 接口服务
│       │   └── utils/          # 工具函数
│       ├── public/             # 公共资源
│       └── package.json        # 依赖管理
│
├── backend/                    # 后端服务目录
│   ├── routes/                 # API路由定义
│   │   ├── auth.js            # 认证相关路由
│   │   ├── questions.js       # 问题管理路由
│   │   └── classification.js  # 分类服务路由
│   ├── models/                # 数据模型定义
│   │   ├── User.js            # 用户模型
│   │   ├── Question.js        # 问题模型
│   │   └── Category.js        # 分类模型
│   ├── middleware/            # Express中间件
│   │   ├── auth.js            # 身份验证中间件
│   │   └── validation.js      # 请求数据验证
│   ├── services/              # 业务逻辑层
│   │   ├── aiClassification.js # 分类服务实现
│   │   └── questionService.js  # 问题处理服务
│   ├── config/                # 应用配置
│   │   ├── database.js        # 数据库连接配置
│   │   └── config.js          # 应用全局配置
│   ├── utils/                 # 工具函数库
│   ├── app.js                 # Express应用入口
│   └── package.json           # 后端依赖管理
│
├── database/                  # 数据库相关文件
│   ├── migrations/           # 数据库结构迁移
│   ├── seeds/               # 测试数据初始化
│   └── schema.sql           # 数据库表结构定义
│
├── ai-service/              # 智能分析服务(预留)
│   ├── models/              # 模型文件目录(预留)
│   ├── classifier.js        # 分类器实现
│   └── package.json         # 分析服务依赖
│
├── docs/                    # 项目文档
│   ├── api.md              # API接口文档
│   └── deployment.md       # 部署指导文档
│
├── .gitignore              # Git版本控制忽略文件
├── docker-compose.yml      # Docker容器编排配置
├── LICENSE                 # 开源协议文件
└── README.md              # 项目说明文档
```

## 快速开始

### 环境依赖

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- MySQL >= 8.0

### 安装和运行

1. **克隆项目代码**
   ```bash
   git clone https://github.com/LazyCoda123/classroom-interaction-system.git
   cd classroom-interaction-system
   ```

2. **后端服务配置**
   ```bash
   cd backend
   npm install
   
   # 配置数据库连接
   cp config/config.example.js config/config.js
   # 编辑config.js文件，填入数据库连接信息
   
   # 初始化数据库
   npm run migrate
   npm run seed
   ```

3. **启动后端服务**
   ```bash
   npm run dev
   # 服务运行在 http://localhost:3000
   ```

4. **学生端应用**
   ```bash
   cd frontend/student-app
   npm install
   npm run serve
   # 应用运行在 http://localhost:8080
   ```

5. **教师端应用**
   ```bash
   cd frontend/teacher-app
   npm install
   npm run serve
   # 应用运行在 http://localhost:8081
   ```

6. **智能分析服务**
   ```bash
   cd ai-service
   npm install
   npm start
   # 服务运行在 http://localhost:5000
   ```

### 测试账号

为便于测试，系统预置了以下测试账号：

- 教师账号: teacher@demo.com / password123
- 学生无需注册，支持匿名访问

## 使用指南

### 教师操作流程

1. 使用教师账号登录系统
2. 创建新的课堂会话
3. 获取并分享课堂房间码
4. 实时监控学生问题提交
5. 回答问题并查看分类统计
6. 结束课堂并导出数据

### 学生参与流程

1. 访问学生端应用
2. 输入教师提供的房间码
3. 以匿名方式加入课堂
4. 提交问题或疑问
5. 实时查看教师回复
6. 浏览其他同学的问题

## 开发说明

### 项目限制

由于开发时间限制，以下功能为简化实现或预留接口：

- AI模型训练和部署未完成，仅提供接口框架
- 分类算法基于关键词匹配，非机器学习模型
- 用户权限管理为基础实现
- 数据统计功能相对简单
- 缺少完整的错误处理和日志系统

### 扩展方向

1. **AI增强**: 集成真正的机器学习模型进行智能分类
2. **功能完善**: 增加更多互动形式(投票、答题等)
3. **性能优化**: 数据库优化和缓存策略
4. **移动适配**: 响应式设计和移动端优化
5. **系统集成**: 与现有教学管理系统对接

### 代码规范

- 遵循ESLint配置的代码风格
- 使用Prettier进行代码格式化
- 采用Git Conventional Commits提交规范
- API接口遵循RESTful设计原则

### 测试

```bash
# 后端单元测试
cd backend
npm test

# 前端组件测试
cd frontend/student-app
npm run test:unit

cd frontend/teacher-app  
npm run test:unit
```

### 生产构建

```bash
# 构建学生端
cd frontend/student-app
npm run build

# 构建教师端
cd frontend/teacher-app
npm run build

# 启动生产服务
cd backend
npm start
```

## API接口

### 主要接口端点

**认证接口**
- `POST /api/auth/login` - 用户登录验证
- `POST /api/auth/logout` - 用户登出

**问题管理**
- `POST /api/questions` - 提交新问题
- `GET /api/questions` - 获取问题列表
- `PUT /api/questions/:id` - 更新问题状态
- `DELETE /api/questions/:id` - 删除问题

**课堂管理**
- `POST /api/rooms` - 创建课堂房间
- `GET /api/rooms/:code` - 获取房间信息
- `POST /api/rooms/:code/join` - 加入课堂

**分类服务**
- `POST /api/classify` - 问题分类分析
- `GET /api/categories` - 获取分类统计

详细的API文档请参考: [docs/api.md](./docs/api.md)

## 部署指南

### Docker部署

```bash
# 使用Docker Compose部署
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 手动部署

详细的部署步骤请参考: [docs/deployment.md](./docs/deployment.md)

## 贡献指南

1. Fork本项目到个人仓库
2. 创建功能分支 (`git checkout -b feature/new-feature`)
3. 提交代码变更 (`git commit -m 'Add: 新功能描述'`)
4. 推送到分支 (`git push origin feature/new-feature`)
5. 创建Pull Request

### 提交信息规范

- `Add:` 新增功能
- `Fix:` 修复问题
- `Update:` 更新现有功能
- `Remove:` 删除功能
- `Docs:` 文档更新

## 技术栈选择说明

考虑到开发时间限制和技术团队熟悉度，选择了以下技术栈：

- **前端**: Vue.js生态提供快速开发能力
- **后端**: Node.js/Express轻量级且开发效率高
- **数据库**: MySQL提供稳定的关系型数据存储
- **实时通信**: Socket.io简化WebSocket实现

## 已知问题

1. 分类算法准确性有限，依赖预设关键词
2. 并发用户数量未进行压力测试
3. 错误处理机制不够完善
4. 缺少数据备份和恢复机制
5. 前端路由守卫和权限控制需要完善

## 开源协议

本项目采用 MIT 开源协议，详情请查看 [LICENSE](LICENSE) 文件。

## 联系信息

- 项目仓库: https://github.com/LazyCoda123/classroom-interaction-system
- 问题报告: [GitHub Issues](https://github.com/LazyCoda123/classroom-interaction-system/issues)
- 技术讨论: [GitHub Discussions](https://github.com/LazyCoda123/classroom-interaction-system/discussions)

## 致谢

感谢所有参与项目开发和测试的贡献者。本项目作为概念验证，为教育技术的创新应用提供了有价值的探索。

---

**注意**: 这是一个演示项目，不建议直接用于生产环境。如需商业使用，请进行充分的功能完善和安全加固。
