# 标记调试指南

## 🐛 问题：地图上没有显示充电站标记

### 已修复的问题

✅ **markerClusterer.value.clearMarkers is not a function**
- 添加了类型检查
- 添加了try-catch保护
- 添加了降级方案

---

## 🔍 调试步骤

### 1. 刷新浏览器

按 `Ctrl+Shift+R` 强制刷新（清除缓存）

### 2. 打开控制台（F12）

检查是否有以下输出：

```
✅ 已生成合肥市 2000 个固定充电站
✅ 返回 XXX 个充电站数据（边界过滤）
✅ 成功加载 XXX 个充电站
✅ 直接显示 XXX 个充电站标记
✅ 已加载 XXX 个充电站标记（直接显示）
```

### 3. 在控制台执行调试命令

```javascript
// 检查Vue实例和Store
const app = document.querySelector('#app').__vueParentComponent
console.log('Vue实例:', app)

// 检查充电站数据
const stationData = window.mockStationData || []
console.log('充电站总数:', stationData.length)

// 检查地图对象
console.log('AMap对象:', window.AMap)

// 强制刷新标记（在控制台粘贴执行）
if (window.map) {
  console.log('地图中心:', window.map.getCenter())
  console.log('地图缩放:', window.map.getZoom())
  console.log('地图边界:', window.map.getBounds())
}
```

### 4. 检查标记元素

在浏览器Elements标签中查找：

```html
<!-- 应该能看到类似这样的标记元素 -->
<div class="charging-marker" style="...">
  <div style="background: ...">
    <div>⚡ ¥1.50/度</div>
    <div>8/12</div>
  </div>
</div>
```

---

## 🔧 手动修复方案

### 如果标记仍然不显示

#### 方案1：禁用聚合，强制直接显示

修改 `src/components/MapView.vue`：

```javascript
// 找到这一行（约第337行）
const shouldCluster = zoom < 14 && markers.value.length > 200

// 临时改为
const shouldCluster = false // 强制禁用聚合
```

#### 方案2：降低聚合阈值

```javascript
// 找到这一行
const shouldCluster = zoom < 14 && markers.value.length > 200

// 改为
const shouldCluster = zoom < 10 && markers.value.length > 1000
```

#### 方案3：使用简单的标记

在 `updateMarkers()` 函数中，临时使用简单图标：

```javascript
const marker = new AMap.value.Marker({
  position: [station.lng, station.lat],
  // 临时使用默认图标
  icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
  extData: { station }
})
```

---

## ✅ 预期效果

修复后，您应该看到：

### 地图上的标记

```
地图区域内显示多个彩色卡片标记：

┌──────────────┐
│ ⚡ ¥1.54/度 │ ← 绿色（空闲充足）
│ ───────────  │
│   6/7        │
└─────▼────────┘

┌──────────────┐
│ ⚡ ¥1.61/度 │ ← 黄色（空闲紧张）
│ ───────────  │
│   1/8        │
└─────▼────────┘

┌──────────────┐
│ ⚡ ¥1.62/度 │ ← 红色（几乎满载）
│ ───────────  │
│   1/6        │
└─────▼────────┘
```

### 控制台输出

```
已生成合肥市 2000 个固定充电站
成功加载 2000 个充电站
直接显示 234 个充电站标记
已加载 234 个充电站标记（直接显示）
```

---

## 🧪 测试清单

- [ ] 地图正常加载
- [ ] 可以看到蓝色定位点（如果定位成功）
- [ ] 地图上显示充电站标记
- [ ] 标记显示：图标+价格+空闲数
- [ ] 标记有不同颜色（绿/黄/红/灰）
- [ ] 点击标记显示信息窗
- [ ] 缩放地图标记不消失
- [ ] 拖动地图加载新区域标记

---

## 💡 如果还是不显示

### 检查点1：数据是否加载

控制台应该显示：
```
✓ 返回 XXX 个充电站数据
```

如果没有，说明数据没加载成功。

### 检查点2：标记是否创建

控制台应该显示：
```
✓ 已加载 XXX 个充电站标记
```

如果没有，说明标记创建失败。

### 检查点3：地图边界

```javascript
// 在控制台执行
const bounds = map.getBounds()
console.log('地图边界:', {
  sw: bounds.getSouthWest(),
  ne: bounds.getNorthEast()
})

// 检查边界是否包含合肥市（31.7-31.9, 117.1-117.4）
```

### 检查点4：标记HTML

```javascript
// 在控制台执行
const testStation = {
  availableCount: 8,
  totalCount: 12,
  pricePerKWh: '1.50'
}

// 手动创建一个标记测试
const marker = new AMap.Marker({
  position: [117.2272, 31.8206],
  content: '<div style="background:red;width:50px;height:50px;border-radius:50%;">TEST</div>',
  map: window.map
})

// 如果能看到红色圆点，说明标记创建机制正常
```

---

## 📞 获取支持

如果以上方法都无法解决，请提供：

1. **浏览器控制台完整输出**（截图或复制文本）
2. **浏览器版本**（Chrome/Edge等）
3. **操作系统**（Windows版本）
4. **网络状态**（是否能加载高德地图）

---

**创建时间**: 2024-10-17  
**针对问题**: 地图标记不显示  
**状态**: 🔧 调试中

