// 禅模式 - 极简写作环境 + 可选白噪音
import { showToast } from './utils.js'

let isZenMode = false
let audioContext = null
let noiseNode = null
let gainNode = null
let isNoiseEnabled = false

export function toggleZenMode(editor) {
  isZenMode = !isZenMode
  
  if (isZenMode) {
    enterZenMode(editor)
  } else {
    exitZenMode(editor)
  }
}

function enterZenMode(editor) {
  document.body.classList.add('zen-mode')
  
  // 隐藏所有UI
  const elementsToHide = [
    '.sidebar',
    '.toolbar', 
    '.status-bar',
    '#tab-bar',
    '.theme-switcher-container'
  ]
  
  elementsToHide.forEach(selector => {
    const el = document.querySelector(selector)
    if (el) el.style.display = 'none'
  })
  
  // 编辑器全屏居中
  const editorPane = document.getElementById('editorPane')
  if (editorPane) {
    editorPane.style.maxWidth = '750px'
    editorPane.style.margin = '0 auto'
    editorPane.style.padding = '60px 20px'
  }
  
  // 添加控制面板
  showZenControls()
  
  showToast('已进入禅模式 (按 Esc 退出)')
}

function exitZenMode(editor) {
  document.body.classList.remove('zen-mode')
  
  // 恢复UI
  const elementsToShow = [
    '.toolbar', 
    '.status-bar',
    '#tab-bar',
    '.theme-switcher-container'
  ]
  
  elementsToShow.forEach(selector => {
    const el = document.querySelector(selector)
    if (el) el.style.display = ''
  })
  
  // 侧边栏根据之前状态恢复
  const sidebar = document.querySelector('.sidebar')
  if (sidebar && !sidebar.classList.contains('collapsed')) {
    sidebar.style.display = ''
  }
  
  // 恢复编辑器样式
  const editorPane = document.getElementById('editorPane')
  if (editorPane) {
    editorPane.style.maxWidth = ''
    editorPane.style.margin = ''
    editorPane.style.padding = ''
  }
  
  // 移除控制面板
  const controls = document.getElementById('zenControls')
  if (controls) controls.remove()
  
  // 停止白噪音
  stopNoise()
  
  showToast('已退出禅模式')
}

function showZenControls() {
  const existing = document.getElementById('zenControls')
  if (existing) existing.remove()
  
  const controls = document.createElement('div')
  controls.id = 'zenControls'
  controls.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 8px;
    z-index: 9999;
    opacity: 0.3;
    transition: opacity 0.3s;
  `
  controls.onmouseenter = () => controls.style.opacity = '1'
  controls.onmouseleave = () => controls.style.opacity = '0.3'
  
  controls.innerHTML = `
    <button id="zenNoiseBtn" title="白噪音" style="
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">🔇</button>
    <button id="zenExitBtn" title="退出禅模式 (Esc)" style="
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">✕</button>
  `
  
  document.body.appendChild(controls)
  
  document.getElementById('zenNoiseBtn').onclick = toggleNoise
  document.getElementById('zenExitBtn').onclick = () => toggleZenMode()
}

function toggleNoise() {
  if (isNoiseEnabled) {
    stopNoise()
  } else {
    startNoise()
  }
}

function startNoise() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // 创建白噪音
    const bufferSize = 2 * audioContext.sampleRate
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    noiseNode = audioContext.createBufferSource()
    noiseNode.buffer = noiseBuffer
    noiseNode.loop = true
    
    // 低通滤波器让声音更柔和
    const filter = audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1000
    
    gainNode = audioContext.createGain()
    gainNode.gain.value = 0.1 // 音量
    
    noiseNode.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    noiseNode.start()
    isNoiseEnabled = true
    
    // 更新按钮
    const btn = document.getElementById('zenNoiseBtn')
    if (btn) {
      btn.textContent = '🔊'
      btn.style.background = 'var(--accent-light)'
      btn.style.color = 'var(--accent-color)'
    }
    
    showToast('白噪音已开启')
  } catch (e) {
    showToast('无法播放白噪音', 'error')
  }
}

function stopNoise() {
  if (noiseNode) {
    noiseNode.stop()
    noiseNode.disconnect()
    noiseNode = null
  }
  if (gainNode) {
    gainNode.disconnect()
    gainNode = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  
  isNoiseEnabled = false
  
  // 更新按钮
  const btn = document.getElementById('zenNoiseBtn')
  if (btn) {
    btn.textContent = '🔇'
    btn.style.background = 'var(--bg-secondary)'
    btn.style.color = 'var(--text-secondary)'
  }
}

// 监听 Esc 退出
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isZenMode) {
    toggleZenMode()
  }
})

export function isInZenMode() {
  return isZenMode
}
