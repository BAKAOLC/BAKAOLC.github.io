// 图片缓存服务
enum LoadPriority {
  LOW = 0,      // 预加载，低优先级
  NORMAL = 1,   // 普通优先级
  HIGH = 2      // 当前查看的图片，高优先级
}

interface CachedImage {
  url: string
  objectUrl: string
  loaded: boolean
  loading: boolean
  error: boolean
  loadingProgress: number
  priority: LoadPriority
  xhr?: XMLHttpRequest
  loadPromise?: Promise<string>
}

class ImageCacheService {
  private cache = new Map<string, CachedImage>()
  private maxCacheSize = 50 // 最大缓存数量
  private accessOrder: string[] = [] // 访问顺序，用于LRU清理

  // 获取缓存的图片
  getCachedImage(url: string): CachedImage | null {
    const cached = this.cache.get(url)
    if (cached) {
      // 更新访问顺序
      this.updateAccessOrder(url)
      return cached
    }
    return null
  }

  // 调整加载优先级（暂时简单实现，后续可以优化）
  private adjustLoadingPriority(url: string, priority: LoadPriority): void {
    // 简单实现：如果是高优先级且有并发限制，可以考虑暂停低优先级的请求
    // 这里先保持简单，只更新优先级标记
    const cached = this.cache.get(url)
    if (cached) {
      cached.priority = priority
    }
  }

  // 开始加载图片
  loadImage(url: string, priority: LoadPriority = LoadPriority.NORMAL, onProgress?: (progress: number) => void): Promise<string> {
    let cached = this.getCachedImage(url)
    
    if (cached) {
      // 更新优先级（如果新的优先级更高）
      if (priority > cached.priority) {
        cached.priority = priority
        // 如果正在加载且新优先级更高，可能需要调整加载顺序
        if (cached.loading) {
          this.adjustLoadingPriority(url, priority)
        }
      }
      
      // 如果已经加载完成，直接返回
      if (cached.loaded && !cached.error) {
        return Promise.resolve(cached.objectUrl)
      }
      
      // 如果正在加载，返回现有的Promise
      if (cached.loading && cached.loadPromise) {
        // 如果有新的进度回调，添加到现有的xhr中
        if (onProgress && cached.xhr) {
          const originalOnProgress = cached.xhr.onprogress
          cached.xhr.onprogress = (event) => {
            if (originalOnProgress && cached?.xhr) {
              originalOnProgress.call(cached.xhr, event)
            }
            if (event.lengthComputable && cached) {
              const progress = (event.loaded / event.total) * 100
              cached.loadingProgress = progress
              onProgress(progress)
            }
          }
        }
        return cached.loadPromise
      }
      
      // 如果之前加载失败，重新加载
      if (cached.error) {
        this.clearCachedImage(url)
        cached = null
      }
    }

    // 创建新的缓存项
    if (!cached) {
      cached = {
        url,
        objectUrl: '',
        loaded: false,
        loading: true,
        error: false,
        loadingProgress: 0,
        priority
      }
      this.cache.set(url, cached)
      this.updateAccessOrder(url)
    }

    // 开始加载
    cached.loading = true
    cached.error = false
    cached.loadingProgress = 0
    cached.priority = priority

    const loadPromise = new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      cached!.xhr = xhr
      
      xhr.open('GET', url, true)
      xhr.responseType = 'blob'
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          cached!.loadingProgress = progress
          if (onProgress) {
            onProgress(progress)
          }
        }
      }
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          cached!.loadingProgress = 100
          const blob = xhr.response
          const objectUrl = URL.createObjectURL(blob)
          cached!.objectUrl = objectUrl
          cached!.loaded = true
          cached!.loading = false
          resolve(objectUrl)
        } else {
          cached!.error = true
          cached!.loading = false
          reject(new Error(`HTTP ${xhr.status}`))
        }
      }
      
      xhr.onerror = () => {
        cached!.error = true
        cached!.loading = false
        reject(new Error('Network error'))
      }
      
      xhr.onabort = () => {
        cached!.loading = false
        reject(new Error('Request aborted'))
      }
      
      xhr.send()
    })

    cached.loadPromise = loadPromise
    
    // 清理缓存如果超过限制
    this.cleanupCache()
    
    return loadPromise
  }

  // 取消加载
  cancelLoad(url: string): void {
    const cached = this.cache.get(url)
    if (cached && cached.xhr && cached.loading) {
      cached.xhr.abort()
      cached.loading = false
    }
  }

  // 清理指定图片的缓存
  clearCachedImage(url: string): void {
    const cached = this.cache.get(url)
    if (cached) {
      if (cached.xhr && cached.loading) {
        cached.xhr.abort()
      }
      if (cached.objectUrl) {
        URL.revokeObjectURL(cached.objectUrl)
      }
      this.cache.delete(url)
      const index = this.accessOrder.indexOf(url)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    }
  }

  // 更新访问顺序
  private updateAccessOrder(url: string): void {
    const index = this.accessOrder.indexOf(url)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(url)
  }

  // 清理缓存（LRU策略）
  private cleanupCache(): void {
    while (this.cache.size > this.maxCacheSize && this.accessOrder.length > 0) {
      const oldestUrl = this.accessOrder.shift()
      if (oldestUrl) {
        this.clearCachedImage(oldestUrl)
      }
    }
  }

  // 预加载图片
  preloadImage(url: string, priority: LoadPriority = LoadPriority.LOW): Promise<string> {
    return this.loadImage(url, priority)
  }

  // 批量预加载
  preloadImages(urls: string[], priority: LoadPriority = LoadPriority.LOW): Promise<string[]> {
    return Promise.all(urls.map(url => this.preloadImage(url, priority)))
  }

  // 清理所有缓存
  clearAllCache(): void {
    for (const [url] of this.cache) {
      this.clearCachedImage(url)
    }
  }

  // 获取缓存统计信息
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      items: Array.from(this.cache.entries()).map(([url, cached]) => ({
        url,
        loaded: cached.loaded,
        loading: cached.loading,
        error: cached.error,
        progress: cached.loadingProgress
      }))
    }
  }
}

// 创建全局单例
export const imageCache = new ImageCacheService()

// 导出类型和枚举
export type { CachedImage }
export { LoadPriority }
