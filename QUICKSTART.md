# 快速开始指南

本指南帮助您快速运行大众充电地图项目。

## 🎯 5分钟快速体验

### 1. 克隆项目

```bash
git clone https://github.com/your-org/volkswagen-charging.git
cd volkswagen-charging
```

### 2. 安装依赖

```bash
npm install
```

或使用pnpm（推荐）:

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 打开浏览器

访问 `http://localhost:3000`

**就这么简单！** 🎉

项目默认使用Mock数据，无需配置后端即可体验所有功能。

## 📱 移动端预览

### 方式一：Chrome DevTools

1. 打开Chrome浏览器
2. 按F12打开开发者工具
3. 点击设备模拟按钮（Ctrl+Shift+M）
4. 选择移动设备（如iPhone 12 Pro）

### 方式二：手机访问

1. 确保手机和电脑在同一局域网
2. 查看终端输出的Network地址（如：`http://192.168.1.100:3000`）
3. 手机浏览器访问该地址

## 🔧 可选配置

### 配置高德地图API Key（推荐）

虽然不配置也能运行，但配置后体验更好：

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并创建应用
3. 获取Web端API Key
4. 在项目根目录创建 `.env` 文件：

```env
VITE_AMAP_KEY=你的高德地图API_Key
VITE_USE_MOCK=true
```

5. 重启开发服务器

## 🎮 功能体验指南

### 1. 地图浏览

- **拖动地图**: 单指拖动
- **缩放地图**: 双指缩放或点击+/-按钮
- **定位**: 点击右侧定位按钮
- **切换主题**: 点击日/夜模式按钮

### 2. 查找充电站

- **查看附近**: 地图自动显示附近充电站
- **搜索**: 顶部搜索框输入关键词
- **筛选**: 底部滑动查看推荐站点

### 3. 查看详情

- **点击标记**: 地图上点击充电站标记
- **点击卡片**: 底部列表点击站点卡片
- **查看充电桩**: 展开详情查看每个充电桩状态

### 4. 开始充电（模拟）

1. 点击"立即充电"按钮
2. 查看实时充电数据
3. 点击"结束充电"
4. 进入支付页面

### 5. 支付（模拟）

1. 选择支付方式
2. 点击"确认支付"
3. 查看支付成功动画

### 6. 查看历史

- 点击顶部历史按钮
- 浏览充电历史记录

## 📊 性能测试

### 测试首屏加载时间

打开浏览器控制台，查看输出：

```
地图加载时间: XXXms
```

目标：< 2000ms

### 测试标记渲染

地图上显示2000个充电站标记，观察：

- 拖动是否流畅
- 缩放是否卡顿
- 标记聚合是否正常

## 🐛 常见问题

### Q1: 地图显示空白？

**A**: 检查网络连接，或配置高德地图API Key。

### Q2: 定位失败？

**A**: 浏览器需要定位权限，或使用HTTPS访问。开发环境下会自动使用默认位置（北京）。

### Q3: WebSocket连接失败？

**A**: 正常现象，Mock模式下会自动模拟WebSocket推送，不影响功能。

### Q4: 充电站数据不显示？

**A**: 确保 `VITE_USE_MOCK=true`，Mock数据会自动生成。

## 🔍 项目结构快速导航

```
src/
├── views/          # 页面组件（从这里开始看）
│   ├── MapView.vue        # 地图主页
│   ├── ChargingView.vue   # 充电页面
│   └── PaymentView.vue    # 支付页面
├── components/     # 公共组件
│   ├── MapView.vue        # 地图组件（核心）
│   └── StationDrawer.vue  # 详情抽屉
├── stores/         # 状态管理
│   ├── app.js             # 全局状态
│   └── station.js         # 充电站状态
├── api/            # API接口
│   ├── station.js         # 充电站API
│   └── mock/              # Mock数据
└── services/       # 服务层
    ├── amap.js            # 地图服务
    └── websocket.js       # WebSocket服务
```

## 📚 下一步

- 📖 阅读 [README.md](./README.md) 了解完整功能
- 🏗️ 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解架构设计
- 📡 阅读 [API.md](./API.md) 了解接口文档
- 🚀 阅读 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解部署流程

## 💡 开发提示

### 热更新

修改代码后，浏览器会自动刷新，无需手动刷新。

### 调试技巧

```javascript
// 1. 查看Pinia状态
import { useStationStore } from '@/stores/station'
const store = useStationStore()
console.log(store.stations)

// 2. 模拟状态更新
store.updateStationStatus([{
  id: 'station_1',
  availableCount: 10
}])

// 3. 查看地图实例
window.AMap // 高德地图全局对象
```

### VSCode推荐插件

- Vue Language Features (Volar)
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### 开发命令速查

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览构建
npm run preview

# 测试
npm run test

# 代码检查
npm run lint
```

## 🎉 开始探索

现在您已经成功运行项目，尽情探索和修改代码吧！

如有任何问题，请查看完整文档或提交Issue。

---

**祝您开发愉快！** 🚀

