import AMapLoader from '@amap/amap-jsapi-loader'

class AMapService {
  constructor() {
    this.AMap = null
    this.map = null
    this.isLoaded = false
    this.loadPromise = null
  }

  // 加载高德地图SDK
  async load() {
    if (this.isLoaded) {
      return this.AMap
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    // 方案1：从环境变量读取（推荐）
    let key = import.meta.env.VITE_AMAP_KEY
    let securityJsCode = import.meta.env.VITE_AMAP_SECURITY_CODE
    
    // 方案2：如果环境变量未配置，使用硬编码（临时方案）
    if (!key) {
      console.warn('⚠️ 环境变量未配置，使用硬编码的Key')
      key = 'e3ad3be46f028b631499ead7d2453741'
      securityJsCode = '636a055bd173ac44c0e7dbbf37432bcd'
    }
    
    // 方案3：如果Key配置了但安全密钥没配置，直接使用硬编码的安全密钥
    if (key && !securityJsCode) {
      console.warn('⚠️ 安全密钥未配置，使用硬编码的安全密钥')
      securityJsCode = '636a055bd173ac44c0e7dbbf37432bcd'
    }
    
    console.log('高德地图配置:', {
      key: key,
      hasSecurityCode: !!securityJsCode,
      securityCodeLength: securityJsCode ? securityJsCode.length : 0,
      source: import.meta.env.VITE_AMAP_KEY ? '环境变量' : '硬编码'
    })
    
    // ⚠️ 重要：按照高德官方文档，必须在加载SDK之前设置安全密钥
    // 参考：https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode
    if (securityJsCode) {
      window._AMapSecurityConfig = {
        securityJsCode: securityJsCode
      }
      console.log('✅ 安全密钥已设置:', securityJsCode.substring(0, 8) + '...')
    } else {
      console.error('❌ 安全密钥未设置，路线规划将无法使用')
    }
    
    this.loadPromise = AMapLoader.load({
      key: key, // 需要在.env中配置
      version: '2.0',
      plugins: [
        'AMap.Geolocation',
        'AMap.Geocoder',
        'AMap.AutoComplete',
        'AMap.PlaceSearch',
        'AMap.Driving',
        'AMap.DragRoute',
        'AMap.MarkerClusterer',
        'AMap.DistrictSearch',
        'AMap.CitySearch'
      ]
    }).then(AMap => {
      this.AMap = AMap
      this.isLoaded = true
      return AMap
    }).catch(error => {
      console.error('加载高德地图失败:', error)
      this.loadPromise = null
      throw error
    })

    return this.loadPromise
  }

  // 创建地图实例
  async createMap(container, options = {}) {
    await this.load()

    const defaultOptions = {
      zoom: 13,
      center: [117.2272, 31.8206], // 默认合肥市
      viewMode: '3D',
      pitch: 0,
      mapStyle: 'amap://styles/normal',
      showLabel: true,
      showIndoorMap: false,
      resizeEnable: true,
      dragEnable: true,
      zoomEnable: true,
      doubleClickZoom: false,
      keyboardEnable: false,
      jogEnable: false,
      scrollWheel: true,
      touchZoom: true,
      touchZoomCenter: 1,
      ...options
    }

    this.map = new this.AMap.Map(container, defaultOptions)
    
    return this.map
  }

  // 获取当前位置
  async getCurrentPosition() {
    await this.load()

    return new Promise((resolve, reject) => {
      const geolocation = new this.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        convert: true,
        showButton: false,
        showMarker: false,
        showCircle: false,
        panToLocation: false
      })

      geolocation.getCurrentPosition((status, result) => {
        if (status === 'complete') {
          resolve({
            lat: result.position.lat,
            lng: result.position.lng,
            accuracy: result.accuracy,
            address: result.formattedAddress
          })
        } else {
          reject(new Error(result.message || '定位失败'))
        }
      })
    })
  }

  // 地理编码（地址转坐标）
  async geocode(address) {
    await this.load()

    return new Promise((resolve, reject) => {
      const geocoder = new this.AMap.Geocoder()

      geocoder.getLocation(address, (status, result) => {
        if (status === 'complete' && result.geocodes.length) {
          const location = result.geocodes[0].location
          resolve({
            lat: location.lat,
            lng: location.lng,
            formattedAddress: result.geocodes[0].formattedAddress
          })
        } else {
          reject(new Error('地理编码失败'))
        }
      })
    })
  }

  // 逆地理编码（坐标转地址）
  async regeocode(lat, lng) {
    await this.load()

    return new Promise((resolve, reject) => {
      const geocoder = new this.AMap.Geocoder()

      geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.regeocode) {
          resolve({
            formattedAddress: result.regeocode.formattedAddress,
            addressComponent: result.regeocode.addressComponent
          })
        } else {
          reject(new Error('逆地理编码失败'))
        }
      })
    })
  }

  // 路线规划（驾车）- 使用 DragRoute 方案
  async getDrivingRoute(start, end) {
    await this.load()

    return new Promise((resolve, reject) => {
      // 验证参数
      if (!start || !start.lat || !start.lng) {
        reject(new Error('起点坐标无效'))
        return
      }
      if (!end || !end.lat || !end.lng) {
        reject(new Error('终点坐标无效'))
        return
      }

      console.log('🚗 使用 DragRoute 规划路线:', {
        start: [start.lng, start.lat],
        end: [end.lng, end.lat]
      })

      try {
        // 使用 Driving 服务（不显示在地图上）
        const driving = new this.AMap.Driving({
          policy: this.AMap.DrivingPolicy.LEAST_TIME,
          hideMarkers: true, // 不显示起终点标记
          map: null // 不关联地图
        })

        driving.search(
          new this.AMap.LngLat(start.lng, start.lat),
          new this.AMap.LngLat(end.lng, end.lat),
          (status, result) => {
            console.log('路线规划结果:', { status, result })

            if (status === 'complete' && result.routes && result.routes.length > 0) {
              const route = result.routes[0]
              console.log('✅ 路线规划成功:', {
                distance: route.distance + 'm',
                duration: route.time + 's'
              })
              
              resolve({
                distance: route.distance,
                duration: route.time,
                path: route.steps.flatMap(step => 
                  step.path.map(point => ({ 
                    lat: point.getLat ? point.getLat() : point.lat, 
                    lng: point.getLng ? point.getLng() : point.lng 
                  }))
                ),
                steps: route.steps.map(step => ({
                  instruction: step.instruction,
                  distance: step.distance,
                  duration: step.time,
                  road: step.road
                }))
              })
            } else if (status === 'no_data') {
              console.warn('⚠️ 高德API返回无数据，使用自定义路线规划')
              // 降级到自定义路线规划
              resolve(this.getCustomRoute(start, end))
            } else {
              console.warn('⚠️ 路线规划失败，使用自定义路线规划')
              // 降级到自定义路线规划
              resolve(this.getCustomRoute(start, end))
            }
          }
        )
      } catch (error) {
        console.error('路线规划异常:', error)
        console.log('📍 使用自定义路线规划作为降级方案')
        // 降级到自定义路线规划
        resolve(this.getCustomRoute(start, end))
      }
    })
  }

  // 自定义路线规划（降级方案）
  getCustomRoute(start, end) {
    console.log('🔧 使用自定义路线规划')
    
    // 计算直线距离
    const distance = this.calculateDistance(start, end)
    
    // 估算时间（假设平均速度40km/h）
    const avgSpeed = 40
    const duration = (distance / 1000) / avgSpeed * 3600
    
    // 生成路径
    const path = this.generateSimplePath(start, end)
    
    // 生成步骤
    const steps = this.generateNavigationSteps(start, end, distance)
    
    return {
      distance: distance,
      duration: duration,
      path: path,
      steps: steps,
      isCustomRoute: true
    }
  }

  // 计算两点间距离（哈弗辛公式）
  calculateDistance(point1, point2) {
    const R = 6371000 // 地球半径（米）
    const lat1 = point1.lat * Math.PI / 180
    const lat2 = point2.lat * Math.PI / 180
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180
    const deltaLng = (point2.lng - point1.lng) * Math.PI / 180

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // 生成简化路径
  generateSimplePath(start, end) {
    const path = []
    const segments = 5

    for (let i = 0; i <= segments; i++) {
      const ratio = i / segments
      const lat = start.lat + (end.lat - start.lat) * ratio
      const lng = start.lng + (end.lng - start.lng) * ratio
      path.push({ lat, lng })
    }

    return path
  }

  // 生成导航步骤
  generateNavigationSteps(start, end, totalDistance) {
    const direction = this.getDirection(start, end)
    
    return [
      {
        instruction: `向${direction}方向出发`,
        distance: totalDistance * 0.1,
        duration: totalDistance * 0.1 / 40 * 3.6,
        road: '当前道路'
      },
      {
        instruction: `继续沿当前方向行驶`,
        distance: totalDistance * 0.7,
        duration: totalDistance * 0.7 / 40 * 3.6,
        road: '主干道'
      },
      {
        instruction: `到达目的地`,
        distance: totalDistance * 0.2,
        duration: totalDistance * 0.2 / 40 * 3.6,
        road: '目的地附近'
      }
    ]
  }

  // 计算方向
  getDirection(start, end) {
    const deltaLat = end.lat - start.lat
    const deltaLng = end.lng - start.lng
    const angle = Math.atan2(deltaLng, deltaLat) * 180 / Math.PI
    
    if (angle >= -22.5 && angle < 22.5) return '北'
    if (angle >= 22.5 && angle < 67.5) return '东北'
    if (angle >= 67.5 && angle < 112.5) return '东'
    if (angle >= 112.5 && angle < 157.5) return '东南'
    if (angle >= 157.5 || angle < -157.5) return '南'
    if (angle >= -157.5 && angle < -112.5) return '西南'
    if (angle >= -112.5 && angle < -67.5) return '西'
    if (angle >= -67.5 && angle < -22.5) return '西北'
    return '北'
  }

  // 搜索附近地点
  async searchNearby(keyword, center, radius = 5000) {
    await this.load()

    return new Promise((resolve, reject) => {
      const placeSearch = new this.AMap.PlaceSearch({
        type: keyword,
        pageSize: 50,
        pageIndex: 1,
        extensions: 'base'
      })

      placeSearch.searchNearBy(
        '',
        [center.lng, center.lat],
        radius,
        (status, result) => {
          if (status === 'complete' && result.poiList) {
            resolve(result.poiList.pois.map(poi => ({
              id: poi.id,
              name: poi.name,
              lat: poi.location.lat,
              lng: poi.location.lng,
              address: poi.address,
              distance: poi.distance
            })))
          } else {
            reject(new Error('搜索失败'))
          }
        }
      )
    })
  }

  // 切换地图样式（日间/夜间模式）
  setMapStyle(isDark) {
    if (!this.map) return

    const style = isDark ? 'amap://styles/dark' : 'amap://styles/normal'
    this.map.setMapStyle(style)
  }

  // 唤起高德地图APP导航
  openAmapApp(destination) {
    const { lat, lng, name } = destination
    
    // 构建高德地图URL Scheme
    const url = `amapuri://route/plan/?dlat=${lat}&dlon=${lng}&dname=${encodeURIComponent(name)}&dev=0&t=0`
    
    // 尝试打开APP
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)
    
    // 延迟后检测是否成功打开，如果失败则跳转到Web版
    setTimeout(() => {
      document.body.removeChild(iframe)
      
      // 如果APP未安装，打开高德地图Web版
      if (document.hidden === false) {
        const webUrl = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&policy=1&src=myapp&coordinate=gaode&callnative=1`
        window.location.href = webUrl
      }
    }, 2000)
  }

  // 销毁地图
  destroy() {
    if (this.map) {
      this.map.destroy()
      this.map = null
    }
  }
}

// 单例模式
const amapService = new AMapService()

export default amapService

