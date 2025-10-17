# 架构设计文档

## 📐 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户端 (移动浏览器)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Vue 3 H5 应用                            │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  地图视图   │  │  充电视图   │  │  支付视图   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  │  ┌────────────────────────────────────────────┐     │   │
│  │  │         Pinia 状态管理                       │     │   │
│  │  └────────────────────────────────────────────┘     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │   │
│  │  │ API服务  │  │  地图SDK  │  │  WebSocket   │     │   │
│  │  └──────────┘  └──────────┘  └──────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
        ┌───────────┐ ┌──────────┐ ┌──────────┐
        │  RESTful  │ │ WebSocket│ │高德地图API│
        │    API    │ │  服务器   │ │          │
        └───────────┘ └──────────┘ └──────────┘
                │           │
                └─────┬─────┘
                      ▼
            ┌──────────────────┐
            │   后端服务集群     │
            │  ┌─────────────┐ │
            │  │  业务逻辑层  │ │
            │  └─────────────┘ │
            │  ┌─────────────┐ │
            │  │  数据访问层  │ │
            │  └─────────────┘ │
            └──────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │    数据存储层     │
            │  ┌────┐  ┌────┐ │
            │  │MySQL│ │Redis│ │
            │  └────┘  └────┘ │
            └──────────────────┘
```

## 🏗️ 前端架构

### 分层架构

```
┌────────────────────────────────────────┐
│          表现层 (Presentation)          │
│  ┌──────────────────────────────────┐  │
│  │       Vue 3 组件                  │  │
│  │  - MapView.vue                   │  │
│  │  - StationDrawer.vue             │  │
│  │  - ChargingView.vue              │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
                   │
┌────────────────────────────────────────┐
│          状态管理层 (State)             │
│  ┌──────────────────────────────────┐  │
│  │       Pinia Stores               │  │
│  │  - appStore (全局状态)            │  │
│  │  - stationStore (充电站状态)      │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
                   │
┌────────────────────────────────────────┐
│         服务层 (Services)               │
│  ┌──────────────────────────────────┐  │
│  │  - amapService (地图服务)         │  │
│  │  - wsService (WebSocket服务)     │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
                   │
┌────────────────────────────────────────┐
│         数据访问层 (API)                │
│  ┌──────────────────────────────────┐  │
│  │  - request (HTTP客户端)           │  │
│  │  - stationApi (充电站API)         │  │
│  │  - mockData (Mock数据)            │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### 技术栈选型理由

#### Vue 3 + Composition API
- **优势**：更好的TypeScript支持、更灵活的代码组织、更好的性能
- **适用场景**：复杂的状态管理和业务逻辑

#### Pinia
- **优势**：轻量级、完美的TypeScript支持、开发工具友好
- **对比Vuex**：更简洁的API、更好的模块化

#### Vite
- **优势**：极快的冷启动、即时的模块热更新、优化的构建性能
- **对比Webpack**：开发体验更好、构建速度更快

#### TailwindCSS
- **优势**：原子化CSS、快速开发、体积优化、响应式设计
- **适用场景**：快速构建统一风格的UI

#### 高德地图
- **优势**：国内地图数据最准确、文档完善、功能丰富
- **对比百度地图**：更好的移动端体验

## 📊 数据流

### 状态管理流程

```
用户操作
   │
   ▼
┌─────────────┐
│ Vue Component│
└─────────────┘
   │ dispatch action
   ▼
┌─────────────┐
│ Pinia Store │
└─────────────┘
   │ call API
   ▼
┌─────────────┐
│  API Layer  │
└─────────────┘
   │ HTTP/WS
   ▼
┌─────────────┐
│   Backend   │
└─────────────┘
   │ response
   ▼
┌─────────────┐
│ Pinia Store │ ──mutation──> State Update
└─────────────┘
   │ reactive
   ▼
┌─────────────┐
│ Vue Component│ ──render──> UI Update
└─────────────┘
```

### WebSocket实时更新流程

```
┌─────────────┐
│   Backend   │
│  (推送消息)  │
└─────────────┘
       │
       ▼
┌──────────────┐
│ WebSocket    │
│  Connection  │
└──────────────┘
       │
       ▼
┌──────────────┐
│ wsService    │ ──解析消息──> 
│ (消息分发)    │
└──────────────┘
       │
       ▼
┌──────────────┐
│ Event Handler│
│ (业务处理)    │
└──────────────┘
       │
       ▼
┌──────────────┐
│ Pinia Store  │ ──更新状态──>
│ (状态更新)    │
└──────────────┘
       │
       ▼
┌──────────────┐
│  Component   │ ──平滑动画──> UI更新
│  (响应式更新) │
└──────────────┘
```

## 🎨 组件设计

### 组件层次结构

```
App.vue
├── MapView (地图主页)
│   ├── MapComponent (地图组件)
│   │   ├── Marker (标记)
│   │   ├── Cluster (聚合)
│   │   └── InfoWindow (信息窗)
│   ├── SearchBar (搜索栏)
│   ├── StationList (站点列表)
│   └── StationDrawer (详情抽屉)
│       └── ChargerList (充电桩列表)
├── StationDetail (站点详情页)
│   ├── MiniMap (小地图)
│   ├── PriceInfo (价格信息)
│   └── ChargerGrid (充电桩网格)
├── ChargingView (充电页面)
│   ├── ChargingAnimation (充电动画)
│   ├── StatusCard (状态卡片)
│   └── DetailList (详情列表)
├── PaymentView (支付页面)
│   ├── OrderInfo (订单信息)
│   ├── PaymentMethod (支付方式)
│   └── SuccessAnimation (成功动画)
└── HistoryView (历史记录)
    ├── StatsCard (统计卡片)
    └── HistoryList (历史列表)
```

### 组件设计原则

1. **单一职责**：每个组件只负责一个功能
2. **高内聚低耦合**：组件内部逻辑完整，组件间依赖少
3. **可复用性**：通用组件抽离，便于复用
4. **可测试性**：组件逻辑清晰，易于编写测试

## 🚀 性能优化

### 1. 首屏加载优化

```javascript
// 路由懒加载
{
  path: '/station/:id',
  component: () => import('@/views/StationDetail.vue')
}

// 组件懒加载
const ChargingView = defineAsyncComponent(() =>
  import('@/views/ChargingView.vue')
)

// 代码分割
export default {
  manualChunks: {
    'vue-vendor': ['vue', 'vue-router', 'pinia'],
    'map-vendor': ['@amap/amap-jsapi-loader']
  }
}
```

### 2. 地图性能优化

```javascript
// 标记聚合
new AMap.MarkerClusterer(map, markers, {
  gridSize: 60,
  minClusterSize: 3
})

// 视口加载
const bounds = map.getBounds()
loadStations(bounds) // 仅加载可见区域

// 防抖处理
debounce(() => {
  loadStations(map.getBounds())
}, 500)
```

### 3. 状态更新优化

```javascript
// 增量更新
function updateStationStatus(updates) {
  updates.forEach(update => {
    const station = stations.find(s => s.id === update.id)
    if (station) {
      Object.assign(station, update) // 仅更新变化的字段
    }
  })
}

// 节流推送
throttle(() => {
  pushStatusUpdate()
}, 1000)
```

### 4. 缓存策略

```javascript
// Service Worker缓存
workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/webapi\.amap\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'amap-cache',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 7
        }
      }
    }
  ]
}
```

## 🔒 安全设计

### 1. API安全

```javascript
// Token认证
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 请求签名
const sign = generateSign(params, secret)
config.headers['X-Sign'] = sign
```

### 2. XSS防护

```javascript
// Vue自动转义
<div>{{ userInput }}</div> // 自动转义

// 手动转义
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}
```

### 3. 数据加密

```javascript
// 敏感信息加密
import CryptoJS from 'crypto-js'

function encrypt(data, key) {
  return CryptoJS.AES.encrypt(data, key).toString()
}

function decrypt(encrypted, key) {
  const bytes = CryptoJS.AES.decrypt(encrypted, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}
```

## 📱 移动端适配

### 1. 视口配置

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### 2. 安全区域适配

```css
/* 适配iPhone刘海屏 */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 3. 触控优化

```css
/* 禁用点击高亮 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* 禁用长按选择 */
.map-container {
  -webkit-user-select: none;
  user-select: none;
}
```

### 4. 手势支持

```javascript
// 地图手势配置
{
  dragEnable: true,      // 拖拽
  zoomEnable: true,      // 缩放
  touchZoom: true,       // 触摸缩放
  touchZoomCenter: 1     // 双指缩放中心点
}
```

## 🧪 测试策略

### 1. 单元测试

```javascript
// Store测试
describe('Station Store', () => {
  it('should update station status', () => {
    const store = useStationStore()
    store.updateStationStatus([{
      id: 'station_1',
      availableCount: 10
    }])
    expect(store.stations[0].availableCount).toBe(10)
  })
})
```

### 2. 组件测试

```javascript
// 组件测试
describe('StationCard', () => {
  it('should render station info', () => {
    const wrapper = mount(StationCard, {
      props: { station: mockStation }
    })
    expect(wrapper.text()).toContain(mockStation.name)
  })
})
```

### 3. E2E测试

```javascript
// Playwright测试
test('should search and select station', async ({ page }) => {
  await page.goto('/')
  await page.fill('input[placeholder="搜索充电站"]', '北京')
  await page.click('text=北京商场中心充电站')
  await expect(page.locator('.station-detail')).toBeVisible()
})
```

## 📊 监控与日志

### 1. 性能监控

```javascript
// Performance API
const loadTime = performance.now()
console.log(`页面加载时间: ${loadTime}ms`)

// 自定义性能指标
performance.mark('map-load-start')
// ... 地图加载
performance.mark('map-load-end')
performance.measure('map-load', 'map-load-start', 'map-load-end')
```

### 2. 错误监控

```javascript
// 全局错误捕获
app.config.errorHandler = (err, instance, info) => {
  console.error('Error:', err)
  console.error('Info:', info)
  // 上报到监控系统
  reportError(err, info)
}

// Promise错误捕获
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason)
  reportError(event.reason)
})
```

### 3. 日志系统

```javascript
// 日志工具
class Logger {
  static log(level, message, data) {
    const log = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    
    console[level](message, data)
    
    // 上报到后端
    if (level === 'error') {
      this.report(log)
    }
  }
  
  static report(log) {
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(log)
    })
  }
}
```

## 🔄 版本管理

### Git分支策略

```
main (生产环境)
  │
  ├── develop (开发环境)
  │   │
  │   ├── feature/map-optimization (功能分支)
  │   ├── feature/payment (功能分支)
  │   └── hotfix/map-crash (热修复分支)
  │
  └── release/v1.0.0 (发布分支)
```

### 版本号规则

遵循语义化版本 (Semantic Versioning):

- **MAJOR**: 不兼容的API修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

例如: `v1.2.3`

## 📝 总结

本架构设计注重:

1. **可维护性**: 清晰的分层架构和代码组织
2. **可扩展性**: 模块化设计，易于添加新功能
3. **性能**: 多层次的性能优化策略
4. **安全性**: 完善的安全防护机制
5. **可测试性**: 全面的测试覆盖
6. **用户体验**: 流畅的交互和快速的响应

通过合理的架构设计，确保系统的稳定性、性能和可维护性。

---

**文档维护**: 架构团队  
**最后更新**: 2024-10-17

