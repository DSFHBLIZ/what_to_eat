/**
 * 权限检查Hook
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AppProvider';
import { UserRole, ResourceType, ActionType, hasPermission } from '../domain/auth/permissions';

// 定义最小用户接口，确保类型兼容性
interface MinimalUser {
  id?: string;
  role?: string;
}

/**
 * 检查当前用户是否有指定资源和动作的权限
 */
export function usePermission() {
  const auth = useAuth();
  
  const checkPermission = useCallback(
    (resource: ResourceType, action: ActionType, resourceId?: string, context?: any) => {
      // 如果没有登录或没有用户信息，拒绝访问
      if (!auth || !auth.isAuthenticated || !auth.user) {
        return false;
      }
      
      const user = auth.user as MinimalUser;
      
      // 如果用户没有ID或角色，拒绝访问
      if (!user.id) {
        return false;
      }
      
      // 使用默认USER角色作为后备选项
      const userRole = (user.role as UserRole) || UserRole.USER;
      
      return hasPermission(
        user.id,
        userRole,
        resource,
        action,
        resourceId,
        context
      );
    },
    [auth]
  );
  
  const assertPermission = useCallback(
    (resource: ResourceType, action: ActionType, resourceId?: string, context?: any) => {
      const hasAccess = checkPermission(resource, action, resourceId, context);
      
      if (!hasAccess) {
        throw new Error(`权限不足: ${resource}/${action}`);
      }
      
      return true;
    },
    [checkPermission]
  );
  
  return {
    checkPermission,
    assertPermission,
  };
}

// 直接导出domain/auth/permissions中的函数
export { hasPermission as checkPermission } from '../domain/auth/permissions';

/**
 * 断言权限，不需要Hook上下文
 */
export function assertPermission(
  role: UserRole, 
  resource: ResourceType, 
  action: ActionType, 
  resourceId?: string, 
  context?: any
) {
  const hasAccess = hasPermission(null, role, resource, action, resourceId, context);
  
  if (!hasAccess) {
    throw new Error(`权限不足: ${resource}/${action}`);
  }
  
  return true;
} 