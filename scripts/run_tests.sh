#!/bin/bash
# run_tests.sh - 一键运行测试脚本
# 作者: DSFHBLIZ
# 创建日期: 2023-05-02

echo "===== 开始测试菜谱搜索RPC功能 ====="
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未安装Node.js，请先安装Node.js"
    exit 1
fi

# 获取Node.js版本
NODE_VERSION=$(node --version)
echo "当前使用的Node.js版本: $NODE_VERSION"

# 设置测试结果目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_RESULTS_DIR="$SCRIPT_DIR/../test_results"

# 创建测试结果目录（如果不存在）
if [ ! -d "$TEST_RESULTS_DIR" ]; then
    mkdir -p "$TEST_RESULTS_DIR"
    echo "创建测试结果目录: $TEST_RESULTS_DIR"
fi

# 检查必要的模块是否安装
echo "检查依赖模块..."
if ! node -e "try{require('@supabase/supabase-js')}catch(e){process.exit(1)}" &> /dev/null; then
    echo "安装依赖模块: @supabase/supabase-js"
    npm install @supabase/supabase-js
fi

echo "依赖检查完成，开始运行测试..."
echo ""

# 设置错误标志，用于跟踪是否有测试失败
ERROR_FLAG=0

echo "1. 运行基本测试脚本"
echo "-------------------"
node test_search_rpc.js
if [ $? -ne 0 ]; then
    echo "[警告] 基本测试脚本执行出错，错误代码: $?"
    ERROR_FLAG=1
else
    echo "[成功] 基本测试脚本执行完成"
fi

echo ""
echo "2. 运行高级测试脚本（带分析）"
echo "----------------------------"
node test_search_advanced.js
if [ $? -ne 0 ]; then
    echo "[警告] 高级测试脚本执行出错，错误代码: $?"
    ERROR_FLAG=1
else
    echo "[成功] 高级测试脚本执行完成"
fi

echo ""
echo "3. 运行全面测试脚本（多种组合条件）"
echo "----------------------------------"
node test_search_comprehensive.js
if [ $? -ne 0 ]; then
    echo "[警告] 全面测试脚本执行出错，错误代码: $?"
    ERROR_FLAG=1
else
    echo "[成功] 全面测试脚本执行完成"
fi

echo ""
if [ $ERROR_FLAG -eq 0 ]; then
    echo "===== 全部测试成功完成 ====="
else
    echo "===== 测试完成，但存在某些错误 ====="
fi

# 显示测试结果目录
echo "结果文件保存在: $TEST_RESULTS_DIR" 
echo "打开测试结果目录..."
xdg-open "$TEST_RESULTS_DIR" &> /dev/null || open "$TEST_RESULTS_DIR" &> /dev/null || echo "无法自动打开目录，请手动查看" 