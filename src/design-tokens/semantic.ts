/**
 * 语义级别设计Token
 * 基于原子级别Token构建，提供有意义的设计变量名称
 */

import { primitiveTokens } from './tokens';

// 亮色主题语义tokens
export const lightSemanticTokens = {
  // 语义化颜色
  color: {
    // 主要品牌色
    brand: {
      primary: primitiveTokens.color.indigo[500],
      secondary: primitiveTokens.color.red[500],
      accent: primitiveTokens.color.amber[500],
    },
    
    // 状态颜色
    status: {
      success: primitiveTokens.color.green[500],
      warning: primitiveTokens.color.amber[500],
      error: primitiveTokens.color.red[500],
      info: primitiveTokens.color.indigo[500],
    },
    
    // 表面颜色
    surface: {
      primary: primitiveTokens.color.white,
      secondary: primitiveTokens.color.grey[100],
      tertiary: primitiveTokens.color.grey[200],
    },
    
    // 文本颜色
    text: {
      primary: primitiveTokens.color.grey[900],
      secondary: primitiveTokens.color.grey[700],
      tertiary: primitiveTokens.color.grey[500],
      disabled: primitiveTokens.color.grey[400],
      inverse: primitiveTokens.color.white,
    },
    
    // 边框颜色
    border: {
      light: primitiveTokens.color.grey[200],
      medium: primitiveTokens.color.grey[300],
      dark: primitiveTokens.color.grey[400],
    },
    
    // 背景颜色
    background: {
      page: primitiveTokens.color.white,
      card: primitiveTokens.color.white,
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // 交互元素颜色
    interactive: {
      default: primitiveTokens.color.indigo[500],
      hover: primitiveTokens.color.indigo[600],
      active: primitiveTokens.color.indigo[700],
      focus: primitiveTokens.color.indigo[500],
      disabled: primitiveTokens.color.grey[300],
    },

    // 标签颜色
    tag: {
      // 难度标签颜色
      difficulty: {
        easy: {
          bg: 'bg-green-100',
          text: 'text-green-800',
          printBg: 'print:bg-green-50'
        },
        medium: {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          printBg: 'print:bg-yellow-50'
        },
        hard: {
          bg: 'bg-red-100',
          text: 'text-red-800',
          printBg: 'print:bg-red-50'
        }
      },
      // 口味标签颜色
      flavor: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        hoverBg: 'hover:bg-indigo-200',
        printBg: 'print:bg-indigo-50'
      },
      // 烹饪方法标签颜色
      method: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        hoverBg: 'hover:bg-purple-200',
        printBg: 'print:bg-purple-50'
      },
      // 菜系标签颜色
      cuisine: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        hoverBg: 'hover:bg-amber-200',
        printBg: 'print:bg-amber-50'
      },
      // 食材颜色
      ingredient: {
        bg: 'bg-green-50',
        text: 'text-green-800',
        title: 'text-green-700',
        border: 'border-green-200',
        hoverBg: 'hover:bg-green-100',
        printBg: 'print:bg-green-50'
      },
      // 调料颜色
      seasoning: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        title: 'text-yellow-700',
        border: 'border-yellow-200',
        hoverBg: 'hover:bg-yellow-100',
        printBg: 'print:bg-yellow-50'
      }
    }
  },
  
  // 组件圆角
  radius: {
    button: {
      sm: primitiveTokens.radius.sm,
      md: primitiveTokens.radius.md,
      lg: primitiveTokens.radius.lg,
      pill: primitiveTokens.radius.full,
    },
    card: {
      sm: primitiveTokens.radius.sm,
      md: primitiveTokens.radius.md,
      lg: primitiveTokens.radius.lg,
    },
    input: {
      sm: primitiveTokens.radius.sm,
      md: primitiveTokens.radius.md,
      lg: primitiveTokens.radius.lg,
    },
    tooltip: primitiveTokens.radius.md,
    badge: primitiveTokens.radius.full,
  },
  
  // 组件阴影
  shadow: {
    card: {
      sm: primitiveTokens.shadow.sm,
      md: primitiveTokens.shadow.md,
      lg: primitiveTokens.shadow.lg,
    },
    dropdown: primitiveTokens.shadow.md,
    modal: primitiveTokens.shadow.xl,
    tooltip: primitiveTokens.shadow.sm,
  },
  
  // 组件间距
  spacing: {
    layout: {
      xs: primitiveTokens.spacing.xs,
      sm: primitiveTokens.spacing.sm,
      md: primitiveTokens.spacing.md,
      lg: primitiveTokens.spacing.lg,
      xl: primitiveTokens.spacing.xl,
      xxl: primitiveTokens.spacing.xxl,
    },
    inset: {
      button: {
        sm: `${primitiveTokens.spacing.xs} ${primitiveTokens.spacing.sm}`,
        md: `${primitiveTokens.spacing.sm} ${primitiveTokens.spacing.md}`,
        lg: `${primitiveTokens.spacing.md} ${primitiveTokens.spacing.lg}`,
      },
      card: primitiveTokens.spacing.md,
      input: primitiveTokens.spacing.sm,
    },
  },
  
  // 组件过渡
  transition: {
    button: `all ${primitiveTokens.transition.duration.fast} ${primitiveTokens.transition.timing.easeInOut}`,
    card: `all ${primitiveTokens.transition.duration.normal} ${primitiveTokens.transition.timing.easeOut}`,
    modal: `all ${primitiveTokens.transition.duration.normal} ${primitiveTokens.transition.timing.easeInOut}`,
    tooltip: `all ${primitiveTokens.transition.duration.fast} ${primitiveTokens.transition.timing.easeOut}`,
  },
};

// 暗色主题语义tokens
export const darkSemanticTokens = {
  // 语义化颜色
  color: {
    // 主要品牌色
    brand: {
      primary: primitiveTokens.color.indigo[400], // 稍微变亮
      secondary: primitiveTokens.color.red[400],
      accent: primitiveTokens.color.amber[400],
    },
    
    // 状态颜色
    status: {
      success: primitiveTokens.color.green[400],
      warning: primitiveTokens.color.amber[400],
      error: primitiveTokens.color.red[400],
      info: primitiveTokens.color.indigo[400],
    },
    
    // 表面颜色
    surface: {
      primary: primitiveTokens.color.grey[900],
      secondary: primitiveTokens.color.grey[800],
      tertiary: primitiveTokens.color.grey[700],
    },
    
    // 文本颜色
    text: {
      primary: primitiveTokens.color.grey[100],
      secondary: primitiveTokens.color.grey[300],
      tertiary: primitiveTokens.color.grey[400],
      disabled: primitiveTokens.color.grey[600],
      inverse: primitiveTokens.color.grey[900],
    },
    
    // 边框颜色
    border: {
      light: primitiveTokens.color.grey[700],
      medium: primitiveTokens.color.grey[600],
      dark: primitiveTokens.color.grey[500],
    },
    
    // 背景颜色
    background: {
      page: primitiveTokens.color.grey[900],
      card: primitiveTokens.color.grey[800],
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    
    // 交互元素颜色
    interactive: {
      default: primitiveTokens.color.indigo[400],
      hover: primitiveTokens.color.indigo[300],
      active: primitiveTokens.color.indigo[200],
      focus: primitiveTokens.color.indigo[400],
      disabled: primitiveTokens.color.grey[700],
    },
    
    // 标签颜色
    tag: {
      // 难度标签颜色
      difficulty: {
        easy: {
          bg: 'bg-green-900',
          text: 'text-green-100',
          printBg: 'print:bg-green-800'
        },
        medium: {
          bg: 'bg-yellow-900',
          text: 'text-yellow-100',
          printBg: 'print:bg-yellow-800'
        },
        hard: {
          bg: 'bg-red-900',
          text: 'text-red-100',
          printBg: 'print:bg-red-800'
        }
      },
      // 口味标签颜色
      flavor: {
        bg: 'bg-indigo-900',
        text: 'text-indigo-100',
        border: 'border-indigo-700',
        hoverBg: 'hover:bg-indigo-800',
        printBg: 'print:bg-indigo-800'
      },
      // 烹饪方法标签颜色
      method: {
        bg: 'bg-purple-900',
        text: 'text-purple-100',
        border: 'border-purple-700',
        hoverBg: 'hover:bg-purple-800',
        printBg: 'print:bg-purple-800'
      },
      // 菜系标签颜色
      cuisine: {
        bg: 'bg-amber-900',
        text: 'text-amber-100',
        border: 'border-amber-700',
        hoverBg: 'hover:bg-amber-800',
        printBg: 'print:bg-amber-800'
      },
      // 食材颜色
      ingredient: {
        bg: 'bg-green-900',
        text: 'text-green-100',
        title: 'text-green-200',
        border: 'border-green-700',
        hoverBg: 'hover:bg-green-800',
        printBg: 'print:bg-green-800'
      },
      // 调料颜色
      seasoning: {
        bg: 'bg-yellow-900',
        text: 'text-yellow-100',
        title: 'text-yellow-200',
        border: 'border-yellow-700',
        hoverBg: 'hover:bg-yellow-800',
        printBg: 'print:bg-yellow-800'
      }
    }
  },
  
  // 其他属性与亮色主题相同
  radius: { ...lightSemanticTokens.radius },
  shadow: { ...lightSemanticTokens.shadow },
  spacing: { ...lightSemanticTokens.spacing },
  transition: { ...lightSemanticTokens.transition },
};

// 导出类型
export type SemanticTokens = typeof lightSemanticTokens; 