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
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transform: translate(-50%, -100%);
      transition: transform 0.2s ease;
    " class="charging-marker">
      <!-- 信息卡片 -->
      <div style="
        background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}dd 100%);
        color: ${colors.text};
        border: 2px solid ${colors.border};
        border-radius: 10px;
        padding: 8px 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        min-width: 100px;
        text-align: center;
        font-size: 12px;
        line-height: 1.5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
        white-space: nowrap;
        backdrop-filter: blur(10px);
      ">
        <!-- 充电图标和价格 -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-bottom: 4px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="${colors.text}" stroke="${colors.text}" stroke-width="1"/>
          </svg>
          <span style="
            font-weight: bold; 
            font-size: 14px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          ">¥${station.pricePerKWh}/度</span>
        </div>
        
        <!-- 分隔线 -->
        <div style="
          height: 1px;
          background: ${colors.text}40;
          margin: 4px 0;
        "></div>
        
        <!-- 空闲桩数 -->
        <div style="
          font-weight: bold; 
          font-size: 16px;
          letter-spacing: 0.5px;
        ">
          <span style="color: ${colors.text};">${station.availableCount}</span>
          <span style="color: ${colors.text}99; font-size: 14px;">/${station.totalCount}</span>
        </div>
      </div>
      
      <!-- 三角箭头 -->
      <div style="
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid ${colors.border};
        margin-top: -2px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      "></div>
      
      <!-- 定位点 -->
      <div style="
        width: 10px;
        height: 10px;
        background: ${colors.bg};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        margin-top: -1px;
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
      zoom: 13,
      center: [116.397428, 39.90923], // 默认北京
      mapStyle: isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/normal'
    })

    // 等待地图完全加载
    await new Promise(resolve => {
      map.value.on('complete', resolve)
    })

    // 地图事件监听
    map.value.on('moveend', handleMapMove)
    map.value.on('zoomend', handleMapMove)
    
    // 尝试定位（失败不影响后续流程）
    try {
      await handleLocation(false)
    } catch (error) {
      console.warn('定位失败，使用默认位置:', error)
      // 使用默认位置（北京）
      stationStore.setUserLocation({
        lat: 39.90923,
        lng: 116.397428,
        address: '北京市'
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
    // 创建标记聚合器
    if (!markerClusterer.value) {
      markerClusterer.value = new AMap.value.MarkerClusterer(map.value, [], {
        gridSize: 60,
        minClusterSize: 3,
        renderClusterMarker: renderCluster,
        zoomOnClick: true
      })
    }

    // 创建标记
    markers.value = stations.map(station => {
      const marker = new AMap.value.Marker({
        position: [station.lng, station.lat],
        content: createMarkerHTML(station),
        offset: new AMap.value.Pixel(0, 0),
        extData: { station },
        zIndex: 100
      })

      marker.on('click', () => {
        emit('markerClick', station)
      })

      return marker
    })

    if (markerClusterer.value && typeof markerClusterer.value.setMarkers === 'function') {
      markerClusterer.value.setMarkers(markers.value)
      console.log(`已加载 ${markers.value.length} 个充电站标记`)
    }
  } catch (error) {
    console.error('更新标记失败:', error)
  }
}

// 渲染聚合标记
function renderCluster(context) {
  const count = context.count
  const div = document.createElement('div')
  div.style.cssText = `
    background-color: rgba(0, 30, 80, 0.9);
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `
  div.textContent = count
  context.marker.setContent(div)
}

// 清除标记
function clearMarkers() {
  if (markerClusterer.value && typeof markerClusterer.value.clearMarkers === 'function') {
    markerClusterer.value.clearMarkers()
  }
  if (markers.value && markers.value.length > 0) {
    markers.value.forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove()
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
      map.value.setZoom(15)
      
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
    }
    
    if (showToast) {
      appStore.showToast('定位成功', 'success')
    }
  } catch (error) {
    console.error('定位失败:', error)
    if (showToast) {
      appStore.showToast('定位失败，使用默认位置', 'warning')
    }
    
    // 设置默认位置（北京天安门）
    const defaultPosition = {
      lat: 39.90923,
      lng: 116.397428,
      address: '北京市'
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
.charging-marker:hover {
  transform: translate(-50%, -100%) scale(1.08) !important;
  z-index: 1000 !important;
}

.charging-marker:active {
  transform: translate(-50%, -100%) scale(0.98) !important;
}

/* 标记动画 */
@keyframes markerPulse {
  0%, 100% {
    transform: translate(-50%, -100%) scale(1);
  }
  50% {
    transform: translate(-50%, -100%) scale(1.05);
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

