<template>
  <div class="charging-view">
    <!-- 顶部导航栏 -->
    <div class="top-nav safe-area-top">
      <button class="back-btn" @click="handleBack">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-lg font-bold text-white">正在充电</h1>
      <div class="w-6"></div>
    </div>

    <!-- 充电状态卡片 -->
    <div class="charging-container">
      <div class="charging-card">
        <!-- 充电动画 -->
        <div class="charging-animation">
          <div class="charging-circle">
            <svg class="charging-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="pulse-ring"></div>
          <div class="pulse-ring" style="animation-delay: 0.5s"></div>
        </div>

        <!-- 充电进度 -->
        <div class="charging-progress mt-8">
          <div class="text-center mb-6">
            <div class="text-5xl font-bold text-primary-500">
              {{ chargingData.energy.toFixed(1) }}
            </div>
            <div class="text-gray-600 dark:text-gray-400 mt-2">已充电量 (kWh)</div>
          </div>

          <!-- 统计信息 -->
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">实时功率</div>
              <div class="stat-value">{{ chargingData.power }}kW</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">充电时长</div>
              <div class="stat-value">{{ formatDuration(chargingData.duration) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">预计剩余</div>
              <div class="stat-value">{{ formatDuration(chargingData.estimatedTime) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">当前费用</div>
              <div class="stat-value text-primary-500">¥{{ chargingData.amount.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- 充电详情 -->
        <div class="charging-details">
          <h3 class="text-base font-bold mb-3">充电详情</h3>
          <div class="detail-list">
            <div class="detail-item">
              <span>充电站</span>
              <span>{{ stationName }}</span>
            </div>
            <div class="detail-item">
              <span>充电桩</span>
              <span>{{ chargerNumber }}</span>
            </div>
            <div class="detail-item">
              <span>电压</span>
              <span>{{ chargingData.voltage }}V</span>
            </div>
            <div class="detail-item">
              <span>电流</span>
              <span>{{ chargingData.current }}A</span>
            </div>
            <div class="detail-item">
              <span>开始时间</span>
              <span>{{ formatTime(chargingData.startTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button 
          class="btn btn-primary btn-large" 
          @click="handleStopCharging"
          :disabled="stopping"
        >
          <span v-if="!stopping">结束充电</span>
          <span v-else class="flex items-center gap-2">
            <div class="loading-spinner w-5 h-5"></div>
            停止中...
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { stationApi } from '@/api/station'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const stationName = ref('充电站')
const chargerNumber = ref('1号桩')
const stopping = ref(false)
const updateInterval = ref(null)

const chargingData = ref({
  orderId: '',
  status: 'charging',
  startTime: new Date().toISOString(),
  duration: 0,
  energy: 0,
  power: 0,
  voltage: 0,
  current: 0,
  estimatedTime: 0,
  amount: 0
})

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

function formatTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function loadChargingData() {
  try {
    const orderId = route.query.orderId || `ORDER_${Date.now()}`
    const data = await stationApi.getChargingStatus(orderId)
    chargingData.value = data
  } catch (error) {
    console.error('获取充电状态失败:', error)
  }
}

async function startCharging() {
  try {
    const stationId = route.params.id
    const chargerId = route.query.chargerId
    
    const result = await stationApi.startCharging(stationId, chargerId)
    chargingData.value.orderId = result.orderId
    
    // 开始轮询更新充电状态
    startStatusUpdates()
  } catch (error) {
    console.error('启动充电失败:', error)
    appStore.showToast('启动充电失败', 'error')
    handleBack()
  }
}

function startStatusUpdates() {
  // 模拟充电数据更新
  updateInterval.value = setInterval(() => {
    chargingData.value.duration += 1
    chargingData.value.energy += chargingData.value.power / 3600
    chargingData.value.amount += (chargingData.value.power / 3600) * 1.5
    chargingData.value.estimatedTime = Math.max(0, chargingData.value.estimatedTime - 1)
    
    // 随机波动功率
    chargingData.value.power = Math.floor(48 + Math.random() * 6)
    chargingData.value.current = Math.floor(125 + Math.random() * 10)
  }, 1000)
}

function stopStatusUpdates() {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
    updateInterval.value = null
  }
}

async function handleStopCharging() {
  if (stopping.value) return

  // 确认对话框
  if (!confirm('确定要结束充电吗？')) {
    return
  }

  try {
    stopping.value = true
    
    const result = await stationApi.stopCharging(chargingData.value.orderId)
    
    stopStatusUpdates()
    
    appStore.showToast('充电已结束', 'success')
    
    // 跳转到支付页面
    router.push({
      name: 'payment',
      params: { id: result.orderId },
      query: {
        energy: result.energy,
        amount: result.amount,
        duration: result.duration
      }
    })
  } catch (error) {
    console.error('停止充电失败:', error)
    appStore.showToast('停止充电失败，请重试', 'error')
  } finally {
    stopping.value = false
  }
}

function handleBack() {
  if (chargingData.value.status === 'charging') {
    if (!confirm('充电正在进行中，确定要返回吗？')) {
      return
    }
  }
  router.back()
}

onMounted(async () => {
  // 检查是否有orderId，如果有则加载数据，否则启动新的充电
  if (route.query.orderId) {
    await loadChargingData()
    startStatusUpdates()
  } else {
    await startCharging()
  }
})

onUnmounted(() => {
  stopStatusUpdates()
})
</script>

<style scoped>
.charging-view {
  @apply min-h-screen bg-gradient-to-b from-primary-500 to-primary-700;
}

.top-nav {
  @apply flex items-center justify-between px-4 py-4;
}

.back-btn {
  @apply p-2 text-white active:scale-95 transition-transform;
}

.charging-container {
  @apply px-4 pb-6;
}

.charging-card {
  @apply bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl;
}

.charging-animation {
  @apply relative flex items-center justify-center h-48;
}

.charging-circle {
  @apply relative z-10 w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center;
  animation: bounce 2s ease-in-out infinite;
}

.charging-icon {
  @apply w-12 h-12 text-white;
}

.pulse-ring {
  @apply absolute w-32 h-32 border-4 border-primary-300 rounded-full;
  animation: pulse-ring 2s ease-out infinite;
}

.charging-progress {
  @apply border-t border-gray-200 dark:border-gray-700 pt-6;
}

.stats-grid {
  @apply grid grid-cols-2 gap-4;
}

.stat-item {
  @apply text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-1;
}

.stat-value {
  @apply text-lg font-bold text-gray-900 dark:text-white;
}

.charging-details {
  @apply mt-6 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.detail-list {
  @apply space-y-3;
}

.detail-item {
  @apply flex justify-between items-center text-sm;
}

.detail-item > span:first-child {
  @apply text-gray-600 dark:text-gray-400;
}

.detail-item > span:last-child {
  @apply font-medium text-gray-900 dark:text-white;
}

.action-buttons {
  @apply mt-6;
}

.btn-large {
  @apply w-full py-4 text-lg font-bold;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>

