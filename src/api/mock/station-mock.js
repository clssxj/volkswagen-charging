// 合肥市充电站静态数据生成（只在应用启动时生成一次）
function generateHefeiStations() {
  const stations = []
  
  // 合肥市中心坐标（市政府/天鹅湖附近）
  const centerLat = 31.8206
  const centerLng = 117.2272
  
  // 总数125个，均匀分布
  const totalCount = 125
  
  const statuses = ['available', 'busy', 'offline', 'maintenance']
  const statusWeights = [0.5, 0.3, 0.15, 0.05]
  
  // 区域定义（用于根据坐标判断所属区域）
  const districts = [
    { name: '蜀山区', lat: 31.8500, lng: 117.2600 },
    { name: '庐阳区', lat: 31.8800, lng: 117.2650 },
    { name: '瑶海区', lat: 31.8600, lng: 117.3200 },
    { name: '包河区', lat: 31.7800, lng: 117.3100 },
    { name: '高新区', lat: 31.8400, lng: 117.1700 },
    { name: '经开区', lat: 31.7700, lng: 117.2200 },
    { name: '新站区', lat: 31.9200, lng: 117.3000 },
    { name: '滨湖新区', lat: 31.7200, lng: 117.2800 }
  ]
  
  let id = 1
  
  for (let i = 0; i < totalCount; i++) {
    // 使用均匀分布生成坐标（在市区范围内平均分布）
    // 范围：市中心周围±0.1度（约10km半径）
    const latOffset = (Math.random() - 0.5) * 0.2 // -0.1 到 +0.1
    const lngOffset = (Math.random() - 0.5) * 0.2 // -0.1 到 +0.1
    
    const lat = parseFloat((centerLat + latOffset).toFixed(6))
    const lng = parseFloat((centerLng + lngOffset).toFixed(6))
    
    // 根据坐标判断最近的区域
    let nearestDistrict = districts[0]
    let minDistance = Infinity
    
    districts.forEach(district => {
      const distance = Math.sqrt(
        Math.pow(lat - district.lat, 2) + Math.pow(lng - district.lng, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestDistrict = district
      }
    })
    
    // 随机选择初始状态
    const random = Math.random()
    let cumulativeWeight = 0
    let status = 'available'
    for (let j = 0; j < statuses.length; j++) {
      cumulativeWeight += statusWeights[j]
      if (random <= cumulativeWeight) {
        status = statuses[j]
        break
      }
    }
    
    // 固定的充电桩总数（不会变化）
    const stationTotalCount = Math.floor(Math.random() * 12) + 4
    let availableCount, chargingCount
    
    if (status === 'available') {
      availableCount = Math.floor(stationTotalCount * (0.5 + Math.random() * 0.5))
      chargingCount = Math.floor((stationTotalCount - availableCount) * Math.random())
    } else if (status === 'busy') {
      chargingCount = Math.floor(stationTotalCount * (0.7 + Math.random() * 0.3))
      availableCount = Math.max(0, stationTotalCount - chargingCount - Math.floor(Math.random() * 3))
    } else if (status === 'offline') {
      availableCount = 0
      chargingCount = 0
    } else {
      availableCount = 0
      chargingCount = 0
    }
    
    // 基础电价（1.3-1.6元/度）
    const basePricePerKWh = parseFloat((Math.random() * 0.3 + 1.3).toFixed(2))
    
    const station = {
      id: `hefei_station_${id}`,
      name: `合肥${generateStationName()}`,
      lat, // 固定坐标
      lng, // 固定坐标
      address: `合肥市${nearestDistrict.name}${generateAddress()}`,
      status,
      totalCount: stationTotalCount, // 固定：总充电桩数不变
      availableCount, // 动态：会定时变化
      chargingCount, // 动态：会定时变化
      offlineCount: stationTotalCount - availableCount - chargingCount,
      hasAC: Math.random() > 0.3,
      hasDC: Math.random() > 0.2,
      maxPower: Math.random() > 0.5 ? 120 : 60,
      basePricePerKWh, // 基础价格（不变）
      pricePerKWh: basePricePerKWh, // 当前价格（会根据时段变化）
      serviceFee: parseFloat((Math.random() * 0.2 + 0.6).toFixed(2)), // 固定服务费
      distance: null,
      operatorId: Math.floor(Math.random() * 5) + 1,
      _lastAvailableUpdate: Date.now(), // 记录上次数量更新时间
      _lastPriceUpdate: Date.now() // 记录上次价格更新时间
    }
    
    stations.push(station)
    id++
  }
  
  console.log(`已生成合肥市 ${stations.length} 个固定充电站`)
  return stations
}

function generateStationName() {
  const types = [
    '商场', '科技园', '住宅区', '工业园', '医院', '学校', '停车场', '服务区',
    '购物中心', '写字楼', '酒店', '体育馆', '公园', '地铁站', '高铁站', '机场'
  ]
  const adjectives = [
    '中心', '东区', '西区', '南区', '北区', '广场', '大厦', '园区',
    '城', '汇', '港', '天地', '新城', '都会', '之光', '国际'
  ]
  
  const type = types[Math.floor(Math.random() * types.length)]
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  
  return `${type}${adj}充电站`
}

function generateAddress() {
  const streets = [
    '金寨路', '长江西路', '潜山路', '黄山路', '望江路', '芜湖路', '徽州大道', '马鞍山路',
    '习友路', '繁华大道', '锦绣大道', '宿松路', '太湖路', '屯溪路', '桐城路', '宣城路',
    '天鹅湖路', '怀宁路', '合作化路', '长江中路', '寿春路', '淮河路', '庐江路', '桐城南路'
  ]
  
  const street = streets[Math.floor(Math.random() * streets.length)]
  const number = Math.floor(Math.random() * 999) + 1
  
  return `${street}${number}号`
}

// 生成固定的合肥市充电站数据（只生成一次）
const HEFEI_STATIONS = generateHefeiStations()

// 根据时间段计算价格倍率
function getPriceMultiplierByTime() {
  const hour = new Date().getHours()
  
  // 峰谷电价
  if (hour >= 8 && hour < 11) {
    return 1.5 // 早高峰（8-11点）
  } else if (hour >= 17 && hour < 22) {
    return 1.6 // 晚高峰（17-22点）
  } else if (hour >= 0 && hour < 6) {
    return 0.7 // 深夜低谷（0-6点）
  } else {
    return 1.0 // 平时段
  }
}

// 更新充电站价格（根据时段）
export function updateStationPrices() {
  const multiplier = getPriceMultiplierByTime()
  const now = Date.now()
  
  HEFEI_STATIONS.forEach(station => {
    // 每小时更新一次价格
    if (now - station._lastPriceUpdate >= 3600000) { // 1小时
      station.pricePerKWh = (station.basePricePerKWh * multiplier).toFixed(2)
      station._lastPriceUpdate = now
    }
  })
}

// 更新充电站可用数量（模拟充电桩使用变化）
export function updateStationAvailability() {
  const now = Date.now()
  const updates = []
  
  HEFEI_STATIONS.forEach(station => {
    // 每10-15分钟随机更新一次
    const updateInterval = (10 + Math.random() * 5) * 60 * 1000 // 10-15分钟
    
    if (now - station._lastAvailableUpdate >= updateInterval) {
      // 随机变化 -3 到 +3
      const change = Math.floor(Math.random() * 7) - 3
      
      // 计算新的可用数量
      let newAvailableCount = station.availableCount + change
      newAvailableCount = Math.max(0, Math.min(station.totalCount, newAvailableCount))
      
      // 更新
      station.availableCount = newAvailableCount
      station.chargingCount = station.totalCount - newAvailableCount - station.offlineCount
      
      // 重新计算状态
      if (newAvailableCount === 0 && station.offlineCount === station.totalCount) {
        station.status = 'offline'
      } else if (newAvailableCount === 0) {
        station.status = 'busy'
      } else if (newAvailableCount > station.totalCount * 0.5) {
        station.status = 'available'
      } else {
        station.status = 'busy'
      }
      
      station._lastAvailableUpdate = now
      
      // 记录更新
      updates.push({
        id: station.id,
        status: station.status,
        availableCount: station.availableCount,
        chargingCount: station.chargingCount,
        offlineCount: station.offlineCount
      })
    }
  })
  
  return updates
}

// Mock数据对象
export const mockStationData = {
  stations: HEFEI_STATIONS, // 固定的2000个合肥充电站
  operators: [
    { id: 1, name: '国家电网', logo: '' },
    { id: 2, name: '南方电网', logo: '' },
    { id: 3, name: '特来电', logo: '' },
    { id: 4, name: '星星充电', logo: '' },
    { id: 5, name: '小桔充电', logo: '' }
  ]
}

// 模拟状态更新（WebSocket推送使用）
export function generateStatusUpdate(stationIds) {
  // 更新充电桩可用数量
  const updates = updateStationAvailability()
  
  // 如果指定了stationIds，只返回这些站点的更新
  if (stationIds && stationIds.length > 0) {
    return updates.filter(update => stationIds.includes(update.id))
  }
  
  return updates
}

export default mockStationData
