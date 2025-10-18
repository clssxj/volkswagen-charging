import { generateStatusUpdate, updateStationPrices } from '@/api/mock/station-mock'

class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
    this.heartbeatTimeout = null
    this.messageHandlers = new Map()
    this.isConnecting = false
    this.shouldReconnect = true
    this.useMock = import.meta.env.VITE_USE_MOCK === 'true' || true
    this.mockInterval = null
  }

  connect(url) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket已连接或正在连接中')
      return Promise.resolve()
    }

    // 如果使用Mock模式，启动模拟推送
    if (this.useMock) {
      console.log('使用Mock模式，启动模拟状态推送')
      this.startMockUpdates()
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true

      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('WebSocket连接成功')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('解析WebSocket消息失败:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error)
          this.isConnecting = false
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket连接关闭:', event.code, event.reason)
          this.isConnecting = false
          this.stopHeartbeat()
          
          if (this.shouldReconnect) {
            this.attemptReconnect(url)
          }
        }

      } catch (error) {
        console.error('创建WebSocket连接失败:', error)
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect() {
    this.shouldReconnect = false
    this.stopHeartbeat()
    this.stopMockUpdates()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket未连接，无法发送消息')
    }
  }

  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, [])
    }
    this.messageHandlers.get(eventType).push(handler)
  }

  off(eventType, handler) {
    if (this.messageHandlers.has(eventType)) {
      const handlers = this.messageHandlers.get(eventType)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  handleMessage(data) {
    const { type, payload } = data
    
    if (type === 'heartbeat') {
      this.resetHeartbeatTimeout()
      return
    }

    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)
      handlers.forEach(handler => {
        try {
          handler(payload)
        } catch (error) {
          console.error('处理WebSocket消息失败:', error)
        }
      })
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat', timestamp: Date.now() })
    }, 30000) // 每30秒发送一次心跳

    this.resetHeartbeatTimeout()
  }

  resetHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
    }

    this.heartbeatTimeout = setTimeout(() => {
      console.warn('心跳超时，尝试重连')
      this.ws?.close()
    }, 60000) // 60秒未收到心跳响应则断开
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  attemptReconnect(url) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数已达上限')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连...`)

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect(url).catch(() => {
          // 重连失败会触发onclose，自动进入下一次重连
        })
      }
    }, delay)
  }

  // Mock模式：模拟状态更新推送
  startMockUpdates() {
    if (this.mockInterval || this.priceInterval) {
      return
    }

    console.log('启动Mock模式：充电桩状态和价格自动更新')

    // 定时更新充电桩可用数量（每10-15分钟）
    const pushAvailabilityUpdate = () => {
      // 调用更新函数，返回所有有变化的充电站
      const updates = generateStatusUpdate()
      
      if (updates.length > 0) {
        console.log(`推送 ${updates.length} 个充电站的数量更新`)
        this.handleMessage({
          type: 'station_status_update',
          payload: { updates }
        })
      }

      // 下次更新时间：10-15分钟
      const nextDelay = (10 + Math.random() * 5) * 60 * 1000
      console.log(`下次充电桩数量更新将在 ${Math.round(nextDelay / 60000)} 分钟后`)
      this.mockInterval = setTimeout(pushAvailabilityUpdate, nextDelay)
    }

    // 定时更新价格（每小时）
    const pushPriceUpdate = () => {
      updateStationPrices()
      console.log('价格已根据时段更新')
      
      // 通知前端刷新价格
      this.handleMessage({
        type: 'price_update',
        payload: { timestamp: Date.now() }
      })
      
      // 每小时更新一次
      this.priceInterval = setTimeout(pushPriceUpdate, 60 * 60 * 1000)
    }

    // 立即执行一次更新
    setTimeout(pushAvailabilityUpdate, 5000) // 5秒后首次更新
    pushPriceUpdate() // 立即更新价格
  }

  stopMockUpdates() {
    if (this.mockInterval) {
      clearTimeout(this.mockInterval)
      this.mockInterval = null
    }
    if (this.priceInterval) {
      clearTimeout(this.priceInterval)
      this.priceInterval = null
    }
  }

  // 订阅特定充电站的状态更新
  subscribeStations(stationIds) {
    if (this.useMock) {
      // Mock模式下不需要订阅，会自动推送
      return
    }
    
    this.send({
      type: 'subscribe',
      payload: { stationIds }
    })
  }

  // 取消订阅
  unsubscribeStations(stationIds) {
    if (this.useMock) {
      return
    }
    
    this.send({
      type: 'unsubscribe',
      payload: { stationIds }
    })
  }
}

// 单例模式
const wsService = new WebSocketService()

export default wsService

