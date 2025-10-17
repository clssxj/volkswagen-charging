import { createRouter, createWebHistory } from 'vue-router'
import MapView from '@/views/MapView.vue'

const routes = [
  {
    path: '/',
    name: 'map',
    component: MapView,
    meta: {
      title: '充电地图'
    }
  },
  {
    path: '/station/:id',
    name: 'station-detail',
    component: () => import('@/views/StationDetail.vue'),
    meta: {
      title: '充电站详情'
    }
  },
  {
    path: '/charging/:id',
    name: 'charging',
    component: () => import('@/views/ChargingView.vue'),
    meta: {
      title: '正在充电'
    }
  },
  {
    path: '/payment/:id',
    name: 'payment',
    component: () => import('@/views/PaymentView.vue'),
    meta: {
      title: '支付'
    }
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
    meta: {
      title: '充电记录'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 大众充电地图` : '大众充电地图'
  next()
})

export default router

