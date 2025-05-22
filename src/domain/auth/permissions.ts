/**
 * 领域层：权限管理
 * 定义系统权限和权限检查逻辑
 */

// 用户角色枚举
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

// 资源类型枚举
export enum ResourceType {
  RECIPE = 'recipe',
  INGREDIENT = 'ingredient',
  USER_PROFILE = 'user_profile',
  COMMENT = 'comment',
  COLLECTION = 'collection',
}

// 操作类型枚举
export enum ActionType {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  PUBLISH = 'publish',
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
  RATE = 'rate',
}

// 权限规则接口
export interface PermissionRule {
  // 资源类型
  resource: ResourceType;
  // 操作类型
  action: ActionType;
  // 允许的角色
  roles: UserRole[];
  // 高级检查函数，返回是否有权限
  check?: (userId: string, resourceId: string, context?: any) => boolean;
}

// 权限规则集
const permissionRules: PermissionRule[] = [
  // 食谱权限
  {
    resource: ResourceType.RECIPE,
    action: ActionType.VIEW,
    roles: [UserRole.GUEST, UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
  },
  {
    resource: ResourceType.RECIPE,
    action: ActionType.CREATE,
    roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
  },
  {
    resource: ResourceType.RECIPE,
    action: ActionType.EDIT,
    roles: [UserRole.EDITOR, UserRole.ADMIN],
    // 用户可以编辑自己创建的食谱
    check: (userId, resourceId, context) => {
      return userId === context?.recipe?.createdBy;
    },
  },
  {
    resource: ResourceType.RECIPE,
    action: ActionType.DELETE,
    roles: [UserRole.ADMIN],
    // 用户可以删除自己创建的食谱
    check: (userId, resourceId, context) => {
      return userId === context?.recipe?.createdBy;
    },
  },
  {
    resource: ResourceType.RECIPE,
    action: ActionType.PUBLISH,
    roles: [UserRole.EDITOR, UserRole.ADMIN],
    // 用户可以发布自己创建的食谱
    check: (userId, resourceId, context) => {
      return userId === context?.recipe?.createdBy;
    },
  },
  
  // 评论权限
  {
    resource: ResourceType.COMMENT,
    action: ActionType.VIEW,
    roles: [UserRole.GUEST, UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
  },
  {
    resource: ResourceType.COMMENT,
    action: ActionType.CREATE,
    roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
  },
  {
    resource: ResourceType.COMMENT,
    action: ActionType.EDIT,
    roles: [UserRole.ADMIN],
    // 用户可以编辑自己的评论
    check: (userId, resourceId, context) => {
      return userId === context?.comment?.createdBy;
    },
  },
  {
    resource: ResourceType.COMMENT,
    action: ActionType.DELETE,
    roles: [UserRole.ADMIN],
    // 用户可以删除自己的评论
    check: (userId, resourceId, context) => {
      return userId === context?.comment?.createdBy;
    },
  },
  
  // 收藏权限
  {
    resource: ResourceType.COLLECTION,
    action: ActionType.VIEW,
    roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    // 只能查看自己的收藏或公开收藏
    check: (userId, resourceId, context) => {
      return userId === context?.collection?.userId || context?.collection?.isPublic;
    },
  },
  {
    resource: ResourceType.COLLECTION,
    action: ActionType.CREATE,
    roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
  },
  {
    resource: ResourceType.COLLECTION,
    action: ActionType.EDIT,
    roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    // 只能编辑自己的收藏
    check: (userId, resourceId, context) => {
      return userId === context?.collection?.userId;
    },
  },
  {
    resource: ResourceType.COLLECTION,
    action: ActionType.DELETE,
    roles: [UserRole.USER, UserRole.EDITOR, UserRole.ADMIN],
    // 只能删除自己的收藏
    check: (userId, resourceId, context) => {
      return userId === context?.collection?.userId;
    },
  },
];

/**
 * 检查用户是否有权限
 * @param userId 用户ID
 * @param role 用户角色
 * @param resource 资源类型
 * @param action 操作类型
 * @param resourceId 资源ID
 * @param context 上下文信息
 * @returns 是否有权限
 */
export function hasPermission(
  userId: string | null,
  role: UserRole,
  resource: ResourceType,
  action: ActionType,
  resourceId?: string,
  context?: any
): boolean {
  // 找到匹配的权限规则
  const rule = permissionRules.find(
    (r) => r.resource === resource && r.action === action
  );
  
  // 如果没有找到规则，默认拒绝
  if (!rule) {
    return false;
  }
  
  // 检查角色是否允许
  const roleAllowed = rule.roles.includes(role);
  if (!roleAllowed) {
    return false;
  }
  
  // 如果有高级检查函数，且用户ID存在，则执行高级检查
  if (rule.check && userId && resourceId) {
    return rule.check(userId, resourceId, context);
  }
  
  // 如果角色允许且没有高级检查，或者高级检查通过，则允许操作
  return true;
} 