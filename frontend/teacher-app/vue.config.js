// frontend/teacher-app/vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // 🔥 修复 Element UI 警告
  configureWebpack: {
    resolve: {
      alias: {
        // 确保 Vue 版本一致
        'vue$': 'vue/dist/vue.esm.js'
      }
    }
  },
  
  // 🔥 禁用产生警告的特性
  chainWebpack: config => {
    // 禁用 eslint 对 node_modules 的检查
    config.module.rule('eslint').exclude.add(/node_modules/)
  },
  
  // 🔥 开发服务器配置
  devServer: {
    port: 8081,
    host: 'localhost',
    open: false,
    // 忽略 Element UI 的警告
    client: {
      overlay: {
        warnings: false,
        errors: true
      }
    }
  },
  
  // 🔥 生产环境优化
  productionSourceMap: false,
  
  // 🔥 CSS 配置
  css: {
    extract: false,
    sourceMap: false
  }
})