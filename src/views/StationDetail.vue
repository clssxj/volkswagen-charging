<template>
  <div class="station-detail-view">
    <!-- 顶部导航栏 -->
    <div class="top-nav safe-area-top">
      <button class="back-btn" @click="handleBack">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-lg font-bold">充电站详情</h1>
      <button class="share-btn">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
    </div>

    <div v-else-if="station" class="station-content">
      <!-- 站点信息卡片 -->
      <div class="info-card">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ station.name }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ station.address }}
        </p>

        <div class="flex items-center gap-3 mb-4">
          <span class="badge" :class="statusBadgeClass">
            {{ statusText }}
          </span>
          <span v-if="distance" class="text-sm text-gray-600 dark:text-gray-400">
            距离 {{ distance }}
          </span>
        </div>

        <!-- 快速统计 -->
        <div class="quick-stats">
          <div class="stat-box">
            <div class="stat-number text-green-600 dark:text-green-400">
              {{ station.availableCount }}
            </div>
            <div class="stat-text">空闲</div>
          </div>
          <div class="stat-box">
            <div class="stat-number text-yellow-600 dark:text-yellow-400">
              {{ station.chargingCount }}
            </div>
            <div class="stat-text">使用中</div>
          </div>
          <div class="stat-box">
            <div class="stat-number text-gray-600 dark:text-gray-400">
              {{ station.totalCount }}
            </div>
            <div class="stat-text">总计</div>
          </div>
        </div>
      </div>

      <!-- 地图位置 -->
      <div class="map-card">
        <div ref="miniMapContainer" class="mini-map"></div>
      </div>

      <!-- 价格信息 -->
      <div class="price-card">
        <h3 class="section-title">价格信息</h3>
        <div class="price-list">
          <div class="price-item">
            <span class="price-label">电价</span>
            <span class="price-value">¥{{ station.pricePerKWh }}/度</span>
          </div>
          <div class="price-item">
            <span class="price-label">服务费</span>
            <span class="price-value">¥{{ station.serviceFee }}/度</span>
          </div>
          <div class="price-item">
            <span class="price-label">综合费用</span>
            <span class="price-value text-primary-500">
              ¥{{ (parseFloat(station.pricePerKWh) + parseFloat(station.serviceFee)).toFixed(2) }}/度
            </span>
          </div>
        </div>
      </div>

      <!-- 充电桩列表 -->
      <div class="chargers-card">
        <h3 class="section-title">充电桩详情</h3>
        <div class="charger-grid">
          <div
            v-for="charger in station.chargers"
            :key="charger.id"
            class="charger-card status-transition"
            :class="chargerStatusClass(charger.status)"
            @click="selectCharger(charger)"
          >
            <div class="charger-header">
              <span class="charger-number">{{ charger.number }}</span>
              <span class="charger-type">{{ charger.type }}</span>
            </div>
            <div class="charger-power">{{ charger.power }}kW</div>
            <div class="charger-status">{{ chargerStatusText(charger.status) }}</div>
          </div>
        </div>
      </div>

      <!-- 站点详情 -->
      <div class="details-card">
        <h3 class="section-title">站点信息</h3>
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">营业时间</span>
            <span class="detail-value">{{ station.openTime || '00:00-24:00' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">运营商</span>
            <span class="detail-value">{{ station.operatorName || '国家电网' }}</span>
          </div>
          <div v-if="station.rating" class="detail-row">
            <span class="detail-label">用户评分</span>
            <span class="detail-value">
              ⭐ {{ station.rating }} ({{ station.reviewCount }}条评价)
            </span>
          </div>
        </div>
      </div>

      <!-- 配套设施 -->
      <div v-if="station.facilities && station.facilities.length > 0" class="facilities-card">
        <h3 class="section-title">配套设施</h3>
        <div class="facility-tags">
          <span
            v-for="facility in station.facilities"
            :key="facility"
            class="facility-tag"
          >
            {{ facility }}
          </span>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="station" class="bottom-actions safe-area-bottom">
      <button class="action-btn action-btn-secondary" @click="handleNavigate">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        导航
      </button>
      <button
        class="action-btn action-btn-primary flex-1"
        @click="handleCharge"
        :disabled="station.availableCount === 0"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        立即充电
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStationStore } from '@/stores/station'
import { useAppStore } from '@/stores/app'
import amapService from '@/services/amap'

const route = useRoute()
const router = useRouter()
const stationStore = useStationStore()
const appStore = useAppStore()

const loading = ref(true)
const station = ref(null)
const miniMapContainer = ref(null)
const miniMap = ref(null)
const selectedCharger = ref(null)

const statusText = computed(() => {
  const status = station.value?.status
  const map = {
    available: '可用',
    busy: '繁忙',
    offline: '离线',
    maintenance: '维护中'
  }
  return map[status] || '未知'
})

const statusBadgeClass = computed(() => {
  const status = station.value?.status
  const map = {
    available: 'badge-available',
    busy: 'badge-busy',
    offline: 'badge-offline',
    maintenance: 'badge-maintenance'
  }
  return map[status] || ''
})

const distance = computed(() => {
  if (!station.value || !stationStore.userLocation) return null
  
  const dist = stationStore.calculateDistance(
    stationStore.userLocation.lat,
    stationStore.userLocation.lng,
    station.value.lat,
    station.value.lng
  )
  
  return stationStore.formatDistance(dist)
})

function chargerStatusClass(status) {
  const map = {
    available: 'charger-available',
    charging: 'charger-charging',
    offline: 'charger-offline'
  }
  return map[status] || ''
}

function chargerStatusText(status) {
  const map = {
    available: '空闲',
    charging: '充电中',
    offline: '离线'
  }
  return map[status] || '未知'
}

async function loadStationDetail() {
  try {
    loading.value = true
    const stationId = route.params.id
    station.value = await stationStore.fetchStationDetail(stationId)
    
    // 初始化小地图
    await initMiniMap()
  } catch (error) {
    console.error('加载充电站详情失败:', error)
    appStore.showToast('加载失败', 'error')
    router.back()
  } finally {
    loading.value = false
  }
}

async function initMiniMap() {
  if (!station.value || !miniMapContainer.value) return

  try {
    const AMap = await amapService.load()
    
    miniMap.value = new AMap.Map(miniMapContainer.value, {
      center: [station.value.lng, station.value.lat],
      zoom: 15,
      resizeEnable: true,
      dragEnable: false,
      zoomEnable: false,
      doubleClickZoom: false
    })

    // 添加标记
    new AMap.Marker({
      position: [station.value.lng, station.value.lat],
      map: miniMap.value
    })
  } catch (error) {
    console.error('初始化小地图失败:', error)
  }
}

function selectCharger(charger) {
  if (charger.status === 'available') {
    selectedCharger.value = charger
    appStore.showToast(`已选择${charger.number}`, 'success', 2000)
  } else {
    appStore.showToast(`${charger.number}不可用`, 'warning')
  }
}

function handleNavigate() {
  if (!station.value) return
  
  amapService.openAmapApp({
    lat: station.value.lat,
    lng: station.value.lng,
    name: station.value.name
  })
}

function handleCharge() {
  if (!station.value || station.value.availableCount === 0) {
    appStore.showToast('当前无可用充电桩', 'warning')
    return
  }

  // 如果未选择充电桩，选择第一个可用的
  if (!selectedCharger.value && station.value.chargers) {
    selectedCharger.value = station.value.chargers.find(c => c.status === 'available')
  }

  router.push({
    name: 'charging',
    params: { id: station.value.id },
    query: { chargerId: selectedCharger.value?.id }
  })
}

function handleBack() {
  router.back()
}

onMounted(() => {
  loadStationDetail()
})

onUnmounted(() => {
  if (miniMap.value) {
    miniMap.value.destroy()
  }
})
</script>

<style scoped>
.station-detail-view {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900 pb-20;
}

.top-nav {
  @apply flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.back-btn, .share-btn {
  @apply p-2 text-gray-700 dark:text-gray-200 active:scale-95 transition-transform;
}

.loading-container {
  @apply flex flex-col items-center justify-center py-20;
}

.station-content {
  @apply space-y-3 p-4;
}

.info-card, .map-card, .price-card, .chargers-card, .details-card, .facilities-card {
  @apply bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm;
}

.section-title {
  @apply text-base font-bold text-gray-900 dark:text-white mb-3;
}

.quick-stats {
  @apply grid grid-cols-3 gap-3;
}

.stat-box {
  @apply text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.stat-number {
  @apply text-2xl font-bold;
}

.stat-text {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.mini-map {
  @apply w-full h-48 rounded-lg overflow-hidden;
}

.price-list, .detail-list {
  @apply space-y-3;
}

.price-item, .detail-row {
  @apply flex justify-between items-center;
}

.price-label, .detail-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.price-value, .detail-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.charger-grid {
  @apply grid grid-cols-3 gap-2;
}

.charger-card {
  @apply p-3 rounded-lg text-center cursor-pointer;
  @apply transition-all active:scale-95;
}

.charger-available {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400;
}

.charger-charging {
  @apply bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400;
}

.charger-offline {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.charger-header {
  @apply flex items-center justify-between mb-1;
}

.charger-number {
  @apply text-xs font-medium;
}

.charger-type {
  @apply text-xs px-1.5 py-0.5 bg-white/50 rounded;
}

.charger-power {
  @apply text-sm font-bold my-1;
}

.charger-status {
  @apply text-xs;
}

.facility-tags {
  @apply flex flex-wrap gap-2;
}

.facility-tag {
  @apply px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300;
}

.bottom-actions {
  @apply fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  @apply flex gap-3;
}

.action-btn {
  @apply flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium;
  @apply transition-all active:scale-95;
}

.action-btn-secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white;
}

.action-btn-primary {
  @apply bg-primary-500 text-white;
}

.action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>

