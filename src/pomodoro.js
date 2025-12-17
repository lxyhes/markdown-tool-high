// 番茄钟 - 专注写作计时器
import { showToast } from './utils.js'

let timer = null
let timeLeft = 25 * 60 // 25分钟
let isRunning = false
let isBreak = false
let pomodoroCount = 0

const WORK_TIME = 25 * 60
const SHORT_BREAK = 5 * 60
const LONG_BREAK = 15 * 60

let panel = null

export function showPomodoro() {
  if (panel) {
    panel.remove()
    panel = null
    return
  }
  
  panel = document.createElement('div')
  panel.id = 'pomodoroPanel'
  panel.style.cssText = `
    position: fixed;
    bottom: 60px;
    right: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 1000;
    width: 280px;
    text-align: center;
  `
  
  document.body.appendChild(panel)
  updatePanelUI()
}

function updatePanelUI() {
  if (!panel) return
  
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  
  // 清空并重建内容
  panel.innerHTML = ''
  
  // 标题栏
  const header = document.createElement('div')
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;'
  
  const title = document.createElement('span')
  title.style.cssText = 'font-weight: 600; color: var(--text-primary);'
  title.textContent = '🍅 番茄钟'
  
  const closeBtn = document.createElement('button')
  closeBtn.style.cssText = 'background:none; border:none; color:var(--text-tertiary); cursor:pointer; font-size:18px;'
  closeBtn.textContent = '×'
  closeBtn.onclick = () => {
    panel.remove()
    panel = null
  }
  
  header.appendChild(title)
  header.appendChild(closeBtn)
  panel.appendChild(header)
  
  // 时间显示
  const timeDisplay = document.createElement('div')
  timeDisplay.style.cssText = `
    font-size: 48px;
    font-weight: 300;
    color: ${isBreak ? 'var(--accent-color)' : 'var(--text-primary)'};
    font-family: var(--font-mono);
    margin: 20px 0;
  `
  timeDisplay.textContent = timeStr
  panel.appendChild(timeDisplay)
  
  // 状态文字
  const status = document.createElement('div')
  status.style.cssText = 'font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;'
  status.textContent = isBreak ? '☕ 休息时间' : '💪 专注工作'
  panel.appendChild(status)
  
  // 按钮区
  const btnGroup = document.createElement('div')
  btnGroup.style.cssText = 'display: flex; gap: 8px; justify-content: center; margin-bottom: 16px;'
  
  const toggleBtn = document.createElement('button')
  toggleBtn.style.cssText = `
    padding: 10px 24px;
    background: ${isRunning ? 'var(--bg-tertiary)' : 'var(--accent-color)'};
    color: ${isRunning ? 'var(--text-primary)' : 'white'};
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `
  toggleBtn.textContent = isRunning ? '⏸ 暂停' : '▶ 开始'
  toggleBtn.onclick = () => {
    if (isRunning) {
      stopTimer()
    } else {
      startTimer()
    }
    updatePanelUI()
  }
  
  const resetBtn = document.createElement('button')
  resetBtn.style.cssText = `
    padding: 10px 16px;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  `
  resetBtn.textContent = '↺ 重置'
  resetBtn.onclick = () => {
    stopTimer()
    timeLeft = isBreak ? SHORT_BREAK : WORK_TIME
    updatePanelUI()
  }
  
  btnGroup.appendChild(toggleBtn)
  btnGroup.appendChild(resetBtn)
  panel.appendChild(btnGroup)
  
  // 进度点
  const dots = document.createElement('div')
  dots.style.cssText = 'display: flex; justify-content: center; gap: 4px; margin-bottom: 12px;'
  for (let i = 1; i <= 4; i++) {
    const dot = document.createElement('span')
    dot.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${i <= pomodoroCount % 4 || (pomodoroCount % 4 === 0 && pomodoroCount > 0 && i === 4) ? 'var(--accent-color)' : 'var(--bg-tertiary)'};
    `
    dots.appendChild(dot)
  }
  panel.appendChild(dots)
  
  // 完成数
  const count = document.createElement('div')
  count.style.cssText = 'font-size: 12px; color: var(--text-tertiary);'
  count.textContent = `已完成 ${pomodoroCount} 个番茄`
  panel.appendChild(count)
  
  // 快速设置
  const presetArea = document.createElement('div')
  presetArea.style.cssText = 'margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);'
  
  const presetLabel = document.createElement('div')
  presetLabel.style.cssText = 'font-size: 11px; color: var(--text-tertiary); margin-bottom: 8px;'
  presetLabel.textContent = '快速设置'
  presetArea.appendChild(presetLabel)
  
  const presetBtns = document.createElement('div')
  presetBtns.style.cssText = 'display: flex; gap: 6px; justify-content: center;'
  
  ;[25, 45, 60].forEach(mins => {
    const btn = document.createElement('button')
    btn.style.cssText = `
      padding: 4px 10px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 11px;
    `
    btn.textContent = `${mins}分`
    btn.onclick = () => {
      timeLeft = mins * 60
      isBreak = false
      stopTimer()
      updatePanelUI()
    }
    presetBtns.appendChild(btn)
  })
  
  presetArea.appendChild(presetBtns)
  panel.appendChild(presetArea)
}

function startTimer() {
  if (timer) return
  isRunning = true
  
  timer = setInterval(() => {
    timeLeft--
    
    if (timeLeft <= 0) {
      onTimerComplete()
    }
    
    updatePanelUI()
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isRunning = false
}

function onTimerComplete() {
  stopTimer()
  
  // 播放提示音
  playNotificationSound()
  
  if (isBreak) {
    // 休息结束，开始工作
    isBreak = false
    timeLeft = WORK_TIME
    showToast('休息结束，开始新的番茄！🍅')
  } else {
    // 工作结束，开始休息
    pomodoroCount++
    isBreak = true
    
    // 每4个番茄后长休息
    if (pomodoroCount % 4 === 0) {
      timeLeft = LONG_BREAK
      showToast(`太棒了！完成 ${pomodoroCount} 个番茄，休息15分钟 ☕`)
    } else {
      timeLeft = SHORT_BREAK
      showToast(`完成一个番茄！休息5分钟 ☕`)
    }
  }
  
  updatePanelUI()
}

function playNotificationSound() {
  try {
    // 使用 Web Audio API 播放简单提示音
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3
    
    oscillator.start()
    
    // 渐弱
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (e) {
    // 静默失败
  }
}

// 获取当前状态
export function getPomodoroStatus() {
  return {
    isRunning,
    isBreak,
    timeLeft,
    pomodoroCount
  }
}
