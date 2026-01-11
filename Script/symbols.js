(function() {
    'use strict';

    // 符号模板定义
    const symbolTemplates = {
        lt: '<',
        gt: '>',
        slash: '/',
        exclam: '!',
        equal: '=',
        quote: '"',
        apostrophe: "'",
        lparen: '(',
        rparen: ')',
        lbrack: '[',
        rbrack: ']',
        lbrace: '{',
        rbrace: '}',
        colon: ':',
        semicolon: ';',
        comma: ',',
        dot: '.',
        minus: '-',
        plus: '+',
        star: '*',
        hash: '#',
        at: '@',
        save: 'save',
        run: 'run'
    };

    // 符号数据数组
    const symbols = [
        { type: 'lt', tag: '&lt;', desc: '左尖括号' },
        { type: 'gt', tag: '&gt;', desc: '右尖括号' },
        { type: 'slash', tag: '/', desc: '斜杠' },
        { type: 'exclam', tag: '!', desc: '感叹号' },
        { type: 'equal', tag: '=', desc: '等号' },
        { type: 'quote', tag: '&quot;', desc: '双引号' },
        { type: 'apostrophe', tag: '&apos;', desc: '单引号' },
        { type: 'lparen', tag: '(', desc: '左圆括号' },
        { type: 'rparen', tag: ')', desc: '右圆括号' },
        { type: 'lbrack', tag: '[', desc: '左方括号' },
        { type: 'rbrack', tag: ']', desc: '右方括号' },
        { type: 'lbrace', tag: '{', desc: '左花括号' },
        { type: 'rbrace', tag: '}', desc: '右花括号' },
        { type: 'colon', tag: ':', desc: '冒号' },
        { type: 'semicolon', tag: ';', desc: '分号' },
        { type: 'comma', tag: ',', desc: '逗号' },
        { type: 'dot', tag: '.', desc: '点' },
        { type: 'minus', tag: '-', desc: '减号' },
        { type: 'plus', tag: '+', desc: '加号' },
        { type: 'star', tag: '*', desc: '星号' },
        { type: 'hash', tag: '#', desc: '井号' },
        { type: 'at', tag: '@', desc: '@符号' },
        { type: 'save', tag: '❏', desc: '保存' }, // 特殊符号可选择要与不要
        { type: 'run', tag: '▶', desc: '运行' } // 特殊符号可选择要与不要
    ];

    // 生成符号栏
    function generateSymbols() {
        const container = document.querySelector('.editor__symbols-grid');
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 生成符号按钮
        symbols.forEach(symbol => {
            const button = document.createElement('button');
            button.className = 'symbol-btn';
            button.innerHTML = `
                <span class="symbol-btn__tag">${symbol.tag}</span>
                <span class="symbol-btn__desc">${symbol.desc}</span>
            `;
            button.addEventListener('click', () => insertSymbol(symbol.type));
            container.appendChild(button);
        });
    }

    // 插入符号到编辑器或执行功能
    function insertSymbol(type) {
        // 处理特殊功能符号
        switch (type) {
            case 'save':
                if (typeof window.saveProject === 'function') {
                    window.saveProject();
                } else {
                    console.error('saveProject function not found');
                }
                return;
            case 'run':
                if (typeof window.toggleRunPreview === 'function') {
                    window.toggleRunPreview();
                } else {
                    console.error('toggleRunPreview function not found');
                }
                return;
            default:
                // 处理普通符号插入
                if (typeof window.insertSymbol === 'function') {
                    window.insertSymbol(type);
                } else {
                    console.error('insertSymbol function not found');
                }
        }
    }

    // 导出符号模板和函数
    window.symbolTemplates = symbolTemplates;
    window.generateSymbols = generateSymbols;

    // 上滑改变符号栏高度功能
    function initSymbolBarResize() {
        const symbolsContainer = document.querySelector('.editor__symbols');
        const resizer = document.querySelector('.editor__symbols-resizer');
        
        if (!symbolsContainer || !resizer) return;
        
        const DEFAULT_HEIGHT = 30;
        const EXPAND_THRESHOLD = 60;
        const SENSITIVITY = 10;
        const DIRECTION_THRESHOLD = 0.5;
        
        let isResizing = false;
        let isVerticalDrag = false;
        let startX = 0;
        let startY = 0;
        let startHeight = 0;
        let hasMoved = false;
        
        // 更新布局状态
        function updateLayoutState(height) {
            if (height > EXPAND_THRESHOLD) {
                symbolsContainer.classList.add('expanded');
            } else {
                symbolsContainer.classList.remove('expanded');
                symbolsContainer.style.height = DEFAULT_HEIGHT + 'px';
            }
        }
        
        // 开始调整
        function startResize(e) {
            isResizing = true;
            isVerticalDrag = false;
            hasMoved = false;
            startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            startHeight = parseInt(window.getComputedStyle(symbolsContainer).height);
            document.body.style.userSelect = 'none';
            
            symbolsContainer.classList.add('resizing');
        }
        
        // 处理移动
        function handleMove(e) {
            if (!isResizing) return;
            
            const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            const deltaX = currentX - startX;
            const deltaY = startY - currentY;
            
            if (Math.abs(deltaX) > SENSITIVITY || Math.abs(deltaY) > SENSITIVITY) {
                hasMoved = true;
            }
            
            if (hasMoved) {
                const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (!isVerticalDrag) {
                    if (totalDistance > SENSITIVITY) {
                        const verticalRatio = Math.abs(deltaY) / totalDistance;
                        isVerticalDrag = verticalRatio > DIRECTION_THRESHOLD;
                        
                        if (isVerticalDrag) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                }
                
                if (isVerticalDrag) {
                    let newHeight = startHeight + deltaY;
                    
                    // 限制高度范围
                    newHeight = Math.max(DEFAULT_HEIGHT, Math.min(75, newHeight));
                    
                    // 使用requestAnimationFrame确保流畅
                    requestAnimationFrame(() => {
                        symbolsContainer.style.height = newHeight + 'px';
                        updateLayoutState(newHeight);
                    });
                } else {
                    // 水平滑动时，移除调整状态，允许正常滚动
                    symbolsContainer.classList.remove('resizing');
                }
            }
        }
        
        // 结束调整
        function endResize() {
            if (!isResizing) return;
            
            isResizing = false;
            isVerticalDrag = false;
            document.body.style.userSelect = '';
            symbolsContainer.classList.remove('resizing');
            
            // 结束时再次检查状态
            const finalHeight = parseInt(window.getComputedStyle(symbolsContainer).height);
            updateLayoutState(finalHeight);
        }
        
        // 点击事件处理 - 用于区分点击和滑动
        function handleClick(e) {
            if (hasMoved) {
                e.stopPropagation();
                e.preventDefault();
                return;
            }
            
            if (e.target.closest && e.target.closest('.symbol-btn')) {
                return;
            }
            
            // 点击切换展开/收起状态
            if (symbolsContainer.classList.contains('expanded')) {
                symbolsContainer.classList.remove('expanded');
                symbolsContainer.style.height = DEFAULT_HEIGHT + 'px';
            } else {
                symbolsContainer.classList.add('expanded');
                symbolsContainer.style.height = 'auto';
            }
        }
        
        symbolsContainer.addEventListener('touchstart', (e) => {
            startResize(e);
        });
        
        symbolsContainer.addEventListener('mousedown', (e) => {
            startResize(e);
        });
        
        symbolsContainer.addEventListener('touchmove', handleMove, { passive: false });
        symbolsContainer.addEventListener('mousemove', handleMove);
        
        // 绑定结束事件
        symbolsContainer.addEventListener('touchend', (e) => {
            endResize();
            if (!hasMoved || !isVerticalDrag) {
                setTimeout(() => handleClick(e), 50);
            }
        });
        
        symbolsContainer.addEventListener('mouseup', (e) => {
            endResize();
            if (!hasMoved || !isVerticalDrag) {
                setTimeout(() => handleClick(e), 50);
            }
        });
        
        symbolsContainer.addEventListener('mouseleave', () => {
            endResize();
        });
        
        symbolsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.symbol-btn') && !hasMoved) {
                symbolsContainer.classList.remove('resizing');
                return;
            }
            
            if (e.target !== symbolsContainer && e.target !== resizer) {
                e.stopPropagation();
            }
        }, true);
    }
    
    // 页面加载完成后生成符号栏并初始化调整功能
    document.addEventListener('DOMContentLoaded', () => {
        generateSymbols();
        initSymbolBarResize();
    });
})();
