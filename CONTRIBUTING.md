# 贡献指南

感谢您考虑为大众充电地图项目做出贡献！

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request流程](#pull-request流程)

## 🤝 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 侮辱性/贬损性评论，人身攻击
- 公开或私下骚扰
- 未经许可发布他人私人信息
- 其他可能被认为不适当的行为

## 💡 如何贡献

### 报告Bug

发现Bug？请先检查：

1. **搜索已有Issue** - 可能已经有人报告了
2. **确认是Bug** - 确保不是配置或使用问题
3. **提供详细信息** - 使用Bug报告模板

**Bug报告应包含：**

```markdown
**描述Bug**
清楚简洁地描述bug

**复现步骤**
1. 访问 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**预期行为**
简要描述应该发生什么

**截图**
如果适用，添加截图帮助解释问题

**环境信息**
- 操作系统: [如 iOS 15]
- 浏览器: [如 Chrome 95]
- 版本: [如 1.0.0]

**额外信息**
关于问题的任何其他信息
```

### 建议新功能

有好点子？我们很乐意听！

1. **搜索已有Issue** - 可能已经有人提出了
2. **清晰描述** - 说明功能是什么，为什么需要
3. **提供示例** - 如果可能，提供mockup或示例代码

**功能建议应包含：**

```markdown
**功能描述**
清楚简洁地描述您想要的功能

**动机**
为什么需要这个功能？它解决什么问题？

**替代方案**
您考虑过哪些替代解决方案？

**额外信息**
关于功能请求的任何其他信息
```

### 改进文档

文档永远可以更好！

- 修复错别字
- 改进说明
- 添加示例
- 翻译文档

## 🛠️ 开发流程

### 1. Fork项目

点击GitHub页面右上角的"Fork"按钮。

### 2. 克隆仓库

```bash
git clone https://github.com/your-username/volkswagen-charging.git
cd volkswagen-charging
```

### 3. 添加上游仓库

```bash
git remote add upstream https://github.com/volkswagen/volkswagen-charging.git
```

### 4. 创建分支

```bash
git checkout -b feature/your-feature-name
```

**分支命名规范：**

- `feature/xxx` - 新功能
- `bugfix/xxx` - Bug修复
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构
- `test/xxx` - 测试相关
- `chore/xxx` - 构建/工具更新

### 5. 安装依赖

```bash
npm install
```

### 6. 开发

```bash
npm run dev
```

### 7. 测试

```bash
# 运行测试
npm run test

# 代码检查
npm run lint

# 构建测试
npm run build
```

### 8. 提交代码

```bash
git add .
git commit -m "feat: add new feature"
```

### 9. 推送到远程

```bash
git push origin feature/your-feature-name
```

### 10. 创建Pull Request

访问您的Fork仓库页面，点击"New Pull Request"。

## 📝 代码规范

### JavaScript/Vue规范

遵循项目的ESLint配置：

```javascript
// ✅ 好的示例
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  // ...实现
  return distance
}

// ❌ 不好的示例
function calc(a, b, c, d) {
  let r = 6371
  // ...
  return dist
}
```

**关键点：**

1. **命名规范**
   - 组件：PascalCase（`StationCard.vue`）
   - 文件：kebab-case（`station-api.js`）
   - 变量/函数：camelCase（`getUserInfo`）
   - 常量：UPPER_SNAKE_CASE（`API_BASE_URL`）

2. **注释**
   ```javascript
   /**
    * 计算两点间距离
    * @param {number} lat1 - 起点纬度
    * @param {number} lng1 - 起点经度
    * @param {number} lat2 - 终点纬度
    * @param {number} lng2 - 终点经度
    * @returns {number} 距离（公里）
    */
   function calculateDistance(lat1, lng1, lat2, lng2) {
     // 实现...
   }
   ```

3. **组件结构**
   ```vue
   <template>
     <!-- 模板 -->
   </template>

   <script setup>
   // 1. imports
   import { ref, computed } from 'vue'
   
   // 2. props/emits
   const props = defineProps({...})
   const emit = defineEmits([...])
   
   // 3. refs
   const count = ref(0)
   
   // 4. computed
   const doubled = computed(() => count.value * 2)
   
   // 5. methods
   function increment() {
     count.value++
   }
   
   // 6. lifecycle
   onMounted(() => {
     // ...
   })
   </script>

   <style scoped>
   /* 样式 */
   </style>
   ```

### CSS/Tailwind规范

```vue
<!-- ✅ 好的示例 -->
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h3 class="text-lg font-bold text-gray-900">标题</h3>
  <button class="btn btn-primary">按钮</button>
</div>

<!-- ❌ 不好的示例 -->
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg active:shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105">
  <!-- 类名过长，应抽取为组件或自定义类 -->
</div>
```

## 📋 提交规范

使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具更新
- `revert`: 回滚

### 示例

```bash
# 新功能
git commit -m "feat(map): add station clustering feature"

# Bug修复
git commit -m "fix(payment): resolve payment confirmation issue"

# 文档更新
git commit -m "docs(readme): update installation instructions"

# 完整示例
git commit -m "feat(charging): add real-time charging status

- Add WebSocket connection for status updates
- Implement smooth UI transitions
- Add error handling and retry logic

Closes #123"
```

## 🔄 Pull Request流程

### 提交PR前检查清单

- [ ] 代码符合项目规范
- [ ] 通过所有测试（`npm run test`）
- [ ] 通过代码检查（`npm run lint`）
- [ ] 更新相关文档
- [ ] 添加必要的测试
- [ ] 提交信息符合规范
- [ ] 分支基于最新的main

### PR描述模板

```markdown
## 变更类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 重大变更
- [ ] 文档更新

## 变更描述
简要描述这个PR做了什么

## 相关Issue
Closes #123

## 测试
描述如何测试这些变更

## 截图（如适用）
添加截图或GIF

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 自测通过
- [ ] 添加/更新了测试
- [ ] 更新了文档
- [ ] 通过CI检查
```

### PR审查流程

1. **自动检查** - CI/CD自动运行测试
2. **代码审查** - 至少一位维护者审查
3. **讨论修改** - 根据反馈修改代码
4. **合并** - 审查通过后合并到main

### 获得反馈后

```bash
# 同步上游变更
git fetch upstream
git rebase upstream/main

# 修改代码后
git add .
git commit -m "fix: address review comments"
git push origin feature/your-feature-name -f
```

## 🎯 优先级

我们欢迎所有贡献，但以下类型会优先处理：

1. **安全问题** - 最高优先级
2. **Bug修复** - 高优先级
3. **性能优化** - 高优先级
4. **新功能** - 中等优先级
5. **文档改进** - 中等优先级
6. **代码重构** - 低优先级

## 💬 沟通渠道

- **GitHub Issues** - Bug报告和功能建议
- **GitHub Discussions** - 一般讨论和问答
- **Pull Requests** - 代码审查和讨论

## 🏆 贡献者

感谢所有贡献者！

您的贡献将被记录在：
- README.md的贡献者部分
- GitHub的Contributors页面

## 📄 许可证

通过贡献代码，您同意您的贡献将在[MIT License](LICENSE)下授权。

## ❓ 问题？

如有任何问题，请：

1. 查看[FAQ](docs/FAQ.md)
2. 搜索[GitHub Issues](https://github.com/volkswagen/volkswagen-charging/issues)
3. 创建新Issue询问

---

**再次感谢您的贡献！** 🎉

我们期待您的Pull Request！

