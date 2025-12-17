import { EditorState } from '@codemirror/state'

// Commands List
const commands = [
    // Headings
    { label: "Heading 1", type: "text", apply: "# ", detail: "一级标题 (H1)", boost: 99 },
    { label: "Heading 2", type: "text", apply: "## ", detail: "二级标题 (H2)", boost: 98 },
    { label: "Heading 3", type: "text", apply: "### ", detail: "三级标题 (H3)", boost: 97 },

    // Blocks
    { label: "Table", type: "text", apply: (view) => { if (window.showTableEditor) window.showTableEditor() }, detail: "插入表格", boost: 95 },
    { label: "Code Block", type: "text", apply: "```\n\n```", detail: "代码块", boost: 94 },
    { label: "Math Block", type: "text", apply: "$$\n\n$$", detail: "数学公式块", boost: 93 },
    { label: "Quote", type: "text", apply: "> ", detail: "引用", boost: 92 },
    { label: "Divider", type: "text", apply: "\n---\n", detail: "分割线", boost: 91 },
    { label: "Details", type: "text", apply: "<details>\n<summary>标题</summary>\n\n内容\n</details>", detail: "折叠详情", boost: 90 },

    // Lists
    { label: "Task List", type: "text", apply: "- [ ] ", detail: "任务列表", boost: 88 },
    { label: "Bullet List", type: "text", apply: "- ", detail: "无序列表", boost: 87 },
    { label: "Ordered List", type: "text", apply: "1. ", detail: "有序列表", boost: 86 },

    // Inline
    { label: "Image", type: "text", apply: (view) => { if (window.insertImage) window.insertImage() }, detail: "插入图片", boost: 85 },
    { label: "Link", type: "text", apply: (view) => { if (window.insertLink) window.insertLink() }, detail: "插入链接", boost: 84 },
    { label: "Bold", type: "text", apply: "**粗体**", detail: "粗体", boost: 80 },
    { label: "Italic", type: "text", apply: "*斜体*", detail: "斜体", boost: 79 },
    { label: "Strike", type: "text", apply: "~~删除线~~", detail: "删除线", boost: 78 },
    { label: "Highlight", type: "text", apply: "==高亮==", detail: "高亮", boost: 77 },
    { label: "Inline Code", type: "text", apply: "`代码`", detail: "行内代码", boost: 76 },

    // Utility
    { label: "Date", type: "text", apply: () => new Date().toLocaleDateString(), detail: "当前日期" },
    { label: "Time", type: "text", apply: () => new Date().toLocaleTimeString(), detail: "当前时间" },
    { label: "DateTime", type: "text", apply: () => new Date().toLocaleString(), detail: "当前日期时间" },
    
    // New Features
    { label: "Emoji", type: "text", apply: (view) => { if (window.showEmojiPicker) window.showEmojiPicker() }, detail: "插入表情", boost: 70 },
    { label: "Template", type: "text", apply: (view) => { if (window.showTemplates) window.showTemplates() }, detail: "从模板新建", boost: 69 },
    
    // Callouts / Admonitions
    { label: "Note", type: "text", apply: "> [!NOTE]\n> ", detail: "提示框 - 注意", boost: 65 },
    { label: "Tip", type: "text", apply: "> [!TIP]\n> ", detail: "提示框 - 技巧", boost: 64 },
    { label: "Warning", type: "text", apply: "> [!WARNING]\n> ", detail: "提示框 - 警告", boost: 63 },
    { label: "Important", type: "text", apply: "> [!IMPORTANT]\n> ", detail: "提示框 - 重要", boost: 62 },
    
    // More blocks
    { label: "Footnote", type: "text", apply: "[^1]: ", detail: "脚注", boost: 60 },
    { label: "Checkbox", type: "text", apply: "- [ ] ", detail: "复选框", boost: 59 },
    { label: "Mermaid", type: "text", apply: "```mermaid\ngraph TD\n    A[开始] --> B[结束]\n```", detail: "Mermaid 图表", boost: 58 },
    
    // Tools
    { label: "TOC", type: "text", apply: (view) => { if (window.showTOCGenerator) window.showTOCGenerator() }, detail: "生成目录", boost: 55 },
    { label: "Format", type: "text", apply: (view) => { if (window.formatDocument) window.formatDocument() }, detail: "格式化文档", boost: 54 },
]

function slashCommandCompletion(context) {
    let word = context.matchBefore(/\/[\w]*$/)

    if (!word) return null
    if (word.from == word.to && !context.explicit) return null

    return {
        from: word.from,
        options: commands.map(c => ({
            label: "/" + c.label,
            displayLabel: c.label, // Show clean name in list
            detail: c.detail,
            type: c.type,
            apply: (view, completion, from, to) => {
                if (typeof c.apply === 'string') {
                    // Atomic replacement for text items
                    view.dispatch({
                        changes: { from: from, to: to, insert: c.apply },
                        selection: { anchor: from + c.apply.length }
                    });
                } else {
                    // For functions (modals, complex inserts), clear the command first
                    view.dispatch({
                        changes: { from: from, to: to, insert: "" }
                    });
                    // Then execute the custom logic
                    // We pass 'from' as the cursor position since we just cleared up to there
                    try {
                        c.apply(view, completion, from, from);
                    } catch (e) {
                        console.error("Slash command action failed:", e);
                    }
                }
            },
            boost: c.boost || 0
        }))
    }
}

export const slashCommandExtension = EditorState.languageData.of((state, pos) => {
    return [{ autocomplete: slashCommandCompletion }]
})
