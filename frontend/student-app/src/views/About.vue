<template>
  <div class="about-container">
    <div class="page-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">
          <i class="el-icon-info"></i>
          关于课堂互动系统
        </h1>
        <p class="page-subtitle">让课堂提问更智能、更高效</p>
      </div>

      <!-- 系统介绍 -->
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="12">
          <el-card class="info-card">
            <div slot="header" class="card-header">
              <i class="el-icon-star-on"></i>
              <span>系统特色</span>
            </div>
            <div class="feature-list">
              <div class="feature-item">
                <i class="el-icon-edit feature-icon"></i>
                <div class="feature-content">
                  <h4>便捷提问</h4>
                  <p>随时随地提交课堂问题，不再错过任何疑惑</p>
                </div>
              </div>
              <div class="feature-item">
                <i class="el-icon-cpu feature-icon"></i>
                <div class="feature-content">
                  <h4>AI智能分类</h4>
                  <p>自动识别问题类型，帮助老师快速理解问题</p>
                </div>
              </div>
              <div class="feature-item">
                <i class="el-icon-view feature-icon"></i>
                <div class="feature-content">
                  <h4>实时追踪</h4>
                  <p>查看问题处理状态，及时获得反馈</p>
                </div>
              </div>
              <div class="feature-item">
                <i class="el-icon-message feature-icon"></i>
                <div class="feature-content">
                  <h4>高效互动</h4>
                  <p>提升师生互动效率，营造良好学习氛围</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="24" :md="12">
          <el-card class="info-card">
            <div slot="header" class="card-header">
              <i class="el-icon-collection-tag"></i>
              <span>问题分类</span>
            </div>
            <div class="category-list">
              <div class="category-item" v-for="category in categories" :key="category.id">
                <div class="category-badge" :style="{ backgroundColor: category.color }">
                  {{ category.id }}
                </div>
                <div class="category-info">
                  <h4>{{ category.name }}</h4>
                  <p>{{ category.description }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 使用指南 -->
      <el-card class="guide-card">
        <div slot="header" class="card-header">
          <i class="el-icon-notebook-1"></i>
          <span>使用指南</span>
        </div>
        <el-steps :active="4" finish-status="success" align-center>
          <el-step title="登录系统" description="使用学号和密码登录"></el-step>
          <el-step title="提交问题" description="在首页输入你的问题"></el-step>
          <el-step title="AI分类" description="系统自动分析问题类型"></el-step>
          <el-step title="查看状态" description="在'我的问题'页面追踪进度"></el-step>
        </el-steps>
      </el-card>

      <!-- 技术信息 -->
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="tech-card">
            <div slot="header" class="card-header">
              <i class="el-icon-monitor"></i>
              <span>前端技术</span>
            </div>
            <ul class="tech-list">
              <li>Vue 2.x</li>
              <li>Element UI</li>
              <li>Vuex</li>
              <li>Vue Router</li>
              <li>Axios</li>
            </ul>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="tech-card">
            <div slot="header" class="card-header">
              <i class="el-icon-server"></i>
              <span>后端技术</span>
            </div>
            <ul class="tech-list">
              <li>Node.js</li>
              <li>Express.js</li>
              <li>MySQL</li>
              <li>JWT认证</li>
              <li>关键词分类</li>
            </ul>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="tech-card">
            <div slot="header" class="card-header">
              <i class="el-icon-pie-chart"></i>
              <span>系统信息</span>
            </div>
            <div class="system-info">
              <div class="info-item">
                <span class="label">版本:</span>
                <span class="value">v1.0.0</span>
              </div>
              <div class="info-item">
                <span class="label">环境:</span>
                <span class="value">{{ environment }}</span>
              </div>
              <div class="info-item">
                <span class="label">部署时间:</span>
                <span class="value">{{ deployTime }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 联系信息 -->
      <el-card class="contact-card">
        <div slot="header" class="card-header">
          <i class="el-icon-phone"></i>
          <span>联系我们</span>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <div class="contact-item">
              <i class="el-icon-message"></i>
              <div>
                <h4>技术支持</h4>
                <p>如遇到技术问题，请联系系统管理员</p>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="contact-item">
              <i class="el-icon-question"></i>
              <div>
                <h4>使用帮助</h4>
                <p>查看使用手册或咨询任课老师</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'About',
  data() {
    return {
      categories: [
        {
          id: 1,
          name: '知识点定义类问题',
          description: '关于概念、定义、含义的问题',
          color: '#409EFF'
        },
        {
          id: 2,
          name: '知识点应用类问题',
          description: '关于具体应用、计算、使用方法的问题',
          color: '#67C23A'
        },
        {
          id: 3,
          name: '知识点关联类问题',
          description: '关于对比、区别、联系的问题',
          color: '#E6A23C'
        },
        {
          id: 4,
          name: '实验操作类问题',
          description: '关于实验、操作、步骤的问题',
          color: '#F56C6C'
        },
        {
          id: 5,
          name: '解题方法类问题',
          description: '关于解题技巧、思路、方法的问题',
          color: '#909399'
        },
        {
          id: 6,
          name: '其他类问题',
          description: '无法归类的其他问题',
          color: '#606266'
        }
      ],
      environment: process.env.NODE_ENV,
      deployTime: new Date().toLocaleDateString()
    }
  },

  computed: {
    ...mapGetters(['currentUser'])
  },

  created() {
    // 设置页面标题
    document.title = '关于系统 - 课堂互动系统'
  }
}
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px 0;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 40px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  color: white;
}

.page-title {
  font-size: 32px;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.page-title i {
  margin-right: 10px;
}

.page-subtitle {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.info-card,
.guide-card,
.tech-card,
.contact-card {
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-weight: 600;
  color: #333;
}

.card-header i {
  margin-right: 8px;
  color: #667eea;
}

.feature-list {
  padding: 0;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9ff;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 24px;
  color: #667eea;
  margin-right: 15px;
  margin-top: 5px;
}

.feature-content h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.feature-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.category-list {
  padding: 0;
}

.category-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.category-badge {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin-right: 15px;
  font-size: 14px;
}

.category-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 14px;
}

.category-info p {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.guide-card {
  margin: 30px 0;
}

.guide-card .el-steps {
  margin-top: 20px;
}

.tech-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tech-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.tech-list li:last-child {
  border-bottom: none;
}

.system-info {
  padding: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  background: #f8f9ff;
  border-radius: 8px;
  margin-bottom: 15px;
}

.contact-item i {
  font-size: 24px;
  color: #667eea;
  margin-right: 15px;
  margin-top: 5px;
}

.contact-item h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.contact-item p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 30px 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .feature-item,
  .contact-item {
    flex-direction: column;
    text-align: center;
  }
  
  .feature-icon,
  .contact-item i {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>