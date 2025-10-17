import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const isLoading = ref(false)
  const isDarkMode = ref(false)
  const toast = ref({
    visible: false,
    message: '',
    type: 'info' // 'success' | 'error' | 'warning' | 'info'
  })

  let toastTimer = null

  // 计算属性
  const themeClass = computed(() => isDarkMode.value ? 'dark' : '')

  // 方法
  function setLoading(loading) {
    isLoading.value = loading
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('darkMode', isDarkMode.value)
    
    // 触发地图主题切换
    window.dispatchEvent(new CustomEvent('theme-change', { 
      detail: { isDark: isDarkMode.value } 
    }))
  }

  function showToast(message, type = 'info', duration = 3000) {
    if (toastTimer) {
      clearTimeout(toastTimer)
    }

    toast.value = {
      visible: true,
      message,
      type
    }

    toastTimer = setTimeout(() => {
      toast.value.visible = false
    }, duration)
  }

  function hideToast() {
    toast.value.visible = false
    if (toastTimer) {
      clearTimeout(toastTimer)
    }
  }

  function initDarkMode() {
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      isDarkMode.value = savedMode === 'true'
    } else {
      // 检测系统主题偏好
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  // 初始化
  initDarkMode()

  return {
    isLoading,
    isDarkMode,
    toast,
    themeClass,
    setLoading,
    toggleDarkMode,
    showToast,
    hideToast
  }
})

