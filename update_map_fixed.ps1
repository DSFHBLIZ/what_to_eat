# 要删除的文件列表
$filesToRemove = @(
    "BadgeUI", "TagBadge",
    "RecipeSeasonings",
    "RecipeContext",
    "FilterContext",
    "FilterPersistenceProvider",
    "search-client.tsx",
    "ClientHomeContainer",
    "RecipeResultsSection",
    "NewSearchResultsValidator",
    "ValidationResults",
    "ValidationProcessor",
    "ValidationStats",
    "ThemeContext.tsx",
    "ValidationLogic.tsx",
    "ErrorsDisplay.tsx",
    "IngredientTagUI", "IngredientTag",
    "httpClient.ts",
    "client.ts",
    "src/server",
    "src/lib",
    "animations.css",
    "typography.css",
    "utils.css",
    "layout.css",
    "forms.css",
    "components.css",
    "responsive.css"
)

# 读取map.md文件
$content = Get-Content -Path "map.md" -Raw

# 分割内容为段落（通过两个连续的换行符）
$paragraphs = $content -split "(\r?\n){2,}"

# 初始化新内容
$newContent = @()

# 处理每个段落
foreach ($paragraph in $paragraphs) {
    $shouldKeep = $true
    
    # 检查段落是否包含要删除的文件名
    foreach ($file in $filesToRemove) {
        if ($paragraph -match $file) {
            $shouldKeep = $false
            Write-Host "删除包含 $file 的段落"
            break
        }
    }
    
    # 如果段落应该保留，添加到新内容
    if ($shouldKeep) {
        $newContent += $paragraph
    }
}

# 将段落重新组合为内容（使用两个换行符分隔）
$newContentText = $newContent -join "`r`n`r`n"

# 写入新内容到map.md
Set-Content -Path "map.md" -Value $newContentText

Write-Host "map.md 更新完成" 
