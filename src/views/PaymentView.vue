<template>
  <div class="payment-view">
    <!-- 顶部导航栏 -->
    <div class="top-nav safe-area-top">
      <button class="back-btn" @click="handleBack">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-lg font-bold">支付</h1>
      <div class="w-6"></div>
    </div>

    <div class="payment-container">
      <!-- 支付成功动画 -->
      <div v-if="paymentStatus === 'success'" class="success-animation">
        <div class="success-circle">
          <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-6">支付成功</h2>
        <p class="text-gray-600 dark:text-gray-400 mt-2">感谢使用大众充电服务</p>
      </div>

      <!-- 订单信息 -->
      <div class="order-card">
        <h3 class="text-lg font-bold mb-4">订单详情</h3>
        
        <div class="amount-section">
          <div class="text-gray-600 dark:text-gray-400 mb-2">支付金额</div>
          <div class="text-4xl font-bold text-primary-500">
            ¥{{ orderData.amount.toFixed(2) }}
          </div>
        </div>

        <div class="order-details">
          <div class="detail-item">
            <span>充电量</span>
            <span class="font-medium">{{ orderData.energy.toFixed(2) }} kWh</span>
          </div>
          <div class="detail-item">
            <span>充电时长</span>
            <span class="font-medium">{{ formatDuration(orderData.duration) }}</span>
          </div>
          <div class="detail-item">
            <span>电费</span>
            <span class="font-medium">¥{{ (orderData.energy * 1.2).toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span>服务费</span>
            <span class="font-medium">¥{{ (orderData.energy * 0.5).toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span>订单编号</span>
            <span class="font-medium text-xs">{{ orderData.orderId }}</span>
          </div>
        </div>
      </div>

      <!-- 支付方式选择 -->
      <div v-if="paymentStatus === 'pending'" class="payment-methods">
        <h3 class="text-base font-bold mb-4">选择支付方式</h3>
        
        <div class="method-list">
          <div 
            v-for="method in paymentMethods" 
            :key="method.id"
            class="method-item"
            :class="{ 'method-selected': selectedMethod === method.id }"
            @click="selectMethod(method.id)"
          >
            <div class="flex items-center gap-3 flex-1">
              <div class="method-icon" :style="{ backgroundColor: method.color }">
                <span class="text-2xl">{{ method.icon }}</span>
              </div>
              <div>
                <div class="font-medium text-gray-900 dark:text-white">{{ method.name }}</div>
                <div class="text-xs text-gray-500">{{ method.desc }}</div>
              </div>
            </div>
            <div class="radio-btn" :class="{ 'radio-checked': selectedMethod === method.id }">
              <div class="radio-dot"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 支付按钮 -->
      <div v-if="paymentStatus === 'pending'" class="action-buttons">
        <button 
          class="btn btn-primary btn-large w-full"
          @click="handlePay"
          :disabled="!selectedMethod || paying"
        >
          <span v-if="!paying">确认支付 ¥{{ orderData.amount.toFixed(2) }}</span>
          <span v-else class="flex items-center justify-center gap-2">
            <div class="loading-spinner w-5 h-5"></div>
            支付中...
          </span>
        </button>
      </div>

      <!-- 支付成功后的操作按钮 -->
      <div v-if="paymentStatus === 'success'" class="action-buttons">
        <button class="btn btn-secondary w-full mb-3" @click="viewReceipt">
          查看发票
        </button>
        <button class="btn btn-primary w-full" @click="backToMap">
          返回地图
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { stationApi } from '@/api/station'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const paymentStatus = ref('pending') // 'pending' | 'processing' | 'success' | 'failed'
const selectedMethod = ref(null)
const paying = ref(false)

const orderData = ref({
  orderId: route.params.id || `ORDER_${Date.now()}`,
  energy: parseFloat(route.query.energy) || 0,
  amount: parseFloat(route.query.amount) || 0,
  duration: parseInt(route.query.duration) || 0
})

const paymentMethods = [
  {
    id: 'wechat',
    name: '微信支付',
    desc: '推荐使用',
    icon: '💚',
    color: '#07c160'
  },
  {
    id: 'alipay',
    name: '支付宝',
    desc: '安全便捷',
    icon: '💙',
    color: '#1677ff'
  },
  {
    id: 'unionpay',
    name: '银联支付',
    desc: '银行卡支付',
    icon: '🔴',
    color: '#e21b1b'
  }
]

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

function selectMethod(methodId) {
  selectedMethod.value = methodId
}

async function handlePay() {
  if (!selectedMethod.value || paying.value) return

  try {
    paying.value = true
    
    // 创建支付订单
    const result = await stationApi.createPayment(
      orderData.value.orderId,
      selectedMethod.value
    )
    
    // 模拟支付过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 支付成功
    paymentStatus.value = 'success'
    appStore.showToast('支付成功', 'success')
    
  } catch (error) {
    console.error('支付失败:', error)
    appStore.showToast('支付失败，请重试', 'error')
    paymentStatus.value = 'failed'
  } finally {
    paying.value = false
  }
}

function viewReceipt() {
  appStore.showToast('发票功能开发中', 'info')
}

function backToMap() {
  router.push({ name: 'map' })
}

function handleBack() {
  if (paymentStatus.value === 'success') {
    backToMap()
  } else {
    if (confirm('确定要取消支付吗？')) {
      router.back()
    }
  }
}

onMounted(() => {
  // 默认选择微信支付
  selectedMethod.value = 'wechat'
})
</script>

<style scoped>
.payment-view {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.top-nav {
  @apply flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.back-btn {
  @apply p-2 text-gray-700 dark:text-gray-200 active:scale-95 transition-transform;
}

.payment-container {
  @apply px-4 pb-6 pt-4;
}

.success-animation {
  @apply flex flex-col items-center justify-center py-12;
}

.success-circle {
  @apply w-24 h-24 bg-success rounded-full flex items-center justify-center;
  animation: successScale 0.6s ease-out;
}

.order-card {
  @apply bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-4;
}

.amount-section {
  @apply text-center py-6 border-b border-gray-200 dark:border-gray-700 mb-6;
}

.order-details {
  @apply space-y-3;
}

.detail-item {
  @apply flex justify-between items-center py-2;
}

.detail-item > span:first-child {
  @apply text-gray-600 dark:text-gray-400 text-sm;
}

.detail-item > span:last-child {
  @apply text-gray-900 dark:text-white;
}

.payment-methods {
  @apply bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-4;
}

.method-list {
  @apply space-y-3;
}

.method-item {
  @apply flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer;
  @apply transition-all active:scale-95;
}

.method-selected {
  @apply border-primary-500 bg-primary-50 dark:bg-primary-900/10;
}

.method-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center;
}

.radio-btn {
  @apply w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center;
  @apply transition-all;
}

.radio-checked {
  @apply border-primary-500 bg-primary-500;
}

.radio-dot {
  @apply w-2 h-2 rounded-full bg-white;
  @apply opacity-0 transition-opacity;
}

.radio-checked .radio-dot {
  @apply opacity-100;
}

.action-buttons {
  @apply mt-6 safe-area-bottom;
}

.btn-large {
  @apply py-4 text-lg font-bold;
}

@keyframes successScale {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

