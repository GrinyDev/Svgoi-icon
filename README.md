<p align="center">
  <img src="./Icon/logo.svg" alt="SVGOI Logo" width="150" height="150">
</p>

# SVGOI - 极简SVG代码编辑器

<div align="center">
  <a href="#">
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/platform-web-lightgrey.svg" alt="Platform">
  </a>
</div>

## 项目简介

SVGOI是一个极简SVG代码编辑器，专为SVG图标设计和编辑而制作。它提供了直观的界面和简约的功能，能够轻松创建、编辑和管理SVG项目。

### 🌟 核心亮点
- 🎨 **实时预览** - 所见即所得的编辑体验
- 💾 **项目管理** - 轻松创建和管理多个SVG项目
- ✨ **智能编辑** - 代码高亮、自动补全
- 📱 **移动端友好** - 🌝
- 📤 **便捷导出** - 一键导出SVG文件

## 快速开始

### 在线使用
这是一个网页转换app暂无web版本


### 功能演示

#### 创建新项目
```javascript
// app.js 中创建项目的核心代码
function createProject(name) {
    const projectName = name || generateDefaultProjectName();
    const project = {
        id: Date.now().toString(),
        name: projectName,
        code: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  \n</svg>',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    projects.unshift(project);
    saveProjects();
    return project;
}
```

#### SVG实时预览
```javascript
// 实时预览核心逻辑
function updatePreview() {
    const code = codeMirrorEditor.getValue();
    const previewContent = document.getElementById('preview-content');
    previewContent.innerHTML = code;
}
```

## 主要功能

### 🎨 **SVG编辑**

#### 代码编辑器
- ✅ 语法高亮支持
- ✅ 自动补全功能
- ✅ 颜色高亮填充

**代码示例 - 简单SVG图标**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="8" x2="12" y2="12"></line>
  <line x1="12" y1="16" x2="12.01" y2="16"></line>
</svg>
```

#### 实时预览
- 📱 所见即所得的编辑体验
- 🔄 代码修改立即反映在预览中

### 💾 **项目管理**

#### 项目创建与管理
```javascript
// 项目管理核心功能
function updateProject(id, updates) {
    const project = getProject(id);
    if (project) {
        Object.assign(project, updates, { updatedAt: Date.now() });
        saveProjects();
        return project;
    }
    return null;
}
```

#### 项目列表功能
- 📋 列表/网格视图切换
- 🔍 项目搜索和过滤
- 📌 最近项目快速访问
- 📊 批量操作支持

### ✨ **高级功能**

#### 查找和替换
```javascript
// 查找替换核心逻辑
function findText() {
    const searchTerm = document.getElementById('find-input').value;
    if (!searchTerm) {
        clearHighlights();
        return;
    }
    // 实现查找逻辑...
}
```

#### 撤销/重做
- ⏪ 无限撤销历史记录
- ⏩ 重做功能

#### 自动备份
```javascript
// 项目自动备份
function backupProject(project) {
    // 实现自动备份逻辑...
    if (isAutoBackupEnabled) {
        // 创建备份文件
        const backupPath = getBackupPath(project.id);
        saveBackup(backupPath, project);
    }
}
```

### 📤 **导出与分享**

#### 导出功能
- 💾 单项目导出
- 📦 批量项目导出
- 📋 复制SVG代码

**导出SVG示例**
```bash
# 导出单个SVG项目
function exportProject(project) {
    const svgContent = project.code;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
}
```

## 技术栈

### 🔧 **核心技术**
| 技术 | 版本 | 用途 |
|------|------|------|
| HTML5 | - | 页面结构 |
| CSS3 | - | 样式设计 |
| JavaScript | ES6+ | 功能实现 |
| CodeMirror | 5.65.15 | 代码编辑器 |

### 📦 **外部依赖**
```html
<!-- CodeMirror核心库 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/mode/xml/xml.min.js"></script>
```

### 📱 **适配策略**
```css
/* 移动端适配核心CSS */
* {
  margin: 0;
  padding: 0;
  user-select: none;
  -ms-user-select: none;
  -moz-user-select: none;
  box-sizing: border-box;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 768px) {
  .editor__main {
    flex-direction: column;
  }
  /* 更多移动端适配样式... */
}
```

## 项目结构

### 📁 **目录结构**
```
📁 SVGOI/                     # 项目根目录
├── 📁 Icon/                  # SVG图标资源
│   ├── logo.svg             # 项目logo
│   └── *.svg                # 其他图标资源
├── 📁 Script/                # JavaScript功能模块
│   ├── app.js              # 主应用逻辑
│   ├── autocomplete.js     # 智能补全功能
│   ├── color-highlight.js  # 颜色高亮填充
│   ├── fileManager.js      # 文件管理和备份
│   └── symbols.js          # 符号库功能
├── 📁 Style/                 # 样式文件
│   ├── app.css             # 主样式文件
│   └── bjq/                # CodeMirror主题
│       ├── 01.css          # 主题样式1
│       └── 02.css          # 主题样式2
├── index.html               # 主页面
└── README.md                # 项目说明文档
```

### 📄 **核心文件说明**

#### index.html - 主页面
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>极简代码编辑器</title>
  <!-- 引入样式和脚本 -->
</head>
<body>
  <!-- 页面结构 -->
  <div class="app">
    <!-- 首页 -->
    <div class="page active" id="page-home">...</div>
    <!-- 项目列表页 -->
    <div class="page" id="page-projects">...</div>
    <!-- 编辑器页面 -->
    <div class="page" id="page-editor">...</div>
    <!-- 设置页面 -->
    <div class="page" id="page-about">...</div>
  </div>
  <!-- 引入JavaScript文件 -->
</body>
</html>
```

#### app.js - 主应用逻辑
```javascript
// 应用初始化
function init() {
    loadProjects();
    renderRecentProjects();
    bindEvents();
    // 初始化编辑器...
}

// 页面导航
function showPage(pageId) {
    // 实现页面切换逻辑...
}

// 项目保存
function saveProject() {
    // 实现项目保存逻辑...
}
```

## 核心功能模块

### 🎯 **app.js - 主应用逻辑**

#### 功能说明
- 🏠 **页面管理** - 实现多页面切换和导航
- 💾 **项目管理** - 项目的创建、编辑、保存和删除
- ⏪ **历史记录** - 撤销/重做功能实现
- 🔍 **查找替换** - 代码查找和替换功能

#### 核心代码示例
```javascript
// 应用主入口
(function() {
    'use strict';
    
    const STORAGE_KEY = 'svg_editor_projects';
    const CURRENT_PROJECT_KEY = 'svg_editor_current';
    
    let projects = [];
    let currentProject = null;
    let undoStack = [];
    let redoStack = [];
    
    // 初始化应用
    function init() {
        loadProjects();
        renderRecentProjects();
        bindEvents();
    }
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
```

### ✨ **autocomplete.js - 智能补全**

#### 功能说明
- 📝 **标签补全** - SVG标签自动补全
- ⚙️ **属性补全** - SVG属性智能补全
- 🎨 **值补全** - 常用属性值补全
- 🔍 **上下文感知** - 根据当前上下文提供补全建议

#### 核心代码示例
```javascript
// 自动补全核心逻辑
function initAutocomplete(editor) {
    // 定义补全项
    const svgTags = ['svg', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'text', 'g'];
    const svgAttributes = ['xmlns', 'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'cx', 'cy', 'r'];
    
    // 注册补全事件
    editor.on('inputRead', function(cm) {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        // 实现补全逻辑...
    });
}
```

### 🎨 **color-highlight.js - 颜色高亮填充**

#### 功能说明
- 🌈 **颜色高亮** - SVG颜色值实时高亮
- 🎯 **颜色选择器** - 集成颜色选择器
- 👁️ **颜色预览** - 颜色值预览功能
- 🔄 **实时更新** - 颜色修改立即反映

#### 核心代码示例
```javascript
// 颜色高亮核心逻辑
function highlightColors(editor) {
    editor.on('change', function(cm) {
        const content = cm.getValue();
        // 查找颜色值
        const colorRegex = /(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgb\((\d+,\s*\d+,\s*\d+)\)|rgba\((\d+,\s*\d+,\s*\d+,\s*[0-1]\.?\d*)\))/g;
        let match;
        
        while ((match = colorRegex.exec(content)) !== null) {
            // 实现颜色高亮...
        }
    });
}
```

### 💾 **fileManager.js - 文件管理**

#### 功能说明
- 💾 **本地存储** - 项目文件的本地存储管理
- 📁 **目录结构** - 外部存储目录结构创建
- ⏪ **自动备份** - 项目自动备份功能
- 📤 **导出功能** - 项目导出功能

#### 核心代码示例
```javascript
// 文件管理初始化
function initFileManager() {
    checkStoragePermission();
    createFolderStructure();
}

// 创建文件夹结构
function createFolderStructure() {
    const externalDir = webapp.获取外部存储目录();
    if (!externalDir) return;
    
    const svgiconDir = externalDir + '/Svgicon';
    const completionDir = svgiconDir + '/Completion';
    const backupDir = svgiconDir + '/Back up';
    
    // 创建必要的文件夹...
}
```

### 🔣 **symbols.js - 符号库**

#### 功能说明
- 📚 **符号管理** - SVG符号库管理
- 📝 **符号插入** - 快速插入符号到代码中
- 🔍 **符号搜索** - 符号搜索和分类
- 🎨 **符号预览** - 符号预览功能

#### 核心代码示例
```javascript
// 符号库初始化
function initSymbols() {
    // 加载符号数据
    const symbols = loadSymbols();
    // 渲染符号面板
    renderSymbolsPanel(symbols);
    // 绑定符号点击事件
    bindSymbolEvents();
}

// 符号插入功能
function insertSymbol(symbol) {
    const editor = getCurrentEditor();
    if (editor) {
        const cursor = editor.getCursor();
        editor.replaceRange(symbol.code, cursor);
    }
}
```

## 使用说明

### 1. 创建新项目
- 点击首页的"+"号按钮
- 输入项目名称
- 开始编辑SVG代码

### 2. 编辑SVG
- 使用自动补全提高编辑效率

### 3. 保存项目
- 点击顶部工具栏的"保存"按钮图标

### 4. 管理项目
- 在项目列表中查看所有项目
- 支持列表/网格视图切换
- 可进行批量导出和删除操作

### 5. 高级功能
- 使用查找替换功能快速修改代码
- 利用撤销/重做功能恢复操作
- 开启自动备份保护项目数据

## 配置选项

### 设置页面功能
- **列表状态**: 保存视图切换状态
- **项目图标**: 以代码作为图标显示
- **复制项目代码**: 点击图标复制代码
- **自动备份**: 每次修改自动备份
- **代码换行**: 自动换行显示代码

## 存储结构

```
📁 Svgicon
├─ 📁 Completion - 项目导出文件
├─ 📁 Back up    - 项目备份文件
└─ 📄 Hello.txt  - 使用与隐私声明
```

## 浏览器兼容性

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- 支持移动设备浏览器

## 特性亮点

1. **极简设计**: 简洁直观的用户界面
2. **移动端友好**: 适配各种屏幕尺寸
3. **功能还行**: 满足专业SVG编辑需求 🌝
4. **数据安全**: 本地存储+自动备份

## 开发说明

### 本地开发
1. 克隆或下载项目文件
2. 在浏览器中打开 `index.html`
3. 开始开发和调试

### 主要依赖
- CodeMirror 5.65.15 (CDN引入)

## 未来计划

- [ ] 脑瓜在乱转.... 🌚

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

**SVGOI** - 让SVG编辑更简单、更高效！
