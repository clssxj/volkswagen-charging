import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '@/stores/app'

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const store = useAppStore()
    expect(store.isLoading).toBe(false)
    expect(store.toast.visible).toBe(false)
  })

  it('should set loading state', () => {
    const store = useAppStore()
    store.setLoading(true)
    expect(store.isLoading).toBe(true)
    store.setLoading(false)
    expect(store.isLoading).toBe(false)
  })

  it('should show toast message', () => {
    const store = useAppStore()
    store.showToast('Test message', 'success')
    expect(store.toast.visible).toBe(true)
    expect(store.toast.message).toBe('Test message')
    expect(store.toast.type).toBe('success')
  })

  it('should hide toast after duration', async () => {
    vi.useFakeTimers()
    const store = useAppStore()
    
    store.showToast('Test message', 'info', 1000)
    expect(store.toast.visible).toBe(true)
    
    vi.advanceTimersByTime(1000)
    expect(store.toast.visible).toBe(false)
    
    vi.useRealTimers()
  })

  it('should toggle dark mode', () => {
    const store = useAppStore()
    const initialMode = store.isDarkMode
    
    store.toggleDarkMode()
    expect(store.isDarkMode).toBe(!initialMode)
    
    store.toggleDarkMode()
    expect(store.isDarkMode).toBe(initialMode)
  })
})

