(function() {
    'use strict';

    const STORAGE_KEY = 'svg_editor_projects';
    const CURRENT_PROJECT_KEY = 'svg_editor_current';

    let projects = [];
    let currentProject = null;
    let undoStack = [];
    let redoStack = [];
    let isUndoRedo = false;
    let currentPage = 'page-home';
    let isBackNavigation = false;
    let codeMirrorEditor = null;
    let hasUnsavedChanges = false; // 跟踪编辑器是否有未保存的更改
    let isSaveChangesModalOpen = false; // 跟踪保存更改弹窗是否打开
    let isClosingSaveModal = false;
    let wasSaveModalCancelled = false; // 标记保存更改弹窗是否通过取消按钮关闭

    function init() {
        loadProjects();
        renderRecentProjects();
        bindEvents();
    }

    function loadProjects() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            projects = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('加载项目失败:', e);
            projects = [];
        }
    }

    function saveProjects() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        } catch (e) {
            console.error('保存项目失败:', e);
            showToast('保存失败');
        }
    }

    function generateDefaultProjectName() {
        let counter = 1;
        let defaultName;
        
        do {
            defaultName = `Svgoi-${counter}`;
            counter++;
        } while (projects.some(project => project.name === defaultName));
        
        return defaultName;
    }

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

    function getProject(id) {
        return projects.find(p => p.id === id);
    }

    function updateProject(id, updates) {
        const project = getProject(id);
        if (project) {
            // 保存原始项目数据用于备份
            const originalProject = JSON.parse(JSON.stringify(project));
            
            // 更新项目数据
            Object.assign(project, updates, { updatedAt: Date.now() });
            saveProjects();
            
            // 自动备份更新前的项目- 自动备份功能开启后才能实现
            if (isAutoBackupEnabled && window.backupProject) {
                window.backupProject(originalProject);
            }
            
            return project;
        }
        return null;
    }

    function deleteProject(id) {
        const index = projects.findIndex(p => p.id === id);
        if (index > -1) {
            projects.splice(index, 1);
            saveProjects();
            return true;
        }
        return false;
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)} 分钟前`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)} 小时前`;
        } else {
            return `${Math.floor(diff / 86400000)} 天前`;
        }
    }

    function showPage(pageId) {
        const currentActivePage = document.querySelector('.page.active');
        const targetPage = document.getElementById(pageId);
        
        if (!targetPage) return;
        
        // 移除所有页面的动画类
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
        });
        
        // 记录上一个页面- 仅当不是返回导航时
        if (currentActivePage && !isBackNavigation) {
            previousPage = currentActivePage.id;
        }
        
        // 根据导航方向确定动画方向
        if (currentActivePage) {
            // 应用退出动画
            if (isBackNavigation) {
                currentActivePage.classList.add('slide-out-right');
                targetPage.classList.add('slide-in-left');
            } else {
                currentActivePage.classList.add('slide-out-left');
                targetPage.classList.add('slide-in-right');
            }
        } else {
            // 初始加载时的动画
            targetPage.classList.add('slide-in-right');
        }
        
        // 显示目标页面
        targetPage.classList.add('active');
        currentPage = pageId;
        
        // 只有在不是返回导航时才添加新的历史记录
        if (!isBackNavigation) {
            updateHistoryState();
        }
        
        // 重置返回导航标志
        isBackNavigation = false;
        
        // 清理旧页面的active类 - 在动画完成后
        setTimeout(() => {
            if (currentActivePage && currentActivePage !== targetPage) {
                currentActivePage.classList.remove('active');
            }
        }, 300);
        
        // 当离开编辑器页面时自动关闭悬浮窗
        if (currentActivePage && currentActivePage.id === 'page-editor') {
            const preview = document.getElementById('run-preview');
            if (preview && isRunPreviewVisible) {
                preview.style.display = 'none';
                isRunPreviewVisible = false;
                const runBtn = document.getElementById('run-btn');
                if (runBtn) {
                    runBtn.title = '运行代码';
                }
            }
        }
        
        // 页面特定逻辑
        if (pageId === 'page-projects') {
            renderAllProjects();
        } else if (pageId === 'page-about') {
            initSettings();
        }
    }

    function renderRecentProjects() {
        const container = document.getElementById('recent-projects');
        if (!container) return;

        let displayProjects;
        let emptyStateTitle;
        let emptyStateDesc;
        
        // 根据视图模式筛选项目
        if (projectViewMode === 'recent') {
            displayProjects = projects.slice(0, 7);
            emptyStateTitle = '暂无项目';
            emptyStateDesc = '点击加号按钮创建新项目';
        } else {
            displayProjects = projects.filter(project => project.starred);
            emptyStateTitle = '暂无收藏项目';
            emptyStateDesc = '长按项目添加收藏';
        }

        if (displayProjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 811 811" style="width: 100%; height: 100%;">
                            <g><path fill="#f9faf9" d="M -0.5,-0.5 C 269.833,-0.5 540.167,-0.5 810.5,-0.5C 810.5,269.833 810.5,540.167 810.5,810.5C 540.167,810.5 269.833,810.5 -0.5,810.5C -0.5,540.167 -0.5,269.833 -0.5,-0.5 Z M 0.5,0.5 C 270.167,0.5 539.833,0.5 809.5,0.5C 809.5,270.167 809.5,539.833 809.5,809.5C 539.833,809.5 270.167,809.5 0.5,809.5C 0.5,539.833 0.5,270.167 0.5,0.5 Z"/></g>
                            <g><path fill="#64c7f9" d="M 215.5,35.5 C 342.167,35.3333 468.834,35.5 595.5,36C 680.743,48.0319 737.91,94.5319 767,175.5C 770.929,188.553 773.595,201.886 775,215.5C 775.667,342.167 775.667,468.833 775,595.5C 762.968,680.743 716.468,737.91 635.5,767C 622.447,770.929 609.114,773.595 595.5,775C 468.833,775.667 342.167,775.667 215.5,775C 130.257,762.968 73.09,716.468 44,635.5C 40.0715,622.447 37.4048,609.114 36,595.5C 35.3333,468.833 35.3333,342.167 36,215.5C 46.3065,139.678 85.8065,85.1784 154.5,52C 174.19,43.7285 194.524,38.2285 215.5,35.5 Z"/></g>
                            <g><path fill="#97d5f5" d="M 451.5,277.5 C 450.207,276.158 449.374,274.491 449,272.5C 448.5,237.502 448.333,202.502 448.5,167.5C 392.144,167.183 335.81,167.516 279.5,168.5C 279.918,167.778 280.584,167.278 281.5,167C 337.499,166.5 393.499,166.333 449.5,166.5C 449.333,201.168 449.5,235.835 450,270.5C 450.977,272.74 451.477,275.073 451.5,277.5 Z"/></g>
                            <g><path fill="#f9f9fa" d="M 451.5,277.5 C 456.565,289.535 465.565,296.535 478.5,298.5C 512.329,299.498 546.329,299.832 580.5,299.5C 580.5,329.5 580.5,359.5 580.5,389.5C 463.833,389.5 347.167,389.5 230.5,389.5C 230.5,332.5 230.5,275.5 230.5,218.5C 236.07,191.264 252.403,174.597 279.5,168.5C 335.81,167.516 392.144,167.183 448.5,167.5C 448.333,202.502 448.5,237.502 449,272.5C 449.374,274.491 450.207,276.158 451.5,277.5 Z"/></g>
                            <g><path fill="#f8f9f9" d="M 473.5,167.5 C 475.199,167.34 476.866,167.506 478.5,168C 512.576,202.412 546.743,236.245 581,269.5C 581.494,271.134 581.66,272.801 581.5,274.5C 547.498,274.667 513.498,274.5 479.5,274C 477.291,272.127 475.458,269.96 474,267.5C 473.5,234.168 473.333,200.835 473.5,167.5 Z"/></g>
                            <g><path fill="#c0ebfa" d="M 230.5,218.5 C 230.5,275.5 230.5,332.5 230.5,389.5C 347.167,389.5 463.833,389.5 580.5,389.5C 580.5,359.5 580.5,329.5 580.5,299.5C 546.329,299.832 512.329,299.498 478.5,298.5C 512.833,298.5 547.167,298.5 581.5,298.5C 581.5,329.167 581.5,359.833 581.5,390.5C 464.167,390.5 346.833,390.5 229.5,390.5C 229.168,332.998 229.501,275.664 230.5,218.5 Z"/></g>
                            <g><path fill="#f8f9f9" d="M 624.5,419.5 C 624.372,421.655 624.872,423.655 626,425.5C 626.5,462.832 626.667,500.165 626.5,537.5C 623.993,550.173 616.326,557.673 603.5,560C 470.833,560.667 338.167,560.667 205.5,560C 194.342,556.842 187.175,549.675 184,538.5C 183.333,500.167 183.333,461.833 184,423.5C 187.988,413.74 195.155,407.573 205.5,405C 338.833,404.333 472.167,404.333 605.5,405C 614.085,407.108 620.418,411.941 624.5,419.5 Z"/></g>
                            <g><path fill="#c6ecf9" d="M 624.5,419.5 C 625.558,420.6 626.392,421.934 627,423.5C 627.831,461.669 627.664,499.669 626.5,537.5C 626.667,500.165 626.5,462.832 626,425.5C 624.872,423.655 624.372,421.655 624.5,419.5 Z"/></g>
                            <g><path fill="#6bc9f8" d="M 309.5,441.5 C 322.834,440.062 333.834,444.229 342.5,454C 339.326,457.341 336.326,460.841 333.5,464.5C 326.673,458.292 318.673,456.125 309.5,458C 308.069,458.465 306.903,459.299 306,460.5C 304.773,464.591 305.606,468.091 308.5,471C 317.88,474.57 326.88,478.903 335.5,484C 344.085,490.483 346.918,498.983 344,509.5C 340.575,519.254 333.742,525.087 323.5,527C 310.763,529.518 299.096,527.185 288.5,520C 284.99,518.093 283.824,515.26 285,511.5C 287.763,508.565 290.596,505.898 293.5,503.5C 297.453,506.817 301.786,509.65 306.5,512C 312.755,513.127 318.755,512.46 324.5,510C 328.41,505.925 328.41,501.925 324.5,498C 316.739,493.786 308.739,490.119 300.5,487C 287.179,478.362 284.012,466.862 291,452.5C 296.37,447.255 302.537,443.588 309.5,441.5 Z"/></g>
                            <g><path fill="#6ac8f8" d="M 507.5,510.5 C 508.651,505.35 508.817,500.016 508,494.5C 503.548,493.859 499.048,493.192 494.5,492.5C 493.415,489.227 493.248,485.894 494,482.5C 503.422,481.349 512.922,481.182 522.5,482C 523.488,494.086 523.822,506.253 523.5,518.5C 507.081,530.75 490.081,531.583 472.5,521C 458.606,505.693 454.44,487.86 460,467.5C 469.381,445.009 485.881,437.175 509.5,444C 513.929,446.102 518.095,448.602 522,451.5C 522.667,453.167 522.667,454.833 522,456.5C 519.588,458.571 517.588,460.904 516,463.5C 514.951,464.517 513.784,464.684 512.5,464C 504,456.484 494.667,455.484 484.5,461C 477.294,466.78 474.294,474.28 475.5,483.5C 474.577,495.482 478.91,504.982 488.5,512C 495.071,513.029 501.404,512.529 507.5,510.5 Z"/></g>
                            <g><path fill="#6ac8f8" d="M 366.5,442.5 C 371.844,442.334 377.177,442.501 382.5,443C 383,443.5 383.5,444 384,444.5C 389.566,464.295 395.232,483.961 401,503.5C 406.269,483.648 412.102,463.981 418.5,444.5C 423.792,443.505 429.125,443.172 434.5,443.5C 427.416,470.911 419.25,497.911 410,524.5C 407.106,525.78 403.939,526.446 400.5,526.5C 397.248,526.479 394.081,526.146 391,525.5C 383.47,499.721 375.47,474.055 367,448.5C 366.505,446.527 366.338,444.527 366.5,442.5 Z"/></g>
                            <g><path fill="#9ed9f5" d="M 523.5,518.5 C 523.822,506.253 523.488,494.086 522.5,482C 512.922,481.182 503.422,481.349 494,482.5C 493.248,485.894 493.415,489.227 494.5,492.5C 499.048,493.192 503.548,493.859 508,494.5C 508.817,500.016 508.651,505.35 507.5,510.5C 507.5,505.5 507.5,500.5 507.5,495.5C 502.786,495.827 498.12,495.493 493.5,494.5C 492.188,489.636 492.188,484.803 493.5,480C 503.744,479.181 513.91,479.348 524,480.5C 524.827,493.34 524.66,506.007 523.5,518.5 Z"/></g>
                            <g><path fill="#c0e7f3" d="M 580.5,586.5 C 580.5,582.5 580.5,578.5 580.5,574.5C 463.833,574.5 347.167,574.5 230.5,574.5C 230.5,578.5 230.5,582.5 230.5,586.5C 229.515,582.366 229.182,578.032 229.5,573.5C 346.833,573.5 464.167,573.5 581.5,573.5C 581.818,578.032 581.485,582.366 580.5,586.5 Z"/></g>
                            <g><path fill="#f9f9fa" d="M 580.5,586.5 C 577.41,615.095 562.076,633.595 534.5,642C 491.203,643.153 447.87,643.653 404.5,643.5C 361.13,643.653 317.797,643.153 274.5,642C 248.235,632.613 233.569,614.113 230.5,586.5C 230.5,582.5 230.5,578.5 230.5,574.5C 347.167,574.5 463.833,574.5 580.5,574.5C 580.5,578.5 580.5,582.5 580.5,586.5 Z"/></g>
                        </svg>
                    </div>
                    <div class="empty-state__title">${emptyStateTitle}</div>
                    <div class="empty-state__desc">${emptyStateDesc}</div>
                </div>
            `;
            return;
        }

        container.innerHTML = displayProjects.map(project => `
            <div class="project-card" data-project-id="${project.id}" onclick="openProject('${project.id}')">
                <div class="project-card__icon" onclick="event.stopPropagation(); updateProjectIcon('${project.id}')">
                    ${isIconFetchEnabled ? `
                        <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                            ${project.code}
                        </div>
                    ` : `
                        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 256 256"><path fill="#fff" d="m213.66 82.34l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v76a4 4 0 0 0 4 4h168a4 4 0 0 0 4-4V88a8 8 0 0 0-2.34-5.66M152 88V44l44 44ZM87.82 196.31a20.82 20.82 0 0 1-9.19 15.23C73.44 215 67 216 61.14 216A61.2 61.2 0 0 1 46 214a8 8 0 0 1 4.3-15.41c4.38 1.2 14.95 2.7 19.55-.36c.88-.59 1.83-1.52 2.14-3.93c.35-2.67-.71-4.1-12.78-7.59c-9.35-2.7-25-7.23-23-23.11a20.55 20.55 0 0 1 9-14.95c11.84-8 30.72-3.31 32.83-2.76a8 8 0 0 1-4.07 15.48c-4.48-1.17-15.23-2.56-19.83.56a4.54 4.54 0 0 0-2 3.67c-.11.9-.14 1.09 1.12 1.9c2.31 1.49 6.44 2.68 10.45 3.84c9.79 2.83 26.35 7.66 24.11 24.97m63.72-41.62l-19.9 55.72a8.25 8.25 0 0 1-6.5 5.51a8 8 0 0 1-8.67-5.23L96.59 155a8.21 8.21 0 0 1 4.5-10.45a8 8 0 0 1 10.45 4.76l12.46 34.9l12.46-34.9a8 8 0 0 1 15.07 5.38ZM216 184v16.87a8 8 0 0 1-2.26 5.57A30 30 0 0 1 192 216c-17.64 0-32-16.15-32-36s14.36-36 32-36a29.36 29.36 0 0 1 16.09 4.86a8.22 8.22 0 0 1 3 10.64a8 8 0 0 1-11.54 2.88A13.27 13.27 0 0 0 192 160c-8.82 0-16 9-16 20s7.18 20 16 20a13.38 13.38 0 0 0 8-2.71V192a8 8 0 0 1-8-8.53a8.18 8.18 0 0 1 8.26-7.47H208a8 8 0 0 1 8 8"/></svg>
                    `}
                </div>
                <div class="project-card__name">
                    ${project.name}
                    ${project.starred ? `
                        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" width="16" height="16" style="margin-left: 4px; vertical-align: middle;">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    ` : ''}
                </div>
                <div class="project-card__time">${formatTime(project.updatedAt)}</div>
            </div>
        `).join('');
        
        // 添加长按事件监听
        addRecentProjectsLongPressListeners();
    }
    
    // 切换项目视图模式
    function toggleProjectView() {
        // 切换视图模式
        projectViewMode = projectViewMode === 'recent' ? 'starred' : 'recent';
        
        // 更新切换按钮图标
        const toggleBtn = document.getElementById('view-toggle-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = projectViewMode === 'recent' ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.146 11.023c.38-.682.57-1.023.854-1.023s.474.34.854 1.023l.098.176c.108.194.162.29.246.354c.085.064.19.088.4.135l.19.044c.738.167 1.107.25 1.195.532s-.164.577-.667 1.165l-.13.152c-.143.167-.215.25-.247.354s-.021.215 0 .438l.02.203c.076.785.114 1.178-.115 1.352c-.23.174-.576.015-1.267-.303l-.178-.082c-.197-.09-.295-.135-.399-.135s-.202.045-.399.135l-.178.082c-.691.319-1.037.477-1.267.303s-.191-.567-.115-1.352l.02-.203c.021-.223.032-.334 0-.438s-.104-.187-.247-.354l-.13-.152c-.503-.588-.755-.882-.667-1.165c.088-.282.457-.365 1.195-.532l.19-.044c.21-.047.315-.07.4-.135c.084-.064.138-.16.246-.354z" opacity=".5"/><path d="M2 6.95c0-.883 0-1.324.07-1.692A4 4 0 0 1 5.257 2.07C5.626 2 6.068 2 6.95 2c.386 0 .58 0 .766.017a4 4 0 0 1 2.18.904c.144.119.28.255.554.529L11 4c.816.816 1.224 1.224 1.712 1.495a4 4 0 0 0 .848.352C14.098 6 14.675 6 15.828 6h.374c2.632 0 3.949 0 4.804.77q.119.105.224.224c.77.855.77 2.172.77 4.804V14c0 3.771 0 5.657-1.172 6.828S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14z"/></g></svg>
            ` : `
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.146 11.023c.38-.682.57-1.023.854-1.023s.474.34.854 1.023l.098.176c.108.194.162.29.246.354c.085.064.19.088.4.135l.19.044c.738.167 1.107.25 1.195.532s-.164.577-.667 1.165l-.13.152c-.143.167-.215.25-.247.354s-.021.215 0 .438l.02.203c.076.785.114 1.178-.115 1.352c-.23.174-.576.015-1.267-.303l-.178-.082c-.197-.09-.295-.135-.399-.135s-.202.045-.399.135l-.178.082c-.691.319-1.037.477-1.267.303s-.191-.567-.115-1.352l.02-.203c.021-.223.032-.334 0-.438s-.104-.187-.247-.354l-.13-.152c-.503-.588-.755-.882-.667-1.165c.088-.282.457-.365 1.195-.532l.19-.044c.21-.047.315-.07.4-.135c.084-.064.138-.16.246-.354z"/><path d="M2 6.95c0-.883 0-1.324.07-1.692A4 4 0 0 1 5.257 2.07C5.626 2 6.068 2 6.95 2c.386 0 .58 0 .766.017a4 4 0 0 1 2.18.904c.144.119.28.255.554.529L11 4c.816.816 1.224 1.224 1.712 1.495a4 4 0 0 0 .848.352C14.098 6 14.675 6 15.828 6h.374c2.632 0 3.949 0 4.804.77q.119.105.224.224c.77.855.77 2.172.77 4.804V14c0 3.771 0 5.657-1.172 6.828S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14z"/></g></svg>
            `;
        }
        
        // 重新渲染项目列表
        renderRecentProjects();
    }
    
    // 为最近项目添加长按事件监听
    function addRecentProjectsLongPressListeners() {
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            card.addEventListener('mousedown', handleProjectCardMouseDown);
            card.addEventListener('touchstart', handleProjectCardTouchStart);
            card.addEventListener('mouseup', handleProjectCardMouseUp);
            card.addEventListener('mouseleave', handleProjectCardMouseLeave);
            card.addEventListener('touchend', handleProjectCardTouchEnd);
        });
    }
    
    function handleProjectCardMouseDown(e) {
        const projectId = e.currentTarget.dataset.projectId;
        startLongPressTimer(projectId);
    }
    
    function handleProjectCardTouchStart(e) {
        const projectId = e.currentTarget.dataset.projectId;
        startLongPressTimer(projectId);
    }
    
    function handleProjectCardMouseUp(e) {
        cancelLongPressTimer();
    }
    
    function handleProjectCardMouseLeave(e) {
        cancelLongPressTimer();
    }
    
    function handleProjectCardTouchEnd(e) {
        cancelLongPressTimer();
    }
    
    // 显示首页项目的二级菜单
    function showRecentProjectMenu(projectId) {
        const project = getProject(projectId);
        if (!project) return;

        closeProjectMenu();
        
        // 创建菜单
        const menu = document.createElement('div');
        menu.className = 'context-menu show';
        
        // 检查项目是否已收藏
        const isStarred = project.starred || false;
        
        menu.innerHTML = `
            <div class="context-menu__content">
                <div class="context-menu__item" onclick="event.stopPropagation(); toggleStarProject('${projectId}'); closeProjectMenu();">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.146 11.023c.38-.682.57-1.023.854-1.023s.474.34.854 1.023l.098.176c.108.194.162.29.246.354c.085.064.19.088.4.135l.19.044c.738.167 1.107.25 1.195.532s-.164.577-.667 1.165l-.13.152c-.143.167-.215.25-.247.354s-.021.215 0 .438l.02.203c.076.785.114 1.178-.115 1.352c-.23.174-.576.015-1.267-.303l-.178-.082c-.197-.09-.295-.135-.399-.135s-.202.045-.399.135l-.178.082c-.691.319-1.037.477-1.267.303s-.191-.567-.115-1.352l.02-.203c.021-.223.032-.334 0-.438s-.104-.187-.247-.354l-.13-.152c-.503-.588-.755-.882-.667-1.165c.088-.282.457-.365 1.195-.532l.19-.044c.21-.047.315-.07.4-.135c.084-.064.138-.16.246-.354z"/><path d="M2 6.95c0-.883 0-1.324.07-1.692A4 4 0 0 1 5.257 2.07C5.626 2 6.068 2 6.95 2c.386 0 .58 0 .766.017a4 4 0 0 1 2.18.904c.144.119.28.255.554.529L11 4c.816.816 1.224 1.224 1.712 1.495a4 4 0 0 0 .848.352C14.098 6 14.675 6 15.828 6h.374c2.632 0 3.949 0 4.804.77q.119.105.224.224c.77.855.77 2.172.77 4.804V14c0 3.771 0 5.657-1.172 6.828S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14z"/></g></svg>
                    ${isStarred ? '取消收藏' : '收藏'}
                </div>
                <div class="context-menu__item" onclick="event.stopPropagation(); exportProject('${projectId}'); closeProjectMenu();">
                    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24"><g fill="none" stroke="#333333" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M4 7c.59.607 2.16 3 3 3s2.41-2.393 3-3M7 9V2"/><path d="M4 13v1.544c0 3.245 0 4.868.886 5.967a4 4 0 0 0 .603.603C6.59 22 8.211 22 11.456 22c.705 0 1.058 0 1.381-.114q.1-.036.197-.082c.31-.148.559-.397 1.058-.896l4.736-4.736c.579-.578.867-.867 1.02-1.235c.152-.368.152-.776.152-1.594V10c0-3.771 0-5.657-1.172-6.828S15.771 2 12 2m1 19.5V21c0-2.828 0-4.243.879-5.121C14.757 15 16.172 15 19 15h.5"/></g></svg>
                    导出
                </div>
                <div class="context-menu__item" onclick="event.stopPropagation(); renameProject('${projectId}');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.172 19.828L19.828 8.172c.546-.546.818-.818.964-1.112a2 2 0 0 0 0-1.776c-.146-.295-.418-.567-.964-1.112c-.545-.546-.817-.818-1.112-.964a2 2 0 0 0-1.776 0c-.294.146-.566.418-1.112.964L4.172 15.828c-.579.578-.868.867-1.02 1.235C3 17.43 3 17.839 3 18.657V21h2.343c.818 0 1.226 0 1.594-.152c.367-.152.656-.442 1.235-1.02M12 21h6M14.5 5.5l4 4"/></svg>
                    重命名
                </div>
                <div class="context-menu__item context-menu__item--danger" onclick="event.stopPropagation(); confirmDeleteProject('${projectId}');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M20.5 6h-17m5.67-2a3.001 3.001 0 0 1 5.66 0m3.544 11.4c-.177 2.654-.266 3.981-1.131 4.79s-2.195.81-4.856.81h-.774c-2.66 0-3.99 0-4.856-.81c-.865-.809-.953-2.136-1.13-4.79l-.46-6.9m13.666 0l-.2 3"/></svg>
                    删除
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // 打开上下文菜单时添加历史记录
        history.pushState({ type: 'context-menu', page: currentPage }, '', window.location.href);
    }
    
    // 切换项目收藏状态
    function toggleStarProject(projectId) {
        const project = getProject(projectId);
        if (!project) return;
        
        // 切换收藏状态
        project.starred = !project.starred;
        
        // 保存并重新渲染
        saveProjects();
        renderRecentProjects();
        renderAllProjects();
        
        showToast(project.starred ? '项目已收藏' : '已取消收藏');
    }

    function renderAllProjects() {
        const container = document.getElementById('all-projects');
        if (!container) return;
        
        if (isSaveViewEnabled) {
            isGridView = localStorage.getItem('svg_editor_grid_view') === 'true';
        }
        
        container.classList.toggle('grid-view', isGridView);
        
        // 更新切换按钮图标
        const toggleButton = document.getElementById('view-toggle');
        if (toggleButton) {
            toggleButton.innerHTML = isGridView ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"><path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 24H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2ZM42 4H30a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path stroke-linecap="round" d="M28 28h16m-8 8h8m-16 8h16"/></g></svg>
            ` : `
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"><path d="M8 14a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm0 12a2 2 0 1 0 0-4a2 2 0 0 0 0 4Zm0 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z"/><path stroke-linecap="round" d="M20 24h24M20 38h24M20 10h24"/></g></svg>
            `;
        }

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 811 811" style="width: 100%; height: 100%;">
                            <g><path fill="#f9faf9" d="M -0.5,-0.5 C 269.833,-0.5 540.167,-0.5 810.5,-0.5C 810.5,269.833 810.5,540.167 810.5,810.5C 540.167,810.5 269.833,810.5 -0.5,810.5C -0.5,540.167 -0.5,269.833 -0.5,-0.5 Z M 0.5,0.5 C 270.167,0.5 539.833,0.5 809.5,0.5C 809.5,270.167 809.5,539.833 809.5,809.5C 539.833,809.5 270.167,809.5 0.5,809.5C 0.5,539.833 0.5,270.167 0.5,0.5 Z"/></g>
                            <g><path fill="#64c7f9" d="M 215.5,35.5 C 342.167,35.3333 468.834,35.5 595.5,36C 680.743,48.0319 737.91,94.5319 767,175.5C 770.929,188.553 773.595,201.886 775,215.5C 775.667,342.167 775.667,468.833 775,595.5C 762.968,680.743 716.468,737.91 635.5,767C 622.447,770.929 609.114,773.595 595.5,775C 468.833,775.667 342.167,775.667 215.5,775C 130.257,762.968 73.09,716.468 44,635.5C 40.0715,622.447 37.4048,609.114 36,595.5C 35.3333,468.833 35.3333,342.167 36,215.5C 46.3065,139.678 85.8065,85.1784 154.5,52C 174.19,43.7285 194.524,38.2285 215.5,35.5 Z"/></g>
                            <g><path fill="#97d5f5" d="M 451.5,277.5 C 450.207,276.158 449.374,274.491 449,272.5C 448.5,237.502 448.333,202.502 448.5,167.5C 392.144,167.183 335.81,167.516 279.5,168.5C 279.918,167.778 280.584,167.278 281.5,167C 337.499,166.5 393.499,166.333 449.5,166.5C 449.333,201.168 449.5,235.835 450,270.5C 450.977,272.74 451.477,275.073 451.5,277.5 Z"/></g>
                            <g><path fill="#f9f9fa" d="M 451.5,277.5 C 456.565,289.535 465.565,296.535 478.5,298.5C 512.329,299.498 546.329,299.832 580.5,299.5C 580.5,329.5 580.5,359.5 580.5,389.5C 463.833,389.5 347.167,389.5 230.5,389.5C 230.5,332.5 230.5,275.5 230.5,218.5C 236.07,191.264 252.403,174.597 279.5,168.5C 335.81,167.516 392.144,167.183 448.5,167.5C 448.333,202.502 448.5,237.502 449,272.5C 449.374,274.491 450.207,276.158 451.5,277.5 Z"/></g>
                            <g><path fill="#f8f9f9" d="M 473.5,167.5 C 475.199,167.34 476.866,167.506 478.5,168C 512.576,202.412 546.743,236.245 581,269.5C 581.494,271.134 581.66,272.801 581.5,274.5C 547.498,274.667 513.498,274.5 479.5,274C 477.291,272.127 475.458,269.96 474,267.5C 473.5,234.168 473.333,200.835 473.5,167.5 Z"/></g>
                            <g><path fill="#c0ebfa" d="M 230.5,218.5 C 230.5,275.5 230.5,332.5 230.5,389.5C 347.167,389.5 463.833,389.5 580.5,389.5C 580.5,359.5 580.5,329.5 580.5,299.5C 546.329,299.832 512.329,299.498 478.5,298.5C 512.833,298.5 547.167,298.5 581.5,298.5C 581.5,329.167 581.5,359.833 581.5,390.5C 464.167,390.5 346.833,390.5 229.5,390.5C 229.168,332.998 229.501,275.664 230.5,218.5 Z"/></g>
                            <g><path fill="#f8f9f9" d="M 624.5,419.5 C 624.372,421.655 624.872,423.655 626,425.5C 626.5,462.832 626.667,500.165 626.5,537.5C 623.993,550.173 616.326,557.673 603.5,560C 470.833,560.667 338.167,560.667 205.5,560C 194.342,556.842 187.175,549.675 184,538.5C 183.333,500.167 183.333,461.833 184,423.5C 187.988,413.74 195.155,407.573 205.5,405C 338.833,404.333 472.167,404.333 605.5,405C 614.085,407.108 620.418,411.941 624.5,419.5 Z"/></g>
                            <g><path fill="#c6ecf9" d="M 624.5,419.5 C 625.558,420.6 626.392,421.934 627,423.5C 627.831,461.669 627.664,499.669 626.5,537.5C 626.667,500.165 626.5,462.832 626,425.5C 624.872,423.655 624.372,421.655 624.5,419.5 Z"/></g>
                            <g><path fill="#6bc9f8" d="M 309.5,441.5 C 322.834,440.062 333.834,444.229 342.5,454C 339.326,457.341 336.326,460.841 333.5,464.5C 326.673,458.292 318.673,456.125 309.5,458C 308.069,458.465 306.903,459.299 306,460.5C 304.773,464.591 305.606,468.091 308.5,471C 317.88,474.57 326.88,478.903 335.5,484C 344.085,490.483 346.918,498.983 344,509.5C 340.575,519.254 333.742,525.087 323.5,527C 310.763,529.518 299.096,527.185 288.5,520C 284.99,518.093 283.824,515.26 285,511.5C 287.763,508.565 290.596,505.898 293.5,503.5C 297.453,506.817 301.786,509.65 306.5,512C 312.755,513.127 318.755,512.46 324.5,510C 328.41,505.925 328.41,501.925 324.5,498C 316.739,493.786 308.739,490.119 300.5,487C 287.179,478.362 284.012,466.862 291,452.5C 296.37,447.255 302.537,443.588 309.5,441.5 Z"/></g>
                            <g><path fill="#6ac8f8" d="M 507.5,510.5 C 508.651,505.35 508.817,500.016 508,494.5C 503.548,493.859 499.048,493.192 494.5,492.5C 493.415,489.227 493.248,485.894 494,482.5C 503.422,481.349 512.922,481.182 522.5,482C 523.488,494.086 523.822,506.253 523.5,518.5C 507.081,530.75 490.081,531.583 472.5,521C 458.606,505.693 454.44,487.86 460,467.5C 469.381,445.009 485.881,437.175 509.5,444C 513.929,446.102 518.095,448.602 522,451.5C 522.667,453.167 522.667,454.833 522,456.5C 519.588,458.571 517.588,460.904 516,463.5C 514.951,464.517 513.784,464.684 512.5,464C 504,456.484 494.667,455.484 484.5,461C 477.294,466.78 474.294,474.28 475.5,483.5C 474.577,495.482 478.91,504.982 488.5,512C 495.071,513.029 501.404,512.529 507.5,510.5 Z"/></g>
                            <g><path fill="#6ac8f8" d="M 366.5,442.5 C 371.844,442.334 377.177,442.501 382.5,443C 383,443.5 383.5,444 384,444.5C 389.566,464.295 395.232,483.961 401,503.5C 406.269,483.648 412.102,463.981 418.5,444.5C 423.792,443.505 429.125,443.172 434.5,443.5C 427.416,470.911 419.25,497.911 410,524.5C 407.106,525.78 403.939,526.446 400.5,526.5C 397.248,526.479 394.081,526.146 391,525.5C 383.47,499.721 375.47,474.055 367,448.5C 366.505,446.527 366.338,444.527 366.5,442.5 Z"/></g>
                            <g><path fill="#9ed9f5" d="M 523.5,518.5 C 523.822,506.253 523.488,494.086 522.5,482C 512.922,481.182 503.422,481.349 494,482.5C 493.248,485.894 493.415,489.227 494.5,492.5C 499.048,493.192 503.548,493.859 508,494.5C 508.817,500.016 508.651,505.35 507.5,510.5C 507.5,505.5 507.5,500.5 507.5,495.5C 502.786,495.827 498.12,495.493 493.5,494.5C 492.188,489.636 492.188,484.803 493.5,480C 503.744,479.181 513.91,479.348 524,480.5C 524.827,493.34 524.66,506.007 523.5,518.5 Z"/></g>
                            <g><path fill="#c0e7f3" d="M 580.5,586.5 C 580.5,582.5 580.5,578.5 580.5,574.5C 463.833,574.5 347.167,574.5 230.5,574.5C 230.5,578.5 230.5,582.5 230.5,586.5C 229.515,582.366 229.182,578.032 229.5,573.5C 346.833,573.5 464.167,573.5 581.5,573.5C 581.818,578.032 581.485,582.366 580.5,586.5 Z"/></g>
                            <g><path fill="#f9f9fa" d="M 580.5,586.5 C 577.41,615.095 562.076,633.595 534.5,642C 491.203,643.153 447.87,643.653 404.5,643.5C 361.13,643.653 317.797,643.153 274.5,642C 248.235,632.613 233.569,614.113 230.5,586.5C 230.5,582.5 230.5,578.5 230.5,574.5C 347.167,574.5 463.833,574.5 580.5,574.5C 580.5,578.5 580.5,582.5 580.5,586.5 Z"/></g>
                        </svg>
                    </div>
                    <div class="empty-state__title">暂无项目</div>
                    <div class="empty-state__desc">点击加号按钮创建新项目</div>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map(project => `
            <div class="projects-list__item" data-project-id="${project.id}">
                <div class="checkbox" onclick="event.stopPropagation(); toggleProjectSelection('${project.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div class="projects-list__icon" onclick="event.stopPropagation(); updateProjectIcon('${project.id}')">
                    ${isIconFetchEnabled ? `
                        <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                            ${project.code}
                        </div>
                    ` : `
                        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 256 256"><path fill="#fff" d="m213.66 82.34l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v76a4 4 0 0 0 4 4h168a4 4 0 0 0 4-4V88a8 8 0 0 0-2.34-5.66M152 88V44l44 44ZM87.82 196.31a20.82 20.82 0 0 1-9.19 15.23C73.44 215 67 216 61.14 216A61.2 61.2 0 0 1 46 214a8 8 0 0 1 4.3-15.41c4.38 1.2 14.95 2.7 19.55-.36c.88-.59 1.83-1.52 2.14-3.93c.35-2.67-.71-4.1-12.78-7.59c-9.35-2.7-25-7.23-23-23.11a20.55 20.55 0 0 1 9-14.95c11.84-8 30.72-3.31 32.83-2.76a8 8 0 0 1-4.07 15.48c-4.48-1.17-15.23-2.56-19.83.56a4.54 4.54 0 0 0-2 3.67c-.11.9-.14 1.09 1.12 1.9c2.31 1.49 6.44 2.68 10.45 3.84c9.79 2.83 26.35 7.66 24.11 24.97m63.72-41.62l-19.9 55.72a8.25 8.25 0 0 1-6.5 5.51a8 8 0 0 1-8.67-5.23L96.59 155a8.21 8.21 0 0 1 4.5-10.45a8 8 0 0 1 10.45 4.76l12.46 34.9l12.46-34.9a8 8 0 0 1 15.07 5.38ZM216 184v16.87a8 8 0 0 1-2.26 5.57A30 30 0 0 1 192 216c-17.64 0-32-16.15-32-36s14.36-36 32-36a29.36 29.36 0 0 1 16.09 4.86a8.22 8.22 0 0 1 3 10.64a8 8 0 0 1-11.54 2.88A13.27 13.27 0 0 0 192 160c-8.82 0-16 9-16 20s7.18 20 16 20a13.38 13.38 0 0 0 8-2.71V192a8 8 0 0 1-8-8.53a8.18 8.18 0 0 1 8.26-7.47H208a8 8 0 0 1 8 8"/></svg>
                    `}
                </div>
                <div class="projects-list__info">
                    <div class="projects-list__name">${escapeHtml(project.name)}</div>
                    <div class="projects-list__meta">
                        <span>${formatTime(project.updatedAt)}</span>
                    </div>
                </div>
                <div class="projects-list__actions">
                    <button class="btn btn--icon" onclick="event.stopPropagation(); showProjectMenu('${project.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
        
        // 添加长按事件监听
        addLongPressEventListeners();
    }
    
    // 初始化设置页面
    function initSettings() {
        const toggle = document.getElementById('save-view-toggle');
        if (toggle) {
            toggle.checked = isSaveViewEnabled;
        }
        
        const iconToggle = document.getElementById('icon-fetch-toggle');
        if (iconToggle) {
            iconToggle.checked = isIconFetchEnabled;
        }
        
        const codeCopyToggle = document.getElementById('code-copy-toggle');
        if (codeCopyToggle) {
            codeCopyToggle.checked = isCodeCopyEnabled;
        }
        
        const autoBackupToggle = document.getElementById('auto-backup-toggle');
        if (autoBackupToggle) {
            autoBackupToggle.checked = isAutoBackupEnabled;
        }
        
        const lineWrapToggle = document.getElementById('line-wrap-toggle');
        if (lineWrapToggle) {
            const lineWrapSetting = localStorage.getItem('lineWrap') === 'true';
            lineWrapToggle.checked = lineWrapSetting;
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNewProjectModal() {
        const defaultName = generateDefaultProjectName();
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal__content">
                <div class="modal__title">新建项目</div>
                <input type="text" class="modal__input" id="new-project-name" placeholder="${defaultName}" autofocus>
                <div class="modal__actions">
                    <button class="btn btn--text" onclick="closeModal()">取消</button>
                    <button class="btn btn--primary" onclick="confirmCreateProject()">创建</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const input = document.getElementById('new-project-name');
        input.focus();

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                confirmCreateProject();
            }
        });
        
        // 打开模态框时添加历史记录
        history.pushState({ type: 'modal', page: currentPage }, '', window.location.href);
    }

    function closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
            if (modal.classList.contains('show') && currentPage !== 'page-editor') {
                history.back();
            }
        }
    }

    function confirmCreateProject() {
        const input = document.getElementById('new-project-name');
        const name = input.value.trim();
        
        if (name && projects.some(project => project.name === name)) {
            showToast('项目名称已存在，请使用其他名称');
            return;
        }
        
        const project = createProject(name);
        
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
        
        previousPage = 'page-home';
        
        openProject(project.id);
        
        history.replaceState({ page: 'page-editor' }, '', window.location.href);
    }

    function showProjectMenu(projectId) {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu show';
        menu.innerHTML = `
            <div class="context-menu__content">
                <div class="context-menu__item" onclick="exportProject('${projectId}');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24"><g fill="none" stroke="#333333" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M4 7c.59.607 2.16 3 3 3s2.41-2.393 3-3M7 9V2"/><path d="M4 13v1.544c0 3.245 0 4.868.886 5.967a4 4 0 0 0 .603.603C6.59 22 8.211 22 11.456 22c.705 0 1.058 0 1.381-.114q.1-.036.197-.082c.31-.148.559-.397 1.058-.896l4.736-4.736c.579-.578.867-.867 1.02-1.235c.152-.368.152-.776.152-1.594V10c0-3.771 0-5.657-1.172-6.828S15.771 2 12 2m1 19.5V21c0-2.828 0-4.243.879-5.121C14.757 15 16.172 15 19 15h.5"/></g></svg>
                    导出
                </div>
                <div class="context-menu__item" onclick="renameProject('${projectId}');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.172 19.828L19.828 8.172c.546-.546.818-.818.964-1.112a2 2 0 0 0 0-1.776c-.146-.295-.418-.567-.964-1.112c-.545-.546-.817-.818-1.112-.964a2 2 0 0 0-1.776 0c-.294.146-.566.418-1.112.964L4.172 15.828c-.579.578-.868.867-1.02 1.235C3 17.43 3 17.839 3 18.657V21h2.343c.818 0 1.226 0 1.594-.152c.367-.152.656-.442 1.235-1.02M12 21h6M14.5 5.5l4 4"/></svg>
                    重命名
                </div>
                <div class="context-menu__item context-menu__item--danger" onclick="confirmDeleteProject('${projectId}');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M20.5 6h-17m5.67-2a3.001 3.001 0 0 1 5.66 0m3.544 11.4c-.177 2.654-.266 3.981-1.131 4.79s-2.195.81-4.856.81h-.774c-2.66 0-3.99 0-4.856-.81c-.865-.809-.953-2.136-1.13-4.79l-.46-6.9m13.666 0l-.2 3"/></svg>
                    删除
                </div>
            </div>
        `;
        document.body.appendChild(menu);

        menu.addEventListener('click', function(e) {
            if (e.target === menu) {
                closeProjectMenu();
            }
        });
        
        history.pushState({ type: 'context-menu', page: currentPage }, '', window.location.href);
    }

    function closeProjectMenu() {
        const menu = document.querySelector('.context-menu');
        if (menu) {
            menu.remove();
        }
    }

    function renameProject(projectId) {
        const project = getProject(projectId);
        if (!project) return;

        closeProjectMenu();

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal__content">
                <div class="modal__title">重命名项目</div>
                <input type="text" class="modal__input" id="rename-project-name" value="${escapeHtml(project.name)}" placeholder="输入项目名称" autofocus>
                <div class="modal__actions">
                    <button class="btn btn--text" onclick="closeModal()">取消</button>
                    <button class="btn btn--primary" onclick="confirmRenameProject('${projectId}')">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        history.pushState({ type: 'modal', modalType: 'rename', projectId: projectId, page: currentPage }, '', window.location.href);

        const input = document.getElementById('rename-project-name');
        input.focus();
        input.select();

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                confirmRenameProject(projectId);
            }
        });
    }

    function confirmRenameProject(projectId) {
        const input = document.getElementById('rename-project-name');
        const name = input.value.trim();
        if (name) {
            updateProject(projectId, { name });
            renderRecentProjects();
            if (currentProject && currentProject.id === projectId) {
                document.getElementById('current-project-name').textContent = name;
            }
            showToast('重命名成功');
        }
        closeModal();
    }

    function confirmDeleteProject(projectId) {
        closeProjectMenu();
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal__content">
                <div class="modal__title">确认删除</div>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">确定要删除这个项目吗？此操作无法撤销。</p>
                <div class="modal__actions">
                    <button class="btn btn--text" onclick="closeModal()">取消</button>
                    <button class="btn btn--danger" onclick="executeDeleteProject('${projectId}')">删除</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        history.pushState({ type: 'modal', modalType: 'delete', projectId: projectId, page: currentPage }, '', window.location.href);
    }

    function executeDeleteProject(projectId) {
        deleteProject(projectId);
        closeModal();
        renderRecentProjects();
        renderAllProjects();
        showToast('项目已删除');
    }

    function openProject(projectId) {
        const project = getProject(projectId);
        if (!project) return;

        currentProject = project;
        localStorage.setItem(CURRENT_PROJECT_KEY, projectId);

        document.getElementById('current-project-name').textContent = project.name;
        
        // 初始化CodeMirror编辑器
        if (!codeMirrorEditor) {
            // 从本地存储获取换行设置，默认关闭
            const lineWrapSetting = localStorage.getItem('lineWrap') === 'true';
            
            codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
                mode: 'xml',
                theme: 'dracula',
                lineNumbers: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                lineWrapping: lineWrapSetting,
                styleActiveLine: true,
                indentUnit: 2,
                tabSize: 2,
                indentWithTabs: false
            });
            
            // 监听编辑器内容变化事件
            codeMirrorEditor.on('change', handleCodeChange);
            
            // 监听键盘事件
            codeMirrorEditor.on('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey)) {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        codeMirrorEditor.replaceSelection('  ', 'end');
                    }
                }
            });
            
            // 初始化自动补全
            if (typeof window.initAutocomplete === 'function') {
                window.initAutocomplete(codeMirrorEditor);
            }
            
            // 初始化颜色高亮填充
            if (typeof window.initColorHighlight === 'function') {
                window.initColorHighlight(codeMirrorEditor);
            }
        }
        
        // 设置编辑器内容
        codeMirrorEditor.setValue(project.code);

        // 初始化撤销栈，将初始代码推入栈中
        undoStack = [project.code];
        redoStack = [];
        hasUnsavedChanges = false;

        updatePreview();
        showPage('page-editor');
    }

    function saveProject() {
        if (!currentProject) return;

        const code = codeMirrorEditor.getValue();
        updateProject(currentProject.id, { code });

        if (!isUndoRedo) {
            redoStack = [];
        }

        showToast('已保存');
    }

    function handleBack() {
        // 设置返回导航标志
        isBackNavigation = true;
        
        // 如果有未保存的更改显示保存更改弹窗
        if (currentProject && hasUnsavedChanges) {
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.id = 'save-changes-modal';
            modal.innerHTML = `
                <div class="modal__content">
                    <div class="modal__title">保存更改</div>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">是否保存对 "${escapeHtml(currentProject.name)}" 的更改？</p>
                    <div class="modal__actions">
                        <button class="btn btn--text" onclick="discardAndBack()">不保存</button>
                        <button class="btn btn--text" onclick="handleCloseSaveModal()">取消</button>
                        <button class="btn btn--primary" onclick="saveAndBack()">保存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            isSaveChangesModalOpen = true;
        } else {
            goBack();
        }
    }
    
    function handleCloseSaveModal() {
        // 关闭弹窗
        closeSaveModal();
        
        // 重置标志
        isSaveChangesModalOpen = false;
        
        // 重新添加当前状态到历史记录
        history.pushState({ page: currentPage }, '', window.location.href);
    }
    
    function closeSaveModal() {
        if (isClosingSaveModal) return;
        isClosingSaveModal = true;
        
        const modal = document.getElementById('save-changes-modal');
        if (modal) {
            modal.remove();
        }
        
        setTimeout(() => {
            isClosingSaveModal = false;
        }, 100);
    }

    function saveAndBack() {
        saveProject();
        hasUnsavedChanges = false;
        isSaveChangesModalOpen = false;
        closeModal();
        goBack();
    }

    function discardAndBack() {
        hasUnsavedChanges = false;
        isSaveChangesModalOpen = false;
        closeModal();
        goBack();
    }

    function goBack() {
        if (currentProject && codeMirrorEditor) {
            const project = getProject(currentProject.id);
            if (project) {
                codeMirrorEditor.setValue(project.code);
            }
        }
        currentProject = null;
        undoStack = [];
        redoStack = [];
        
        const targetPage = previousPage && previousPage !== 'page-editor' ? previousPage : 'page-home';
        const currentPageTemp = currentPage;
        
        showPage(targetPage);
        
        if (targetPage === 'page-home') {
            previousPage = 'page-home';
        } 
        else if (currentPageTemp === 'page-editor' && targetPage === 'page-projects') {
            previousPage = 'page-home';
        }
        
        if (targetPage === 'page-projects') {
            renderAllProjects();
        } else {
            renderRecentProjects();
        }
    }

    function insertSymbol(type) {
        if (!codeMirrorEditor) return;

        // 使用从symbols.js引入的symbolTemplates
        const symbolTemplates = window.symbolTemplates;
        const symbol = symbolTemplates[type];
        if (!symbol) return;

        // 直接插入符号
        codeMirrorEditor.replaceSelection(symbol);
        
        // 聚焦编辑器
        codeMirrorEditor.focus();
        
        handleCodeChange();
    }

    function handleCodeChange() {
        if (isUndoRedo) return;

        const code = codeMirrorEditor.getValue();
        undoStack.push(code);

        if (undoStack.length > 100) {
            undoStack.shift();
        }

        redoStack = [];
        hasUnsavedChanges = true;
        updatePreview();
    }

    function undo() {
        if (!currentProject || undoStack.length <= 1) return;

        const currentCode = codeMirrorEditor.getValue();
        redoStack.push(currentCode);

        undoStack.pop();
        const previousCode = undoStack[undoStack.length - 1];

        isUndoRedo = true;
        codeMirrorEditor.setValue(previousCode);
        isUndoRedo = false;

        updatePreview();
        showToast('已撤销');
    }

    function redo() {
        if (!currentProject || redoStack.length === 0) return;

        const currentCode = codeMirrorEditor.getValue();
        undoStack.push(currentCode);

        const nextCode = redoStack.pop();

        isUndoRedo = true;
        codeMirrorEditor.setValue(nextCode);
        isUndoRedo = false;

        updatePreview();
        showToast('已重做');
    }

    function updatePreview() {
        const code = codeMirrorEditor ? codeMirrorEditor.getValue() : document.getElementById('code-editor').value;
        const previewContent = document.getElementById('preview-content');

        if (!previewContent) return;

        try {
            previewContent.innerHTML = code;
        } catch (e) {
            previewContent.innerHTML = '<span style="color: var(--danger-color);">无效的 SVG 代码</span>';
        }
    }

    function showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    function bindEvents() {
        document.addEventListener('click', function(e) {
            if (e.target.closest('.context-menu__content')) return;
            if (e.target.closest('.context-menu') && !e.target.closest('.context-menu__content')) {
                closeProjectMenu();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (findReplaceVisible) {
                    closeFindReplace();
                    return;
                }
                closeModal();
                closeProjectMenu();
            }

            if (currentProject && (e.ctrlKey || e.metaKey)) {
                if (e.key === 's') {
                    e.preventDefault();
                    saveProject();
                } else if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    undo();
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    redo();
                }
            }
        });

        // 添加物理返回键处理
    window.addEventListener('popstate', function(e) {
        // 检查是否有需要处理的UI状态
        const modal = document.querySelector('.modal');
        const contextMenu = document.querySelector('.context-menu');
        
        if (findReplaceVisible) {
            const panel = document.getElementById('find-replace-panel');
            const header = document.querySelector('.editor__header');
            
            panel.classList.remove('show');
            header.style.display = 'flex';
            
            findReplaceVisible = false;
            clearHighlights();
            
            document.getElementById('find-input').value = '';
            document.getElementById('replace-input').value = '';
            document.getElementById('find-info').textContent = '';
            
            if (codeMirrorEditor) {
                codeMirrorEditor.focus();
            }
            return;
        }
        
        if (contextMenu) {
            contextMenu.remove();
            return;
        }
        
        if (modal) {
            modal.remove();
            if (modal.id === 'save-changes-modal' && currentPage === 'page-editor' && hasUnsavedChanges) {
                isSaveChangesModalOpen = false;
                hasUnsavedChanges = false;
            }
            return;
        }
        
        if (isBatchSelectionMode) {
            isBatchSelectionMode = false;
            selectedProjects.clear();
            updateBatchSelectionUI();
            updateProjectItemSelection();
            return;
        }
        
        if (currentPage === 'page-home') {
            return;
        }
        
        isBackNavigation = true;
        
        if (currentPage === 'page-editor' && hasUnsavedChanges) {
            handleBack();
        } else {
            goBack();
        }
    });

        // 初始加载时添加历史记录
        if (history.state === null) {
            history.pushState({ page: currentPage }, '', window.location.href);
        }
    }

    // 处理物理返回键
    function handleBackButton() {
        const modal = document.querySelector('.modal.show');
        const contextMenu = document.querySelector('.context-menu.show');
        
        if (findReplaceVisible) {
            closeFindReplace();
            return;
        }
        if (modal) {
            closeModal();
            return;
        }
        if (contextMenu) {
            closeProjectMenu();
            return;
        }
        if (isBatchSelectionMode) {
            exitBatchSelection();
            return;
        }
        
        // 设置返回导航标志
        isBackNavigation = true;
        
        // 根据当前页面执行不同的返回逻辑
        switch (currentPage) {
            case 'page-editor':
                handleBack();
                break;
            case 'page-projects':
                showPage('page-home');
                break;
            case 'page-about':
                showPage('page-home');
                break;
            case 'page-home':
                break;
        }
    }

    // 更新历史记录
    function updateHistoryState() {
        history.pushState({ page: currentPage }, '', window.location.href);
    }

    window.showPage = showPage;
    window.showNewProjectModal = showNewProjectModal;
    window.closeModal = closeModal;
    window.closeSaveModal = closeSaveModal;
    window.handleCloseSaveModal = handleCloseSaveModal;
    window.confirmCreateProject = confirmCreateProject;
    window.openProject = openProject;
    window.showProjectMenu = showProjectMenu;
    window.closeProjectMenu = closeProjectMenu;
    window.renameProject = renameProject;
    window.confirmRenameProject = confirmRenameProject;
    window.confirmDeleteProject = confirmDeleteProject;
    window.executeDeleteProject = executeDeleteProject;
    window.saveProject = saveProject;
    window.handleBack = handleBack;
    window.saveAndBack = saveAndBack;
    window.discardAndBack = discardAndBack;
    window.insertSymbol = insertSymbol;
    window.updateProjectIcon = updateProjectIcon;
    window.toggleIconFetchSetting = toggleIconFetchSetting;
    window.toggleCodeCopySetting = toggleCodeCopySetting;
    window.toggleAutoBackupSetting = toggleAutoBackupSetting;
    window.toggleLineWrapSetting = toggleLineWrapSetting;
    window.exportProject = exportProject;
    window.batchExportProjects = batchExportProjects;
    window.executeBatchExport = executeBatchExport;
    let isGridView = false;
    let isSaveViewEnabled = localStorage.getItem('svg_editor_save_view_enabled') === 'true';
    let isIconFetchEnabled = localStorage.getItem('svg_editor_icon_fetch_enabled') === 'true'; // 图标获取功能开关，默认关闭
    let isCodeCopyEnabled = localStorage.getItem('svg_editor_code_copy_enabled') === 'true'; // 复制代码功能开关，默认关闭
    let isAutoBackupEnabled = localStorage.getItem('svg_editor_auto_backup_enabled') === 'true'; // 自动备份功能开关，默认关闭
    let isBatchSelectionMode = false;
    let selectedProjects = new Set();
    let longPressTimer = null;
    const LONG_PRESS_DURATION = 500; // 长按时长（毫秒）
    let projectViewMode = 'recent'; // recent 或 starred
    let previousPage = 'page-home'; // 记录上一个页面用于返回导航

    function toggleViewMode() {
        const projectsList = document.getElementById('all-projects');
        const toggleButton = document.getElementById('view-toggle');
        
        if (!projectsList || !toggleButton) return;
        
        isGridView = !isGridView;
        
        if (isSaveViewEnabled) {
            localStorage.setItem('svg_editor_grid_view', isGridView);
        }
        
        projectsList.classList.toggle('grid-view', isGridView);
        
        toggleButton.innerHTML = isGridView ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"><path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 24H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2ZM42 4H30a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path stroke-linecap="round" d="M28 28h16m-8 8h8m-16 8h16"/></g></svg>
        ` : `
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"><path d="M8 14a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm0 12a2 2 0 1 0 0-4a2 2 0 0 0 0 4Zm0 14a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z"/><path stroke-linecap="round" d="M20 24h24M20 38h24M20 10h24"/></g></svg>
        `;
    }

    // 添加长按事件监听
    function addLongPressEventListeners() {
        const projectItems = document.querySelectorAll('.projects-list__item');
        
        projectItems.forEach(item => {
            item.addEventListener('mousedown', handleMouseDown);
            item.addEventListener('touchstart', handleTouchStart);
            item.addEventListener('mouseup', handleMouseUp);
            item.addEventListener('mouseleave', handleMouseLeave);
            item.addEventListener('touchend', handleTouchEnd);
            item.addEventListener('click', handleItemClick);
        });
    }

    function handleMouseDown(e) {
        if (isBatchSelectionMode) return;
        const projectId = e.currentTarget.dataset.projectId;
        startLongPressTimer(projectId);
    }

    function handleTouchStart(e) {
        if (isBatchSelectionMode) return;
        const projectId = e.currentTarget.dataset.projectId;
        startLongPressTimer(projectId);
    }

    function handleMouseUp(e) {
        cancelLongPressTimer();
    }

    function handleMouseLeave(e) {
        cancelLongPressTimer();
    }

    function handleTouchEnd(e) {
        cancelLongPressTimer();
    }

    function startLongPressTimer(projectId) {
        cancelLongPressTimer();
        longPressTimer = setTimeout(() => {
            // 根据当前页面决定执行什么操作
            if (currentPage === 'page-projects') {
                enterBatchSelectionMode(projectId);
            } else if (currentPage === 'page-home') {
                showRecentProjectMenu(projectId);
            }
        }, LONG_PRESS_DURATION);
    }

    function cancelLongPressTimer() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    // 进入批量选择模式
    function enterBatchSelectionMode(initialProjectId) {
        isBatchSelectionMode = true;
        selectedProjects.clear();
        selectedProjects.add(initialProjectId);
        
        updateBatchSelectionUI();
        updateProjectItemSelection();
        
        history.pushState({ type: 'batch-selection', page: currentPage }, '', window.location.href);
    }

    // 退出批量选择模式
    function exitBatchSelection() {
        isBatchSelectionMode = false;
        selectedProjects.clear();
        
        updateBatchSelectionUI();
        updateProjectItemSelection();
    }

    // 更新批量选择UI
    function updateBatchSelectionUI() {
        const projectHeader = document.getElementById('project-header');
        const batchSelectionBar = document.getElementById('batch-selection-bar');
        const selectedCount = document.getElementById('selected-count');
        const projectsList = document.getElementById('all-projects');
        
        if (!projectHeader || !batchSelectionBar || !selectedCount || !projectsList) return;
        
        projectsList.parentElement.classList.toggle('batch-selection-mode', isBatchSelectionMode);
        
        if (isBatchSelectionMode) {
            projectHeader.style.display = 'none';
            batchSelectionBar.style.display = 'flex';
        } else {
            projectHeader.style.display = 'flex';
            batchSelectionBar.style.display = 'none';
        }
        
        selectedCount.textContent = selectedProjects.size;
    }

    // 切换项目选择状态
    function toggleProjectSelection(projectId) {
        if (!isBatchSelectionMode) {
            enterBatchSelectionMode(projectId);
            return;
        }
        
        if (selectedProjects.has(projectId)) {
            selectedProjects.delete(projectId);
        } else {
            selectedProjects.add(projectId);
        }
        
        updateProjectItemSelection();
        updateBatchSelectionUI();
    }

    // 处理项目项点击事件
    function handleItemClick(e) {
        if (!isBatchSelectionMode) {
            const projectId = e.currentTarget.dataset.projectId;
            openProject(projectId);
        } else {
            const projectId = e.currentTarget.dataset.projectId;
            toggleProjectSelection(projectId);
        }
    }

    // 更新项目项选择状态
    function updateProjectItemSelection() {
        const projectItems = document.querySelectorAll('.projects-list__item');
        
        projectItems.forEach(item => {
            const projectId = item.dataset.projectId;
            const checkbox = item.querySelector('.checkbox');
            
            if (selectedProjects.has(projectId)) {
                item.classList.add('selected');
                checkbox.classList.add('checked');
            } else {
                item.classList.remove('selected');
                checkbox.classList.remove('checked');
            }
        });
    }

    // 全选/取消全选
    function selectAllProjects() {
        const projectItems = document.querySelectorAll('.projects-list__item');
        
        if (selectedProjects.size === projectItems.length) {
            selectedProjects.clear();
        } else {
            selectedProjects.clear();
            projectItems.forEach(item => {
                selectedProjects.add(item.dataset.projectId);
            });
        }
        
        updateProjectItemSelection();
        updateBatchSelectionUI();
    }
    
    // 切换视图保存设置
    function toggleSaveViewSetting() {
        const toggle = document.getElementById('save-view-toggle');
        if (toggle) {
            isSaveViewEnabled = toggle.checked;
            localStorage.setItem('svg_editor_save_view_enabled', isSaveViewEnabled);
            
            if (isSaveViewEnabled) {
                localStorage.setItem('svg_editor_grid_view', isGridView);
            }
        }
    }
    
    // 切换图标获取功能设置
    function toggleIconFetchSetting() {
        const toggle = document.getElementById('icon-fetch-toggle');
        if (toggle) {
            isIconFetchEnabled = toggle.checked;
            localStorage.setItem('svg_editor_icon_fetch_enabled', isIconFetchEnabled);
            
            renderRecentProjects();
            renderAllProjects();
        }
    }
    
    // 切换复制代码功能设置
    function toggleCodeCopySetting() {
        const toggle = document.getElementById('code-copy-toggle');
        if (toggle) {
            isCodeCopyEnabled = toggle.checked;
            localStorage.setItem('svg_editor_code_copy_enabled', isCodeCopyEnabled);
            
            renderRecentProjects();
            renderAllProjects();
        }
    }
    
    // 切换自动备份功能设置
    function toggleAutoBackupSetting() {
        const toggle = document.getElementById('auto-backup-toggle');
        if (toggle) {
            isAutoBackupEnabled = toggle.checked;
            localStorage.setItem('svg_editor_auto_backup_enabled', isAutoBackupEnabled);
            showToast(isAutoBackupEnabled ? '自动备份已开启' : '自动备份已关闭');
        }
    }
    
    // 切换编辑器换行功能设置
    function toggleLineWrapSetting() {
        const toggle = document.getElementById('line-wrap-toggle');
        if (toggle) {
            const isLineWrapEnabled = toggle.checked;
            localStorage.setItem('lineWrap', isLineWrapEnabled);
            
            // 更新编辑器换行设置
            if (codeMirrorEditor) {
                codeMirrorEditor.setOption('lineWrapping', isLineWrapEnabled);
            }
            
            showToast(isLineWrapEnabled ? '编辑器自动换行已开启' : '编辑器自动换行已关闭');
        }
    }
    
    // 复制项目代码到剪贴板 - 为了兼容以下浏览器：
    // - Chrome 66+
    // - Firefox 63+
    // - Safari 13+
    // - Edge 79+
    // - 不喜欢的可将其删除保留所需就行了
    function copyProjectCode(projectId) {
        const project = getProject(projectId);
        if (!project) return;
        
        const code = project.code;
        
        // 优先使用现代的 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code).then(() => {
                showToast('代码已复制到剪贴板');
            }).catch(err => {
                console.error('现代剪贴板API复制失败:', err);
                fallbackCopyTextToClipboard(code);
            });
        } else {
            // 直接使用传统方法
            fallbackCopyTextToClipboard(code);
        }
    }
    
    // 传统复制方法，兼容旧浏览器
    function fallbackCopyTextToClipboard(text) {
        try {
            // 创建临时文本area元素
            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            // 设置样式以确保元素不可见但要选中
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            textArea.style.opacity = '0';
            textArea.style.pointerEvents = 'none';
            
            document.body.appendChild(textArea);
            
            // 选中并复制
            textArea.focus();
            textArea.select();
            
            // 执行复制命令
            const successful = document.execCommand('copy');
            
            // 移除临时元素
            document.body.removeChild(textArea);
            
            if (successful) {
                showToast('内容已复制到剪贴板');
            } else {
                throw new Error('execCommand copy failed');
            }
        } catch (err) {
            console.error('传统复制方法失败:', err);
            showToast('复制失败，请打开项目手动复制');
        }
    }
    
    // 导出项目到文件夹
    function exportProject(projectId) {
        const project = getProject(projectId);
        if (!project) return;
        
        // 检查是否支持文件操作
        if (!window.webapp || typeof window.webapp.获取外部存储目录 !== 'function') {
            showToast('导出功能不可用');
            return;
        }
        
        try {
            // 获取外部存储目录
            const externalDir = window.webapp.获取外部存储目录();
            if (!externalDir) {
                showToast('无法获取存储目录');
                return;
            }
            
            // 构建导出文件路径
            const svgiconDir = externalDir + '/Svgicon';
            const completionDir = svgiconDir + '/Completion';
            const fileName = project.name.replace(/[^a-zA-Z0-9-_]/g, '_') + '.svg';
            const filePath = completionDir + '/' + fileName;
            
            // 检查并创建必要的文件夹
            if (!window.webapp.判断指定文件(svgiconDir)) {
                window.webapp.保存指定文件(svgiconDir, null);
            }
            
            if (!window.webapp.判断指定文件(completionDir)) {
                window.webapp.保存指定文件(completionDir, null);
            }
            
            // 导出SVG文件
            const content = project.code;
            const base64Content = btoa(unescape(encodeURIComponent(content)));
            const dataUrl = 'data:image/svg+xml;base64,' + base64Content;
            
            window.webapp.保存指定文件(filePath, dataUrl);
            showToast('项目已导出');
        } catch (err) {
            console.error('导出失败:', err);
            showToast('导出失败，请检查存储权限');
        }
    }

    // 批量导出项目
    function batchExportProjects() {
        if (selectedProjects.size === 0) {
            showToast('请先选择要导出的项目');
            return;
        }
        
        // 确认导出
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal__content">
                <div class="modal__title">确认导出</div>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">确定要导出选中的 ${selectedProjects.size} 个项目吗？</p>
                <div class="modal__actions">
                    <button class="btn btn--text" onclick="closeModal()">取消</button>
                    <button class="btn btn--primary" onclick="executeBatchExport()">导出</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // 执行批量导出
    function executeBatchExport() {
        // 检查是否支持文件操作
        if (!window.webapp || typeof window.webapp.获取外部存储目录 !== 'function') {
            showToast('导出功能不可用');
            closeModal();
            return;
        }
        
        try {
            // 获取外部存储目录
            const externalDir = window.webapp.获取外部存储目录();
            if (!externalDir) {
                showToast('无法获取存储目录');
                closeModal();
                return;
            }
            
            // 构建导出目录路径
            const svgiconDir = externalDir + '/Svgicon';
            const completionDir = svgiconDir + '/Completion';
            
            // 检查并创建必要的文件夹
            if (!window.webapp.判断指定文件(svgiconDir)) {
                window.webapp.保存指定文件(svgiconDir, null);
            }
            
            if (!window.webapp.判断指定文件(completionDir)) {
                window.webapp.保存指定文件(completionDir, null);
            }
            
            let exportedCount = 0;
            
            // 遍历选中的项目并导出
            selectedProjects.forEach(projectId => {
                const project = getProject(projectId);
                if (project) {
                    try {
                        // 构建导出文件路径
                        const fileName = project.name.replace(/[^a-zA-Z0-9-_]/g, '_') + '.svg';
                        const filePath = completionDir + '/' + fileName;
                        
                        // 导出SVG文件
                        const content = project.code;
                        const base64Content = btoa(unescape(encodeURIComponent(content)));
                        const dataUrl = 'data:image/svg+xml;base64,' + base64Content;
                        
                        window.webapp.保存指定文件(filePath, dataUrl);
                        exportedCount++;
                    } catch (err) {
                        console.error('导出失败:', err);
                    }
                }
            });
            
            showToast(`成功导出 ${exportedCount} 个项目到Completion文件夹`);
            closeModal();
        } catch (err) {
            console.error('批量导出失败:', err);
            showToast('批量导出失败，请检查存储权限');
            closeModal();
        }
    }
    
    // 批量删除项目
    function batchDeleteProjects() {
        if (selectedProjects.size === 0) return;
        
        // 确认删除
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal__content">
                <div class="modal__title">确认删除</div>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">确定要删除选中的 ${selectedProjects.size} 个项目吗？此操作无法撤销。</p>
                <div class="modal__actions">
                    <button class="btn btn--text" onclick="closeModal()">取消</button>
                    <button class="btn btn--danger" onclick="executeBatchDelete()">删除</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // 更新项目图标
    function updateProjectIcon(projectId) {
        const project = getProject(projectId);
        if (!project) return;
        
        // 如果复制代码功能启用，执行复制代码操作
        if (isCodeCopyEnabled) {
            copyProjectCode(projectId);
        } else {
            // 否则执行原有的更新图标操作
            if (!isIconFetchEnabled) {
                showToast('请先在设置中启用图标获取功能');
                return;
            }
            
            try {
                // 重新渲染项目列表，更新图标显示
                renderRecentProjects();
                renderAllProjects();
                
                // 显示成功提示
                showToast('项目图标已更新');
            } catch (err) {
                console.error('更新项目图标失败:', err);
                showToast('更新项目图标失败，请重试');
            }
        }
    }
    
    // 执行批量删除
    function executeBatchDelete() {
        // 删除选中的项目
        selectedProjects.forEach(projectId => {
            deleteProject(projectId);
        });
        
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
        
        isBatchSelectionMode = false;
        selectedProjects.clear();
        updateBatchSelectionUI();
        updateProjectItemSelection();
        renderAllProjects();
        renderRecentProjects();
        showToast(`已删除 ${selectedProjects.size} 个项目`);
    }

    window.toggleViewMode = toggleViewMode;
    window.toggleProjectView = toggleProjectView;
    window.toggleStarProject = toggleStarProject;
    window.exitBatchSelection = exitBatchSelection;
    window.selectAllProjects = selectAllProjects;
    window.batchDeleteProjects = batchDeleteProjects;
    window.executeBatchDelete = executeBatchDelete;
    window.toggleProjectSelection = toggleProjectSelection;
    window.toggleSaveViewSetting = toggleSaveViewSetting;
    window.undo = undo;
    window.redo = redo;
    
    // 代码运行悬浮窗相关
    let isRunPreviewVisible = false;
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    let dragAnimationFrame = null;
    
    // 切换运行预览悬浮窗显示
    function toggleRunPreview() {
        const preview = document.getElementById('run-preview');
        const runBtn = document.getElementById('run-btn');
        
        isRunPreviewVisible = !isRunPreviewVisible;
        
        if (isRunPreviewVisible) {
            preview.style.display = 'flex';
            runBtn.title = '关闭运行结果';
            // 更新预览内容
            updateRunPreview();
        } else {
            preview.style.display = 'none';
            runBtn.title = '运行代码';
        }
    }
    
    // 更新运行预览内容
    function updateRunPreview() {
        const previewContent = document.getElementById('run-preview-content');
        
        if (!previewContent) return;
        
        try {
            const code = codeMirrorEditor ? codeMirrorEditor.getValue() : (document.getElementById('code-editor') ? document.getElementById('code-editor').value : '<span style="color: var(--text-secondary); font-size: 12px;">请在编辑器中输入 SVG 代码</span>');
            previewContent.innerHTML = code;
        } catch (e) {
            previewContent.innerHTML = '<span style="color: var(--danger-color); font-size: 12px;">无效的 SVG 代码</span>';
        }
    }
    
    // 初始化拖动功能
    function initDragAndDrop() {
        const preview = document.getElementById('run-preview');
        preview.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        preview.addEventListener('touchstart', startDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', stopDrag);
    }
    
    // 开始拖动
    function startDrag(e) {
        const preview = document.getElementById('run-preview');
        isDragging = true;
        preview.classList.add('dragging');
        
        // 获取初始位置
        const rect = preview.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        // 根据事件类型获取起始坐标
        if (e.type === 'mousedown') {
            startX = e.clientX;
            startY = e.clientY;
        } else if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
        
        // 防止默认行为
        e.preventDefault();
    }
    
    // 拖动中
    function drag(e) {
        if (!isDragging) return;
    
        e.preventDefault();
        
        if (dragAnimationFrame) {
            cancelAnimationFrame(dragAnimationFrame);
        }
        
        dragAnimationFrame = requestAnimationFrame(() => {
            const preview = document.getElementById('run-preview');
            let currentX, currentY;
            
            // 根据事件类型获取当前坐标
            if (e.type === 'mousemove') {
                currentX = e.clientX;
                currentY = e.clientY;
            } else if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            }

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            // 限制在可视区域内，顶部最小距离为52px
            const maxLeft = window.innerWidth - preview.offsetWidth;
            const maxTop = window.innerHeight - preview.offsetHeight;
            const minTop = 52; // 顶部最小距离

            newLeft = Math.max(0, Math.min(maxLeft, newLeft));
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            preview.style.left = newLeft + 'px';
            preview.style.top = newTop + 'px';
            preview.style.right = 'auto';
            preview.style.bottom = 'auto';

            // 实时更新圆角
            updatePreviewBorderRadius();
        });
    }

    // 停止拖动
    function stopDrag() {
        if (!isDragging) return;

        if (dragAnimationFrame) {
            cancelAnimationFrame(dragAnimationFrame);
            dragAnimationFrame = null;
        }

        const preview = document.getElementById('run-preview');
        isDragging = false;
        preview.classList.remove('dragging');

        // 自动靠边
        autoSnapToEdge();
    }
    
    // 初始化悬浮窗位置
    function initPreviewPosition() {
        const preview = document.getElementById('run-preview');
        if (preview) {
            preview.style.top = '52px';
            preview.style.right = '0';
            preview.style.left = 'auto';
            preview.style.bottom = 'auto';
        }
    }
    
    // 悬浮窗圆角
    function updatePreviewBorderRadius() {
        const preview = document.getElementById('run-preview');
        const rect = preview.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const maxBorderRadius = 20;
        const transitionDistance = 100;
        
        // 计算距离边缘
        const distanceToLeft = rect.left;
        const distanceToRight = windowWidth - rect.right;
        
        // 根据距离计算左侧圆角
        const leftBorderRadius = Math.min(maxBorderRadius, Math.max(0, (distanceToLeft / transitionDistance) * maxBorderRadius));
        
        // 根据距离计算右侧圆角
        const rightBorderRadius = Math.min(maxBorderRadius, Math.max(0, (distanceToRight / transitionDistance) * maxBorderRadius));
        
        // 圆角实现平滑过渡
        preview.style.borderRadius = `${leftBorderRadius}px ${rightBorderRadius}px ${rightBorderRadius}px ${leftBorderRadius}px`;
    }
    
    // 自动靠边功能
    function autoSnapToEdge() {
        const preview = document.getElementById('run-preview');
        const rect = preview.getBoundingClientRect();
        const snapThreshold = 100;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        preview.classList.remove('snap-left', 'snap-right', 'snap-top', 'snap-bottom');

        // 左右自动靠边
        if (rect.left < snapThreshold) {
            preview.style.left = '0';
            preview.style.right = 'auto';
            preview.classList.add('snap-left');
        } else if (windowWidth - rect.right < snapThreshold) {
            preview.style.right = '0';
            preview.style.left = 'auto';
            preview.classList.add('snap-right');
        }

        // 上下自动靠边
        if (rect.top < snapThreshold) {
            preview.style.top = '52px';
            preview.style.bottom = 'auto';
            preview.classList.add('snap-top');
        } else if (windowHeight - rect.bottom < snapThreshold) {
            preview.style.bottom = '0';
            preview.style.top = 'auto';
            preview.classList.add('snap-bottom');
        }

        // 更新圆角
        updatePreviewBorderRadius();
    }

    // 初始化悬浮窗
    function initRunPreview() {
        initDragAndDrop();
        initPreviewPosition();
    }

    function handleCodeChange() {
        if (isUndoRedo) return;

        const code = codeMirrorEditor.getValue();
        undoStack.push(code);

        if (undoStack.length > 100) {
            undoStack.shift();
        }

        redoStack = [];
        hasUnsavedChanges = true;
        updatePreview();

        if (isRunPreviewVisible) {
            updateRunPreview();
        }
    }

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', function() {
        initRunPreview();
    });

    window.toggleRunPreview = toggleRunPreview;

    // 查找替换相关变量
    let findReplaceVisible = false;
    let currentFindIndex = 0;
    let findResults = [];
    let findTimeout = null;
    let replaceHistory = [];
    let replaceUndoLongPressTimer = null;
    const REPLACE_UNDO_LONG_PRESS_DURATION = 500;

    // 切换查找替换面板显示
    function toggleFindReplace() {
        const panel = document.getElementById('find-replace-panel');
        const header = document.querySelector('.editor__header');

        findReplaceVisible = !findReplaceVisible;

        if (findReplaceVisible) {
            panel.classList.add('show');
            header.style.display = 'none';
            document.getElementById('find-input').focus();
            history.pushState({ type: 'find-replace', page: currentPage }, '', window.location.href);
        } else {
            closeFindReplace();
        }
    }

    // 关闭查找替换面板
    function closeFindReplace() {
        const panel = document.getElementById('find-replace-panel');
        const header = document.querySelector('.editor__header');

        panel.classList.remove('show');
        header.style.display = 'flex';

        findReplaceVisible = false;
        clearHighlights();

        document.getElementById('find-input').value = '';
        document.getElementById('replace-input').value = '';
        document.getElementById('find-info').textContent = '';

        if (codeMirrorEditor) {
            codeMirrorEditor.focus();
        }
    }

    // 清除高亮
    function clearHighlights() {
        if (!codeMirrorEditor) return;

        const doc = codeMirrorEditor.getDoc();
        doc.eachLine(function(line) {
            const marked = line.markedSpans;
            if (marked) {
                for (let i = marked.length - 1; i >= 0; i--) {
                    if (marked[i].marker && marked[i].marker.className && marked[i].marker.className.includes('highlight')) {
                        marked[i].marker.clear();
                    }
                }
            }
        });

        findResults = [];
        currentFindIndex = 0;

        if (findTimeout) {
            clearTimeout(findTimeout);
            findTimeout = null;
        }
    }

    // 优化的查找文本添加防抖
    function findText() {
        if (!codeMirrorEditor) return;

        if (findTimeout) {
            clearTimeout(findTimeout);
            findTimeout = null;
        }

        findTimeout = setTimeout(function() {
            clearHighlights();

            const searchText = document.getElementById('find-input').value.trim();
            const infoEl = document.getElementById('find-info');

            if (!searchText) {
                infoEl.textContent = '';
                return;
            }

            const content = codeMirrorEditor.getValue();
            const regex = new RegExp(escapeRegExp(searchText), 'g');
            const matches = [...content.matchAll(regex)];

            if (matches.length === 0) {
                infoEl.textContent = `no "${searchText}"`;
                return;
            }

            findResults = matches.map(match => ({
                index: match.index,
                length: match[0].length
            }));

            highlightMatches();
            
            if (findResults.length > 0) {
                currentFindIndex = 0;
                jumpToMatch(currentFindIndex);
                infoEl.textContent = `${findResults.length}`;
            }
        }, 300);
    }

    // 高亮所有匹配项
    function highlightMatches() {
        if (!codeMirrorEditor || findResults.length === 0) return;

        const doc = codeMirrorEditor.getDoc();

        doc.eachLine(function(line) {
            const marked = line.markedSpans;
            if (marked) {
                for (let i = marked.length - 1; i >= 0; i--) {
                    if (marked[i].marker && marked[i].marker.className && marked[i].marker.className.includes('highlight')) {
                        marked[i].marker.clear();
                    }
                }
            }
        });

        findResults.forEach((result, index) => {
            const startPos = doc.posFromIndex(result.index);
            const endPos = doc.posFromIndex(result.index + result.length);

            const className = index === currentFindIndex ? 'highlight current' : 'highlight';
            doc.markText(startPos, endPos, {
                className: className,
                clearWhenEmpty: true
            });
        });
    }

    function jumpToMatch(index) {
        if (!codeMirrorEditor || findResults.length === 0) return;

        const result = findResults[index];
        const doc = codeMirrorEditor.getDoc();
        const startPos = doc.posFromIndex(result.index);
        const endPos = doc.posFromIndex(result.index + result.length);

        codeMirrorEditor.focus();
        codeMirrorEditor.setSelection(startPos, endPos);
        codeMirrorEditor.scrollIntoView(startPos, 100);

        currentFindIndex = index;

        highlightMatches();
        
        const infoEl = document.getElementById('find-info');
        infoEl.textContent = `${findResults.length} - ${index + 1} `;
    }

    // 查找下一个
    function findNext() {
        if (findResults.length === 0) {
            findText();
            return;
        }
        
        currentFindIndex = (currentFindIndex + 1) % findResults.length;
        jumpToMatch(currentFindIndex);
    }

    // 查找上一个
    function findPrev() {
        if (findResults.length === 0) {
            findText();
            return;
        }
        
        currentFindIndex = (currentFindIndex - 1 + findResults.length) % findResults.length;
        jumpToMatch(currentFindIndex);
    }

    // 替换当前匹配项
    function replaceText() {
        if (!codeMirrorEditor || findResults.length === 0) return;

        const searchText = document.getElementById('find-input').value.trim();
        const replaceText = document.getElementById('replace-input').value;

        if (!searchText) return;

        // 保存替换前的状态到历史记录
        const beforeText = codeMirrorEditor.getValue();
        replaceHistory.push(beforeText);

        const doc = codeMirrorEditor.getDoc();
        const result = findResults[currentFindIndex];
        const startPos = doc.posFromIndex(result.index);
        const endPos = doc.posFromIndex(result.index + result.length);

        doc.replaceRange(replaceText, startPos, endPos);

        const content = codeMirrorEditor.getValue();
        const regex = new RegExp(escapeRegExp(searchText), 'g');
        const matches = [...content.matchAll(regex)];

        findResults = matches.map(match => ({
            index: match.index,
            length: match[0].length
        }));

        if (findResults.length > 0) {
            currentFindIndex = Math.min(currentFindIndex, findResults.length - 1);
            highlightMatches();
            jumpToMatch(currentFindIndex);

            const infoEl = document.getElementById('find-info');
            infoEl.textContent = `${findResults.length} /`;
        } else {
            document.getElementById('find-info').textContent = `已替换 "${searchText}"`;
        }
    }

    // 替换所有匹配项
    function replaceAllText() {
        if (!codeMirrorEditor) return;

        const searchText = document.getElementById('find-input').value.trim();
        const replaceText = document.getElementById('replace-input').value;

        if (!searchText) return;

        const beforeText = codeMirrorEditor.getValue();
        replaceHistory.push(beforeText);

        const content = codeMirrorEditor.getValue();
        const newContent = content.split(searchText).join(replaceText);

        codeMirrorEditor.setValue(newContent);

        document.getElementById('find-info').textContent = `已将 "${searchText}" 全部替换为 "${replaceText}"`;

        clearHighlights();
        findText();
    }

    // 撤销替换操作（单击挨个撤销）
    function undoReplace() {
        if (!codeMirrorEditor || replaceHistory.length === 0) return;

        const previousContent = replaceHistory.pop();
        codeMirrorEditor.setValue(previousContent);

        // 重新查找以更新匹配结果
        clearHighlights();
        findText();

        document.getElementById('find-info').textContent = `已撤销替换`;
    }

    // 开始长按撤销计时器
    function startReplaceUndoLongPress() {
        cancelReplaceUndoLongPress();
        replaceUndoLongPressTimer = setTimeout(function() {
            // 一键撤销所有替换操作
            if (replaceHistory.length > 0) {
                const originalContent = replaceHistory[0];
                codeMirrorEditor.setValue(originalContent);
                replaceHistory = [];

                clearHighlights();
                findText();

                document.getElementById('find-info').textContent = `已一键撤销所有替换`;
            }
        }, REPLACE_UNDO_LONG_PRESS_DURATION);
    }

    // 取消长按撤销计时器
    function cancelReplaceUndoLongPress() {
        if (replaceUndoLongPressTimer) {
            clearTimeout(replaceUndoLongPressTimer);
            replaceUndoLongPressTimer = null;
        }
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 导出查找替换函数
    window.toggleFindReplace = toggleFindReplace;
    window.closeFindReplace = closeFindReplace;
    window.findText = findText;
    window.findNext = findNext;
    window.findPrev = findPrev;
    window.replaceText = replaceText;
    window.replaceAllText = replaceAllText;
    window.undoReplace = undoReplace;
    window.startReplaceUndoLongPress = startReplaceUndoLongPress;
    window.cancelReplaceUndoLongPress = cancelReplaceUndoLongPress;

    document.addEventListener('DOMContentLoaded', init);
})();
