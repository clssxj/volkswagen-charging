<template>
  <div class="map-view">
    <!-- 顶部搜索栏 -->
    <div class="top-bar safe-area-top">
      <div class="search-container">
        <div class="search-box">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索充电站"
            class="search-input"
            @focus="showSearchResults = true"
            @keyup.enter="handleSearch"
          />
          <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button class="icon-btn" @click="showHistory">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <!-- 搜索结果 -->
      <transition name="fade">
        <div v-if="showSearchResults && searchResults.length > 0" class="search-results">
          <div
            v-for="result in searchResults"
            :key="result.id"
            class="search-result-item"
            @click="selectSearchResult(result)"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">{{ result.name }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ result.address }}</p>
            </div>
            <span v-if="result.distance" class="text-sm text-gray-500">
              {{ formatDistance(result.distance) }}
            </span>
          </div>
        </div>
      </transition>
    </div>

    <!-- 地图组件 -->
    <MapComponent
      ref="mapRef"
      @map-ready="handleMapReady"
      @marker-click="handleMarkerClick"
      @bounds-changed="handleBoundsChanged"
    />

    <!-- 底部充电站列表（可滑动） -->
    <div class="bottom-panel" v-show="!selectedStation">
      <div class="panel-header">
        <h3 class="text-base font-bold text-gray-900 dark:text-white">
          附近充电站
          <span class="text-sm font-normal text-gray-500 ml-2">
            ({{ nearbyStations.length }})
          </span>
        </h3>
        <button class="text-sm text-primary-500" @click="showAllStations">
          查看全部
        </button>
      </div>
      <div class="station-list hide-scrollbar">
        <div
          v-for="station in nearbyStations.slice(0, 10)"
          :key="station.id"
          class="station-card"
          @click="handleStationCardClick(station)"
        >
          <div class="flex items-start gap-3">
            <div class="station-icon" :class="stationIconClass(station.status)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-900 dark:text-white truncate">
                {{ station.name }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                {{ station.address }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge" :class="statusBadgeClass(station.status)">
                  {{ getStatusText(station.status) }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ station.availableCount }}/{{ station.totalCount }} 可用
                </span>
              </div>
            </div>
            <div class="text-right">
              <div v-if="station.distance !== null" class="text-sm font-medium text-gray-900 dark:text-white">
                {{ formatDistance(station.distance) }}
              </div>
              <div class="text-xs text-gray-500 mt-1">
                ¥{{ station.pricePerKWh }}/度
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 充电站详情抽屉 -->
    <StationDrawer
      :visible="showDrawer"
      :station="selectedStation"
      @close="handleDrawerClose"
      @navigate="handleNavigate"
      @charge="handleCharge"
    />

    <!-- WebSocket连接状态指示器 -->
    <div v-if="!wsConnected" class="ws-status-indicator">
      <svg class="w-4 h-4 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span class="text-xs text-yellow-600 dark:text-yellow-400">实时更新已断开</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStationStore } from '@/stores/station'
import { useAppStore } from '@/stores/app'
import MapComponent from '@/components/MapView.vue'
import StationDrawer from '@/components/StationDrawer.vue'
import wsService from '@/services/websocket'
import { stationApi } from '@/api/station'

const router = useRouter()
const stationStore = useStationStore()
const appStore = useAppStore()

const mapRef = ref(null)
const searchKeyword = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])
const selectedStation = ref(null)
const showDrawer = ref(false)
const wsConnected = ref(false)

const nearbyStations = computed(() => stationStore.nearbyStations)

function stationIconClass(status) {
  const map = {
    available: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    busy: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    offline: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    maintenance: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
  return map[status] || ''
}

function statusBadgeClass(status) {
  const map = {
    available: 'badge-available',
    busy: 'badge-busy',
    offline: 'badge-offline',
    maintenance: 'badge-maintenance'
  }
  return map[status] || ''
}

function getStatusText(status) {
  const map = {
    available: '可用',
    busy: '繁忙',
    offline: '离线',
    maintenance: '维护中'
  }
  return map[status] || '未知'
}

function formatDistance(distance) {
  return stationStore.formatDistance(distance)
}

async function handleSearch() {
  if (!searchKeyword.value.trim()) return

  try {
    appStore.setLoading(true)
    const results = await stationApi.searchStations(
      searchKeyword.value,
      stationStore.userLocation
    )
    
    // 计算距离
    if (stationStore.userLocation) {
      results.forEach(station => {
        station.distance = stationStore.calculateDistance(
          stationStore.userLocation.lat,
          stationStore.userLocation.lng,
          station.lat,
          station.lng
        )
      })
    }
    
    searchResults.value = results
    showSearchResults.value = true
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    appStore.setLoading(false)
  }
}

function clearSearch() {
  searchKeyword.value = ''
  searchResults.value = []
  showSearchResults.value = false
}

function selectSearchResult(station) {
  showSearchResults.value = false
  
  // 移动地图到选中的站点
  if (mapRef.value) {
    mapRef.value.panTo(station.lng, station.lat)
    mapRef.value.setZoom(16)
  }
  
  // 显示详情
  selectedStation.value = station
  showDrawer.value = true
}

function handleMapReady(map) {
  console.log('地图加载完成')
}

function handleMarkerClick(station) {
  selectedStation.value = station
  showDrawer.value = true
}

function handleBoundsChanged(bounds) {
  // 可以在这里处理地图边界变化
}

function handleStationCardClick(station) {
  selectedStation.value = station
  showDrawer.value = true
  
  // 移动地图到选中的站点
  if (mapRef.value) {
    mapRef.value.panTo(station.lng, station.lat)
  }
}

function handleDrawerClose() {
  showDrawer.value = false
  setTimeout(() => {
    selectedStation.value = null
  }, 300)
}

function handleNavigate(station) {
  console.log('导航到:', station.name)
  // 导航逻辑已在StationDrawer组件中处理
}

function handleCharge(data) {
  console.log('开始充电:', data)
  // 跳转逻辑已在StationDrawer组件中处理
}

function showHistory() {
  router.push({ name: 'history' })
}

function showAllStations() {
  // 可以实现显示所有站点的列表页面
  appStore.showToast('功能开发中', 'info')
}

// 初始化WebSocket连接
function initWebSocket() {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
  
  wsService.connect(wsUrl).then(() => {
    wsConnected.value = true
    console.log('WebSocket连接成功')
  }).catch(error => {
    console.error('WebSocket连接失败:', error)
    wsConnected.value = false
    appStore.showToast('实时更新连接失败，将使用轮询模式', 'warning')
  })

  // 订阅状态更新
  wsService.on('station_status_update', (payload) => {
    if (payload.updates) {
      stationStore.updateStationStatus(payload.updates)
    }
  })
}

// 点击外部关闭搜索结果
function handleClickOutside(event) {
  const target = event.target
  if (!target.closest('.search-container') && !target.closest('.search-results')) {
    showSearchResults.value = false
  }
}

onMounted(() => {
  // 初始化WebSocket
  initWebSocket()
  
  // 监听点击事件
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // 断开WebSocket
  wsService.disconnect()
  
  // 移除事件监听
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.map-view {
  @apply relative w-full h-full;
}

.top-bar {
  @apply absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-white/95 to-transparent dark:from-gray-900/95;
}

.search-container {
  @apply flex items-center gap-2;
}

.search-box {
  @apply flex-1 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-lg;
}

.search-input {
  @apply flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white;
  @apply placeholder-gray-400 dark:placeholder-gray-500;
}

.clear-btn {
  @apply p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300;
}

.icon-btn {
  @apply p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-gray-700 dark:text-gray-200;
  @apply active:scale-95 transition-transform;
}

.search-results {
  @apply mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden max-h-96 overflow-y-auto;
}

.search-result-item {
  @apply flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors;
}

.search-result-item:last-child {
  @apply border-b-0;
}

.bottom-panel {
  @apply absolute bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl;
  @apply pb-4 safe-area-bottom;
}

.panel-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800;
}

.station-list {
  @apply px-4 overflow-x-auto flex gap-3 py-3;
  scroll-snap-type: x mandatory;
}

.station-card {
  @apply flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 cursor-pointer;
  @apply transition-all hover:shadow-md active:scale-95;
  scroll-snap-align: start;
}

.station-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0;
}

.ws-status-indicator {
  @apply fixed top-16 right-4 z-30 flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20;
  @apply px-3 py-2 rounded-lg shadow-md;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

