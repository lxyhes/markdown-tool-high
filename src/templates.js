// 文档模板
const templates = [
  {
    name: '📝 空白文档',
    desc: '从空白开始',
    content: ''
  },
  {
    name: '📋 会议记录',
    desc: '标准会议记录模板',
    content: `# 会议记录

## 基本信息
- **日期**: ${new Date().toLocaleDateString()}
- **时间**: 
- **地点**: 
- **主持人**: 
- **记录人**: 

## 参会人员
- 

## 会议议程
1. 
2. 
3. 

## 讨论内容

### 议题一
**讨论要点**:


**结论**:


### 议题二
**讨论要点**:


**结论**:


## 行动项
| 任务 | 负责人 | 截止日期 | 状态 |
|------|--------|----------|------|
|      |        |          | ⏳   |
|      |        |          | ⏳   |

## 下次会议
- **日期**: 
- **议题**: 

---
*记录时间: ${new Date().toLocaleString()}*
`
  },
  {
    name: '📅 日记',
    desc: '每日日记模板',
    content: `# ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}

## 今日心情
😊 开心 | 😐 平静 | 😔 低落 | 😤 烦躁

## 今日待办
- [ ] 
- [ ] 
- [ ] 

## 今日记录


## 感恩时刻
1. 
2. 
3. 

## 明日计划
- 

---
*晚安 🌙*
`
  },
  {
    name: '📊 周报',
    desc: '工作周报模板',
    content: `# 工作周报

**姓名**: 
**部门**: 
**周期**: ${getWeekRange()}

---

## 本周完成

### 项目一
- 

### 项目二
- 

## 进行中的工作
| 任务 | 进度 | 预计完成 |
|------|------|----------|
|      | 50%  |          |

## 遇到的问题
1. **问题描述**: 
   **解决方案**: 

## 下周计划
- [ ] 
- [ ] 
- [ ] 

## 需要的支持
- 

---
*提交时间: ${new Date().toLocaleString()}*
`
  },
  {
    name: '💡 项目方案',
    desc: '项目提案模板',
    content: `# 项目方案: [项目名称]

## 1. 项目背景
描述项目的背景和起因...

## 2. 项目目标
- 目标一
- 目标二
- 目标三

## 3. 解决方案

### 3.1 方案概述


### 3.2 技术架构
\`\`\`
[架构图或说明]
\`\`\`

### 3.3 功能模块
| 模块 | 功能描述 | 优先级 |
|------|----------|--------|
|      |          | P0     |
|      |          | P1     |

## 4. 时间规划
| 阶段 | 时间 | 交付物 |
|------|------|--------|
| 需求分析 | 1周 | 需求文档 |
| 设计 | 2周 | 设计文档 |
| 开发 | 4周 | 代码 |
| 测试 | 2周 | 测试报告 |

## 5. 资源需求
- 人力: 
- 预算: 
- 其他: 

## 6. 风险评估
| 风险 | 影响 | 应对措施 |
|------|------|----------|
|      | 高   |          |

## 7. 预期收益


---
*创建时间: ${new Date().toLocaleString()}*
`
  },
  {
    name: '📚 读书笔记',
    desc: '读书笔记模板',
    content: `# 《书名》读书笔记

## 书籍信息
- **书名**: 
- **作者**: 
- **出版社**: 
- **阅读日期**: ${new Date().toLocaleDateString()}

## 内容概要


## 精彩摘录

> 摘录内容...
> — 第 X 页

> 摘录内容...
> — 第 X 页

## 我的思考


## 行动计划
基于这本书，我打算：
- [ ] 
- [ ] 

## 评分
⭐⭐⭐⭐⭐ (5/5)

## 推荐指数
适合人群：

---
*笔记时间: ${new Date().toLocaleString()}*
`
  },
  {
    name: '🐛 Bug 报告',
    desc: 'Bug 报告模板',
    content: `# Bug 报告

## 基本信息
- **标题**: 
- **严重程度**: 🔴 严重 / 🟡 中等 / 🟢 轻微
- **发现日期**: ${new Date().toLocaleDateString()}
- **报告人**: 

## 环境信息
- **操作系统**: 
- **浏览器/版本**: 
- **应用版本**: 

## Bug 描述
### 预期行为


### 实际行为


## 复现步骤
1. 
2. 
3. 

## 截图/日志
\`\`\`
错误日志...
\`\`\`

## 其他信息

`
  }
]

function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

export function showTemplateSelector(callback) {
  const existing = document.getElementById('templateSelector')
  if (existing) existing.remove()
  
  const overlay = document.createElement('div')
  overlay.id = 'templateSelector'
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  `
  
  const panel = document.createElement('div')
  panel.style.cssText = `
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 500px;
    max-height: 600px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  `
  
  // 标题
  const header = document.createElement('div')
  header.style.cssText = `
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  header.innerHTML = `
    <span style="font-weight: 600; color: var(--text-primary); font-size: 16px;">📄 选择模板</span>
    <button id="closeTemplatePanel" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:20px;">&times;</button>
  `
  
  // 模板列表
  const list = document.createElement('div')
  list.style.cssText = `
    max-height: 500px;
    overflow-y: auto;
    padding: 12px;
  `
  
  templates.forEach(tpl => {
    const item = document.createElement('div')
    item.style.cssText = `
      padding: 14px 16px;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid var(--border-color);
      margin-bottom: 8px;
      transition: all 0.15s;
    `
    item.onmouseenter = () => {
      item.style.background = 'var(--bg-tertiary)'
      item.style.borderColor = 'var(--accent-color)'
    }
    item.onmouseleave = () => {
      item.style.background = 'transparent'
      item.style.borderColor = 'var(--border-color)'
    }
    
    item.innerHTML = `
      <div style="font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">${tpl.name}</div>
      <div style="font-size: 13px; color: var(--text-tertiary);">${tpl.desc}</div>
    `
    
    item.onclick = () => {
      overlay.remove()
      if (callback) callback(tpl.content)
    }
    
    list.appendChild(item)
  })
  
  panel.appendChild(header)
  panel.appendChild(list)
  overlay.appendChild(panel)
  document.body.appendChild(overlay)
  
  // 关闭
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove()
  }
  document.getElementById('closeTemplatePanel').onclick = () => overlay.remove()
  
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}
