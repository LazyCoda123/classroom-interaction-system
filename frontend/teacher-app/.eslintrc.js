// frontend/student-app/.eslintrc.js
module.exports = {
    root: true,
    env: {
      node: true,
      browser: true
    },
    extends: [
      'plugin:vue/essential',
      'eslint:recommended'
    ],
    parserOptions: {
      parser: '@babel/eslint-parser',
      requireConfigFile: false
    },
    rules: {
      // 关闭Vue组件命名规则，允许单词组件名
      'vue/multi-word-component-names': 'off',
      
      // 关闭不必要的catch检查
      'no-useless-catch': 'off',
      
      // 允许console在开发环境
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      
      // 其他常用规则
      'no-unused-vars': 'warn',
      'no-undef': 'error'
    }
  }