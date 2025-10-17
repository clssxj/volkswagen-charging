<template>
  <transition name="drawer">
    <div v-if="visible && station" class="drawer-overlay" @click="handleClose">
      <div 
        class="drawer-content" 
        :class="{ 'drawer-expanded': isExpanded }"
        @click.stop
      >
        <!-- 拖动手柄 -->
        <div class="drawer-handle" @click="toggleExpand">
          <div class="handle-bar"></div>
        </div>

        <!-- 简要信息 -->
        <div class="station-summary" @click="toggleExpand">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {{ station.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ station.address }}
              </p>
              <div class="flex items-center gap-2">
                <span 
                  class="badge status-transition"
                  :class="statusBadgeClass"
                >
                  {{ statusText }}
                </span>
                <span v-if="distance" class="text-sm text-gray-600 dark:text-gray-400">
                  {{ distance }}
                </span>
              </div>
            </div>
            <button class="close-btn" @click.stop="handleClose">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 充电桩统计 -->
          <div class="grid grid-cols-3 gap-3 mt-4">
            <div class="stat-card bg-green-50 dark:bg-green-900/20">
              <div class="stat-value text-green-600 dark:text-green-400">
                {{ station.availableCount }}
              </div>
              <div class="stat-label">空闲</div>
            </div>
            <div class="stat-card bg-yellow-50 dark:bg-yellow-900/20">
              <div class="stat-value text-yellow-600 dark:text-yellow-400">
                {{ station.chargingCount }}
              </div>
              <div class="stat-label">使用中</div>
            </div>
            <div class="stat-card bg-gray-50 dark:bg-gray-800">
              <div class="stat-value text-gray-600 dark:text-gray-400">
                {{ station.totalCount }}
              </div>
              <div class="stat-label">总数</div>
            </div>
          </div>
        </div>

        <!-- 详细信息（展开时显示） -->
        <div v-if="isExpanded" class="station-details">
          <!-- 充电桩详情 -->
          <div v-if="detailLoading" class="py-8 text-center">
            <div class="loading-spinner mx-auto"></div>
            <p class="text-gray-600 dark:text-gray-400 mt-2">加载详情...</p>
          </div>

          <div v-else-if="stationDetail" class="space-y-4">
            <!-- 充电桩列表 -->
            <section>
              <h4 class="section-title">充电桩列表</h4>
              <div class="charger-grid">
                <div 
                  v-for="charger in stationDetail.chargers" 
                  :key="charger.id"
                  class="charger-item status-transition"
                  :class="chargerStatusClass(charger.status)"
                  @click="selectCharger(charger)"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium">{{ charger.number }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-white/50">
                      {{ charger.type }}
                    </span>
                  </div>
                  <div class="text-xs mt-1 opacity-80">
                    {{ charger.power }}kW
                  </div>
                  <div class="text-xs mt-1 font-medium">
                    {{ chargerStatusText(charger.status) }}
                  </div>
                </div>
              </div>
            </section>

            <!-- 价格信息 -->
            <section>
              <h4 class="section-title">价格信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">电价</span>
                  <span class="info-value">¥{{ station.pricePerKWh }}/度</span>
                </div>
                <div class="info-item">
                  <span class="info-label">服务费</span>
                  <span class="info-value">¥{{ station.serviceFee }}/度</span>
                </div>
              </div>
            </section>

            <!-- 站点信息 -->
            <section>
              <h4 class="section-title">站点信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">营业时间</span>
                  <span class="info-value">{{ stationDetail.openTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">运营商</span>
                  <span class="info-value">{{ stationDetail.operatorName }}</span>
                </div>
                <div v-if="stationDetail.rating" class="info-item">
                  <span class="info-label">评分</span>
                  <span class="info-value">
                    ⭐ {{ stationDetail.rating }} ({{ stationDetail.reviewCount }})
                  </span>
                </div>
              </div>
            </section>

            <!-- 配套设施 -->
            <section v-if="stationDetail.facilities">
              <h4 class="section-title">配套设施</h4>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="facility in stationDetail.facilities" 
                  :key="facility"
                  class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                >
                  {{ facility }}
                </span>
              </div>
            </section>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="drawer-actions">
          <button class="btn btn-secondary flex-1" @click="handleNavigate">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            导航
          </button>
          <button 
            class="btn btn-primary flex-1" 
            @click="handleCharge"
            :disabled="station.availableCount === 0"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            立即充电
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStationStore } from '@/stores/station'
import { useAppStore } from '@/stores/app'
import amapService from '@/services/amap'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  station: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'navigate', 'charge'])

const router = useRouter()
const stationStore = useStationStore()
const appStore = useAppStore()

const isExpanded = ref(false)
const detailLoading = ref(false)
const stationDetail = ref(null)
const selectedCharger = ref(null)

const statusText = computed(() => {
  const status = props.station?.status
  const map = {
    available: '可用',
    busy: '繁忙',
    offline: '离线',
    maintenance: '维护中'
  }
  return map[status] || '未知'
})

const statusBadgeClass = computed(() => {
  const status = props.station?.status
  const map = {
    available: 'badge-available',
    busy: 'badge-busy',
    offline: 'badge-offline',
    maintenance: 'badge-maintenance'
  }
  return map[status] || ''
})

const distance = computed(() => {
  if (!props.station || !stationStore.userLocation) return null
  
  const dist = stationStore.calculateDistance(
    stationStore.userLocation.lat,
    stationStore.userLocation.lng,
    props.station.lat,
    props.station.lng
  )
  
  return stationStore.formatDistance(dist)
})

function chargerStatusClass(status) {
  const map = {
    available: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    charging: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    offline: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
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

async function toggleExpand() {
  isExpanded.value = !isExpanded.value
  
  if (isExpanded.value && !stationDetail.value) {
    await loadStationDetail()
  }
}

async function loadStationDetail() {
  if (!props.station) return
  
  try {
    detailLoading.value = true
    stationDetail.value = await stationStore.fetchStationDetail(props.station.id)
  } catch (error) {
    console.error('加载充电站详情失败:', error)
  } finally {
    detailLoading.value = false
  }
}

function selectCharger(charger) {
  if (charger.status === 'available') {
    selectedCharger.value = charger
    appStore.showToast(`已选择${charger.number}`, 'success', 2000)
  }
}

function handleClose() {
  emit('close')
  setTimeout(() => {
    isExpanded.value = false
    stationDetail.value = null
    selectedCharger.value = null
  }, 300)
}

function handleNavigate() {
  if (!props.station) return
  
  // 唤起高德地图APP导航
  amapService.openAmapApp({
    lat: props.station.lat,
    lng: props.station.lng,
    name: props.station.name
  })
  
  emit('navigate', props.station)
}

function handleCharge() {
  if (!props.station || props.station.availableCount === 0) {
    appStore.showToast('当前无可用充电桩', 'warning')
    return
  }
  
  // 如果未选择充电桩，选择第一个可用的
  if (!selectedCharger.value && stationDetail.value) {
    selectedCharger.value = stationDetail.value.chargers.find(c => c.status === 'available')
  }
  
  emit('charge', {
    station: props.station,
    charger: selectedCharger.value
  })
  
  // 跳转到充电页面
  router.push({
    name: 'charging',
    params: { id: props.station.id },
    query: { chargerId: selectedCharger.value?.id }
  })
}

watch(() => props.visible, (visible) => {
  if (visible && props.station) {
    // 可以在这里预加载详情
    // loadStationDetail()
  }
})
</script>

<style scoped>
.drawer-overlay {
  @apply fixed inset-0 bg-black/30 z-40;
}

.drawer-content {
  @apply absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl;
  @apply max-h-[80vh] overflow-y-auto;
  transition: max-height 0.3s ease;
}

.drawer-content.drawer-expanded {
  @apply max-h-[85vh];
}

.drawer-handle {
  @apply flex justify-center py-3 cursor-pointer;
}

.handle-bar {
  @apply w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full;
}

.station-summary {
  @apply px-4 pb-4;
}

.close-btn {
  @apply p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400;
}

.stat-card {
  @apply rounded-lg p-3 text-center;
}

.stat-value {
  @apply text-2xl font-bold;
}

.stat-label {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.station-details {
  @apply px-4 pb-20;
}

.section-title {
  @apply text-base font-bold text-gray-900 dark:text-white mb-3;
}

.charger-grid {
  @apply grid grid-cols-3 gap-2;
}

.charger-item {
  @apply p-3 rounded-lg cursor-pointer text-center;
  @apply transition-all active:scale-95;
}

.info-grid {
  @apply space-y-2;
}

.info-item {
  @apply flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800;
}

.info-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.info-value {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.drawer-actions {
  @apply fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800;
  @apply flex gap-3 safe-area-bottom;
}

.btn {
  @apply flex items-center justify-center;
}
</style>

