# 动态数据生成说明

## 🎯 设计理念

充电站数据采用**基于位置的动态生成**策略，而不是预先生成固定数据。这样可以确保：

✅ 无论用户在哪里定位，都能看到附近的充电站  
✅ 数据始终与地图当前位置相关  
✅ 减少内存占用，按需生成  
✅ 支持无限范围的地图探索  

---

## 🔄 工作原理

### 1. 初始化加载

```javascript
// 应用启动时
地图加载 → 获取地图边界(bounds) → 动态生成该区域充电站 → 显示标记
```

**默认位置**：合肥市中心 (31.8206, 117.2272)  
**初始范围**：半径约30km  
**生成数量**：500个充电站

### 2. 定位成功

```javascript
// 用户允许定位后
获取GPS坐标 → 移动地图到当前位置 → 获取新的地图边界 → 生成当前位置周围充电站 → 显示标记
```

**示例**：
- 用户在北京 → 生成北京周围充电站
- 用户在上海 → 生成上海周围充电站
- 用户在任何位置 → 生成该位置周围充电站

### 3. 拖动地图

```javascript
// 用户拖动地图到新区域
地图移动 → 获取新边界 → 检查缓存 → 如果没有则动态生成 → 显示标记
```

**特点**：
- 500ms防抖，避免频繁生成
- 区域缓存，相同区域不重复生成
- 平滑过渡，无感知加载

---

## 📊 数据生成策略

### 基于地图边界生成

```javascript
function getStationsByBounds(minLat, maxLat, minLng, maxLng) {
  // 1. 计算区域面积
  const area = (maxLat - minLat) * (maxLng - minLng)
  
  // 2. 根据面积决定充电站密度
  const count = Math.floor(area * 150) // 每0.01平方度约150个
  
  // 3. 在区域内均匀分布生成
  for (let i = 0; i < count; i++) {
    const lat = minLat + Math.random() * (maxLat - minLat)
    const lng = minLng + Math.random() * (maxLng - minLng)
    // ... 生成充电站
  }
}
```

### 基于中心点生成（定位后）

```javascript
function generateStationsByLocation(centerLat, centerLng, count, radius) {
  // 使用极坐标实现均匀圆形分布
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.sqrt(Math.random()) * radius
    
    const lat = centerLat + distance * Math.cos(angle)
    const lng = centerLng + distance * Math.sin(angle)
    // ... 生成充电站
  }
}
```

---

## 🗺️ 城市识别

系统会根据坐标自动识别最近的城市：

```javascript
支持的城市：
- 北京 (39.90, 116.40)
- 上海 (31.23, 121.47)
- 广州 (23.13, 113.26)
- 深圳 (22.54, 114.05)
- 杭州 (30.27, 120.15)
- 南京 (32.06, 118.79)
- 武汉 (30.59, 114.30)
- 成都 (30.57, 104.06)
- 重庆 (29.56, 106.55)
- 天津 (39.34, 117.36)
- 西安 (34.34, 108.93)
- 合肥 (31.82, 117.22) ← 默认
- 郑州 (34.74, 113.62)
- 长沙 (28.22, 112.93)
- 济南 (36.65, 117.12)
- 青岛 (36.06, 120.38)
```

**自动匹配**：
- 计算坐标到各城市的距离
- 选择最近的城市名称
- 生成该城市风格的地址

---

## 💾 缓存机制

### 区域网格缓存

```javascript
// 将地图划分为0.1度×0.1度的网格
网格Key = `${Math.floor(lat * 10)}_${Math.floor(lng * 10)}`

示例：
- 合肥 (31.82, 117.22) → 网格 "318_1172"
- 北京 (39.90, 116.40) → 网格 "399_1164"
```

**优势**：
- ✅ 相同区域不重复生成
- ✅ 快速查找已生成数据
- ✅ 内存占用可控

### 缓存策略

```
首次访问区域 → 动态生成 → 存入缓存 → 返回数据
                                ↓
再次访问相同区域 → 从缓存读取 → 快速返回
```

---

## 🎲 数据特征

### 充电站属性

每个充电站包含：

```javascript
{
  id: "station_123",           // 唯一ID
  name: "合肥商场中心充电站",   // 动态生成名称
  lat: 31.8234,                 // 纬度
  lng: 117.2156,                // 经度
  address: "合肥市蜀山区金寨路456号",
  status: "available",          // available/busy/offline/maintenance
  totalCount: 12,               // 总充电桩数（4-16随机）
  availableCount: 8,            // 空闲数
  chargingCount: 3,             // 充电中
  offlineCount: 1,              // 离线数
  hasAC: true,                  // 有交流桩
  hasDC: true,                  // 有直流桩
  maxPower: 120,                // 最大功率(kW)
  pricePerKWh: "1.50",          // 电价
  serviceFee: "0.80",           // 服务费
  operatorId: 1                 // 运营商ID
}
```

### 状态分布（权重随机）

| 状态 | 权重 | 说明 |
|-----|------|------|
| available | 50% | 可用 |
| busy | 30% | 繁忙 |
| offline | 15% | 离线 |
| maintenance | 5% | 维护中 |

### 充电桩数量

- **总数**：4-16个（随机）
- **空闲数**：根据状态计算
  - available状态：50%-100%空闲
  - busy状态：0-30%空闲
  - offline/maintenance：0空闲

---

## 🔍 矢量标注逻辑

### 标记生成流程

```
获取充电站数据
    ↓
遍历每个充电站
    ↓
计算空闲率 (availableCount / totalCount)
    ↓
根据空闲率选择颜色
    ↓
生成HTML标记内容
    ↓
创建AMap.Marker对象
    ↓
添加到地图或聚合器
```

### 颜色计算

```javascript
空闲率 = 空闲桩数 / 总桩数

if (总桩数 === 0) {
  颜色 = 灰色
} else if (空闲率 >= 0.5) {
  颜色 = 绿色 (#10b981)
} else if (空闲率 >= 0.2) {
  颜色 = 黄色 (#f59e0b)
} else {
  颜色 = 红色 (#ef4444)
}
```

### 标记内容

```html
<div class="charging-marker">
  <div style="background: ${颜色}; ...">
    <div>⚡ ¥${价格}/度</div>
    <div>${空闲数}/${总数}</div>
  </div>
  <div>▼</div>
  <div>●</div>
</div>
```

---

## 🎮 使用场景

### 场景1：应用启动（合肥）

```
1. 地图加载 → 中心点：合肥 (31.82, 117.22)
2. 获取边界 → bounds: {...}
3. 动态生成 → 在边界内生成约150-300个充电站
4. 显示标记 → 根据缩放级别显示聚合或单个标记
```

**结果**：看到合肥市区的充电站

### 场景2：定位成功（用户实际位置）

```
1. GPS定位 → 例如：上海 (31.23, 121.47)
2. 移动地图 → 中心点移到上海
3. 获取新边界 → bounds: {...}
4. 动态生成 → 在上海周围生成充电站
5. 显示标记 → 看到上海的充电站
```

**结果**：看到用户当前位置周围的充电站

### 场景3：拖动地图（探索其他城市）

```
1. 用户拖动 → 从合肥拖到南京
2. 地图移动 → 新中心点：南京
3. 延迟500ms → 防抖处理
4. 获取边界 → 南京区域的bounds
5. 检查缓存 → 该区域首次访问
6. 动态生成 → 生成南京的充电站
7. 缓存结果 → 下次访问直接使用
8. 显示标记 → 看到南京的充电站
```

**结果**：无论拖到哪里，都能看到该区域的充电站

---

## 📈 性能优化

### 1. 区域缓存

```javascript
已访问区域：
- 合肥市区 (318_1172) → 缓存 ✓
- 包河区 (318_1173) → 缓存 ✓
- 蜀山区 (318_1171) → 缓存 ✓

未访问区域：
- 南京市区 (320_1187) → 需生成
```

**优势**：
- 相同区域秒加载
- 减少重复计算
- 内存占用可控

### 2. 按需生成

```
只生成可见区域的数据，不是全国所有城市
```

**对比**：
- ❌ 旧方案：预生成2000个固定位置 → 大部分不可见
- ✅ 新方案：根据视口生成150-300个 → 全部可见

### 3. 密度控制

```javascript
区域越大 → 生成越多（最多500个）
区域越小 → 生成越少
```

---

## 🧪 测试验证

### 测试步骤

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **访问HTTPS地址**
   ```
   https://localhost:3000
   ```

3. **允许定位权限**

4. **观察控制台输出**
   ```
   定位成功
   动态生成区域 XXX_XXX 的充电站
   返回 XXX 个充电站数据
   已加载 XXX 个充电站标记
   ```

5. **查看地图**
   - 应该能看到您当前位置周围的充电站标记
   - 标记颜色根据空闲率变化（绿/黄/红/灰）

6. **拖动地图**
   - 拖到任何位置
   - 等待500ms
   - 自动生成新区域的充电站

### 验证标记显示

**缩小地图（zoom 10-12）**：
- 应该看到聚合标记（圆形，显示数字）
- 不同颜色表示不同平均空闲率

**放大地图（zoom 14+）**：
- 应该看到完整的单个标记
- 显示图标、价格、空闲桩数
- 颜色根据空闲率变化

**点击标记**：
- 弹出信息窗
- 显示充电站详细信息

---

## 🎨 数据质量

### 真实性

虽然是Mock数据，但具有以下特点：

1. **地理真实性**
   - 坐标在实际城市范围内
   - 均匀分布，符合真实分布规律

2. **数据合理性**
   - 充电桩数量：4-16个（符合实际）
   - 价格范围：1.2-1.7元/度（符合市场）
   - 服务费：0.5-0.8元/度（合理范围）
   - 状态分布：50%可用（符合实际）

3. **命名真实性**
   - 根据城市生成对应地名
   - 合肥的站点用合肥的路名
   - 北京的站点用北京的路名

### 示例数据

**合肥市充电站**：
```
合肥商场中心充电站
地址：合肥市蜀山区金寨路123号
空闲：8/12
价格：¥1.50/度
```

**北京市充电站**：
```
北京科技园广场充电站
地址：北京市朝阳区建国路456号
空闲：5/10
价格：¥1.65/度
```

---

## 🔧 技术实现

### 核心函数

#### 1. `generateStationsByBounds`
根据地图边界动态生成充电站

```javascript
参数：
- minLat, maxLat: 纬度范围
- minLng, maxLng: 经度范围
- density: 密度系数（默认150）

返回：
- Array<Station>: 充电站数组
```

#### 2. `generateStationsAroundLocation`
根据中心点生成周围的充电站

```javascript
参数：
- lat, lng: 中心点坐标
- count: 生成数量（默认500）
- radiusKm: 半径（默认30km）

返回：
- Array<Station>: 充电站数组
```

#### 3. `getCityNameByCoordinates`
根据坐标识别城市

```javascript
参数：
- lat, lng: 坐标

返回：
- string: 城市名称
```

#### 4. `getStationsByBounds`（带缓存）
获取或生成区域充电站

```javascript
参数：
- minLat, maxLat, minLng, maxLng

返回：
- Array<Station>: 充电站数组

特性：
- 自动缓存
- 重复调用直接从缓存返回
```

---

## 📍 与定位的关系

### 定位成功后的流程

```
1. 获取GPS坐标 (lat, lng)
   ↓
2. 保存到store
   stationStore.setUserLocation({lat, lng})
   ↓
3. 移动地图中心
   map.setCenter([lng, lat])
   ↓
4. 触发地图complete事件
   ↓
5. 调用loadStations()
   ↓
6. 获取当前地图边界
   const bounds = map.getBounds()
   ↓
7. 调用API获取充电站
   stationApi.getStations({
     minLat: bounds.sw.lat,
     maxLat: bounds.ne.lat,
     minLng: bounds.sw.lng,
     maxLng: bounds.ne.lng
   })
   ↓
8. 动态生成该位置周围的充电站
   getStationsByBounds(...)
   ↓
9. 创建标记并显示
   updateMarkers()
```

### 关键代码位置

**定位处理**：`src/components/MapView.vue` (line 569-630)
```javascript
async function handleLocation() {
  const position = await amapService.getCurrentPosition()
  stationStore.setUserLocation(position)
  map.value.setCenter([position.lng, position.lat])
  
  // 定位成功后重新加载充电站
  await loadStations()
}
```

**数据加载**：`src/components/MapView.vue` (line 250-292)
```javascript
async function loadStations() {
  const bounds = map.value.getBounds()
  await stationStore.fetchStations({
    minLat: bounds.sw.lat,
    maxLat: bounds.ne.lat,
    minLng: bounds.sw.lng,
    maxLng: bounds.ne.lng
  })
  updateMarkers()
}
```

**动态生成**：`src/api/mock/station-mock.js` (line 118-197)
```javascript
function generateStationsByBounds(minLat, maxLat, minLng, maxLng) {
  // 在边界内随机分布生成充电站
}
```

---

## 🎯 优势总结

### 旧方案（预生成）

```
❌ 数据固定在几个城市
❌ 其他位置看不到充电站
❌ 内存占用大（2000个站点）
❌ 无法适应不同位置
```

### 新方案（动态生成）

```
✅ 任何位置都能看到充电站
✅ 数据跟随用户位置
✅ 内存占用小（按需生成）
✅ 支持全国范围探索
✅ 缓存机制提升性能
```

---

## 📝 使用说明

### 开发者

如需调整充电站密度：

```javascript
// src/api/mock/station-mock.js

// 调整密度系数（默认150）
function generateStationsByBounds(minLat, maxLat, minLng, maxLng, density = 150) {
  // density越大，充电站越密集
  // 建议范围：50-300
}
```

### 测试者

1. **允许定位**：让应用定位到您的真实位置
2. **查看标记**：应该能看到周围的充电站
3. **拖动地图**：探索不同区域
4. **观察生成**：控制台会显示动态生成日志

---

## 🚀 下一步

当前实现已经完成，您可以：

1. ✅ 在任何位置定位并看到附近充电站
2. ✅ 拖动地图探索不同区域
3. ✅ 自动生成+缓存机制保证性能
4. ✅ 标记颜色根据空闲率智能变化

---

**更新时间**: 2024-10-17  
**版本**: v2.0.0  
**状态**: ✅ 完成

