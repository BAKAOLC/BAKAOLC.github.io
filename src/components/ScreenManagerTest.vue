<template>
  <div class="screen-manager-test">
    <h3>屏幕管理器测试</h3>
    <div class="info-grid">
      <div class="info-item">
        <label>屏幕宽度:</label>
        <span>{{ screenInfo.width }}px</span>
      </div>
      <div class="info-item">
        <label>屏幕高度:</label>
        <span>{{ screenInfo.height }}px</span>
      </div>
      <div class="info-item">
        <label>是否移动端:</label>
        <span :class="{ active: isMobile }">{{ isMobile ? '是' : '否' }}</span>
      </div>
      <div class="info-item">
        <label>是否平板:</label>
        <span :class="{ active: isTablet }">{{ isTablet ? '是' : '否' }}</span>
      </div>
      <div class="info-item">
        <label>是否桌面端:</label>
        <span :class="{ active: isDesktop }">{{ isDesktop ? '是' : '否' }}</span>
      </div>
      <div class="info-item">
        <label>设备像素比:</label>
        <span>{{ screenInfo.devicePixelRatio }}</span>
      </div>
      <div class="info-item">
        <label>屏幕方向:</label>
        <span>{{ screenInfo.orientation === 'landscape' ? '横屏' : '竖屏' }}</span>
      </div>
      <div class="info-item">
        <label>活跃监听器数量:</label>
        <span>{{ activeListeners }}</span>
      </div>
    </div>
    <div class="change-log">
      <h4>变化日志:</h4>
      <div class="log-entries">
        <div v-for="(entry, index) in changeLog" :key="index" class="log-entry">
          <span class="timestamp">{{ entry.timestamp }}</span>
          <span class="message">{{ entry.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useScreenManager, type ScreenInfo } from '@/composables/useScreenManager';

const { screenInfo, isMobile, isTablet, isDesktop, onScreenChange, getActiveListenersCount } = useScreenManager();

const activeListeners = ref(0);
const changeLog = ref<Array<{ timestamp: string; message: string }>>([]);

// 屏幕变化监听器取消函数
let unsubscribeScreenChange: (() => void) | null = null;

const addLogEntry = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  changeLog.value.unshift({ timestamp, message });
  // 只保留最近10条记录
  if (changeLog.value.length > 10) {
    changeLog.value = changeLog.value.slice(0, 10);
  }
};

const handleScreenChange = (info: ScreenInfo) => {
  const deviceType = info.isMobile ? '移动端' : info.isTablet ? '平板' : '桌面端';
  const message = `屏幕变化: ${info.width}x${info.height} (${deviceType}, ${info.orientation === 'landscape' ? '横屏' : '竖屏'})`;
  addLogEntry(message);
  
  // 更新活跃监听器数量
  activeListeners.value = getActiveListenersCount();
};

onMounted(() => {
  // 注册屏幕变化监听器
  unsubscribeScreenChange = onScreenChange(handleScreenChange);
  
  // 初始化活跃监听器数量
  activeListeners.value = getActiveListenersCount();
  
  addLogEntry('屏幕管理器测试组件已挂载');
});

onBeforeUnmount(() => {
  // 取消屏幕变化监听器
  if (unsubscribeScreenChange) {
    unsubscribeScreenChange();
    unsubscribeScreenChange = null;
  }
  
  addLogEntry('屏幕管理器测试组件已卸载');
});
</script>

<style scoped>
.screen-manager-test {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #f8fafc;
  margin: 1rem 0;
}

.screen-manager-test h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: white;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
}

.info-item label {
  font-weight: 500;
  color: #475569;
}

.info-item span {
  font-weight: 600;
  color: #1e293b;
}

.info-item span.active {
  color: #059669;
}

.change-log {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.change-log h4 {
  margin: 0 0 0.75rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}

.log-entries {
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.log-entry:last-child {
  border-bottom: none;
}

.timestamp {
  color: #64748b;
  font-family: monospace;
  min-width: 80px;
}

.message {
  color: #334155;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
