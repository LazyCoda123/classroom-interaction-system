项目目录结构解释
classroom-interaction-system/
├── frontend/                    # 前端项目
│   ├── student-app/            # 学生端
│   │   ├── src/
│   │   │   ├── components/     # 组件
│   │   │   ├── views/          # 页面
│   │   │   ├── router/         # 路由
│   │   │   ├── store/          # Vuex状态管理
│   │   │   ├── api/            # API接口
│   │   │   └── utils/          # 工具函数
│   │   ├── public/
│   │   └── package.json
│   │
│   └── teacher-app/            # 教师端
│       ├── src/
│       │   ├── components/
│       │   ├── views/
│       │   ├── router/
│       │   ├── store/
│       │   ├── api/
│       │   └── utils/
│       ├── public/
│       └── package.json
│
├── backend/                    # 后端项目
│   ├── routes/                 # 路由
│   │   ├── auth.js            # 认证路由
│   │   ├── questions.js       # 问题相关路由
│   │   └── classification.js  # 分类相关路由
│   ├── models/                # 数据模型
│   │   ├── User.js
│   │   ├── Question.js
│   │   └── Category.js
│   ├── middleware/            # 中间件
│   │   ├── auth.js
│   │   └── validation.js
│   ├── services/              # 业务逻辑
│   │   ├── aiClassification.js
│   │   └── questionService.js
│   ├── config/                # 配置文件
│   │   ├── database.js
│   │   └── config.js
│   ├── utils/                 # 工具函数
│   ├── app.js                 # 主应用文件
│   └── package.json
│
├── database/                  # 数据库相关
│   ├── migrations/           # 数据库迁移文件
│   ├── seeds/               # 测试数据
│   └── schema.sql           # 数据库结构
│
├── ai-service/              # AI分类服务
│   ├── models/              # AI模型
│   ├── classifier.js        # 分类逻辑
│   └── package.json
│
├── docs/                    # 文档
│   ├── api.md              # API文档
│   └── deployment.md       # 部署文档
│
└── README.md
