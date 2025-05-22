import { type StateCreator } from 'zustand';
import { type StoreMutatorIdentifier } from 'zustand/vanilla';
import { createBroadcastChannel } from '../utils/common/networkUtils';

// 浏览器存储密钥
const SYNC_KEY_PREFIX = 'what_to_eat_sync_';

// 同步通道
const SYNC_CHANNEL = 'what_to_eat_state_sync';

// 同步消息类型
interface SyncMessage<T = any> {
  key: string;
  state: T;
  timestamp: number;
}

// 中间件类型定义
type BrowserSyncOptions = {
  /**
   * 要同步的状态键名列表
   */
  syncKeys?: string[];
  
  /**
   * 自定义密钥前缀
   */
  prefix?: string;
  
  /**
   * 自定义通道名称
   */
  channel?: string;
  
  /**
   * 同步前的处理函数
   */
  onSync?: <T>(state: T) => T;
  
  /**
   * 同步完成后的回调
   */
  onSynced?: <T>(newState: T) => void;
};

/**
 * 创建跨页面同步中间件
 * 用于在不同标签页之间同步状态
 */
export const browserSync = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  options: BrowserSyncOptions = {}
) => {
  const {
    syncKeys = [],
    prefix = SYNC_KEY_PREFIX,
    channel = SYNC_CHANNEL,
    onSync = (state) => state,
    onSynced,
  } = options;

  // 创建广播通道
  const broadcastChannel = createBroadcastChannel<SyncMessage>(channel);

  return <S extends T>(
    f: StateCreator<S, Mps, Mcs>,
    get: () => S,
    api: { setState: (state: Partial<S>) => void }
  ): StateCreator<S, Mps, Mcs> => {
    // 初始化时从localStorage加载状态
    if (typeof window !== 'undefined') {
      try {
        for (const key of syncKeys) {
          const storedItem = localStorage.getItem(`${prefix}${key}`);
          if (storedItem) {
            const { state } = JSON.parse(storedItem) as SyncMessage;
            if (state !== undefined) {
              const currentState = get();
              api.setState({ ...currentState, [key]: state } as Partial<S>);
              
              // 触发同步后回调
              if (onSynced) {
                onSynced({ ...currentState, [key]: state } as S);
              }
            }
          }
        }
      } catch (err) {
        console.error('从localStorage加载状态失败', err);
      }
    }

    // 设置广播通道消息监听器
    const unsubscribe = broadcastChannel.addListener((message: SyncMessage) => {
      try {
        const { key, state, timestamp } = message;
        if (syncKeys.includes(key)) {
          // 更新状态
          const currentState = get();
          api.setState({ ...currentState, [key]: state } as Partial<S>);
          
          // 同步到localStorage
          localStorage.setItem(
            `${prefix}${key}`, 
            JSON.stringify({ key, state, timestamp })
          );
          
          // 触发同步后回调
          if (onSynced) {
            onSynced({ ...currentState, [key]: state } as S);
          }
        }
      } catch (err) {
        console.error('处理广播消息失败', err);
      }
    });

    return (...args: any[]) => {
      // 调用原始状态创建函数
      const result = f(...(args as Parameters<typeof f>));

      // 包装setState以同步更改
      const originalSetState = api.setState;
      api.setState = (partial: Partial<S>) => {
        // 调用原始setState
        originalSetState(partial);
        
        // 获取更新后的状态
        const state = get();
        
        // 同步关键状态
        for (const key of syncKeys) {
          if (key in partial) {
            const processedState = onSync(state[key as keyof S]);
            const syncMessage: SyncMessage = {
              key,
              state: processedState,
              timestamp: Date.now(),
            };
            
            // 存储到localStorage
            try {
              localStorage.setItem(
                `${prefix}${key}`, 
                JSON.stringify(syncMessage)
              );
            } catch (err) {
              console.error(`同步状态到localStorage失败: ${key}`, err);
            }
            
            // 通过广播频道广播
            broadcastChannel.postMessage(syncMessage);
          }
        }
      };

      return result;
    };
  };
};

// 清理函数，用于组件卸载时调用
export const cleanupBrowserSync = (channelName: string = SYNC_CHANNEL): void => {
  const channel = createBroadcastChannel(channelName);
  channel.close();
}; 