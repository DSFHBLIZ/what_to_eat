#!/usr/bin/env ts-node
/**
 * 测试运行脚本
 * 
 * 用于运行所有测试或特定类别的测试
 * 使用方法: 
 *   npm run test                 # 运行所有测试
 *   npm run test:unit            # 只运行单元测试
 *   npm run test:integration     # 只运行集成测试
 *   npm run test:system          # 只运行系统测试
 */

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, join } from 'path';

// 测试类型
type TestType = 'unit' | 'integration' | 'system' | 'all';

// 获取测试类型
const getTestType = (): TestType => {
  const args = process.argv.slice(2);
  
  if (args.includes('--unit')) return 'unit';
  if (args.includes('--integration')) return 'integration';
  if (args.includes('--system')) return 'system';
  
  return 'all';
};

// 运行测试
const runTests = () => {
  const testType = getTestType();
  console.log(`Running ${testType} tests...`);
  
  // 构建测试命令
  let command = 'vitest';
  let args = ['run'];
  
  if (testType === 'unit') {
    args.push('tests/unit');
  } else if (testType === 'integration') {
    args.push('tests/integration');
  } else if (testType === 'system') {
    args = ['run', 'tests/system'];
    command = 'playwright';
  }
  
  // 运行测试
  const result = spawnSync(command, args, { 
    stdio: 'inherit',
    shell: true
  });
  
  process.exit(result.status || 0);
};

// 执行测试
runTests(); 