import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DifficultyBadge from '../../src/components/recipe/DifficultyBadge';

describe('DifficultyBadge 组件', () => {
  it('应正确渲染简单难度', () => {
    const { container } = render(<DifficultyBadge difficulty="简单" />);
    expect(container).toMatchSnapshot();
  });

  it('应正确渲染中等难度', () => {
    const { container } = render(<DifficultyBadge difficulty="中等" />);
    expect(container).toMatchSnapshot();
  });

  it('应正确渲染困难难度', () => {
    const { container } = render(<DifficultyBadge difficulty="困难" />);
    expect(container).toMatchSnapshot();
  });

  it('应正确渲染英文难度值', () => {
    const { container } = render(<DifficultyBadge difficulty="easy" />);
    expect(container).toMatchSnapshot();
  });

  it('应支持隐藏标签', () => {
    const { container } = render(<DifficultyBadge difficulty="简单" showLabel={false} />);
    expect(container).toMatchSnapshot();
  });

  it('应支持不同尺寸', () => {
    const { container: smallContainer } = render(<DifficultyBadge difficulty="简单" size="sm" />);
    const { container: largeContainer } = render(<DifficultyBadge difficulty="简单" size="lg" />);
    
    expect(smallContainer).toMatchSnapshot('小尺寸');
    expect(largeContainer).toMatchSnapshot('大尺寸');
  });

  it('应支持自定义类名', () => {
    const { container } = render(<DifficultyBadge difficulty="简单" className="custom-class" />);
    expect(container).toMatchSnapshot();
  });

  it('对于无效难度值返回null', () => {
    const { container: emptyContainer } = render(<DifficultyBadge difficulty="" />);
    const { container: unknownContainer } = render(<DifficultyBadge difficulty="未知" />);
    
    expect(emptyContainer.firstChild).toBeNull();
    expect(unknownContainer.firstChild).toBeNull();
  });
}); 