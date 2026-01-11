// 颜色填充插件
(function() {
    'use strict';

    // 颜色映射 - 可添加更多或换个逻辑 - 嫌麻烦的不用管直接用
    const colorNames = {
        'aliceblue': '#f0f8ff',
        'antiquewhite': '#faebd7',
        'aqua': '#00ffff',
        'aquamarine': '#7fffd4',
        'azure': '#f0ffff',
        'beige': '#f5f5dc',
        'bisque': '#ffe4c4',
        'black': '#000000',
        'blanchedalmond': '#ffebcd',
        'blue': '#0000ff',
        'blueviolet': '#8a2be2',
        'brown': '#a52a2a',
        'burlywood': '#deb887',
        'cadetblue': '#5f9ea0',
        'chartreuse': '#7fff00',
        'chocolate': '#d2691e',
        'coral': '#ff7f50',
        'cornflowerblue': '#6495ed',
        'cornsilk': '#fff8dc',
        'crimson': '#dc143c',
        'cyan': '#00ffff',
        'darkblue': '#00008b',
        'darkcyan': '#008b8b',
        'darkgoldenrod': '#b8860b',
        'darkgray': '#a9a9a9',
        'darkgreen': '#006400',
        'darkkhaki': '#bdb76b',
        'darkmagenta': '#8b008b',
        'darkolivegreen': '#556b2f',
        'darkorange': '#ff8c00',
        'darkorchid': '#9932cc',
        'darkred': '#8b0000',
        'darksalmon': '#e9967a',
        'darkseagreen': '#8fbc8f',
        'darkslateblue': '#483d8b',
        'darkslategray': '#2f4f4f',
        'darkturquoise': '#00ced1',
        'darkviolet': '#9400d3',
        'deeppink': '#ff1493',
        'deepskyblue': '#00bfff',
        'dimgray': '#696969',
        'dodgerblue': '#1e90ff',
        'firebrick': '#b22222',
        'floralwhite': '#fffaf0',
        'forestgreen': '#228b22',
        'fuchsia': '#ff00ff',
        'gainsboro': '#dcdcdc',
        'ghostwhite': '#f8f8ff',
        'gold': '#ffd700',
        'goldenrod': '#daa520',
        'gray': '#808080',
        'green': '#008000',
        'greenyellow': '#adff2f',
        'honeydew': '#f0fff0',
        'hotpink': '#ff69b4',
        'indianred': '#cd5c5c',
        'indigo': '#4b0082',
        'ivory': '#fffff0',
        'khaki': '#f0e68c',
        'lavender': '#e6e6fa',
        'lavenderblush': '#fff0f5',
        'lawngreen': '#7cfc00',
        'lemonchiffon': '#fffacd',
        'lightblue': '#add8e6',
        'lightcoral': '#f08080',
        'lightcyan': '#e0ffff',
        'lightgoldenrodyellow': '#fafad2',
        'lightgray': '#d3d3d3',
        'lightgreen': '#90ee90',
        'lightpink': '#ffb6c1',
        'lightsalmon': '#ffa07a',
        'lightseagreen': '#20b2aa',
        'lightskyblue': '#87cefa',
        'lightslategray': '#778899',
        'lightsteelblue': '#b0c4de',
        'lightyellow': '#ffffe0',
        'lime': '#00ff00',
        'limegreen': '#32cd32',
        'linen': '#faf0e6',
        'magenta': '#ff00ff',
        'maroon': '#800000',
        'mediumaquamarine': '#66cdaa',
        'mediumblue': '#0000cd',
        'mediumorchid': '#ba55d3',
        'mediumpurple': '#9370db',
        'mediumseagreen': '#3cb371',
        'mediumslateblue': '#7b68ee',
        'mediumspringgreen': '#00fa9a',
        'mediumturquoise': '#48d1cc',
        'mediumvioletred': '#c71585',
        'midnightblue': '#191970',
        'mintcream': '#f5fffa',
        'mistyrose': '#ffe4e1',
        'moccasin': '#ffe4b5',
        'navajowhite': '#ffdead',
        'navy': '#000080',
        'oldlace': '#fdf5e6',
        'olive': '#808000',
        'olivedrab': '#6b8e23',
        'orange': '#ffa500',
        'orangered': '#ff4500',
        'orchid': '#da70d6',
        'palegoldenrod': '#eee8aa',
        'palegreen': '#98fb98',
        'paleturquoise': '#afeeee',
        'palevioletred': '#db7093',
        'papayawhip': '#ffefd5',
        'peachpuff': '#ffdab9',
        'peru': '#cd853f',
        'pink': '#ffc0cb',
        'plum': '#dda0dd',
        'powderblue': '#b0e0e6',
        'purple': '#800080',
        'red': '#ff0000',
        'rosybrown': '#bc8f8f',
        'royalblue': '#4169e1',
        'saddlebrown': '#8b4513',
        'salmon': '#fa8072',
        'sandybrown': '#f4a460',
        'seagreen': '#2e8b57',
        'seashell': '#fff5ee',
        'sienna': '#a0522d',
        'silver': '#c0c0c0',
        'skyblue': '#87ceeb',
        'slateblue': '#6a5acd',
        'slategray': '#708090',
        'snow': '#fffafa',
        'springgreen': '#00ff7f',
        'steelblue': '#4682b4',
        'tan': '#d2b48c',
        'teal': '#008080',
        'thistle': '#d8bfd8',
        'tomato': '#ff6347',
        'turquoise': '#40e0d0',
        'violet': '#ee82ee',
        'wheat': '#f5deb3',
        'white': '#ffffff',
        'whitesmoke': '#f5f5f5',
        'yellow': '#ffff00',
        'yellowgreen': '#9acd32'
    };

    // 颜色正则表达
    const colorRegex = {
        hex: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/g,
        rgb: /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/g,
        rgba: /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)/g,
        hsl: /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)/g,
        hsla: /hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*(0|1|0?\.\d+)\s*\)/g,
        name: new RegExp(`\\b(${Object.keys(colorNames).join('|')})\\b`, 'gi')
    };

    // 初始化颜色高亮填充
    function initColorHighlight(editor) {
        if (!editor) return;

        // 扩展CodeMirror的XML模式添加颜色填充
        CodeMirror.defineMode("xml-with-colors", function(config, parserConfig) {
            const xmlMode = CodeMirror.getMode(config, "xml");
            
            return {
                startState: xmlMode.startState,
                copyState: xmlMode.copyState,
                token: function(stream, state) {
                    const token = xmlMode.token(stream, state);
                    
                    // 如果是属性值检查是否包含颜色
                    if (token === "string") {
                        const string = stream.current();
                        
                        // 检查颜色格式
                        if (colorRegex.hex.test(string)) {
                            return "string color-hex";
                        } else if (colorRegex.rgb.test(string) || colorRegex.rgba.test(string)) {
                            return "string color-rgb";
                        } else if (colorRegex.hsl.test(string) || colorRegex.hsla.test(string)) {
                            return "string color-hsl";
                        } else if (colorRegex.name.test(string)) {
                            return "string color-name";
                        }
                    }
                    
                    return token;
                },
                indent: xmlMode.indent,
                electricInput: xmlMode.electricInput,
                blockCommentStart: xmlMode.blockCommentStart,
                blockCommentEnd: xmlMode.blockCommentEnd,
                lineComment: xmlMode.lineComment,
                fold: xmlMode.fold
            };
        });

        // 应用新的模式
        editor.setOption("mode", "xml-with-colors");

        // 添加样式
        addColorHighlightStyles();

        // 监听编辑器内容变化实时更新颜色高亮填充
        editor.on("change", function() {
            updateColorHighlights(editor);
        });

        // 初始更新
        updateColorHighlights(editor);
    }

    // 添加颜色高亮样式 - 样式因个人审美自行美化
    function addColorHighlightStyles() {
        if (document.getElementById("color-highlight-styles")) return;

        const style = document.createElement("style");
        style.id = "color-highlight-styles";
        style.textContent = `// 需要自定义样式可在此美化`;
        
        document.head.appendChild(style);
    }

    // 更新颜色
    function updateColorHighlights(editor) {
        const doc = editor.getDoc();
        const content = doc.getValue();
        const lines = content.split('\n');

        // 清除之前颜色标记
        clearColorMarks(editor);

        // 遍历每一行查找并标记颜色 - 有想法的或不满足现有颜色逻辑可添加更多颜色类型
        lines.forEach((line, lineNum) => {
            // 使用matchAll一次性获取所有匹配避免lastIndex问题
            
            // 查找hex颜色 - 顺序匹配优先6位hex再匹配3位hex
            const hexMatches = [...line.matchAll(/#([0-9a-fA-F]{6})|#([0-9a-fA-F]{3})/g)];
            hexMatches.forEach(match => {
                const fullMatch = match[0];
                addColorMark(editor, lineNum, match.index, fullMatch, fullMatch);
            });
            
            // 查找rgb颜色
            const rgbMatches = [...line.matchAll(colorRegex.rgb)];
            rgbMatches.forEach(match => {
                addColorMark(editor, lineNum, match.index, match[0], match[0]);
            });
            
            // 查找rgba颜色
            const rgbaMatches = [...line.matchAll(colorRegex.rgba)];
            rgbaMatches.forEach(match => {
                addColorMark(editor, lineNum, match.index, match[0], match[0]);
            });
            
            // 查找hsl颜色
            const hslMatches = [...line.matchAll(colorRegex.hsl)];
            hslMatches.forEach(match => {
                addColorMark(editor, lineNum, match.index, match[0], match[0]);
            });
            
            // 查找hsla颜色
            const hslaMatches = [...line.matchAll(colorRegex.hsla)];
            hslaMatches.forEach(match => {
                addColorMark(editor, lineNum, match.index, match[0], match[0]);
            });
            
            // 查找颜色名称
            const nameMatches = [...line.matchAll(colorRegex.name)];
            nameMatches.forEach(match => {
                const colorName = match[0].toLowerCase();
                const hexColor = colorNames[colorName];
                if (hexColor) {
                    addColorMark(editor, lineNum, match.index, match[0], hexColor);
                }
            });
        });
    }

    // 添加颜色标记
    function addColorMark(editor, line, ch, text, color) {
        const from = { line: line, ch: ch };
        const to = { line: line, ch: ch + text.length };
        
        editor.markText(from, to, {
            css: `background-color: ${color}; color: ${getContrastColor(color)}; padding: 0 2px; border-radius: 2px; border: none; box-shadow: none;`,
            inclusiveLeft: true,
            inclusiveRight: false
        });
    }

    // 清除所有颜色标记
    function clearColorMarks(editor) {
        const marks = editor.getAllMarks();
        marks.forEach(mark => {
            if (mark.className === undefined || mark.css) {
                mark.clear();
            }
        });
    }

    // 获取对比色 - 确保文字在背景色上清晰可见
    function getContrastColor(color) {
        // 解析颜色为RGB
        let r, g, b;
        
        if (color.startsWith('#')) {
            // 处理hex颜色
            const hex = color.slice(1);
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.slice(0, 2), 16);
                g = parseInt(hex.slice(2, 4), 16);
                b = parseInt(hex.slice(4, 6), 16);
            }
        } else if (color.startsWith('rgb(')) {
            // 处理rgb颜色
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
            }
        } else if (color.startsWith('rgba(')) {
            // 处理rgba颜色
            const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[0-9.]+\)/);
            if (match) {
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
            }
        } else {
            // 默认返回黑色
            return '#000000';
        }
        
        // 计算亮度
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // 根据亮度返回对比色
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    // 导出函数
    window.initColorHighlight = initColorHighlight;
    window.colorNames = colorNames;
    window.colorRegex = colorRegex;
    window.getContrastColor = getContrastColor;

})();
