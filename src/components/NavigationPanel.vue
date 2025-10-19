<template>
  <transition name="slide-up">
    <div v-if="visible" class="navigation-panel">
      <div class="panel-content">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="handleClose">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- 路线信息 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p class="text-gray-600 dark:text-gray-400 mt-3">正在规划路线...</p>
        </div>

        <div v-else-if="routeInfo" class="route-info">
          <!-- 目的地信息 -->
          <div class="destination-info">
            <div class="flex items-start">
              <div class="destination-icon">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div class="flex-1 ml-3">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ destination?.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ destination?.address }}
                </p>
              </div>
            </div>
          </div>

          <!-- 路线统计 -->
          <div class="route-stats">
            <div class="stat-item">
              <div class="stat-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatDistance(routeInfo.distance) }}</div>
                <div class="stat-label">距离</div>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatDuration(routeInfo.duration) }}</div>
                <div class="stat-label">预计时间</div>
              </div>
            </div>
          </div>

          <!-- 预估路线提示 -->
          <div v-if="routeInfo.isCustomRoute" class="route-notice">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>以上为直线距离预估，实际路线请以高德地图为准</span>
          </div>

          <!-- 路线步骤 -->
          <div class="route-steps">
            <div class="steps-header">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h4 class="steps-title">路线规划</h4>
            </div>
            <div class="steps-list">
              <div 
                v-for="(step, index) in routeInfo.steps.slice(0, 3)" 
                :key="index"
                class="step-item"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <div class="step-instruction">{{ step.instruction }}</div>
                  <div class="step-details">
                    <span v-if="step.road" class="step-road">{{ step.road }}</span>
                    <span class="step-distance">{{ formatDistance(step.distance) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="routeInfo.steps.length > 3" class="step-more">
                还有 {{ routeInfo.steps.length - 3 }} 个步骤...
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="error" class="error-state">
          <svg class="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
          <button class="retry-btn mt-4" @click="handleRetry">
            重试
          </button>
        </div>

        <!-- 导航按钮 -->
        <div v-if="routeInfo && !loading" class="navigation-actions">
          <button class="nav-btn nav-btn-primary" @click="handleConfirmNavigation">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div class="nav-btn-content">
              <div class="nav-btn-title">启动导航</div>
              <div class="nav-btn-subtitle">使用高德地图导航</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import amapService from '@/services/amap'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  origin: {
    type: Object,
    default: null
  },
  destination: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'navigate', 'routePlanned'])

const loading = ref(false)
const routeInfo = ref(null)
const error = ref(null)

// 格式化距离
function formatDistance(meters) {
  if (!meters) return '0m'
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

// 格式化时间
function formatDuration(seconds) {
  if (!seconds) return '0分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.ceil((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

// 规划路线
async function planRoute() {
  if (!props.origin || !props.destination) {
    error.value = '无法获取位置信息，请确保已授予定位权限'
    return
  }

  // 验证坐标有效性
  if (!props.origin.lat || !props.origin.lng) {
    error.value = '起点位置无效，请重新定位'
    return
  }
  if (!props.destination.lat || !props.destination.lng) {
    error.value = '终点位置无效，请重新选择充电站'
    return
  }

  console.log('准备规划路线:', {
    origin: props.origin,
    destination: props.destination
  })

  try {
    loading.value = true
    error.value = null
    
    const route = await amapService.getDrivingRoute(
      { lat: props.origin.lat, lng: props.origin.lng },
      { lat: props.destination.lat, lng: props.destination.lng }
    )
    
    routeInfo.value = route
    emit('routePlanned', route)
  } catch (err) {
    console.error('路线规划失败:', err)
    error.value = err.message || '路线规划失败，请重试'
  } finally {
    loading.value = false
  }
}

// 重试
function handleRetry() {
  planRoute()
}

// 关闭面板
function handleClose() {
  emit('close')
  // 延迟清空数据，等动画结束
  setTimeout(() => {
    routeInfo.value = null
    error.value = null
  }, 300)
}

// 确认导航
function handleConfirmNavigation() {
  emit('navigate', {
    destination: props.destination,
    route: routeInfo.value
  })
  
  // 打开高德地图APP
  amapService.openAmapApp({
    lat: props.destination.lat,
    lng: props.destination.lng,
    name: props.destination.name
  })
}

// 监听面板显示状态
watch(() => props.visible, (visible) => {
  if (visible && props.origin && props.destination) {
    planRoute()
  }
})
</script>

<style scoped>
.navigation-panel {
  @apply fixed bottom-0 left-0 right-0 z-50;
  @apply bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl;
  max-height: 70vh;
  overflow-y: auto;
}

.panel-content {
  @apply relative p-6 pb-8;
}

.close-btn {
  @apply absolute top-4 right-4 p-2 rounded-full;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400;
  @apply hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors;
  z-index: 10;
}

/* 加载状态 */
.loading-state {
  @apply text-center py-12;
}

.loading-spinner {
  @apply w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto;
}

/* 错误状态 */
.error-state {
  @apply text-center py-12;
}

.retry-btn {
  @apply px-6 py-2 bg-blue-600 text-white rounded-lg;
  @apply hover:bg-blue-700 transition-colors;
}

/* 路线信息 */
.route-info {
  @apply space-y-6;
}

/* 目的地信息 */
.destination-info {
  @apply mb-4;
}

.destination-icon {
  @apply flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full;
  @apply flex items-center justify-center text-blue-600 dark:text-blue-400;
}

/* 路线统计 */
.route-stats {
  @apply flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20;
  @apply rounded-2xl p-4;
}

.stat-item {
  @apply flex items-center flex-1;
}

.stat-icon {
  @apply flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-full;
  @apply flex items-center justify-center text-blue-600 dark:text-blue-400;
  @apply shadow-sm;
}

.stat-content {
  @apply ml-3 flex-1;
}

.stat-value {
  @apply text-xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-0.5;
}

.stat-divider {
  @apply w-px h-10 bg-gray-300 dark:bg-gray-700 mx-4;
}

/* 预估路线提示 */
.route-notice {
  @apply flex items-center gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20;
  @apply rounded-xl text-sm text-amber-700 dark:text-amber-400;
  @apply border border-amber-200 dark:border-amber-800;
}

.route-notice svg {
  @apply flex-shrink-0;
}

.route-notice span {
  @apply flex-1;
}

/* 路线步骤 */
.route-steps {
  @apply bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4;
}

.steps-header {
  @apply flex items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700;
}

.steps-title {
  @apply ml-2 text-base font-bold text-gray-900 dark:text-white;
}

.steps-list {
  @apply space-y-3;
}

.step-item {
  @apply flex items-start;
}

.step-number {
  @apply flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full;
  @apply flex items-center justify-center text-sm font-bold;
}

.step-content {
  @apply ml-3 flex-1;
}

.step-instruction {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.step-details {
  @apply flex items-center gap-2 mt-1;
}

.step-road {
  @apply text-xs text-blue-600 dark:text-blue-400 font-medium;
}

.step-distance {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.step-more {
  @apply text-center text-sm text-gray-500 dark:text-gray-400 py-2;
}

/* 导航按钮 */
.navigation-actions {
  @apply mt-6;
}

.nav-btn {
  @apply w-full flex items-center justify-center;
  @apply rounded-2xl p-4 transition-all;
  @apply shadow-lg active:scale-95;
}

.nav-btn-primary {
  @apply bg-gradient-to-r from-blue-600 to-indigo-600 text-white;
  @apply hover:from-blue-700 hover:to-indigo-700;
}

.nav-btn-content {
  @apply ml-3 text-left;
}

.nav-btn-title {
  @apply text-lg font-bold;
}

.nav-btn-subtitle {
  @apply text-sm opacity-90 mt-0.5;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>

