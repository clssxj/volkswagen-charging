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

    this.loadPromise = AMapLoader.load({
      key: import.meta.env.VITE_AMAP_KEY || 'YOUR_AMAP_KEY', // 需要在.env中配置
      version: '2.0',
      plugins: [
        'AMap.Geolocation',
        'AMap.Geocoder',
        'AMap.AutoComplete',
        'AMap.PlaceSearch',
        'AMap.Driving',
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
      center: [116.397428, 39.90923], // 默认北京
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

  // 路线规划（驾车）
  async getDrivingRoute(start, end) {
    await this.load()

    return new Promise((resolve, reject) => {
      const driving = new this.AMap.Driving({
        policy: this.AMap.DrivingPolicy.LEAST_TIME,
        extensions: 'all'
      })

      driving.search(
        [start.lng, start.lat],
        [end.lng, end.lat],
        (status, result) => {
          if (status === 'complete' && result.routes.length) {
            const route = result.routes[0]
            resolve({
              distance: route.distance,
              duration: route.time,
              path: route.steps.flatMap(step => 
                step.path.map(point => ({ lat: point.lat, lng: point.lng }))
              ),
              steps: route.steps.map(step => ({
                instruction: step.instruction,
                distance: step.distance,
                duration: step.time,
                road: step.road
              }))
            })
          } else {
            reject(new Error('路线规划失败'))
          }
        }
      )
    })
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

