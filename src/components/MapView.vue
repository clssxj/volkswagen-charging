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
import { ManualCluster } from '@/utils/manual-cluster'

const emit = defineEmits(['mapReady', 'markerClick', 'boundsChanged'])

const stationStore = useStationStore()
const appStore = useAppStore()

const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const markerClusterer = ref(null)
const manualCluster = ref(null) // 手动聚合器
const userMarker = ref(null)
const userMarkerStyle = ref({})
const locating = ref(false)
const AMap = ref(null)
const routeLine = ref(null) // 路线折线对象

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

// 初始化地图
async function initMap() {
  try {
    console.log('🚀 开始初始化地图...')
    appStore.setLoading(true)
    
    // 1. 加载高德地图SDK
    console.time('1-加载SDK')
    AMap.value = await amapService.load()
    console.timeEnd('1-加载SDK')
    
    // 2. 先定位（优先，确定用户位置）
    console.time('2-定位')
    let userPosition = null
    try {
      userPosition = await amapService.getCurrentPosition()
      console.timeEnd('2-定位')
      console.log('✅ 定位成功:', userPosition)
      stationStore.setUserLocation(userPosition)
    } catch (error) {
      console.timeEnd('2-定位')
      console.warn('⚠️ 定位失败，使用默认位置')
      userPosition = {
        lat: 31.8206,
        lng: 117.2272,
        address: '合肥市'
      }
      stationStore.setUserLocation(userPosition)
    }
    
    // 3. 创建地图，直接使用定位后的位置作为中心
    console.time('3-创建地图')
    map.value = await amapService.createMap(mapContainer.value, {
      zoom: 14, // 使用更大的缩放级别
      center: [userPosition.lng, userPosition.lat], // 使用定位位置
      mapStyle: isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/normal'
    })
    console.timeEnd('3-创建地图')

    // 4. 添加用户位置标记
    if (userPosition) {
      const marker = new AMap.value.CircleMarker({
        center: [userPosition.lng, userPosition.lat],
        radius: 10,
        fillColor: '#4299e1',
        fillOpacity: 0.8,
        strokeColor: '#fff',
        strokeWeight: 2,
        zIndex: 999
      })
      map.value.add(marker)
      userMarker.value = marker
    }

    // 5. 地图事件监听
    map.value.on('moveend', handleMapMove)
    map.value.on('zoomend', () => {
      handleMapMove()
      updateMarkers()
    })
    
    // 6. 现在才加载充电站（此时地图已经在定位位置，只会加载视野内的充电站）
    console.time('4-加载充电站')
    await loadStations()
    console.timeEnd('4-加载充电站')

    console.log('✅ 地图初始化完成')
    console.log(`📍 当前位置: [${userPosition.lng}, ${userPosition.lat}]`)
    console.log(`📊 已加载充电站数量: ${stationStore.stations.length}`)
    
    emit('mapReady', map.value)
  } catch (error) {
    console.error('❌ 初始化地图失败:', error)
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
      const colors = getColorByAvailability(station.availableCount, station.totalCount)
      
      // 创建简单的标记DOM
      const markerDiv = document.createElement('div')
      markerDiv.className = 'charging-marker'
      markerDiv.style.cssText = `
        position: absolute;
        transform: translate(-50%, -100%);
      `
      markerDiv.innerHTML = `
        <div style="
          background: ${colors.bg};
          color: white;
          border: 2px solid white;
          border-radius: 8px;
          padding: 6px 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          text-align: center;
          min-width: 90px;
        ">
          <div style="font-size: 12px; font-weight: bold; margin-bottom: 2px;">
            ⚡ ¥${station.pricePerKWh}/度
          </div>
          <div style="font-size: 14px; font-weight: bold;">
            ${station.availableCount}/${station.totalCount}
          </div>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid white;
          margin: -1px auto 0;
        "></div>
        <div style="
          width: 8px;
          height: 8px;
          background: ${colors.bg};
          border: 2px solid white;
          border-radius: 50%;
          margin: -1px auto 0;
        "></div>
      `
      
      const marker = new AMap.value.Marker({
        position: [station.lng, station.lat],
        content: markerDiv,
        offset: new AMap.value.Pixel(0, 0),
        extData: { station }
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
    
    // 聚合策略：远距离聚合，近距离直接显示
    // Zoom < 13：始终聚合
    // Zoom 13-15：视野内点数>50时聚合
    // Zoom > 15：始终直接显示
    let shouldCluster = false
    
    if (zoom < 13) {
      shouldCluster = true
    } else if (zoom >= 13 && zoom <= 15 && markers.value.length > 50) {
      shouldCluster = true
    }
    
    console.log(`当前缩放: ${zoom}, 标记数: ${markers.value.length}, 使用聚合: ${shouldCluster}`)

    if (shouldCluster) {
      // 使用手动聚合模式
      console.log(`✓ 使用手动聚合显示 ${markers.value.length} 个充电站`)
      
      // 清除旧的手动聚合
      if (manualCluster.value) {
        manualCluster.value.destroy()
      }
      
      // 创建手动聚合器
      manualCluster.value = new ManualCluster(map.value, {
        gridSize: 80,
        minClusterSize: 3,
        maxZoom: 15
      })
      
      // 设置标记并执行聚合
      manualCluster.value.setMarkers(markers.value)
      
      console.log(`✓ 手动聚合器创建成功，网格大小: 80px`)
    } else {
      // 不使用聚合，直接添加到地图
      console.log(`✓ 直接显示 ${markers.value.length} 个充电站标记`)
      
      // 销毁手动聚合器
      if (manualCluster.value) {
        manualCluster.value.destroy()
        manualCluster.value = null
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
  const markers = context.markers || []
  
  console.log(`[聚合渲染] 开始渲染聚合标记，包含 ${count} 个充电站`)
  
  // 计算聚合内充电站的平均空闲率
  let totalAvailable = 0
  let totalCount = 0
  
  markers.forEach(marker => {
    try {
      const station = marker.getExtData()?.station
      if (station) {
        totalAvailable += station.availableCount || 0
        totalCount += station.totalCount || 0
      }
    } catch (e) {
      console.warn('获取标记数据失败:', e)
    }
  })
  
  const avgRate = totalCount > 0 ? totalAvailable / totalCount : 0.5
  
  console.log(`[聚合渲染] 平均空闲率: ${(avgRate * 100).toFixed(1)}%`)
  
  // 根据平均空闲率选择颜色
  let bgColor, borderColor
  if (avgRate >= 0.5) {
    bgColor = '#10b981' // 绿色
    borderColor = '#059669'
  } else if (avgRate >= 0.2) {
    bgColor = '#f59e0b' // 黄色
    borderColor = '#d97706'
  } else {
    bgColor = '#ef4444' // 红色
    borderColor = '#dc2626'
  }
  
  // 根据数量调整大小
  let size = 50
  if (count > 100) {
    size = 70
  } else if (count > 50) {
    size = 60
  } else if (count > 20) {
    size = 55
  }
  
  // 创建聚合标记DOM
  const div = document.createElement('div')
  div.className = 'cluster-marker'
  div.style.cssText = `
    background: ${bgColor};
    color: white;
    border: 3px solid white;
    border-radius: 50%;
    width: ${size}px;
    height: ${size}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 4px ${borderColor}40;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: Arial, sans-serif;
    position: relative;
    transform: translate(-50%, -50%);
  `
  
  div.innerHTML = `
    <div style="font-size: ${size > 60 ? '22px' : '18px'}; line-height: 1; margin-bottom: 2px;">${count}</div>
    <div style="font-size: ${size > 60 ? '11px' : '9px'}; opacity: 0.95;">充电站</div>
  `
  
  // 添加hover效果
  div.addEventListener('mouseenter', () => {
    div.style.transform = 'translate(-50%, -50%) scale(1.15)'
    div.style.boxShadow = `0 6px 16px rgba(0,0,0,0.5), 0 0 0 6px ${borderColor}60`
  })
  div.addEventListener('mouseleave', () => {
    div.style.transform = 'translate(-50%, -50%) scale(1)'
    div.style.boxShadow = `0 4px 12px rgba(0,0,0,0.4), 0 0 0 4px ${borderColor}40`
  })
  
  // 设置到context.marker
  context.marker.setContent(div)
  
  console.log(`[聚合渲染] ✓ 聚合标记渲染完成: ${count}个充电站, 颜色: ${bgColor}`)
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
    
    // 更新用户位置标记
    if (map.value && userMarker.value) {
      userMarker.value.setCenter([position.lng, position.lat])
      map.value.setCenter([position.lng, position.lat])
      map.value.setZoom(14)
      
      // 重新加载该位置周围的充电站
      await loadStations()
    }
    
    if (showToast) {
      appStore.showToast('定位成功', 'success')
    }
    
    return position
  } catch (error) {
    console.error('定位失败:', error)
    if (showToast) {
      appStore.showToast('定位失败，使用默认位置', 'warning')
    }
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
  clearRoute()
  if (manualCluster.value) {
    manualCluster.value.destroy()
  }
  if (map.value) {
    map.value.destroy()
  }
  window.removeEventListener('theme-change', handleThemeChange)
})

function handleThemeChange(e) {
  amapService.setMapStyle(e.detail.isDark)
}

// 绘制路线
function drawRoute(routeData) {
  if (!map.value || !AMap.value || !routeData) return
  
  // 清除旧路线
  clearRoute()
  
  try {
    // 转换路径格式
    const path = routeData.path.map(point => [point.lng, point.lat])
    
    // 创建路线折线
    routeLine.value = new AMap.value.Polyline({
      path: path,
      strokeColor: '#4299e1', // 蓝色
      strokeWeight: 6,
      strokeOpacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 100,
      showDir: true // 显示方向箭头
    })
    
    map.value.add(routeLine.value)
    
    // 调整视野以适应路线
    map.value.setFitView([routeLine.value], false, [50, 50, 50, 50])
    
    console.log('路线绘制成功')
  } catch (error) {
    console.error('绘制路线失败:', error)
  }
}

// 清除路线
function clearRoute() {
  if (routeLine.value && map.value) {
    map.value.remove(routeLine.value)
    routeLine.value = null
  }
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
  },
  drawRoute,
  clearRoute
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
.charging-marker:hover > div:first-child {
  filter: brightness(1.15);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.charging-marker:active > div:first-child {
  filter: brightness(0.95);
}

/* 聚合标记样式 */
.cluster-marker {
  user-select: none;
  cursor: pointer;
}

/* 优化地图上文字的渲染 */
.amap-marker-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif !important;
}
</style>

