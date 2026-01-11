(function() {
    'use strict';

    // 文件管理功能
    function initFileManager() {
        checkStoragePermission();
    }

    // 检查存储权限
    function checkStoragePermission() {
        if (webapp && typeof webapp.判断存储权限状态 === 'function') {
            if (webapp.判断存储权限状态()) {
                createFolderStructure();
            } else {
                requestStoragePermission();
            }
        }
    }

    // 申请存储权限
    function requestStoragePermission() {
        if (webapp && typeof webapp.申请存储权限 === 'function') {
            webapp.申请存储权限();
            webapp.存储权限回调('onStoragePermissionResult');
        }
    }

    // 存储权限回调函数
    window.onStoragePermissionResult = function(result) {
        if (result === 0) {
            createFolderStructure();
        }
    };

    // 创建完整的文件夹结构
    function createFolderStructure() {
        if (!webapp || typeof webapp.获取外部存储目录 !== 'function') {
            return;
        }

        const externalDir = webapp.获取外部存储目录();
        if (!externalDir) {
            return;
        }

        const svgiconDir = externalDir + '/Svgicon';
        const completionDir = svgiconDir + '/Completion';
        const backupDir = svgiconDir + '/Back up';
        const helloFile = svgiconDir + '/Hello.txt';

        // 创建Svgicon主文件夹
        if (!webapp.判断指定文件(svgiconDir)) {
            webapp.保存指定文件(svgiconDir, null);
        }

        // 确保主文件夹存在后创建子文件夹
        if (webapp.判断指定文件(svgiconDir)) {
            // 创建Completion文件夹
            if (!webapp.判断指定文件(completionDir)) {
                webapp.保存指定文件(completionDir, null);
            }

            // 创建Back up文件夹
            if (!webapp.判断指定文件(backupDir)) {
                webapp.保存指定文件(backupDir, null);
            }

            // 创建或更新Hello.txt文件
            const fileContent = getHelloFileContent();
            createOrUpdateFile(helloFile, fileContent);
        }
    }

    // 创建或更新文件
    function createOrUpdateFile(filePath, content) {
        try {
            const base64Content = btoa(unescape(encodeURIComponent(content)));
            const dataUrl = 'data:text/plain;base64,' + base64Content;
            webapp.保存指定文件(filePath, dataUrl);
        } catch (e) {
            // 备用方案
            try {
                webapp.保存指定文件(filePath, '');
                const base64Content = btoa(unescape(encodeURIComponent(content)));
                webapp.文件追加保存(filePath, base64Content);
            } catch (e2) {
                // 简单内容写入
                const simpleBase64 = btoa('SVGOI Editor');
                webapp.文件追加保存(filePath, simpleBase64);
            }
        }
    }
    
    // 项目备份功能
    function backupProject(project) {
        if (!webapp || typeof webapp.获取外部存储目录 !== 'function') {
            return;
        }
        
        try {
            // 获取外部存储目录
            const externalDir = webapp.获取外部存储目录();
            if (!externalDir) {
                return;
            }
            
            // 构建备份目录路径
            const svgiconDir = externalDir + '/Svgicon';
            const backupDir = svgiconDir + '/Back up';
            const projectBackupDir = backupDir + '/' + project.id;
            
            // 检查并创建必要的文件夹
            if (!webapp.判断指定文件(svgiconDir)) {
                webapp.保存指定文件(svgiconDir, null);
            }
            
            if (!webapp.判断指定文件(backupDir)) {
                webapp.保存指定文件(backupDir, null);
            }
            
            if (!webapp.判断指定文件(projectBackupDir)) {
                webapp.保存指定文件(projectBackupDir, null);
            }
            
            // 生成备份文件名，包含时间戳
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = project.name.replace(/[^a-zA-Z0-9-_]/g, '_') + '_' + timestamp + '.svg';
            const filePath = projectBackupDir + '/' + fileName;
            
            // 备份SVG文件
            const content = project.code;
            const base64Content = btoa(unescape(encodeURIComponent(content)));
            const dataUrl = 'data:image/svg+xml;base64,' + base64Content;
            
            webapp.保存指定文件(filePath, dataUrl);
        } catch (err) {
            console.error('备份项目失败:', err);
        }
    }
    
    // 暴露备份功能给外部调用
    window.backupProject = backupProject;

    // 获取Hello.txt文件内容
    function getHelloFileContent() {
        return `🎨 SVGOI 图标编辑器使用说明 📖
═════════════════════

🔒 一、隐私说明 🔒
✨ 本编辑器不会收集您的任何个人信息
💾 所有SVG项目均保存在本地设备上
🗑️ 您可以随时删除本地项目文件
🛡️ 数据安全是每个人的首要考虑

🚀 二、编辑器功能 🚀
🎯 创建和编辑SVG图标
👁️ 实时预览SVG效果
💾 保存和管理SVG项目
📦 支持批量操作项目
✨ 支持SVG代码高亮和自动补全

📝 三、使用步骤 📝
1️⃣ 点击"新建项目"创建新的SVG图标
2️⃣ 在编辑器中输入或修改SVG代码
3️⃣ 实时查看预览效果
4️⃣ 点击"保存"按钮保存项目
5️⃣ 在项目列表中管理已保存的项目
6️⃣ 使用备份功能保护重要数据

⚠️ 四、注意事项 ⚠️
✅ 请定期备份您的SVG项目
❌ 不要在代码中输入敏感信息
🔄 建议使用最新版本的编辑器
📁 项目文件保存在Svgicon文件夹
💾 Completion文件夹：完成的项目
🔙 Back up文件夹：项目备份

💡 五、使用技巧 💡
⚡ 使用快捷键提高效率
🎨 利用模板快速创建图标
📊 批量导出和导入项目
🔍 使用搜索功能快速定位
🔄 定期清理无用文件

📞 六、联系方式 📞
📧 邮箱：3334832289@qq.com
💬 QQ微信：3334832289

🛠️ 七、文件夹结构 🛠️
📁 Svgicon/
├── 📁 Completion/    # 已完成项目
├── 📁 Back up/       # 项目备份
└── 📄 Hello.txt      # 说明文档

─────────────────────
📅 最后更新日期：${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日
🔄 版本：v1.0.0
👨‍💻 开发者：陌生的朋友
💖 感谢您的使用！

═════════════════════
🌟 让创意无限，让设计更简单！ 🌟
═════════════════════

💌 温馨提示：
如有任何问题或建议，请随时联系邮箱：3334832289@qq.com。
每一条信息会在24小时内回复。

🎉 祝您使用愉快！ 🎉

`;
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFileManager);
    } else {
        initFileManager();
    }

})();
