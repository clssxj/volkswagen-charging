<template>
  <div id="app" :class="{ dark: isDarkMode }">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    
    <!-- 全局加载指示器 -->
    <Teleport to="body">
      <div v-if="isLoading" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-4">
          <div class="loading-spinner"></div>
          <p class="text-gray-700 dark:text-gray-300">加载中...</p>
        </div>
      </div>
    </Teleport>

    <!-- 全局Toast提示 -->
    <Teleport to="body">
      <transition name="slide-up">
        <div
          v-if="toast.visible"
          class="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg max-w-sm"
          :class="toastClass"
        >
          {{ toast.message }}
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const isLoading = computed(() => appStore.isLoading)
const isDarkMode = computed(() => appStore.isDarkMode)
const toast = computed(() => appStore.toast)

const toastClass = computed(() => {
  const baseClass = 'text-white'
  switch (toast.value.type) {
    case 'success':
      return `${baseClass} bg-success`
    case 'error':
      return `${baseClass} bg-danger`
    case 'warning':
      return `${baseClass} bg-warning`
    default:
      return `${baseClass} bg-info`
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100px);
  opacity: 0;
}
</style>

