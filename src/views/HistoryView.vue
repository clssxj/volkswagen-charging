<template>
  <div class="history-view">
    <!-- 顶部导航栏 -->
    <div class="top-nav safe-area-top">
      <button class="back-btn" @click="handleBack">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-lg font-bold">充电记录</h1>
      <div class="w-6"></div>
    </div>

    <div class="history-container">
      <!-- 统计卡片 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ totalCount }}</div>
          <div class="stat-label">总充电次数</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ totalEnergy.toFixed(1) }}</div>
          <div class="stat-label">总充电量(kWh)</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ totalAmount.toFixed(0) }}</div>
          <div class="stat-label">总金额(元)</div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="py-12 text-center">
        <div class="loading-spinner mx-auto"></div>
        <p class="text-gray-600 dark:text-gray-400 mt-4">加载中...</p>
      </div>

      <!-- 历史记录列表 -->
      <div v-else-if="historyList.length > 0" class="history-list">
        <div
          v-for="record in historyList"
          :key="record.id"
          class="history-item"
          @click="viewDetail(record)"
        >
          <div class="flex items-start gap-4">
            <!-- 图标 -->
            <div class="history-icon">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-gray-900 dark:text-white truncate">
                {{ record.stationName }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ formatDateTime(record.startTime) }}
              </p>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-xs text-gray-500">
                  {{ record.energy.toFixed(1) }} kWh
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatDuration(record.duration) }}
                </span>
                <span 
                  class="badge"
                  :class="statusBadgeClass(record.status)"
                >
                  {{ getStatusText(record.status) }}
                </span>
              </div>
            </div>

            <!-- 金额 -->
            <div class="text-right">
              <div class="text-lg font-bold text-gray-900 dark:text-white">
                ¥{{ record.amount.toFixed(2) }}
              </div>
              <button class="text-xs text-primary-500 mt-1">
                查看详情
              </button>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <button 
            class="btn btn-secondary"
            @click="loadMore"
            :disabled="loadingMore"
          >
            <span v-if="!loadingMore">加载更多</span>
            <span v-else class="flex items-center gap-2">
              <div class="loading-spinner w-4 h-4"></div>
              加载中...
            </span>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <svg class="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 mt-4">暂无充电记录</p>
        <button class="btn btn-primary mt-6" @click="goToMap">
          去充电
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { stationApi } from '@/api/station'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(true)
const loadingMore = ref(false)
const historyList = ref([])
const pageIndex = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)

const totalCount = computed(() => historyList.value.length)
const totalEnergy = computed(() => 
  historyList.value.reduce((sum, item) => sum + item.energy, 0)
)
const totalAmount = computed(() => 
  historyList.value.reduce((sum, item) => sum + item.amount, 0)
)

function statusBadgeClass(status) {
  const map = {
    completed: 'badge-available',
    cancelled: 'badge-offline',
    failed: 'badge-offline'
  }
  return map[status] || ''
}

function getStatusText(status) {
  const map = {
    completed: '已完成',
    cancelled: '已取消',
    failed: '失败'
  }
  return map[status] || '未知'
}

function formatDateTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h${minutes}m`
  } else {
    return `${minutes}m`
  }
}

async function loadHistory() {
  try {
    loading.value = true
    const result = await stationApi.getChargingHistory({
      page: pageIndex.value,
      pageSize: pageSize.value
    })
    
    historyList.value = result.list
    hasMore.value = result.list.length >= pageSize.value
  } catch (error) {
    console.error('加载充电记录失败:', error)
    appStore.showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return

  try {
    loadingMore.value = true
    pageIndex.value++
    
    const result = await stationApi.getChargingHistory({
      page: pageIndex.value,
      pageSize: pageSize.value
    })
    
    historyList.value.push(...result.list)
    hasMore.value = result.list.length >= pageSize.value
  } catch (error) {
    console.error('加载更多失败:', error)
    appStore.showToast('加载失败', 'error')
    pageIndex.value--
  } finally {
    loadingMore.value = false
  }
}

function viewDetail(record) {
  appStore.showToast('详情页面开发中', 'info')
  // 可以实现跳转到详情页
  // router.push({ name: 'history-detail', params: { id: record.id } })
}

function goToMap() {
  router.push({ name: 'map' })
}

function handleBack() {
  router.back()
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-view {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.top-nav {
  @apply flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.back-btn {
  @apply p-2 text-gray-700 dark:text-gray-200 active:scale-95 transition-transform;
}

.history-container {
  @apply px-4 pb-6 pt-4;
}

.stats-card {
  @apply bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-4;
  @apply flex items-center justify-around;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply text-2xl font-bold text-primary-500;
}

.stat-label {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.stat-divider {
  @apply w-px h-12 bg-gray-200 dark:bg-gray-700;
}

.history-list {
  @apply space-y-3;
}

.history-item {
  @apply bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm cursor-pointer;
  @apply transition-all active:scale-95 hover:shadow-md;
}

.history-icon {
  @apply w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center;
  @apply text-primary-500;
}

.load-more {
  @apply flex justify-center mt-6;
}

.empty-state {
  @apply text-center py-20;
}
</style>

