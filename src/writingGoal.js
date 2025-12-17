// 写作目标 - 每日字数追踪
import { showToast } from './utils.js'

const STORAGE_KEY = 'markflow_writing_goal'

let goalPanel = null

// 获取今日数据
function getTodayData() {
  const today = new Date().toDateString()
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (data.date !== today) {
      // 新的一天，重置
      return { date: today, written: 0, goal: data.goal || 1000 }
    }
    return data
  } catch {
    return { date: today, written: 0, goal: 1000 }
  }
}

// 保存数据
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 更新已写字数
export function updateWrittenCount(count) {
  const data = getTodayData()
  data.written = count
  saveData(data)
  updateGoalIndicator()
}

// 显示目标面板
export function showWritingGoal() {
  if (goalPanel) {
    goalPanel.remove()
    goalPanel = null
    return
  }
  
  const data = getTodayData()
  const progress = Math.min(100, Math.round((data.written / data.goal) * 100))
  
  goalPanel = document.createElement('div')
  goalPanel.id = 'writingGoalPanel'
  goalPanel.style.cssText = `
    position: fixed;
    bottom: 60px;
    left: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 1000;
    width: 280px;
  `
  
  goalPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <span style="font-weight: 600; color: var(--text-primary);">📝 今日写作目标</span>
      <button id="closeGoalBtn" style="background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:18px;">&times;</button>
    </div>
    
    <div style="text-align: center; margin-bottom: 16px;">
      <div style="font-size: 36px; font-weight: 300; color: var(--text-primary);">
        ${data.written.toLocaleString()}
      </div>
      <div style="font-size: 14px; color: var(--text-tertiary);">
        / ${data.goal.toLocaleString()} 字
      </div>
    </div>
    
    <div style="margin-bottom: 16px;">
      <div style="
        height: 8px;
        background: var(--bg-tertiary);
        border-radius: 4px;
        overflow: hidden;
      ">
        <div style="
          height: 100%;
          width: ${progress}%;
          background: ${progress >= 100 ? '#22c55e' : 'var(--accent-color)'};
          border-radius: 4px;
          transition: width 0.3s ease;
        "></div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; color: var(--text-tertiary);">
        <span>${progress}%</span>
        <span>${progress >= 100 ? '🎉 目标达成！' : `还差 ${(data.goal - data.written).toLocaleString()} 字`}</span>
      </div>
    </div>
    
    <div style="border-top: 1px solid var(--border-color); padding-top: 12px;">
      <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px;">设置每日目标</div>
      <div style="display: flex; gap: 6px;">
        <button class="goal-preset" data-goal="500">500</button>
        <button class="goal-preset" data-goal="1000">1000</button>
        <button class="goal-preset" data-goal="2000">2000</button>
        <button class="goal-preset" data-goal="5000">5000</button>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <input type="number" id="customGoal" placeholder="自定义" value="${data.goal}" style="
          flex: 1;
          padding: 6px 10px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 13px;
        ">
        <button id="setGoalBtn" style="
          padding: 6px 12px;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        ">设置</button>
      </div>
    </div>
  `
  
  document.body.appendChild(goalPanel)
  
  // 事件绑定
  document.getElementById('closeGoalBtn').onclick = () => {
    goalPanel.remove()
    goalPanel = null
  }
  
  goalPanel.querySelectorAll('.goal-preset').forEach(btn => {
    btn.style.cssText = `
      padding: 4px 10px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 12px;
    `
    btn.onclick = () => {
      const goal = parseInt(btn.dataset.goal)
      setGoal(goal)
    }
  })
  
  document.getElementById('setGoalBtn').onclick = () => {
    const input = document.getElementById('customGoal')
    const goal = parseInt(input.value)
    if (goal > 0) {
      setGoal(goal)
    }
  }
}

function setGoal(goal) {
  const data = getTodayData()
  data.goal = goal
  saveData(data)
  showToast(`目标已设置为 ${goal.toLocaleString()} 字`)
  
  // 刷新面板
  if (goalPanel) {
    goalPanel.remove()
    goalPanel = null
    showWritingGoal()
  }
  
  updateGoalIndicator()
}

// 更新状态栏指示器
function updateGoalIndicator() {
  const data = getTodayData()
  const progress = Math.min(100, Math.round((data.written / data.goal) * 100))
  
  let indicator = document.getElementById('goalIndicator')
  if (!indicator) {
    // 创建指示器
    const statusBar = document.querySelector('.status-bar .status-item')
    if (statusBar) {
      indicator = document.createElement('span')
      indicator.id = 'goalIndicator'
      indicator.style.cssText = 'cursor: pointer; margin-left: 10px;'
      indicator.onclick = showWritingGoal
      statusBar.appendChild(indicator)
    }
  }
  
  if (indicator) {
    const color = progress >= 100 ? '#22c55e' : progress >= 50 ? '#f59e0b' : 'var(--text-tertiary)'
    indicator.innerHTML = `<span style="color: ${color};">📝 ${progress}%</span>`
    indicator.title = `今日写作: ${data.written}/${data.goal} 字`
  }
}

// 初始化
export function initWritingGoal() {
  updateGoalIndicator()
}

// 获取当前目标数据
export function getGoalData() {
  return getTodayData()
}
