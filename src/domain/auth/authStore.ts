/**
 * 领域层：身份验证状态管理
 * 包含用户认证和授权的核心逻辑
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from './permissions';
import { eventBus } from '../../core/eventBus';

// 用户接口
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  preferences?: UserPreferences;
}

// 用户偏好设置
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: boolean;
  dietaryRestrictions?: string[];
}

// 认证状态
export interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 动作
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
}

// 创建认证存储
export const createAuthStore = () => 
  create<AuthState>()(
    persist(
      (set, get) => ({
        // 初始状态
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        
        // 登录
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // 这里应该是真实的API调用
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (email === 'test@example.com' && password === 'password') {
              const user: User = {
                id: '1',
                email: 'test@example.com',
                name: '测试用户',
                role: UserRole.USER,
                preferences: {
                  theme: 'system',
                  language: 'zh-CN',
                  notifications: true,
                  dietaryRestrictions: [],
                }
              };
              
              set({
                user,
                token: 'mock-token',
                isAuthenticated: true,
                isLoading: false,
              });
              
              // 使用新的事件总线发出登录事件
              eventBus.emit('auth:login', user);
              
              return true;
            } else {
              set({
                isLoading: false,
                error: '邮箱或密码不正确',
              });
              
              return false;
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '登录失败',
            });
            
            return false;
          }
        },
        
        // 注册
        register: async (name: string, email: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // 这里应该是真实的API调用
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const user: User = {
              id: '1',
              email,
              name,
              role: UserRole.USER,
              preferences: {
                theme: 'system',
                language: 'zh-CN',
                notifications: true,
                dietaryRestrictions: [],
              }
            };
            
            set({
              user,
              token: 'mock-token',
              isAuthenticated: true,
              isLoading: false,
            });
            
            // 使用新的事件总线发出注册事件
            eventBus.emit('auth:register', user);
            
            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '注册失败',
            });
            
            return false;
          }
        },
        
        // 登出
        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          
          // 使用新的事件总线发出登出事件
          eventBus.emit('auth:logout', undefined);
        },
        
        // 更新用户信息
        updateUser: async (userData: Partial<User>) => {
          set({ isLoading: true, error: null });
          
          try {
            // 这里应该是真实的API调用
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const currentUser = get().user;
            if (!currentUser) {
              throw new Error('用户未登录');
            }
            
            const updatedUser = {
              ...currentUser,
              ...userData,
            };
            
            set({
              user: updatedUser,
              isLoading: false,
            });
            
            // 使用新的事件总线发出个人资料更新事件
            eventBus.emit('auth:profile-update', userData);
            
            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '更新用户信息失败',
            });
            
            return false;
          }
        },
        
        // 更新用户偏好设置
        updatePreferences: async (preferences: Partial<UserPreferences>) => {
          set({ isLoading: true, error: null });
          
          try {
            // 这里应该是真实的API调用
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const currentUser = get().user;
            if (!currentUser) {
              throw new Error('用户未登录');
            }
            
            const updatedUser = {
              ...currentUser,
              preferences: {
                ...currentUser.preferences,
                ...preferences,
              },
            };
            
            set({
              user: updatedUser,
              isLoading: false,
            });
            
            // 使用新的事件总线发出个人资料更新事件（包含偏好设置）
            if (currentUser.preferences) {
              const updatedPreferences = {
                ...currentUser.preferences,
                ...preferences,
              };
              
              eventBus.emit('auth:profile-update', {
                preferences: updatedPreferences
              });
            }
            
            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '更新用户偏好设置失败',
            });
            
            return false;
          }
        },
        
        // 验证邮箱
        verifyEmail: async (token: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // 这里应该是真实的API调用
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 模拟成功
            set({ isLoading: false });
            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '验证邮箱失败',
            });
            
            return false;
          }
        },
        
        // 忘记密码
        forgotPassword: async (email: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // 这里应该是真实的API调用
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 模拟成功
            set({ isLoading: false });
            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '发送重置密码邮件失败',
            });
            
            return false;
          }
        },
        
        // 重置密码
        resetPassword: async (token: string, newPassword: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // 这里应该是真实的API调用
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 模拟成功
            set({ isLoading: false });
            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : '重置密码失败',
            });
            
            return false;
          }
        },
        
        // 清除错误
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  );

// 创建认证存储实例
export const useAuthStore = createAuthStore(); 