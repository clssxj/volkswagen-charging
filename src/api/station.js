import request, { createRetryableRequest } from './request'
import { mockStationData } from './mock/station-mock'

// 是否使用Mock数据
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || true

// 获取充电站列表
export const stationApi = {
  // 获取充电站列表（支持边界过滤）
  async getStations(params = {}) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 使用固定的合肥市2000个充电站数据
          let stations = mockStationData.stations
          
          // 如果有边界参数，进行过滤（不重新生成）
          if (params.minLat && params.maxLat && params.minLng && params.maxLng) {
            stations = mockStationData.stations.filter(station => 
              station.lat >= params.minLat &&
              station.lat <= params.maxLat &&
              station.lng >= params.minLng &&
              station.lng <= params.maxLng
            )
          }
          
          console.log(`返回 ${stations.length} 个充电站数据（边界过滤）`)
          resolve(stations)
        }, 200) // 减少延迟
      })
    }
    
    return request.get('/stations', { params })
  },

  // 获取充电站详情
  async getStationDetail(id) {
    if (USE_MOCK) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 从固定数据中查找
          const station = mockStationData.stations.find(s => s.id === id)
          if (station) {
            // 生成详细的充电桩信息
            const chargers = []
            const chargingCount = station.chargingCount || 0
            const availableCount = station.availableCount || station.totalCount
            
            for (let i = 0; i < station.totalCount; i++) {
              chargers.push({
                id: `${id}-charger-${i + 1}`,
                number: `${i + 1}号桩`,
                type: Math.random() > 0.5 ? 'DC' : 'AC',
                power: Math.random() > 0.5 ? 120 : 60,
                status: i < chargingCount ? 'charging' : (i < chargingCount + availableCount ? 'available' : 'offline'),
                voltage: Math.random() > 0.5 ? 380 : 220,
                current: Math.random() > 0.5 ? 250 : 125
              })
            }
            
            resolve({
              ...station,
              chargers,
              facilities: ['停车场', '便利店', '休息区', '卫生间'],
              openTime: '00:00-24:00',
              operatorName: '国家电网',
              rating: 4.5,
              reviewCount: 128
            })
          } else {
            reject(new Error('充电站不存在'))
          }
        }, 200)
      })
    }
    
    return request.get(`/stations/${id}`)
  },

  // 搜索充电站
  async searchStations(keyword, location) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const results = mockStationData.stations.filter(s => 
            s.name.includes(keyword) || s.address.includes(keyword)
          ).slice(0, 10)
          resolve(results)
        }, 300)
      })
    }
    
    return request.get('/stations/search', { 
      params: { keyword, lat: location?.lat, lng: location?.lng } 
    })
  },

  // 获取路线规划
  async getRoute(from, to) {
    // 这里使用高德地图API，不需要后端
    return null
  },

  // 开始充电
  async startCharging(stationId, chargerId) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            orderId: `ORDER_${Date.now()}`,
            stationId,
            chargerId,
            startTime: new Date().toISOString(),
            status: 'charging'
          })
        }, 500)
      })
    }
    
    return request.post('/charging/start', { stationId, chargerId })
  },

  // 停止充电
  async stopCharging(orderId) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            orderId,
            endTime: new Date().toISOString(),
            status: 'completed',
            duration: Math.floor(Math.random() * 3600),
            energy: Math.floor(Math.random() * 50),
            amount: Math.floor(Math.random() * 100)
          })
        }, 500)
      })
    }
    
    return request.post('/charging/stop', { orderId })
  },

  // 获取充电状态
  async getChargingStatus(orderId) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            orderId,
            status: 'charging',
            startTime: new Date(Date.now() - 1800000).toISOString(),
            duration: 1800,
            energy: 25.5,
            power: 51,
            voltage: 380,
            current: 134,
            estimatedTime: 1200,
            amount: 45.5
          })
        }, 200)
      })
    }
    
    return request.get(`/charging/${orderId}`)
  },

  // 支付
  async createPayment(orderId, paymentMethod) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            paymentId: `PAY_${Date.now()}`,
            orderId,
            amount: Math.floor(Math.random() * 100),
            status: 'pending',
            paymentUrl: '#'
          })
        }, 500)
      })
    }
    
    return request.post('/payment/create', { orderId, paymentMethod })
  },

  // 获取充电历史
  async getChargingHistory(params = {}) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const history = []
          for (let i = 0; i < 20; i++) {
            history.push({
              id: `ORDER_${Date.now() - i * 86400000}`,
              stationName: `充电站${i + 1}`,
              startTime: new Date(Date.now() - i * 86400000).toISOString(),
              endTime: new Date(Date.now() - i * 86400000 + 3600000).toISOString(),
              energy: Math.floor(Math.random() * 50),
              amount: Math.floor(Math.random() * 100),
              status: 'completed'
            })
          }
          resolve({
            list: history,
            total: history.length
          })
        }, 300)
      })
    }
    
    return request.get('/charging/history', { params })
  }
}

// 带重试的API（用于关键接口）
export const stationApiWithRetry = {
  getStations: createRetryableRequest(stationApi.getStations, 3, 1000),
  getStationDetail: createRetryableRequest(stationApi.getStationDetail, 3, 1000)
}

