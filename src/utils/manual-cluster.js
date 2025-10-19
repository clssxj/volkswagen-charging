/**
 * 手动实现标记聚合逻辑（不依赖高德MarkerClusterer）
 */

export class ManualCluster {
  constructor(map, options = {}) {
    this.map = map
    this.markers = []
    this.clusterMarkers = []
    this.gridSize = options.gridSize || 80
    this.minClusterSize = options.minClusterSize || 3
    this.maxZoom = options.maxZoom || 15
  }

  // 设置标记
  setMarkers(markers) {
    this.clearClusters()
    this.markers = markers
    this.cluster()
  }

  // 聚合计算
  cluster() {
    const zoom = this.map.getZoom()
    
    // 如果缩放级别超过maxZoom，直接显示所有标记
    if (zoom >= this.maxZoom) {
      this.markers.forEach(marker => marker.setMap(this.map))
      console.log(`[手动聚合] Zoom≥${this.maxZoom}，直接显示 ${this.markers.length} 个标记`)
      return
    }

    // 创建网格聚合
    const clusters = this.createClusters()
    console.log(`[手动聚合] 创建了 ${clusters.length} 个聚合组`)
    
    let clusterCount = 0
    let directCount = 0
    
    // 渲染聚合
    clusters.forEach(cluster => {
      if (cluster.markers.length >= this.minClusterSize) {
        // ≥minClusterSize个：创建聚合标记，隐藏原始标记
        cluster.markers.forEach(marker => {
          marker.setMap(null) // 隐藏原始标记
        })
        this.createClusterMarker(cluster)
        clusterCount++
      } else {
        // <minClusterSize个：直接显示原始标记
        cluster.markers.forEach(marker => marker.setMap(this.map))
        directCount += cluster.markers.length
      }
    })
    
    console.log(`[手动聚合] ✓ 创建 ${clusterCount} 个聚合标记，直接显示 ${directCount} 个单独标记`)
  }

  // 创建网格聚合
  createClusters() {
    const gridMap = new Map()
    
    this.markers.forEach(marker => {
      const position = marker.getPosition()
      const pixel = this.map.lngLatToContainer(position)
      
      // 计算网格索引
      const gridX = Math.floor(pixel.x / this.gridSize)
      const gridY = Math.floor(pixel.y / this.gridSize)
      const gridKey = `${gridX}_${gridY}`
      
      if (!gridMap.has(gridKey)) {
        gridMap.set(gridKey, {
          markers: [],
          center: null
        })
      }
      
      gridMap.get(gridKey).markers.push(marker)
    })
    
    // 计算每个聚合的中心点
    const clusters = []
    gridMap.forEach((cluster, key) => {
      let lat = 0
      let lng = 0
      
      cluster.markers.forEach(marker => {
        const pos = marker.getPosition()
        lat += pos.lat
        lng += pos.lng
      })
      
      cluster.center = {
        lat: lat / cluster.markers.length,
        lng: lng / cluster.markers.length
      }
      
      clusters.push(cluster)
    })
    
    return clusters
  }

  // 创建聚合标记
  createClusterMarker(cluster) {
    const count = cluster.markers.length
    
    // 计算平均空闲率
    let totalAvailable = 0
    let totalCount = 0
    
    cluster.markers.forEach(marker => {
      const station = marker.getExtData()?.station
      if (station) {
        totalAvailable += station.availableCount || 0
        totalCount += station.totalCount || 0
      }
    })
    
    const avgRate = totalCount > 0 ? totalAvailable / totalCount : 0.5
    
    // 选择颜色
    let bgColor = '#10b981'
    if (avgRate < 0.5 && avgRate >= 0.2) {
      bgColor = '#f59e0b'
    } else if (avgRate < 0.2) {
      bgColor = '#ef4444'
    }
    
    // 大小
    let size = 50
    if (count > 50) size = 60
    if (count > 100) size = 70
    
    // 创建DOM
    const div = document.createElement('div')
    div.style.cssText = `
      background: ${bgColor};
      color: white;
      border: 3px solid white;
      border-radius: 50%;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      cursor: pointer;
    `
    
    div.innerHTML = `
      <div style="font-size: ${size > 60 ? '22px' : '18px'}; line-height: 1;">${count}</div>
      <div style="font-size: 10px; opacity: 0.9; margin-top: 2px;">充电站</div>
    `
    
    // 创建标记
    const clusterMarker = new window.AMap.Marker({
      position: [cluster.center.lng, cluster.center.lat],
      content: div,
      offset: new window.AMap.Pixel(-size/2, -size/2),
      zIndex: 200
    })
    
    // 点击事件：放大地图
    clusterMarker.on('click', () => {
      this.map.setZoomAndCenter(this.map.getZoom() + 2, [cluster.center.lng, cluster.center.lat])
    })
    
    clusterMarker.setMap(this.map)
    this.clusterMarkers.push(clusterMarker)
  }

  // 清除聚合
  clearClusters() {
    // 清除聚合标记
    this.clusterMarkers.forEach(marker => {
      marker.setMap(null)
    })
    this.clusterMarkers = []
    
    // 清除原始标记
    this.markers.forEach(marker => {
      marker.setMap(null)
    })
  }

  // 销毁
  destroy() {
    this.clearClusters()
    this.markers = []
  }
}

