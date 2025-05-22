@echo off
REM 设置命令行编码为UTF-8以避免中文乱码
chcp 65001>nul
REM run_tests.bat - 一键运行测试脚本 (Windows版)
REM 作者: DSFHBLIZ
REM 创建日期: 2023-05-02

echo ===== 开始测试菜谱搜索RPC功能 =====
echo.

REM 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未安装Node.js，请先安装Node.js
    exit /b 1
)

REM 获取Node.js版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo 当前使用的Node.js版本: %NODE_VERSION%

REM 切换到脚本目录
cd /d "%~dp0"

REM 创建测试结果目录
if not exist "..\test_results" (
    echo 创建测试结果目录...
    mkdir "..\test_results"
)

REM 检查必要的模块是否安装
echo 检查依赖模块...
node -e "try{require('@supabase/supabase-js')}catch(e){process.exit(1)}" >nul 2>&1
if %errorlevel% neq 0 (
    echo 安装依赖模块: @supabase/supabase-js
    npm install @supabase/supabase-js
)

REM 检查fs模块
node -e "try{require('fs')}catch(e){process.exit(1)}" >nul 2>&1
if %errorlevel% neq 0 (
    echo fs模块已内置于Node.js
)

REM 检查path模块
node -e "try{require('path')}catch(e){process.exit(1)}" >nul 2>&1
if %errorlevel% neq 0 (
    echo path模块已内置于Node.js
)

echo 依赖检查完成，开始运行测试...
echo.

REM 设置错误标志，用于跟踪是否有测试失败
set ERROR_FLAG=0

echo 1. 运行基本测试脚本
echo -------------------
node --experimental-modules test_search_rpc.js
if %errorlevel% neq 0 (
    echo [警告] 基本测试脚本执行出错，错误代码: %errorlevel%
    set ERROR_FLAG=1
) else (
    echo [成功] 基本测试脚本执行完成
)

echo.
echo 2. 运行高级测试脚本（带分析）
echo ----------------------------
node --experimental-modules test_search_advanced.js
if %errorlevel% neq 0 (
    echo [警告] 高级测试脚本执行出错，错误代码: %errorlevel%
    set ERROR_FLAG=1
) else (
    echo [成功] 高级测试脚本执行完成
)

echo.
echo 3. 运行全面测试脚本（多种组合条件）
echo ----------------------------------
node --experimental-modules test_search_comprehensive.js
if %errorlevel% neq 0 (
    echo [警告] 全面测试脚本执行出错，错误代码: %errorlevel%
    set ERROR_FLAG=1
) else (
    echo [成功] 全面测试脚本执行完成
)

echo.
if %ERROR_FLAG% equ 0 (
    echo ===== 全部测试成功完成 =====
) else (
    echo ===== 测试完成，但存在某些错误 =====
)

REM 打开测试结果目录
echo 测试结果文件保存在: %~dp0..\test_results\
start "" "%~dp0..\test_results\"

echo.
echo 按任意键退出...
pause > nul 