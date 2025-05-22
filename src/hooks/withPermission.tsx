/**
 * 权限HOC
 */
import React, { ComponentType, FC } from 'react';
import { ResourceType, ActionType } from '../domain/auth/permissions';
import { usePermission } from './usePermission';

/**
 * 包装需要特定权限的组件
 */
export function withPermission<P extends object>(
  resource: ResourceType,
  action: ActionType,
  FallbackComponent?: ComponentType<{ message?: string }>
) {
  return function (WrappedComponent: ComponentType<P>): FC<P> {
    return function PermissionWrapper(props: P) {
      const { checkPermission } = usePermission();
      const hasAccess = checkPermission(resource, action);
      
      if (!hasAccess) {
        if (FallbackComponent) {
          return React.createElement(FallbackComponent, { 
            message: `无权访问: ${resource}/${action}` 
          });
        }
        return null;
      }
      
      return React.createElement(WrappedComponent, props);
    };
  };
} 