// Mock充电站数据生成器
function generateStations(count = 2000) {
  const stations = []
  
  // 以几个城市为中心生成数据
  const cities = [
    { name: '北京', lat: 39.9042, lng: 116.4074, count: 500 },
    { name: '上海', lat: 31.2304, lng: 121.4737, count: 400 },
    { name: '广州', lat: 23.1291, lng: 113.2644, count: 300 },
    { name: '深圳', lat: 22.5431, lng: 114.0579, count: 300 },
    { name: '杭州', lat: 30.2741, lng: 120.1551, count: 250 },
    { name: '成都', lat: 30.5728, lng: 104.0668, count: 250 }
  ]
  
  const statuses = ['available', 'busy', 'offline', 'maintenance']
  const statusWeights = [0.5, 0.3, 0.15, 0.05] // 权重
  
  let id = 1
  
  cities.forEach(city => {
    for (let i = 0; i < city.count; i++) {
      // 在城市中心周围随机分布（约50km范围）
      const latOffset = (Math.random() - 0.5) * 0.5
      const lngOffset = (Math.random() - 0.5) * 0.5
      
      const lat = city.lat + latOffset
      const lng = city.lng + lngOffset
      
      // 随机选择状态（按权重）
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
      
      const totalCount = Math.floor(Math.random() * 12) + 4 // 4-16个充电桩
      let availableCount, chargingCount
      
      if (status === 'available') {
        availableCount = Math.floor(totalCount * (0.5 + Math.random() * 0.5))
        chargingCount = Math.floor((totalCount - availableCount) * Math.random())
      } else if (status === 'busy') {
        chargingCount = Math.floor(totalCount * (0.7 + Math.random() * 0.3))
        availableCount = Math.max(0, totalCount - chargingCount - Math.floor(Math.random() * 3))
      } else if (status === 'offline') {
        availableCount = 0
        chargingCount = 0
      } else { // maintenance
        availableCount = 0
        chargingCount = 0
      }
      
      const station = {
        id: `station_${id}`,
        name: `${city.name}${generateStationName()}`,
        lat,
        lng,
        address: `${city.name}市${generateAddress()}`,
        status,
        totalCount,
        availableCount,
        chargingCount,
        offlineCount: totalCount - availableCount - chargingCount,
        hasAC: Math.random() > 0.3,
        hasDC: Math.random() > 0.2,
        maxPower: Math.random() > 0.5 ? 120 : 60,
        pricePerKWh: (Math.random() * 0.5 + 1.2).toFixed(2),
        serviceFee: (Math.random() * 0.3 + 0.5).toFixed(2),
        distance: null, // 运行时计算
        operatorId: Math.floor(Math.random() * 5) + 1
      }
      
      stations.push(station)
      id++
    }
  })
  
  return stations
}

function generateStationName() {
  const types = ['商场', '科技园', '住宅区', '工业园', '医院', '学校', '停车场', '服务区']
  const adjectives = ['中心', '东区', '西区', '南区', '北区', '广场', '大厦', '园区']
  
  const type = types[Math.floor(Math.random() * types.length)]
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  
  return `${type}${adj}充电站`
}

function generateAddress() {
  const districts = ['朝阳区', '海淀区', '浦东新区', '黄浦区', '天河区', '南山区', '西湖区', '武侯区']
  const streets = ['中山路', '建国路', '人民路', '解放路', '长江路', '黄河路', '东风路', '西湖路']
  
  const district = districts[Math.floor(Math.random() * districts.length)]
  const street = streets[Math.floor(Math.random() * streets.length)]
  const number = Math.floor(Math.random() * 999) + 1
  
  return `${district}${street}${number}号`
}

// 生成Mock数据
export const mockStationData = {
  stations: generateStations(2000),
  operators: [
    { id: 1, name: '国家电网', logo: '' },
    { id: 2, name: '南方电网', logo: '' },
    { id: 3, name: '特来电', logo: '' },
    { id: 4, name: '星星充电', logo: '' },
    { id: 5, name: '小桔充电', logo: '' }
  ]
}

// 模拟状态更新
export function generateStatusUpdate(stationIds) {
  return stationIds.map(id => {
    const station = mockStationData.stations.find(s => s.id === id)
    if (!station) return null
    
    // 随机改变状态
    const change = Math.floor(Math.random() * 3) - 1 // -1, 0, 1
    let newAvailableCount = Math.max(0, Math.min(station.totalCount, station.availableCount + change))
    let newChargingCount = station.totalCount - newAvailableCount - station.offlineCount
    
    // 确定新状态
    let newStatus = 'available'
    if (newAvailableCount === 0 && station.offlineCount === station.totalCount) {
      newStatus = 'offline'
    } else if (newAvailableCount === 0) {
      newStatus = 'busy'
    } else if (newAvailableCount > station.totalCount * 0.5) {
      newStatus = 'available'
    } else {
      newStatus = 'busy'
    }
    
    return {
      id,
      status: newStatus,
      availableCount: newAvailableCount,
      chargingCount: newChargingCount,
      offlineCount: station.offlineCount
    }
  }).filter(Boolean)
}

export default mockStationData

