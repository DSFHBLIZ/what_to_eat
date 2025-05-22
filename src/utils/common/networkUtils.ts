/**
 * 网络工具函数
 * 提供网络状态检测和广播能力
 */

import { eventBus } from '../../core/eventBus';

// 创建专用的网络事件总线
const networkEventBus = eventBus;

// 网络状态事件类型
export const NetworkEvent = {
  ONLINE: 'network:online',
  OFFLINE: 'network:offline',
  STATUS_CHANGE: 'network:statusChange'
} as const;

// 网络状态接口
export interface NetworkStatus {
  // 是否在线
  isOnline: boolean;
  // 连接类型（如果可以获取）
  connectionType?: string;
  // 最后一次状态变化时间
  lastChanged: number;
  // 是否是快速连接
  isFastConnection?: boolean;
}

// 全局网络状态
let currentNetworkStatus: NetworkStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastChanged: Date.now()
};

// 网络状态监听初始化标志
let isInitialized = false;

/**
 * 初始化网络状态监听
 */
export function initNetworkListeners(): void {
  if (isInitialized || typeof window === 'undefined') return;
  
  // 设置网络状态监听器
  window.addEventListener('online', () => {
    currentNetworkStatus = {
      ...currentNetworkStatus,
      isOnline: true,
      lastChanged: Date.now()
    };
    
    // 触发事件
    networkEventBus.emit(NetworkEvent.ONLINE);
    networkEventBus.emit(NetworkEvent.STATUS_CHANGE, currentNetworkStatus);
  });
  
  window.addEventListener('offline', () => {
    currentNetworkStatus = {
      ...currentNetworkStatus,
      isOnline: false,
      lastChanged: Date.now()
    };
    
    // 触发事件
    networkEventBus.emit(NetworkEvent.OFFLINE);
    networkEventBus.emit(NetworkEvent.STATUS_CHANGE, currentNetworkStatus);
  });
  
  // 如果有Network Information API，监听连接变化
  if (
    typeof navigator !== 'undefined' && 
    'connection' in navigator && 
    navigator.connection && 
    typeof (navigator.connection as any).addEventListener === 'function'
  ) {
    const connection = navigator.connection as any;
    
    connection.addEventListener('change', () => {
      currentNetworkStatus = {
        ...currentNetworkStatus,
        connectionType: connection.effectiveType,
        isFastConnection: ['4g', 'wifi'].includes(connection.effectiveType),
        lastChanged: Date.now()
      };
      
      // 触发事件
      networkEventBus.emit(NetworkEvent.STATUS_CHANGE, currentNetworkStatus);
    });
    
    // 初始化连接类型
    currentNetworkStatus.connectionType = connection.effectiveType;
    currentNetworkStatus.isFastConnection = ['4g', 'wifi'].includes(connection.effectiveType);
  }
  
  isInitialized = true;
}

/**
 * 获取当前网络状态
 * @returns 当前网络状态
 */
export function getNetworkStatus(): NetworkStatus {
  // 确保已初始化
  if (!isInitialized) {
    initNetworkListeners();
  }
  
  return { ...currentNetworkStatus };
}

/**
 * 检查是否在线
 * @returns 是否在线
 */
export function isOnline(): boolean {
  return getNetworkStatus().isOnline;
}

/**
 * 订阅网络状态变化
 * @param handler 处理函数
 * @returns 取消订阅的函数
 */
export function onNetworkStatusChange(handler: (status: NetworkStatus) => void): () => void {
  // 确保已初始化
  if (!isInitialized) {
    initNetworkListeners();
  }
  
  // 先调用一次处理程序
  handler(currentNetworkStatus);
  
  // 订阅事件
  const unsubscribe = () => {
    networkEventBus.off(NetworkEvent.STATUS_CHANGE, handler);
  };
  
  // 添加事件监听
  networkEventBus.on(NetworkEvent.STATUS_CHANGE, handler);
  
  return unsubscribe;
}

/**
 * 创建跨标签页广播频道
 * @param channelName 频道名称
 * @returns 广播频道对象
 */
export function createBroadcastChannel<T = any>(channelName: string) {
  const listeners = new Set<(data: T) => void>();
  let broadcastChannel: BroadcastChannel | null = null;
  
  // 检查BroadcastChannel是否可用
  const isBroadcastChannelAvailable = 
    typeof window !== 'undefined' && 
    'BroadcastChannel' in window;
  
  // 创建广播通道
  if (isBroadcastChannelAvailable) {
    try {
      broadcastChannel = new BroadcastChannel(channelName);
      
      // 设置消息监听器
      broadcastChannel.onmessage = (event) => {
        // 通知所有监听器
        listeners.forEach(listener => {
          try {
            listener(event.data);
          } catch (error) {
            console.error(`处理${channelName}广播消息失败:`, error);
          }
        });
      };
    } catch (err) {
      console.warn(`创建${channelName}BroadcastChannel失败，将回退到localStorage:`, err);
    }
  }
  
  // 如果BroadcastChannel不可用，则使用localStorage
  if (!broadcastChannel) {
    // 存储键
    const storageKey = `broadcast_${channelName}`;
    
    // 设置storage事件监听器
    window.addEventListener('storage', (event) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          
          // 检查时间戳，避免处理过期消息
          const now = Date.now();
          if (data.timestamp && now - data.timestamp < 5000) { // 5秒内的消息
            // 通知所有监听器
            listeners.forEach(listener => {
              try {
                listener(data.message);
              } catch (error) {
                console.error(`处理${channelName}localStorage消息失败:`, error);
              }
            });
          }
        } catch (error) {
          console.error(`解析${channelName}localStorage消息失败:`, error);
        }
      }
    });
  }
  
  return {
    /**
     * 发送消息
     * @param message 消息内容
     */
    postMessage: (message: T) => {
      if (broadcastChannel) {
        // 使用BroadcastChannel发送
        broadcastChannel.postMessage(message);
      } else {
        // 使用localStorage发送
        try {
          localStorage.setItem(
            `broadcast_${channelName}`,
            JSON.stringify({
              message,
              timestamp: Date.now()
            })
          );
        } catch (error) {
          console.error(`通过localStorage发送${channelName}广播消息失败:`, error);
        }
      }
    },
    
    /**
     * 添加消息监听器
     * @param listener 监听器函数
     * @returns 移除监听器的函数
     */
    addListener: (listener: (data: T) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    
    /**
     * 关闭广播频道
     */
    close: () => {
      if (broadcastChannel) {
        broadcastChannel.close();
        broadcastChannel = null;
      }
      listeners.clear();
    }
  };
}

// 初始化网络监听器
if (typeof window !== 'undefined') {
  initNetworkListeners();
}

// 导出默认网络工具
export default {
  initNetworkListeners,
  getNetworkStatus,
  isOnline,
  onNetworkStatusChange,
  createBroadcastChannel
}; 