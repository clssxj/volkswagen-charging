<template>
  <div class="map-wrapper">
    <!-- 地图容器 -->
    <div ref="mapContainer" class="amap-container"></div>

    <!-- 地图控制按钮 -->
    <div class="map-controls">
      <!-- 定位按钮 -->
      <button 
        class="control-btn" 
        @click="handleLocation"
        :disabled="locating"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <!-- 缩放控制 -->
      <button class="control-btn" @click="handleZoomIn">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button class="control-btn" @click="handleZoomOut">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>

      <!-- 主题切换 -->
      <button class="control-btn" @click="toggleTheme">
        <svg v-if="!isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
    </div>

    <!-- 当前位置标记 -->
    <div v-if="userMarker" class="user-location-dot" :style="userMarkerStyle"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useStationStore } from '@/stores/station'
import { useAppStore } from '@/stores/app'
import amapService from '@/services/amap'

const emit = defineEmits(['mapReady', 'markerClick', 'boundsChanged'])

const stationStore = useStationStore()
const appStore = useAppStore()

const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const markerClusterer = ref(null)
const userMarker = ref(null)
const userMarkerStyle = ref({})
const locating = ref(false)
const AMap = ref(null)

const isDarkMode = computed(() => appStore.isDarkMode)

// 根据空闲率计算颜色
function getColorByAvailability(availableCount, totalCount) {
  // 无充电桩（totalCount为0）- 灰色
  if (totalCount === 0) {
    return {
      bg: '#9ca3af',
      text: '#ffffff',
      border: '#6b7280',
      label: '无桩'
    }
  }
  
  const rate = availableCount / totalCount
  
  if (rate >= 0.5) {
    // ≥50% 绿色
    return {
      bg: '#10b981',
      text: '#ffffff',
      border: '#059669',
      label: '充足'
    }
  } else if (rate >= 0.2) {
    // 20%-50% 黄色
    return {
      bg: '#f59e0b',
      text: '#ffffff',
      border: '#d97706',
      label: '紧张'
    }
  } else {
    // <20% 红色（包括availableCount为0的情况）
    return {
      bg: '#ef4444',
      text: '#ffffff',
      border: '#dc2626',
      label: '满载'
    }
  }
}

// 创建自定义标记HTML
function createMarkerHTML(station) {
  const colors = getColorByAvailability(station.availableCount, station.totalCount)
  
  return `
    <div class="charging-marker" style="position: relative; width: 100px;">
      <div style="
        background: ${colors.bg};
        color: white;
        border: 2px solid white;
        border-radius: 8px;
        padding: 6px 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        text-align: center;
        font-family: Arial, sans-serif;
      ">
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 3px;">
          ⚡ ¥${station.pricePerKWh}/度
        </div>
        <div style="font-size: 14px; font-weight: bold;">
          ${station.availableCount}/${station.totalCount}
        </div>
      </div>
      <div style="
        margin: -1px auto 0;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid white;
      "></div>
      <div style="
        margin: -1px auto 0;
        width: 8px;
        height: 8px;
        background: ${colors.bg};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    </div>
  `
}

// 初始化地图
async function initMap() {
  try {
    appStore.setLoading(true)
    
    // 加载高德地图
    AMap.value = await amapService.load()
    
    // 创建地图
    map.value = await amapService.createMap(mapContainer.value, {
      zoom: 12,
      center: [117.2272, 31.8206], // 默认合肥市
      mapStyle: isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/normal'
    })

    // 等待地图完全加载
    await new Promise(resolve => {
      map.value.on('complete', resolve)
    })

    // 地图事件监听
    map.value.on('moveend', handleMapMove)
    map.value.on('zoomend', () => {
      handleMapMove()
      // 缩放时重新渲染标记（切换聚合/非聚合模式）
      updateMarkers()
    })
    
    // 尝试定位（失败不影响后续流程）
    try {
      await handleLocation(false)
    } catch (error) {
      console.warn('定位失败，使用默认位置:', error)
      // 使用默认位置（合肥市）
      stationStore.setUserLocation({
        lat: 31.8206,
        lng: 117.2272,
        address: '合肥市'
      })
    }
    
    // 加载充电站数据
    await loadStations()

    emit('mapReady', map.value)
  } catch (error) {
    console.error('初始化地图失败:', error)
    appStore.showToast('地图加载失败，请刷新重试', 'error')
  } finally {
    appStore.setLoading(false)
  }
}

// 加载充电站
async function loadStations() {
  try {
    // 确保地图已加载
    if (!map.value) {
      console.warn('地图未初始化')
      return
    }

    const bounds = map.value.getBounds()
    if (!bounds) {
      console.warn('无法获取地图边界')
      return
    }

    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    if (!sw || !ne) {
      console.warn('地图边界数据不完整')
      return
    }

    await stationStore.fetchStations({
      minLat: sw.lat,
      maxLat: ne.lat,
      minLng: sw.lng,
      maxLng: ne.lng
    })

    updateMarkers()
  } catch (error) {
    console.error('加载充电站失败:', error)
    // 尝试加载全部数据（不带边界限制）
    try {
      await stationStore.fetchStations()
      updateMarkers()
    } catch (fallbackError) {
      console.error('加载充电站失败（降级方案也失败）:', fallbackError)
    }
  }
}

// 更新标记
function updateMarkers() {
  if (!AMap.value || !map.value) {
    console.warn('地图未初始化，跳过标记更新')
    return
  }

  if (!stationStore.stations || stationStore.stations.length === 0) {
    console.warn('没有充电站数据')
    return
  }

  // 清除旧标记
  clearMarkers()

  const stations = stationStore.stations

  try {
    // 创建标记
    markers.value = stations.map(station => {
      // 创建标记DOM元素
      const markerContent = document.createElement('div')
      markerContent.innerHTML = createMarkerHTML(station)
      
      const marker = new AMap.value.Marker({
        position: [station.lng, station.lat],
        content: markerContent,
        anchor: 'bottom-center',
        extData: { station },
        zIndex: 100
      })

      // 点击标记显示信息窗和触发事件
      marker.on('click', () => {
        showInfoWindow(marker, station)
        emit('markerClick', station)
      })

      return marker
    })
    
    console.log(`已创建 ${markers.value.length} 个标记对象`)

    // 根据当前地图缩放级别决定是否使用聚合
    const zoom = map.value.getZoom()
    // 临时禁用聚合，直接显示所有标记
    const shouldCluster = false // zoom < 14 && markers.value.length > 200

    if (shouldCluster) {
      // 使用聚合模式
      console.log(`使用聚合模式显示 ${markers.value.length} 个充电站`)
      
      // 创建或更新标记聚合器
      if (!markerClusterer.value) {
        markerClusterer.value = new AMap.value.MarkerClusterer(map.value, [], {
          gridSize: 80,
          minClusterSize: 5,
          maxZoom: 14,
          renderClusterMarker: renderCluster,
          zoomOnClick: true
        })
      }
      
      // 设置标记到聚合器
      if (markerClusterer.value && typeof markerClusterer.value.setMarkers === 'function') {
        markerClusterer.value.setMarkers(markers.value)
      }
      
      console.log(`已加载 ${markers.value.length} 个充电站标记（聚合模式）`)
    } else {
      // 不使用聚合，直接添加到地图
      console.log(`直接显示 ${markers.value.length} 个充电站标记`)
      
      // 如果之前使用了聚合器，清除它
      if (markerClusterer.value && typeof markerClusterer.value.clearMarkers === 'function') {
        try {
          markerClusterer.value.clearMarkers()
        } catch (e) {
          console.warn('清除聚合器失败:', e)
        }
      }
      
      // 直接添加标记到地图
      let successCount = 0
      markers.value.forEach((marker, index) => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(map.value)
          successCount++
          
          // 记录前5个标记的位置用于调试
          if (index < 5) {
            console.log(`标记${index + 1}位置:`, marker.getPosition())
          }
        }
      })
      
      console.log(`已加载 ${successCount}/${markers.value.length} 个充电站标记（直接显示）`)
      
      // 验证地图上的标记
      const mapMarkers = map.value.getAllOverlays('marker')
      console.log(`地图上实际标记数量:`, mapMarkers ? mapMarkers.length : 0)
    }
  } catch (error) {
    console.error('更新标记失败:', error)
    
    // 降级方案：即使出错也尝试直接显示标记
    try {
      markers.value.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(map.value)
        }
      })
      console.log('使用降级方案显示标记')
    } catch (fallbackError) {
      console.error('降级方案也失败:', fallbackError)
    }
  }
}

// 渲染聚合标记
function renderCluster(context) {
  const count = context.count
  const markers = context.markers
  
  // 计算聚合内充电站的平均空闲率
  let totalAvailable = 0
  let totalCount = 0
  
  markers.forEach(marker => {
    const station = marker.getExtData().station
    if (station) {
      totalAvailable += station.availableCount || 0
      totalCount += station.totalCount || 0
    }
  })
  
  const avgRate = totalCount > 0 ? totalAvailable / totalCount : 0
  
  // 根据平均空闲率选择颜色
  let bgColor, borderColor
  if (avgRate >= 0.5) {
    bgColor = 'rgba(16, 185, 129, 0.95)'
    borderColor = '#10b981'
  } else if (avgRate >= 0.2) {
    bgColor = 'rgba(245, 158, 11, 0.95)'
    borderColor = '#f59e0b'
  } else {
    bgColor = 'rgba(239, 68, 68, 0.95)'
    borderColor = '#ef4444'
  }
  
  // 根据数量调整大小
  let size = 50
  if (count > 100) {
    size = 70
  } else if (count > 50) {
    size = 60
  }
  
  const div = document.createElement('div')
  div.style.cssText = `
    background: ${bgColor};
    color: white;
    border: 3px solid ${borderColor};
    border-radius: 50%;
    width: ${size}px;
    height: ${size}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: ${size > 60 ? '18px' : '16px'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    cursor: pointer;
    transition: transform 0.2s ease;
  `
  
  div.innerHTML = `
    <div style="font-size: ${size > 60 ? '24px' : '20px'}; line-height: 1;">${count}</div>
    <div style="font-size: 10px; opacity: 0.9; margin-top: 2px;">充电站</div>
  `
  
  // 添加hover效果
  div.addEventListener('mouseenter', () => {
    div.style.transform = 'scale(1.1)'
  })
  div.addEventListener('mouseleave', () => {
    div.style.transform = 'scale(1)'
  })
  
  context.marker.setContent(div)
}

// 显示信息窗
function showInfoWindow(marker, station) {
  if (!AMap.value || !map.value) return

  const colors = getColorByAvailability(station.availableCount, station.totalCount)
  
  const content = `
    <div style="
      min-width: 200px;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
    ">
      <h3 style="
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: bold;
        color: #1f2937;
      ">${station.name}</h3>
      
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      ">
        <span style="
          background: ${colors.bg};
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        ">
          空闲 ${station.availableCount}/${station.totalCount}
        </span>
        <span style="
          color: #6b7280;
          font-size: 13px;
        ">¥${station.pricePerKWh}/度</span>
      </div>
      
      <p style="
        margin: 0;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.5;
      ">${station.address}</p>
      
      <button style="
        width: 100%;
        margin-top: 12px;
        padding: 8px;
        background: #001e50;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
      " onclick="window.viewStationDetail('${station.id}')">
        查看详情
      </button>
    </div>
  `

  const infoWindow = new AMap.value.InfoWindow({
    content,
    offset: new AMap.value.Pixel(0, -40),
    closeWhenClickMap: true
  })

  infoWindow.open(map.value, marker.getPosition())
}

// 全局方法：查看充电站详情
window.viewStationDetail = (stationId) => {
  const station = stationStore.stations.find(s => s.id === stationId)
  if (station) {
    emit('markerClick', station)
  }
}

// 清除标记
function clearMarkers() {
  if (markerClusterer.value && typeof markerClusterer.value.clearMarkers === 'function') {
    markerClusterer.value.clearMarkers()
  }
  if (markers.value && markers.value.length > 0) {
    markers.value.forEach(marker => {
      if (marker && map.value && typeof marker.setMap === 'function') {
        marker.setMap(null)
      }
    })
  }
  markers.value = []
}

// 处理地图移动
function handleMapMove() {
  if (!map.value) return

  try {
    const bounds = map.value.getBounds()
    if (!bounds) return

    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    if (!sw || !ne) return

    stationStore.setMapBounds({
      southWest: { lat: sw.lat, lng: sw.lng },
      northEast: { lat: ne.lat, lng: ne.lng }
    })

    emit('boundsChanged', {
      southWest: { lat: sw.lat, lng: sw.lng },
      northEast: { lat: ne.lat, lng: ne.lng }
    })

    // 延迟加载新数据，避免频繁请求
    clearTimeout(window._mapMoveTimer)
    window._mapMoveTimer = setTimeout(loadStations, 500)
  } catch (error) {
    console.error('处理地图移动失败:', error)
  }
}

// 处理定位
async function handleLocation(showToast = true) {
  if (locating.value) return

  try {
    locating.value = true
    const position = await amapService.getCurrentPosition()
    
    stationStore.setUserLocation(position)
    
    if (map.value) {
      map.value.setCenter([position.lng, position.lat])
      map.value.setZoom(13)
      
      // 添加用户位置标记
      if (!userMarker.value) {
        const marker = new AMap.value.CircleMarker({
          center: [position.lng, position.lat],
          radius: 10,
          fillColor: '#4299e1',
          fillOpacity: 0.8,
          strokeColor: '#fff',
          strokeWeight: 2,
          zIndex: 999
        })
        map.value.add(marker)
        userMarker.value = marker
      } else {
        userMarker.value.setCenter([position.lng, position.lat])
      }
      
      // 定位成功后，加载该位置周围的充电站
      await loadStations()
    }
    
    if (showToast) {
      appStore.showToast('定位成功', 'success')
    }
  } catch (error) {
    console.error('定位失败:', error)
    if (showToast) {
      appStore.showToast('定位失败，使用默认位置', 'warning')
    }
    
    // 设置默认位置（合肥市中心）
    const defaultPosition = {
      lat: 31.8206,
      lng: 117.2272,
      address: '合肥市'
    }
    
    stationStore.setUserLocation(defaultPosition)
    
    if (map.value) {
      map.value.setCenter([defaultPosition.lng, defaultPosition.lat])
    }
    
    // 即使定位失败也抛出错误，让调用者知道
    throw error
  } finally {
    locating.value = false
  }
}

// 缩放控制
function handleZoomIn() {
  if (map.value) {
    map.value.zoomIn()
  }
}

function handleZoomOut() {
  if (map.value) {
    map.value.zoomOut()
  }
}

// 主题切换
function toggleTheme() {
  appStore.toggleDarkMode()
}

// 监听主题变化
watch(isDarkMode, (isDark) => {
  amapService.setMapStyle(isDark)
})

// 监听充电站数据变化
watch(() => stationStore.stations, () => {
  try {
    updateMarkers()
  } catch (error) {
    console.error('监听充电站数据变化时更新标记失败:', error)
  }
}, { deep: true })

onMounted(() => {
  initMap()
  
  // 监听主题变化事件
  window.addEventListener('theme-change', handleThemeChange)
})

onUnmounted(() => {
  clearMarkers()
  if (map.value) {
    map.value.destroy()
  }
  window.removeEventListener('theme-change', handleThemeChange)
})

function handleThemeChange(e) {
  amapService.setMapStyle(e.detail.isDark)
}

// 暴露方法给父组件
defineExpose({
  map,
  panTo: (lng, lat) => {
    if (map.value) {
      map.value.panTo([lng, lat])
    }
  },
  setZoom: (zoom) => {
    if (map.value) {
      map.value.setZoom(zoom)
    }
  }
})
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.amap-container {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  right: 16px;
  bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.control-btn {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 transition-all active:scale-95;
  @apply text-gray-700 dark:text-gray-200;
}

.control-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.control-btn:not(:disabled):hover {
  @apply bg-gray-50 dark:bg-gray-700;
}

.user-location-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: #4299e1;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(66, 153, 225, 0.6);
  pointer-events: none;
  z-index: 999;
}
</style>

<style>
/* 充电站标记交互效果（全局样式） */
.charging-marker {
  transition: all 0.2s ease;
  transform-origin: bottom center;
}

.charging-marker:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
  z-index: 1000 !important;
}

.charging-marker:active {
  transform: scale(0.95);
}

/* 标记动画 */
@keyframes markerPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.charging-marker.new-update {
  animation: markerPulse 0.6s ease-in-out;
}

/* 优化地图上文字的渲染 */
.amap-marker-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif !important;
}
</style>

