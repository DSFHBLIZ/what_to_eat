import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 受保护的路径列表
const PROTECTED_PATHS = [
  '/admin',
  '/admin/',
  '/admin/db-optimization',
  '/admin/data',
  '/admin/settings',
  '/admin/users',
  '/admin/monitoring',
  '/admin/security',
  '/profile',
  '/settings',
];

// 从请求中获取认证状态
interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// 获取用户状态，检查是否已登录和是否是管理员
function getUserStateFromRequest(request: NextRequest): AuthState {
  const authCookie = request.cookies.get('auth_token');
  const userRoleCookie = request.cookies.get('user_role');
  
  const isAuthenticated = !!authCookie?.value;
  const isAdmin = userRoleCookie?.value === 'admin';
  
  return { isAuthenticated, isAdmin };
}

// 中间件函数
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { isAuthenticated, isAdmin } = getUserStateFromRequest(request);
  
  // 重定向 /favorites 到 /collections (收藏夹)
  if (pathname === '/favorites') {
    const url = request.nextUrl.clone();
    url.pathname = '/collections';
    return NextResponse.redirect(url);
  }
  
  // 检查是否是管理员路径
  const isAdminPath = pathname.startsWith('/admin');
  
  // 检查是否是受保护的路径
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // 如果是管理员路径，但用户不是管理员，重定向到首页
  if (isAdminPath && !isAdmin) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 如果是受保护的路径，但用户未登录，重定向到首页
  if (isProtectedPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 继续处理请求
  return NextResponse.next();
}

// 配置匹配的路径
export const config = {
  matcher: [
    // 匹配所有受保护的路径
    ...PROTECTED_PATHS.map(path => path + '/:path*'),
  ],
}; 