import { Decoration, ViewPlugin, EditorView, WidgetType } from "@codemirror/view"
import { RangeSetBuilder, StateField, StateEffect } from "@codemirror/state"
import { syntaxTree } from "@codemirror/language"

// 定义隐藏样式的 Decoration
const hideDecoration = Decoration.replace({});

// 针对链接部分的隐藏（保留链接文本，隐藏 url 部分）
// 我们需要隐藏 `[` 和 `](...)`
// CodeMirror 6 的 Markdown 解析树提供了 Link, URL, LinkMark 等节点

class WysiwygPlugin {
    constructor(view) {
        this.decorations = this.computeDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = this.computeDecorations(update.view);
        }
    }

    computeDecorations(view) {
        const builder = new RangeSetBuilder();
        const { state } = view;
        const selection = state.selection.main;
        
        // 获取当前光标所在的行号（可能有多个光标，这里取主光标）
        // 为了更好的体验，我们不仅检查行，如果是 Link，要检查光标是否在 Link 范围内
        const cursorFrom = selection.from;
        const cursorTo = selection.to;
        
        // 遍历可见区域的语法树
        for (const { from, to } of view.visibleRanges) {
            syntaxTree(state).iterate({
                from,
                to,
                enter: (node) => {
                    // 如果光标在节点范围内（稍微放宽一点，包含边界），则不隐藏
                    // 这种逻辑类似 Typora：光标移入即展开
                    if (cursorFrom >= node.from && cursorTo <= node.to) {
                        return;
                    }
                    
                    // 此外，如果光标仅仅是"接触"到节点边界，通常也应该展开
                    // 比如光标在 **bold**| 的后面。
                    // 简单的判断：如果 selection 与 node区间 有重叠，就不隐藏
                    if (cursorTo >= node.from && cursorFrom <= node.to) {
                        return;
                    }

                    // 1. 标题标记 (HeaderMark) 如 #, ##
                    if (node.type.name === "HeaderMark") {
                        builder.add(node.from, node.to, hideDecoration);
                    }
                    
                    // 2. 粗体/斜体标记 (EmphasisMark) 如 **, *
                    if (node.type.name === "EmphasisMark") {
                        builder.add(node.from, node.to, hideDecoration);
                    }
                    
                    // 3. 引用标记 (QuoteMark) 如 >
                    // 通常引用标记隐藏后可能看不出是引用了，除非有左边框样式。
                    // 我们的主题有左边框，所以可以隐藏 >
                    if (node.type.name === "QuoteMark") {
                        builder.add(node.from, node.to, hideDecoration);
                    }

                    // 4. 链接 (Link)
                    // Link 结构通常是: Link( [ LinkMark Content LinkMark ( Url ) ] )
                    // 我们只想隐藏 LinkMark 和 Url，保留 Content
                    // 但 iterate 是前序遍历。
                    // 简单做法：识别 LinkMark 和 URL 节点并隐藏
                    if (node.type.name === "LinkMark") {
                        // LinkMark includes [ and ] and ( and )
                        builder.add(node.from, node.to, hideDecoration);
                    }
                    if (node.type.name === "URL") {
                        builder.add(node.from, node.to, hideDecoration);
                    }
                    
                    // 5. 列表标记 (ListMark) 如 - 或 1.
                    // 隐藏后列表就没有点的，除非 CSS 补上。
                    // 暂时不隐藏列表标记，因为 CSS 没做 list-style。
                    
                    // 6. 代码块标记 (CodeMark) 如 ```
                    // 隐藏后可能不知道是代码块。通常代码块会保留标记或者变淡。
                    // 我们的主题对代码块有背景色，可以尝试隐藏首尾的 ``` 
                    // FencedCode > CodeMark
                    if (node.type.name === "CodeMark") {
                        // 只隐藏 FencedCode 的标记，行内代码的标记是 Emphasis 还是 CodeMark?
                        // 行内代码 `code` 的标记也是 CodeMark
                        builder.add(node.from, node.to, hideDecoration);
                    }
                }
            });
        }

        return builder.finish();
    }
}

// 导出插件
export const wysiwygPlugin = ViewPlugin.fromClass(WysiwygPlugin, {
    decorations: v => v.decorations
});

// 导出开关状态控制（如果需要像打字机模式那样切换）
// 目前我们默认开启，或者可以在 main.js 里做成扩展数组的一部分
