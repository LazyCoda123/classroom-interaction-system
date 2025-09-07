<template>
  <div class="statistics-container">
    <div class="page-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">
          <i class="el-icon-pie-chart"></i>
          数据统计分析
        </h1>
        <p class="page-subtitle">全面分析学生问题数据和分类效果</p>
      </div>

      <!-- 总体统计卡片 -->
      <div class="overview-section">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card total">
              <div class="stat-icon">
                <i class="el-icon-document"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ questionStats.total }}</div>
                <div class="stat-label">总问题数</div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card pending">
              <div class="stat-icon">
                <i class="el-icon-warning"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ questionStats.pending }}</div>
                <div class="stat-label">待分类</div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card classified">
              <div class="stat-icon">
                <i class="el-icon-success"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ questionStats.classified }}</div>
                <div class="stat-label">已分类</div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <div class="stat-card students">
              <div class="stat-icon">
                <i class="el-icon-user"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ students.length }}</div>
                <div class="stat-label">参与学生</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 图表区域 -->
      <el-row :gutter="20">
        <!-- 分类分布饼图 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="page-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="el-icon-pie-chart"></i>
                问题分类分布
              </h3>
            </div>
            <div class="card-content">
              <v-chart
                class="chart"
                :option="pieChartOption"
                :loading="chartLoading"
                autoresize
              />
            </div>
          </div>
        </el-col>
        
        <!-- 分类统计柱状图 -->
        <el-col :xs="24" :sm="24" :md="12" :lg="12">
          <div class="page-card">
            <div class="card-header">
              <h3 class="card-title">
                <i class="el-icon-s-data"></i>
                分类统计详情
              </h3>
            </div>
            <div class="card-content">
              <v-chart
                class="chart"
                :option="barChartOption"
                :loading="chartLoading"
                autoresize
              />
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细统计表格 -->
      <div class="page-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="el-icon-s-order"></i>
            分类详细统计
          </h3>
          
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              @click="exportStatistics"
              icon="el-icon-download"
            >
              导出数据
            </el-button>
            
            <el-button
              size="small"
              @click="refreshData"
              icon="el-icon-refresh"
            >
              刷新
            </el-button>
          </div>
        </div>
        
        <div class="card-content">
          <el-table
            :data="categoryStats"
            stripe
            style="width: 100%"
            :default-sort="{ prop: 'question_count', order: 'descending' }"
          >
            <el-table-column
              prop="name"
              label="分类名称"
              min-width="200"
            >
              <template slot-scope="scope">
                <el-tag
                  :type="getCategoryTagType(scope.row.name)"
                  size="medium"
                >
                  {{ scope.row.name }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column
              prop="question_count"
              label="问题数量"
              width="120"
              align="center"
              sortable
            >
              <template slot-scope="scope">
                <span class="question-count">{{ scope.row.question_count }}</span>
              </template>
            </el-table-column>
            
            <el-table-column
              prop="percentage"
              label="占比"
              width="120"
              align="center"
              sortable
            >
              <template slot-scope="scope">
                <!-- 🔧 修复：使用安全的百分比格式化方法 -->
                <span class="percentage">{{ formatPercentage(scope.row.percentage) }}%</span>
              </template>
            </el-table-column>
            
            <el-table-column
              label="比例图"
              width="200"
              align="center"
            >
              <template slot-scope="scope">
                <div class="progress-bar">
                  <!-- 🔧 修复：确保percentage是数字类型 -->
                  <el-progress
                    :percentage="getPercentage(scope.row.percentage)"
                    :stroke-width="12"
                    :show-text="false"
                    :color="getProgressColor(scope.row.name)"
                  />
                </div>
              </template>
            </el-table-column>
            
            <el-table-column
              label="操作"
              width="150"
              align="center"
            >
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="small"
                  @click="viewCategoryQuestions(scope.row)"
                  icon="el-icon-view"
                >
                  查看问题
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 学生参与度统计 -->
      <div class="page-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="el-icon-user"></i>
            学生参与度统计
          </h3>
        </div>
        
        <div class="card-content">
          <div class="participation-stats">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="8" :md="8" :lg="8">
                <div class="participation-item">
                  <div class="participation-icon submitted">
                    <i class="el-icon-check"></i>
                  </div>
                  <div class="participation-content">
                    <div class="participation-value">{{ submittedStudentsCount }}</div>
                    <div class="participation-label">已提交问题</div>
                    <div class="participation-percentage">
                      {{ submittedPercentage.toFixed(1) }}%
                    </div>
                  </div>
                </div>
              </el-col>
              
              <el-col :xs="24" :sm="8" :md="8" :lg="8">
                <div class="participation-item">
                  <div class="participation-icon pending">
                    <i class="el-icon-time"></i>
                  </div>
                  <div class="participation-content">
                    <div class="participation-value">{{ notSubmittedStudentsCount }}</div>
                    <div class="participation-label">未提交问题</div>
                    <div class="participation-percentage">
                      {{ notSubmittedPercentage.toFixed(1) }}%
                    </div>
                  </div>
                </div>
              </el-col>
              
              <el-col :xs="24" :sm="8" :md="8" :lg="8">
                <div class="participation-item">
                  <div class="participation-icon total">
                    <i class="el-icon-user-solid"></i>
                  </div>
                  <div class="participation-content">
                    <div class="participation-value">{{ students.length }}</div>
                    <div class="participation-label">总学生数</div>
                    <div class="participation-percentage">100%</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Statistics',
  data() {
    return {
      chartLoading: false
    }
  },
  
  computed: {
    ...mapGetters([
      'questionStats',
      'categoryStats',
      'students'
    ]),
    
    // 已提交问题的学生数量
    submittedStudentsCount() {
      return this.questionStats.total || 0
    },
    
    // 未提交问题的学生数量
    notSubmittedStudentsCount() {
      return this.students.length - this.submittedStudentsCount
    },
    
    // 提交率
    submittedPercentage() {
      if (this.students.length === 0) return 0
      return (this.submittedStudentsCount / this.students.length) * 100
    },
    
    // 未提交率
    notSubmittedPercentage() {
      return 100 - this.submittedPercentage
    },
    
    // 饼图配置
    pieChartOption() {
      const data = this.categoryStats
        .filter(item => item.question_count > 0)
        .map(item => ({
          name: item.name,
          value: item.question_count
        }))
      
      return {
        title: {
          text: '问题分类分布',
          subtext: `总计 ${this.questionStats.classified} 个已分类问题`,
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            name: '问题数量',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: data,
            itemStyle: {
              borderRadius: 5,
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ],
        color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
      }
    },
    
    // 柱状图配置
    barChartOption() {
      const categories = this.categoryStats.map(item => item.name.replace('类问题', ''))
      const data = this.categoryStats.map(item => item.question_count)
      
      return {
        title: {
          text: '各分类问题数量',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            interval: 0,
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '问题数量',
            type: 'bar',
            data: data,
            itemStyle: {
              borderRadius: [5, 5, 0, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#667eea' },
                  { offset: 1, color: '#764ba2' }
                ]
              }
            },
            emphasis: {
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#5a6fd8' },
                    { offset: 1, color: '#6a4190' }
                  ]
                }
              }
            }
          }
        ]
      }
    }
  },
  
  methods: {
    ...mapActions([
      'fetchQuestions',
      'fetchCategoryStats',
      'fetchStudents'
    ]),
    
    // 🔧 新增：安全的百分比格式化方法
    formatPercentage(value) {
      // 如果值为null、undefined或空字符串，返回0.0
      if (value === null || value === undefined || value === '') {
        return '0.0'
      }
      // 转换为数字，如果转换失败返回0.0
      const numValue = Number(value)
      if (isNaN(numValue)) {
        return '0.0'
      }
      // 确保在0-100范围内，并保留1位小数
      return Math.min(Math.max(numValue, 0), 100).toFixed(1)
    },
    
    // 🔧 新增：确保percentage转换为数字类型的方法
    getPercentage(value) {
      // 如果值为null、undefined或空字符串，返回0
      if (value === null || value === undefined || value === '') {
        return 0
      }
      // 转换为数字，如果转换失败返回0
      const numValue = Number(value)
      return isNaN(numValue) ? 0 : Math.min(Math.max(numValue, 0), 100)
    },
    
    // 获取分类标签类型
    getCategoryTagType(categoryName) {
      const types = {
        '知识点定义类问题': 'primary',
        '知识点应用类问题': 'success',
        '知识点关联类问题': 'info',
        '实验操作类问题': 'warning',
        '解题方法类问题': 'danger',
        '其他类问题': 'default'
      }
      return types[categoryName] || 'default'
    },
    
    // 获取进度条颜色
    getProgressColor(categoryName) {
      const colors = {
        '知识点定义类问题': '#409eff',
        '知识点应用类问题': '#67c23a',
        '知识点关联类问题': '#909399',
        '实验操作类问题': '#e6a23c',
        '解题方法类问题': '#f56c6c',
        '其他类问题': '#c0c4cc'
      }
      return colors[categoryName] || '#667eea'
    },
    
    // 查看分类下的问题
    viewCategoryQuestions(category) {
      this.$router.push({
        path: '/classification',
        query: { categoryId: category.id }
      }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error('路由跳转错误:', err)
        }
      })
    },
    
    // 导出统计数据
    async exportStatistics() {
      try {
        // 准备导出数据
        const exportData = this.categoryStats.map(item => ({
          '分类名称': item.name,
          '问题数量': item.question_count,
          '占比(%)': this.formatPercentage(item.percentage)
        }))
        
        // 添加总计行
        exportData.push({
          '分类名称': '总计',
          '问题数量': this.questionStats.total,
          '占比(%)': '100.0'
        })
        
        // 使用混入的导出方法（如果存在）
        if (this.exportToCSV) {
          this.exportToCSV(exportData, `问题分类统计_${new Date().toISOString().split('T')[0]}.csv`)
        } else {
          // 简单的CSV导出实现
          const csvContent = this.convertToCSV(exportData)
          this.downloadCSV(csvContent, `问题分类统计_${new Date().toISOString().split('T')[0]}.csv`)
        }
        
        this.$message.success('统计数据导出成功')
        
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败')
      }
    },
    
    // 简单的CSV转换方法
    convertToCSV(data) {
      if (!data || data.length === 0) return ''
      
      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(field => `"${row[field]}"`).join(','))
      ]
      
      return csvRows.join('\n')
    },
    
    // 简单的CSV下载方法
    downloadCSV(csvContent, filename) {
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    
    // 刷新数据
    async refreshData() {
      this.chartLoading = true
      
      try {
        await Promise.all([
          this.fetchQuestions(),
          this.fetchCategoryStats(),
          this.fetchStudents()
        ])
        
        this.$message.success('数据刷新成功')
        
      } catch (error) {
        console.error('数据刷新失败:', error)
        this.$message.error('数据刷新失败')
      } finally {
        this.chartLoading = false
      }
    }
  },
  
  async created() {
    // 页面加载时获取数据
    await this.refreshData()
  }
}
</script>

<style lang="scss" scoped>
.statistics-container {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
  
  .page-title {
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    
    i {
      margin-right: 15px;
      color: #667eea;
    }
  }
  
  .page-subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;
  }
}

.overview-section {
  margin-bottom: 30px;
  
  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    margin-bottom: 15px;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      
      i {
        font-size: 28px;
        color: white;
      }
    }
    
    .stat-content {
      flex: 1;
      
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #666;
        font-weight: 500;
      }
    }
    
    &.total {
      .stat-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .stat-value {
        color: #667eea;
      }
    }
    
    &.pending {
      .stat-icon {
        background: linear-gradient(135deg, #E6A23C 0%, #F7BA2A 100%);
      }
      .stat-value {
        color: #E6A23C;
      }
    }
    
    &.classified {
      .stat-icon {
        background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
      }
      .stat-value {
        color: #67C23A;
      }
    }
    
    &.students {
      .stat-icon {
        background: linear-gradient(135deg, #409EFF 0%, #36CFC9 100%);
      }
      .stat-value {
        color: #409EFF;
      }
    }
  }
}

.chart {
  height: 400px;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-actions {
    display: flex;
    gap: 10px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      width: 100%;
      margin-top: 15px;
    }
  }
}

.question-count {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.percentage {
  font-weight: 600;
  color: #667eea;
}

.progress-bar {
  padding: 0 10px;
}

.participation-stats {
  .participation-item {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: 15px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .participation-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      
      i {
        font-size: 24px;
        color: white;
      }
      
      &.submitted {
        background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
      }
      
      &.pending {
        background: linear-gradient(135deg, #E6A23C 0%, #F7BA2A 100%);
      }
      
      &.total {
        background: linear-gradient(135deg, #409EFF 0%, #36CFC9 100%);
      }
    }
    
    .participation-content {
      flex: 1;
      text-align: center;
      
      .participation-value {
        font-size: 24px;
        font-weight: 700;
        color: #333;
        margin-bottom: 5px;
      }
      
      .participation-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
      }
      
      .participation-percentage {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

@media (max-width: 768px) {
  .page-header .page-title {
    font-size: 24px;
  }
  
  .overview-section .stat-card {
    .stat-icon {
      width: 50px;
      height: 50px;
      margin-right: 15px;
      
      i {
        font-size: 24px;
      }
    }
    
    .stat-content .stat-value {
      font-size: 24px;
    }
  }
  
  .chart {
    height: 300px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .participation-stats .participation-item {
    .participation-icon {
      width: 40px;
      height: 40px;
      
      i {
        font-size: 20px;
      }
    }
    
    .participation-content .participation-value {
      font-size: 20px;
    }
  }
}
</style>