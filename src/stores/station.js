import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stationApi } from '@/api/station'
import { useAppStore } from './app'

export const useStationStore = defineStore('station', () => {
  const appStore = useAppStore()

  // 状态
  const stations = ref([])
  const selectedStation = ref(null)
  const userLocation = ref(null)
  const mapBounds = ref(null)
  const statusUpdates = ref(new Map()) // 存储状态更新的时间戳

  // 计算属性
  const availableStations = computed(() => {
    return stations.value.filter(s => s.status === 'available' && s.availableCount > 0)
  })

  const nearbyStations = computed(() => {
    if (!userLocation.value) return []
    
    return stations.value
      .map(station => ({
        ...station,
        distance: calculateDistance(
          userLocation.value.lat,
          userLocation.value.lng,
          station.lat,
          station.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
  })

  // 方法
  async function fetchStations(bounds = null) {
    try {
      let params = {}
      
      // 验证bounds参数的完整性
      if (bounds && 
          bounds.minLat !== undefined && 
          bounds.maxLat !== undefined && 
          bounds.minLng !== undefined && 
          bounds.maxLng !== undefined) {
        params = {
          minLat: bounds.minLat,
          maxLat: bounds.maxLat,
          minLng: bounds.minLng,
          maxLng: bounds.maxLng
        }
      } else if (bounds) {
        console.warn('bounds参数不完整，忽略边界限制:', bounds)
      }

      const data = await stationApi.getStations(params)
      
      if (!data || !Array.isArray(data)) {
        console.error('API返回数据格式错误:', data)
        return []
      }
      
      // 保留已有站点的状态更新时间戳
      const newStations = data.map(station => {
        const existingStation = stations.value.find(s => s.id === station.id)
        if (existingStation) {
          return {
            ...station,
            _lastUpdate: existingStation._lastUpdate
          }
        }
        return station
      })

      stations.value = newStations
      console.log(`成功加载 ${newStations.length} 个充电站`)
      return newStations
    } catch (error) {
      console.error('获取充电站列表失败:', error)
      appStore.showToast('获取充电站列表失败', 'error')
      throw error
    }
  }

  async function fetchStationDetail(id) {
    try {
      const data = await stationApi.getStationDetail(id)
      selectedStation.value = data
      
      // 更新列表中的数据
      const index = stations.value.findIndex(s => s.id === id)
      if (index !== -1) {
        stations.value[index] = { ...stations.value[index], ...data }
      }
      
      return data
    } catch (error) {
      console.error('获取充电站详情失败:', error)
      appStore.showToast('获取充电站详情失败', 'error')
      throw error
    }
  }

  function updateStationStatus(updates) {
    // updates: Array<{ id, status, availableCount, chargingCount, totalCount }>
    const now = Date.now()
    
    updates.forEach(update => {
      const station = stations.value.find(s => s.id === update.id)
      if (station) {
        // 平滑更新状态
        Object.assign(station, update)
        station._lastUpdate = now
        
        // 记录更新时间用于动画效果
        statusUpdates.value.set(update.id, now)
        
        // 3秒后移除更新标记
        setTimeout(() => {
          if (statusUpdates.value.get(update.id) === now) {
            statusUpdates.value.delete(update.id)
          }
        }, 3000)
      }
    })

    // 如果当前选中的站点也需要更新
    if (selectedStation.value) {
      const update = updates.find(u => u.id === selectedStation.value.id)
      if (update) {
        Object.assign(selectedStation.value, update)
      }
    }
  }

  function setUserLocation(location) {
    userLocation.value = location
  }

  function setMapBounds(bounds) {
    mapBounds.value = bounds
  }

  function selectStation(station) {
    selectedStation.value = station
  }

  function clearSelectedStation() {
    selectedStation.value = null
  }

  function isStationRecentlyUpdated(stationId) {
    const updateTime = statusUpdates.value.get(stationId)
    if (!updateTime) return false
    return Date.now() - updateTime < 3000
  }

  // 工具函数：计算两点间距离（哈弗辛公式）
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // 地球半径（公里）
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  function toRad(value) {
    return value * Math.PI / 180
  }

  // 格式化距离显示
  function formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }

  return {
    stations,
    selectedStation,
    userLocation,
    mapBounds,
    availableStations,
    nearbyStations,
    fetchStations,
    fetchStationDetail,
    updateStationStatus,
    setUserLocation,
    setMapBounds,
    selectStation,
    clearSelectedStation,
    isStationRecentlyUpdated,
    calculateDistance,
    formatDistance
  }
})

