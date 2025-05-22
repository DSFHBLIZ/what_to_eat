# 获取所有TypeScript和TSX文件
$files = Get-ChildItem -Path ".\src" -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.next\*" }

# 替换单个文件中的导入路径
function UpdateImports {
    param (
        [string]$filePath,
        [string]$oldPath,
        [string]$newPath
    )
    
    $content = Get-Content -Path $filePath -Raw
    $originalContent = $content
    
    # 替换导入路径
    $pattern = [regex]::Escape($oldPath)
    $content = $content -replace "from\s+['\"]$pattern['\"]", "from '$newPath'"
    
    # 如果内容发生变化，保存文件
    if ($content -ne $originalContent) {
        Write-Host "Updating imports in $filePath : $oldPath -> $newPath"
        Set-Content -Path $filePath -Value $content
    }
}

# 检查并替换特殊的supabase导入
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # 处理supabase导入
    if ($content -match "import\s+\{.*?supabase.*?\}\s+from\s+['\"](.*?)utils\/supabase['\"]") {
        $prefix = $matches[1]
        $originalImport = $matches[0]
        $newImport = $originalImport -replace "utils\/supabase", "utils/data/dataService"
        
        Write-Host "Replacing supabase import in $($file.FullName)"
        $content = $content.Replace($originalImport, $newImport)
        Set-Content -Path $file.FullName -Value $content
    }
}

# 为每个文件更新路径
foreach ($file in $files) {
    # 更新DOM相关路径
    UpdateImports $file.FullName '../utils/domUtils' '../utils/dom/domUtils'
    UpdateImports $file.FullName '../../utils/domUtils' '../../utils/dom/domUtils'
    UpdateImports $file.FullName '../../../utils/domUtils' '../../../utils/dom/domUtils'
    UpdateImports $file.FullName '../../../../utils/domUtils' '../../../../utils/dom/domUtils'
    
    # 更新性能相关路径
    UpdateImports $file.FullName '../utils/performanceMonitor' '../utils/performance/performanceMonitor'
    UpdateImports $file.FullName '../utils/performanceUtils' '../utils/performance/performanceUtils'
    UpdateImports $file.FullName '../utils/usePerformanceMonitor' '../utils/performance/usePerformanceMonitor'
    
    UpdateImports $file.FullName '../../utils/performanceMonitor' '../../utils/performance/performanceMonitor'
    UpdateImports $file.FullName '../../utils/performanceUtils' '../../utils/performance/performanceUtils'
    UpdateImports $file.FullName '../../utils/usePerformanceMonitor' '../../utils/performance/usePerformanceMonitor'
    
    UpdateImports $file.FullName '../../../utils/performanceMonitor' '../../../utils/performance/performanceMonitor'
    UpdateImports $file.FullName '../../../utils/performanceUtils' '../../../utils/performance/performanceUtils'
    UpdateImports $file.FullName '../../../utils/usePerformanceMonitor' '../../../utils/performance/usePerformanceMonitor'
    
    UpdateImports $file.FullName '../../../../utils/performanceMonitor' '../../../../utils/performance/performanceMonitor'
    UpdateImports $file.FullName '../../../../utils/performanceUtils' '../../../../utils/performance/performanceUtils'
    UpdateImports $file.FullName '../../../../utils/usePerformanceMonitor' '../../../../utils/performance/usePerformanceMonitor'
    
    # 更新数据相关路径
    UpdateImports $file.FullName '../utils/dataService' '../utils/data/dataService'
    UpdateImports $file.FullName '../../utils/dataService' '../../utils/data/dataService'
    UpdateImports $file.FullName '../../../utils/dataService' '../../../utils/data/dataService'
    UpdateImports $file.FullName '../../../../utils/dataService' '../../../../utils/data/dataService'
    
    UpdateImports $file.FullName '../utils/dataMapper' '../utils/data/dataMapper'
    UpdateImports $file.FullName '../../utils/dataMapper' '../../utils/data/dataMapper'
    UpdateImports $file.FullName '../../../utils/dataMapper' '../../../utils/data/dataMapper'
    UpdateImports $file.FullName '../../../../utils/dataMapper' '../../../../utils/data/dataMapper'
    
    # 更新通用工具函数路径
    UpdateImports $file.FullName '../utils/errorLogger' '../utils/common/errorLogger'
    UpdateImports $file.FullName '../../utils/errorLogger' '../../utils/common/errorLogger'
    UpdateImports $file.FullName '../../../utils/errorLogger' '../../../utils/common/errorLogger'
    UpdateImports $file.FullName '../../../../utils/errorLogger' '../../../../utils/common/errorLogger'
}

Write-Host "导入路径更新完成！" 