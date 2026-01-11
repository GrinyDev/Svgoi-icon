(function() {
    'use strict';

    const SVG_TAGS = [
        { label: 'svg', snippet: 'svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  \n</svg>', description: 'SVG 根元素' },
        { label: 'rect', snippet: 'rect x="0" y="0" width="100" height="100"/>', description: '矩形元素' },
        { label: 'circle', snippet: 'circle cx="50" cy="50" r="50"/>', description: '圆形元素' },
        { label: 'ellipse', snippet: 'ellipse cx="50" cy="50" rx="40" ry="30"/>', description: '椭圆元素' },
        { label: 'line', snippet: 'line x1="0" y1="0" x2="100" y2="100"/>', description: '直线元素' },
        { label: 'polyline', snippet: 'polyline points="0,0 50,25 50,75 100,100"/>', description: '折线元素' },
        { label: 'polygon', snippet: 'polygon points="50,0 100,50 50,100 0,50"/>', description: '多边形元素' },
        { label: 'path', snippet: 'path d="M10 10 L90 10 L90 90 L10 90 Z"/>', description: '路径元素' },
        { label: 'text', snippet: 'text x="50" y="50" text-anchor="middle">Hello</text>', description: '文本元素' },
        { label: 'tspan', snippet: 'tspan x="50" dy="20">World</tspan>', description: '文本跨度元素' },
        { label: 'g', snippet: 'g>\n  \n</g>', description: '分组元素' },
        { label: 'defs', snippet: 'defs>\n  \n</defs>', description: '定义元素' },
        { label: 'use', snippet: 'use href="#id" x="0" y="0"/>', description: '引用元素' },
        { label: 'image', snippet: 'image href="image.png" x="0" y="0" width="100" height="100"/>', description: '图像元素' },
        { label: 'clipPath', snippet: 'clipPath id="clip">\n  \n</clipPath>', description: '裁剪路径元素' },
        { label: 'linearGradient', snippet: 'linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">\n  <stop offset="0%" stop-color="red"/>\n  <stop offset="100%" stop-color="blue"/>\n</linearGradient>', description: '线性渐变元素' },
        { label: 'radialGradient', snippet: 'radialGradient id="grad" cx="50%" cy="50%" r="50%">\n  <stop offset="0%" stop-color="red"/>\n  <stop offset="100%" stop-color="blue"/>\n</radialGradient>', description: '径向渐变元素' },
        { label: 'stop', snippet: 'stop offset="50%" stop-color="black"/>', description: '渐变停止点元素' },
        { label: 'pattern', snippet: 'pattern id="pattern" width="10" height="10" patternUnits="userSpaceOnUse">\n  \n</pattern>', description: '图案元素' },
        { label: 'mask', snippet: 'mask id="mask">\n  \n</mask>', description: '蒙版元素' },
        { label: 'filter', snippet: 'filter id="filter">\n  \n</filter>', description: '滤镜元素' },
        { label: 'feGaussianBlur', snippet: 'feGaussianBlur in="SourceGraphic" stdDeviation="5"/>', description: '高斯模糊元素' },
        { label: 'feOffset', snippet: 'feOffset in="SourceGraphic" dx="5" dy="5"/>', description: '偏移元素' },
        { label: 'feBlend', snippet: 'feBlend in="SourceGraphic" in2="SourceGraphic" mode="multiply"/>', description: '混合元素' },
        { label: 'animate', snippet: 'animate attributeName="opacity" from="1" to="0" dur="1s" repeatCount="indefinite"/>', description: '动画元素' },
        { label: 'animateTransform', snippet: 'animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite"/>', description: '变换动画元素' },
        { label: 'title', snippet: 'title>SVG Title</title>', description: '标题元素' },
        { label: 'desc', snippet: 'desc>SVG Description</desc>', description: '描述元素' }
    ];

    const SVG_ATTRIBUTES = [
        { label: 'xmlns', snippet: 'xmlns="http://www.w3.org/2000/svg"', description: 'SVG 命名空间' },
        { label: 'viewBox', snippet: 'viewBox="0 0 100 100"', description: '视口' },
        { label: 'width', snippet: 'width="100"', description: '宽度' },
        { label: 'height', snippet: 'height="100"', description: '高度' },
        { label: 'x', snippet: 'x="0"', description: 'X坐标' },
        { label: 'y', snippet: 'y="0"', description: 'Y坐标' },
        { label: 'cx', snippet: 'cx="50"', description: '圆心X坐标' },
        { label: 'cy', snippet: 'cy="50"', description: '圆心Y坐标' },
        { label: 'r', snippet: 'r="50"', description: '半径' },
        { label: 'rx', snippet: 'rx="10"', description: '圆角X半径' },
        { label: 'ry', snippet: 'ry="10"', description: '圆角Y半径' },
        { label: 'x1', snippet: 'x1="0"', description: '起点X坐标' },
        { label: 'y1', snippet: 'y1="0"', description: '起点Y坐标' },
        { label: 'x2', snippet: 'x2="100"', description: '终点X坐标' },
        { label: 'y2', snippet: 'y2="100"', description: '终点Y坐标' },
        { label: 'points', snippet: 'points="0,0 100,0 100,100"', description: '点坐标' },
        { label: 'd', snippet: 'd="M0 0 L100 0 L100 100 Z"', description: '路径数据' },
        { label: 'fill', snippet: 'fill="black"', description: '填充颜色' },
        { label: 'stroke', snippet: 'stroke="black"', description: '描边颜色' },
        { label: 'stroke-width', snippet: 'stroke-width="1"', description: '描边宽度' },
        { label: 'stroke-linecap', snippet: 'stroke-linecap="round"', description: '线帽样式' },
        { label: 'stroke-linejoin', snippet: 'stroke-linejoin="round"', description: '线连接样式' },
        { label: 'fill-opacity', snippet: 'fill-opacity="0.5"', description: '填充透明度' },
        { label: 'stroke-opacity', snippet: 'stroke-opacity="0.5"', description: '描边透明度' },
        { label: 'opacity', snippet: 'opacity="0.5"', description: '整体透明度' },
        { label: 'transform', snippet: 'transform="rotate(45)"', description: '变换' },
        { label: 'id', snippet: 'id="element"', description: '元素ID' },
        { label: 'class', snippet: 'class="cls"', description: 'CSS类名' },
        { label: 'style', snippet: 'style="color: black"', description: '内联样式' },
        { label: 'href', snippet: 'href="#id"', description: '链接引用' },
        { label: 'clip-path', snippet: 'clip-path="url(#clip)"', description: '裁剪路径' },
        { label: 'mask', snippet: 'mask="url(#mask)"', description: '蒙版' },
        { label: 'filter', snippet: 'filter="url(#filter)"', description: '滤镜' },
        { label: 'gradientUnits', snippet: 'gradientUnits="userSpaceOnUse"', description: '渐变单位' },
        { label: 'offset', snippet: 'offset="50%"', description: '渐变偏移' },
        { label: 'stop-color', snippet: 'stop-color="black"', description: '渐变颜色' },
        { label: 'stop-opacity', snippet: 'stop-opacity="0.5"', description: '渐变透明度' },
        { label: 'dx', snippet: 'dx="10"', description: 'X偏移' },
        { label: 'dy', snippet: 'dy="10"', description: 'Y偏移' },
        { label: 'text-anchor', snippet: 'text-anchor="middle"', description: '文本对齐' },
        { label: 'dominant-baseline', snippet: 'dominant-baseline="middle"', description: '基线对齐' },
        { label: 'font-size', snippet: 'font-size="16"', description: '字体大小' },
        { label: 'font-family', snippet: 'font-family="Arial"', description: '字体' },
        { label: 'font-weight', snippet: 'font-weight="bold"', description: '字重' },
        { label: 'text-decoration', snippet: 'text-decoration="underline"', description: '文本装饰' },
        { label: 'in', snippet: 'in="SourceGraphic"', description: '滤镜输入' },
        { label: 'in2', snippet: 'in2="SourceAlpha"', description: '滤镜第二个输入' },
        { label: 'mode', snippet: 'mode="multiply"', description: '混合模式' },
        { label: 'stdDeviation', snippet: 'stdDeviation="5"', description: '标准差' },
        { label: 'type', snippet: 'type="rotate"', description: '变换类型' },
        { label: 'from', snippet: 'from="0"', description: '起始值' },
        { label: 'to', snippet: 'to="1"', description: '结束值' },
        { label: 'dur', snippet: 'dur="1s"', description: '持续时间' },
        { label: 'repeatCount', snippet: 'repeatCount="indefinite"', description: '重复次数' },
        { label: 'begin', snippet: 'begin="0s"', description: '开始时间' },
        { label: 'fill', snippet: 'fill="freeze"', description: '填充方式' },
        { label: 'calcMode', snippet: 'calcMode="spline"', description: '计算模式' },
        { label: 'keyTimes', snippet: 'keyTimes="0;1"', description: '关键时间' },
        { label: 'values', snippet: 'values="0;1"', description: '值列表' }
    ];

    const CHINESE_TO_ENGLISH = {
        '直线': 'line',
        '直线元素': 'line',
        '矩形': 'rect',
        '矩形元素': 'rect',
        '圆形': 'circle',
        '圆形元素': 'circle',
        '椭圆': 'ellipse',
        '椭圆元素': 'ellipse',
        '折线': 'polyline',
        '折线元素': 'polyline',
        '多边形': 'polygon',
        '多边形元素': 'polygon',
        '路径': 'path',
        '路径元素': 'path',
        '文本': 'text',
        '文本元素': 'text',
        '文本跨度': 'tspan',
        '文本跨度元素': 'tspan',
        '分组': 'g',
        '分组元素': 'g',
        '定义': 'defs',
        '定义元素': 'defs',
        '引用': 'use',
        '引用元素': 'use',
        '图像': 'image',
        '图像元素': 'image',
        '裁剪路径': 'clipPath',
        '裁剪路径元素': 'clipPath',
        '线性渐变': 'linearGradient',
        '线性渐变元素': 'linearGradient',
        '径向渐变': 'radialGradient',
        '径向渐变元素': 'radialGradient',
        '渐变停止点': 'stop',
        '渐变停止点元素': 'stop',
        '图案': 'pattern',
        '图案元素': 'pattern',
        '蒙版': 'mask',
        '蒙版元素': 'mask',
        '滤镜': 'filter',
        '滤镜元素': 'filter',
        '高斯模糊': 'feGaussianBlur',
        '高斯模糊元素': 'feGaussianBlur',
        '偏移': 'feOffset',
        '偏移元素': 'feOffset',
        '混合': 'feBlend',
        '混合元素': 'feBlend',
        '动画': 'animate',
        '动画元素': 'animate',
        '变换动画': 'animateTransform',
        '变换动画元素': 'animateTransform',
        '标题': 'title',
        '标题元素': 'title',
        '描述': 'desc',
        '描述元素': 'desc',
        
        '宽度': 'width',
        '高度': 'height',
        'X坐标': 'x',
        'Y坐标': 'y',
        '圆心X': 'cx',
        '圆心Y': 'cy',
        '半径': 'r',
        '圆角X': 'rx',
        '圆角Y': 'ry',
        '起点X': 'x1',
        '起点Y': 'y1',
        '终点X': 'x2',
        '终点Y': 'y2',
        '点': 'points',
        '点坐标': 'points',
        '路径数据': 'd',
        '填充': 'fill',
        '填充颜色': 'fill',
        '描边': 'stroke',
        '描边颜色': 'stroke',
        '描边宽度': 'stroke-width',
        '线帽': 'stroke-linecap',
        '线帽样式': 'stroke-linecap',
        '线连接': 'stroke-linejoin',
        '线连接样式': 'stroke-linejoin',
        '填充透明度': 'fill-opacity',
        '描边透明度': 'stroke-opacity',
        '透明度': 'opacity',
        '变换': 'transform',
        'ID': 'id',
        '元素ID': 'id',
        '类名': 'class',
        'CSS类名': 'class',
        '样式': 'style',
        '内联样式': 'style',
        '链接': 'href',
        '链接引用': 'href',
        '裁剪': 'clip-path',
        '裁剪路径': 'clip-path',
        '蒙版': 'mask',
        '滤镜': 'filter',
        '渐变单位': 'gradientUnits',
        '偏移量': 'offset',
        '渐变偏移': 'offset',
        '渐变颜色': 'stop-color',
        '渐变透明度': 'stop-opacity',
        'X偏移': 'dx',
        'Y偏移': 'dy',
        '文本对齐': 'text-anchor',
        '基线对齐': 'dominant-baseline',
        '字体大小': 'font-size',
        '字体': 'font-family',
        '字重': 'font-weight',
        '文本装饰': 'text-decoration',
        '输入': 'in',
        '输入2': 'in2',
        '模式': 'mode',
        '混合模式': 'mode',
        '标准差': 'stdDeviation',
        '类型': 'type',
        '变换类型': 'type',
        '从': 'from',
        '起始值': 'from',
        '到': 'to',
        '结束值': 'to',
        '持续时间': 'dur',
        '重复次数': 'repeatCount',
        '开始时间': 'begin',
        '填充方式': 'fill',
        '计算模式': 'calcMode',
        '关键时间': 'keyTimes',
        '值列表': 'values',
        
        '红色': 'red',
        '黑色': 'black',
        '白色': 'white',
        '蓝色': 'blue',
        '绿色': 'green',
        '黄色': 'yellow',
        '橙色': 'orange',
        '紫色': 'purple',
        '灰色': 'gray',
        '灰色': 'grey',
        '粉色': 'pink',
        '棕色': 'brown',
        '青色': 'cyan',
        '品红': 'magenta',
        '透明': 'transparent'
    };

    let autocompletePopup = null;
    let selectedIndex = -1;
    let currentCompletions = [];
    let isVisible = false;
    let codeMirrorEditor = null;
    let lastTriggerText = '';
    let debounceTimer = null;

    function createAutocompletePopup() {
        if (autocompletePopup) return;

        autocompletePopup = document.createElement('div');
        autocompletePopup.className = 'autocomplete-popup';
        autocompletePopup.style.display = 'none';
        document.body.appendChild(autocompletePopup);
    }

    function showAutocomplete(completions, cursorCoords) {
        if (!completions || completions.length === 0) {
            hideAutocomplete();
            return;
        }

        currentCompletions = completions;
        selectedIndex = 0;

        renderCompletions();

        const editorElement = document.querySelector('.editor__code-wrapper');
        if (editorElement) {
            const rect = editorElement.getBoundingClientRect();
            const maxWidth = Math.min(350, rect.width - 40);
            autocompletePopup.style.maxWidth = maxWidth + 'px';

            const popupHeight = autocompletePopup.offsetHeight || 250;
            const popupWidth = autocompletePopup.offsetWidth || 200;
            const margin = 10;

            let top = cursorCoords.top + 25;
            let left = cursorCoords.left;

            if (top + popupHeight > window.innerHeight - margin) {
                top = cursorCoords.top - popupHeight - margin;
            }

            if (top < margin) {
                top = cursorCoords.bottom + margin;
            }

            if (left + popupWidth > window.innerWidth - margin) {
                left = window.innerWidth - popupWidth - margin;
            }

            if (left < margin) {
                left = margin;
            }

            if (top < rect.top) {
                top = rect.top;
            }
            if (left < rect.left) {
                left = rect.left;
            }
            if (left + popupWidth > rect.right) {
                left = rect.right - popupWidth;
            }

            autocompletePopup.style.top = top + 'px';
            autocompletePopup.style.left = left + 'px';
        }

        autocompletePopup.style.display = 'block';
        isVisible = true;
    }

    function renderCompletions() {
        if (!autocompletePopup) return;

        autocompletePopup.innerHTML = currentCompletions.map((completion, index) => {
            const isSelected = index === selectedIndex;
            return '<div class="autocomplete-item ' + (isSelected ? 'selected' : '') + '" data-index="' + index + '">' +
                '<span class="autocomplete-label">' + escapeHtml(completion.label) + '</span>' +
                '<span class="autocomplete-description">' + escapeHtml(completion.description) + '</span>' +
                '</div>';
        }).join('');

        const items = autocompletePopup.querySelectorAll('.autocomplete-item');
        items.forEach(function(item) {
            item.addEventListener('click', function() {
                const index = parseInt(item.dataset.index);
                selectCompletion(index);
            });

            item.addEventListener('mouseenter', function() {
                selectedIndex = parseInt(item.dataset.index);
                updateSelection();
            });
        });
    }

    function updateSelection() {
        const items = autocompletePopup.querySelectorAll('.autocomplete-item');
        items.forEach(function(item, index) {
            item.classList.toggle('selected', index === selectedIndex);
        });

        if (isVisible && selectedIndex >= 0 && selectedIndex < currentCompletions.length) {
            const selectedItem = items[selectedIndex];
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    function hideAutocomplete() {
        if (autocompletePopup) {
            autocompletePopup.style.display = 'none';
        }
        isVisible = false;
        currentCompletions = [];
        selectedIndex = -1;
    }

    function selectCompletion(index) {
        if (index < 0 || index >= currentCompletions.length) return;

        const completion = currentCompletions[index];
        insertCompletion(completion);
        hideAutocomplete();
    }

    function insertCompletion(completion) {
        if (!codeMirrorEditor) return;

        const doc = codeMirrorEditor.getDoc();
        const cursor = doc.getCursor();
        const line = doc.getLine(cursor.line);
        const lineStart = line.substring(0, cursor.ch);
        const lineEnd = line.substring(cursor.ch);

        let insertText = completion.snippet;
        let startPos = cursor;
        let endPos = cursor;

        // 检查光标前的内容
        const lastChar = lineStart.charAt(lineStart.length - 1);
        const wordMatch = lineStart.match(/([\u4e00-\u9fa5a-zA-Z0-9_]+)$/);
        
        // 判断是否为元素标签
        const isElement = completion.snippet.indexOf('/>') !== -1 || 
                         (completion.snippet.indexOf('>') !== -1 && completion.snippet.indexOf('</') !== -1);
        
        // 检查光标前的内容中是否已经包含 <
        const hasOpeningBracket = lineStart.lastIndexOf('<') > -1;
        
        if (wordMatch) {
            // 中英文单词输入替换整个单词
            const word = wordMatch[0];
            const wordStart = lineStart.length - word.length;
            
            startPos = { line: cursor.line, ch: wordStart };
            endPos = { line: cursor.line, ch: cursor.ch };
            
            if (isElement && insertText.indexOf('<') !== 0 && !hasOpeningBracket) {
                insertText = '<' + insertText;
            }
        } else if (lastChar === '<') {
            startPos = { line: cursor.line, ch: cursor.ch };
        } else if (lastChar === '/') {
            insertText = completion.label + '>';
            startPos = { line: cursor.line, ch: cursor.ch };
        } else {
            // 直接插入
            startPos = cursor;
            
            if (isElement && insertText.indexOf('<') !== 0 && !hasOpeningBracket) {
                insertText = '<' + insertText;
            }
        }

        // 执行替换
        if (startPos.ch !== endPos.ch || startPos.line !== endPos.line) {
            doc.replaceRange(insertText, startPos, endPos);
        } else {
            doc.replaceRange(insertText, startPos);
        }

        const currentCursor = doc.getCursor();
        const currentLine = doc.getLine(currentCursor.line);
        
        // 查找第一个引号对
        const firstQuote = currentLine.indexOf('"', startPos.ch);
        if (firstQuote !== -1) {
            const nextQuote = currentLine.indexOf('"', firstQuote + 1);
            if (nextQuote !== -1) {
                doc.setSelection(
                    { line: currentCursor.line, ch: firstQuote + 1 },
                    { line: currentCursor.line, ch: nextQuote }
                );
                codeMirrorEditor.focus();
                return;
            }
        }
        
        // 查找单引号对
        const firstSingleQuote = currentLine.indexOf("'", startPos.ch);
        if (firstSingleQuote !== -1) {
            const nextSingleQuote = currentLine.indexOf("'", firstSingleQuote + 1);
            if (nextSingleQuote !== -1) {
                doc.setSelection(
                    { line: currentCursor.line, ch: firstSingleQuote + 1 },
                    { line: currentCursor.line, ch: nextSingleQuote }
                );
                codeMirrorEditor.focus();
                return;
            }
        }

        // 没有引号则保持在插入位置末尾
        doc.setCursor(codeMirrorEditor.getCursor());
        codeMirrorEditor.focus();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getTriggerText(line, cursorPos) {
        let text = '';

        for (let i = cursorPos - 1; i >= 0; i--) {
            const char = line[i];
            if (char === '<' || char === '/' || char === ' ' || char === '\t') {
                if (char === '<' || char === '/') {
                    text = char + text;
                }
                break;
            }
            if (/[\u4e00-\u9fa5a-zA-Z0-9_-]/.test(char)) {
                text = char + text;
            } else {
                break;
            }
        }

        if (text.length === 0) {
            const lastWordMatch = line.substring(0, cursorPos).match(/([\u4e00-\u9fa5a-zA-Z0-9_-]+)$/);
            if (lastWordMatch) {
                text = lastWordMatch[1];
            }
        }

        return text;
    }

    function getCompletionsForTrigger(trigger) {
        if (!trigger || trigger.length === 0) {
            return [];
        }

        const line = codeMirrorEditor.getDoc().getLine(codeMirrorEditor.getCursor().line);
        const cursorPos = codeMirrorEditor.getCursor().ch;
        const beforeCursor = line.substring(0, cursorPos);
        const quoteMatch = beforeCursor.match(/([a-zA-Z-]+)="([^"]*)$/);
        
        if (quoteMatch) {
            const attrName = quoteMatch[1];
            const currentText = quoteMatch[2];
            
            if (['fill', 'stroke', 'stop-color', 'color'].includes(attrName)) {
                const colorCompletions = [];
                for (const [chinese, english] of Object.entries(CHINESE_TO_ENGLISH)) {
                    if (/^(红色|黑色|白色|蓝色|绿色|黄色|橙色|紫色|灰色|粉色|棕色|青色|品红|透明)$/.test(chinese)) {
                        if (chinese.indexOf(currentText) === 0) {
                            colorCompletions.push({
                                label: chinese,
                                snippet: english,
                                description: english + ' 颜色'
                            });
                        }
                    }
                }
                return colorCompletions;
            }
        }

        const hasChinese = /[\u4e00-\u9fa5]/.test(trigger);
        
        if (hasChinese) {
            let englishTerm = CHINESE_TO_ENGLISH[trigger];
            
            if (englishTerm) {
                const elementMatch = SVG_TAGS.find(tag => tag.label === englishTerm);
                if (elementMatch) {
                    return [elementMatch];
                }
                const attrMatch = SVG_ATTRIBUTES.find(attr => attr.label === englishTerm);
                if (attrMatch) {
                    return [attrMatch];
                }
            } else {
                const matchingCompletions = [];
                for (const [chinese, english] of Object.entries(CHINESE_TO_ENGLISH)) {
                    if (chinese.indexOf(trigger) === 0) {
                        const elementMatch = SVG_TAGS.find(tag => tag.label === english);
                        if (elementMatch) {
                            matchingCompletions.push({
                                label: chinese,
                                snippet: elementMatch.snippet,
                                description: elementMatch.description
                            });
                        }
                        const attrMatch = SVG_ATTRIBUTES.find(attr => attr.label === english);
                        if (attrMatch) {
                            matchingCompletions.push({
                                label: chinese,
                                snippet: attrMatch.snippet,
                                description: attrMatch.description
                            });
                        }
                    }
                }
                return matchingCompletions.slice(0, 15);
            }
        }

        const lowerTrigger = trigger.toLowerCase();

        if (trigger === '<') {
            return SVG_TAGS;
        }

        if (trigger.charAt(0) === '<') {
            const tagName = trigger.substring(1).toLowerCase();
            if (tagName.length === 0) {
                return SVG_TAGS;
            }
            return SVG_TAGS.filter(function(tag) {
                return tag.label.toLowerCase().indexOf(tagName) === 0;
            });
        }

        if (trigger.charAt(0) === '/') {
            const tagName = trigger.substring(1).toLowerCase();
            return SVG_TAGS.filter(function(tag) {
                return tag.label.toLowerCase().indexOf(tagName) === 0;
            });
        }

        if (/^[a-zA-Z]+$/.test(trigger)) {
            const matchingTags = SVG_TAGS.filter(function(tag) {
                return tag.label.toLowerCase().indexOf(lowerTrigger) === 0;
            });
            const matchingAttrs = SVG_ATTRIBUTES.filter(function(attr) {
                return attr.label.toLowerCase().indexOf(lowerTrigger) === 0;
            });
            return matchingTags.concat(matchingAttrs).slice(0, 15);
        }

        return [];
    }

    function handleInput() {
        if (!codeMirrorEditor) return;

        const doc = codeMirrorEditor.getDoc();
        const cursor = doc.getCursor();
        const line = doc.getLine(cursor.line);
        const beforeCursor = line.substring(0, cursor.ch);
        const afterCursor = line.substring(cursor.ch);
        const trigger = getTriggerText(line, cursor.ch);

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // 立即隐藏补全提示如果没有触发词
        if (trigger.length === 0) {
            hideAutocomplete();
            return;
        }

        debounceTimer = setTimeout(function() {
            const completions = getCompletionsForTrigger(trigger);
            
            if (completions.length > 0) {
                const coords = codeMirrorEditor.cursorCoords(true);
                showAutocomplete(completions, coords);
            } else {
                hideAutocomplete();
            }
        }, 50);
    }

    function handleKeyDown(cm, event) {
        if (!isVisible) {
            return CodeMirror.PASS;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentCompletions.length - 1);
                updateSelection();
                return CodeMirror.Pass;

            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateSelection();
                return CodeMirror.Pass;

            case 'Enter':
            case 'Tab':
                event.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < currentCompletions.length) {
                    selectCompletion(selectedIndex);
                }
                return CodeMirror.Pass;

            case 'Escape':
                event.preventDefault();
                hideAutocomplete();
                return CodeMirror.Pass;

            default:
                return CodeMirror.Pass;
        }
    }

    function initAutocomplete(editor) {
        codeMirrorEditor = editor;
        createAutocompletePopup();

        editor.on('inputRead', function(cm, change) {
            handleInput();
        });
        
        editor.on('change', function(cm, change) {
            if (change.remove && change.remove.length > 0) {
                hideAutocomplete();
            } else if (change.text && change.text.length > 0 && change.text[0] !== '') {
                handleInput();
            } else {
                handleInput();
            }
        });

        // 监听键盘事件 - 针对讯飞输入法
        editor.on('keydown', handleKeyDown);
        
        document.addEventListener('click', function(e) {
            if (isVisible && 
                !e.target.closest('.autocomplete-popup') && 
                !e.target.closest('.CodeMirror')) {
                hideAutocomplete();
            }
        });
    }

    window.initAutocomplete = initAutocomplete;

    document.addEventListener('DOMContentLoaded', function() {
        createAutocompletePopup();
    });
})();
