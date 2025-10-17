# 故障排查指南

## 🔍 常见问题与解决方案

### 1. 定位失败问题

#### 问题描述
```
定位失败: Error: Get ipLocation failed.Geolocation permission denied.
```

#### 原因
浏览器阻止了定位权限请求。

#### 解决方案

**Chrome浏览器：**
1. 点击地址栏左侧的 🔒 或 ⓘ 图标
2. 找到"位置"权限
3. 选择"允许"
4. 刷新页面

**Edge浏览器：**
1. 点击地址栏右侧的 🔒 图标
2. 点击"站点权限"
3. 将"位置"设置为"允许"
4. 刷新页面

**开发环境（localhost）：**
- 在 `http://localhost` 下定位API可能受限
- 建议使用 `https://localhost` 或直接使用IP地址

**自动降级：**
即使定位失败，应用会自动使用北京天安门作为默认位置，不影响使用。

---

### 2. 地图不显示

#### 问题描述
地图区域显示空白或加载失败。

#### 解决方案

**检查高德地图API Key：**
```bash
# 检查 .env 文件
VITE_AMAP_KEY=your_key_here
```

**获取API Key：**
1. 访问 https://lbs.amap.com/
2. 注册并登录
3. 创建应用（选择Web端JS API）
4. 复制Key到 `.env` 文件
5. 重启开发服务器

**检查网络连接：**
- 确保能访问高德地图API
- 检查防火墙设置
- 尝试使用手机热点

---

### 3. 充电站数据不显示

#### 问题描述
地图加载成功，但没有显示充电站标记。

#### 解决方案

**确认Mock模式已启用：**
```env
# .env 文件
VITE_USE_MOCK=true
```

**清除缓存重启：**
```bash
# 停止开发服务器（Ctrl+C）
# 清除缓存
npm cache clean --force

# 重新安装
npm install

# 启动
npm run dev
```

**检查控制台错误：**
按 F12 打开浏览器控制台，查看是否有错误信息。

---

### 4. npm run dev 失败

#### 问题1: 'vite' 不是内部或外部命令

```bash
# 解决方案
npm install
```

#### 问题2: 端口被占用

```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案：**
```bash
# Windows - 查找并关闭占用端口的进程
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F

# 或者修改端口
# vite.config.js
server: {
  port: 3001  // 改为其他端口
}
```

#### 问题3: Node版本过低

```
Node.js version 16.x is not supported
```

**解决方案：**
- 下载并安装 Node.js 18+ LTS版本
- https://nodejs.org/

---

### 5. WebSocket连接失败

#### 问题描述
```
WebSocket connection failed
```

#### 解决方案

这是正常现象，Mock模式下会自动模拟WebSocket推送：

```javascript
// src/services/websocket.js
const useMock = import.meta.env.VITE_USE_MOCK === 'true' || true
```

**Mock模式下：**
- 会自动模拟每5-10秒推送一次状态更新
- 不影响功能使用
- 右上角黄色提示可以忽略

**连接真实WebSocket：**
```env
# .env
VITE_USE_MOCK=false
VITE_WS_URL=wss://your-server.com/ws
```

---

### 6. 样式不生效

#### 问题描述
页面显示混乱，样式丢失。

#### 解决方案

```bash
# 检查 TailwindCSS 是否正确安装
npm list tailwindcss

# 重新构建样式
npm run dev
```

**检查浏览器缓存：**
- 按 `Ctrl+Shift+R` 强制刷新
- 或在DevTools中禁用缓存

---

### 7. 构建失败

#### 问题描述
```bash
npm run build
# 报错...
```

#### 解决方案

**清理并重新构建：**
```bash
# 删除构建产物
Remove-Item -Recurse -Force dist

# 清理依赖
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 重新安装并构建
npm install
npm run build
```

**检查磁盘空间：**
确保有足够的磁盘空间用于构建。

---

### 8. 移动端触控不灵敏

#### 问题描述
手机上触摸地图反应慢或不响应。

#### 解决方案

**检查地图配置：**
```javascript
// 确保这些配置已启用
{
  dragEnable: true,
  zoomEnable: true,
  touchZoom: true,
  touchZoomCenter: 1
}
```

**禁用浏览器默认行为：**
```css
.amap-container {
  touch-action: none;
  -webkit-user-select: none;
}
```

---

### 9. 性能问题

#### 问题描述
地图卡顿，标记加载慢。

#### 解决方案

**减少可见标记数量：**
```javascript
// src/api/mock/station-mock.js
// 减少生成的充电站数量
generateStations(500)  // 默认2000，可以改小
```

**调整聚合参数：**
```javascript
// src/components/MapView.vue
markerClusterer = new AMap.MarkerClusterer(map, [], {
  gridSize: 80,  // 增大网格，减少标记
  minClusterSize: 5  // 增大最小聚合数
})
```

**禁用动画：**
```css
/* 如果设备性能较差 */
* {
  animation: none !important;
  transition: none !important;
}
```

---

### 10. 开发工具相关

#### 问题：ESLint 错误太多

```bash
# 暂时禁用 ESLint
# package.json
"scripts": {
  "dev": "vite",  // 移除 --lint
}
```

#### 问题：Git 提交失败

```bash
# 跳过 git hooks（不推荐）
git commit --no-verify -m "message"

# 或修复 lint 错误
npm run lint
```

---

## 🆘 获取帮助

如果以上方案都无法解决问题：

1. **查看控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签
   - 截图完整错误信息

2. **查看文档**
   - [README.md](./README.md) - 项目说明
   - [QUICKSTART.md](./QUICKSTART.md) - 快速开始
   - [API.md](./API.md) - API文档

3. **提交Issue**
   - 描述问题现象
   - 附上错误信息
   - 说明操作系统和浏览器版本
   - 提供复现步骤

4. **联系支持**
   - 项目仓库 Issues 页面
   - 技术支持邮箱

---

## 📋 诊断检查清单

遇到问题时，请依次检查：

- [ ] Node.js 版本 >= 18.0.0
- [ ] npm 版本 >= 9.0.0
- [ ] 依赖已正确安装（node_modules 存在）
- [ ] .env 文件已配置
- [ ] 端口 3000 未被占用
- [ ] 网络连接正常
- [ ] 浏览器版本较新（Chrome 90+）
- [ ] 清除了浏览器缓存
- [ ] 没有其他错误提示

---

**最后更新**: 2024-10-17

