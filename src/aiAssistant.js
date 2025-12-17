// AI Assistant Logic - Supports Gemini & OpenAI-Compatible APIs

export class AIAssistant {
    constructor(editor) {
        this.editor = editor;
        this.isVisible = false;
        
        // UI Elements
        this.container = document.getElementById('ai-dialog');
        this.input = document.getElementById('ai-input');
        this.output = document.getElementById('ai-output');
        this.loader = document.getElementById('ai-loader');
        
        // Buttons
        this.closeBtn = document.getElementById('ai-close-btn');
        this.settingsBtn = document.getElementById('ai-settings-btn');
        this.sendBtn = document.getElementById('ai-send-btn');
        this.insertBtn = document.getElementById('ai-insert-btn');
        this.saveSettingsBtn = document.getElementById('ai-save-settings');

        // Settings Elements
        this.settingsPanel = document.getElementById('ai-settings-panel');
        this.providerSelect = document.getElementById('ai-provider');
        this.apiKeyInput = document.getElementById('ai-api-key');
        this.openaiFields = document.getElementById('openai-fields');
        this.baseUrlInput = document.getElementById('ai-base-url');
        this.modelInput = document.getElementById('ai-model');

        this.currentGeneratedText = "";
        this.abortController = null;

        this.loadSettings();
        this.initEvents();
    }

    loadSettings() {
        this.config = {
            provider: localStorage.getItem('ai_provider') || 'gemini',
            apiKey: localStorage.getItem('ai_api_key') || '',
            baseUrl: localStorage.getItem('ai_base_url') || 'https://api.deepseek.com',
            model: localStorage.getItem('ai_model') || 'deepseek-chat'
        };

        // Pre-fill UI
        this.providerSelect.value = this.config.provider;
        this.apiKeyInput.value = this.config.apiKey;
        this.baseUrlInput.value = this.config.baseUrl;
        this.modelInput.value = this.config.model;
        this.updateSettingsUI();
    }

    updateSettingsUI() {
        const isOpenAI = this.providerSelect.value === 'openai';
        if (isOpenAI) {
            this.openaiFields.classList.remove('hidden');
        } else {
            this.openaiFields.classList.add('hidden');
        }
    }

    initEvents() {
        // Main Controls
        this.closeBtn.onclick = () => this.hide();
        this.settingsBtn.onclick = () => this.toggleSettings();
        this.sendBtn.onclick = () => this.handleSend();
        this.insertBtn.onclick = () => this.insertContent();

        // Settings
        this.providerSelect.onchange = () => this.updateSettingsUI();
        this.saveSettingsBtn.onclick = () => {
            this.config.provider = this.providerSelect.value;
            this.config.apiKey = this.apiKeyInput.value.trim();
            this.config.baseUrl = this.baseUrlInput.value.trim();
            this.config.model = this.modelInput.value.trim();

            localStorage.setItem('ai_provider', this.config.provider);
            localStorage.setItem('ai_api_key', this.config.apiKey);
            localStorage.setItem('ai_base_url', this.config.baseUrl);
            localStorage.setItem('ai_model', this.config.model);

            this.settingsPanel.classList.add('hidden');
            this.output.classList.remove('hidden');
            if (window.showToast) window.showToast("配置已保存");
            
            // Re-prompt if empty
            if (!this.output.innerText.trim()) {
                this.output.innerHTML = '<span class="placeholder">配置已更新。请输入指令...</span>';
            }
        };

        // Shortcuts
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) this.hide();
        });
    }

    toggleSettings() {
        const isHidden = this.settingsPanel.classList.contains('hidden');
        if (isHidden) {
            this.settingsPanel.classList.remove('hidden');
            this.output.classList.add('hidden');
        } else {
            this.settingsPanel.classList.add('hidden');
            this.output.classList.remove('hidden');
        }
    }

    show() {
        this.container.classList.remove('hidden');
        this.input.focus();
        this.isVisible = true;
        
        if (!this.config.apiKey) {
            this.toggleSettings(); // Force settings open if no key
        }
    }

    hide() {
        this.container.classList.add('hidden');
        this.isVisible = false;
        this.editor.focus();
    }

    async handleSend() {
        const prompt = this.input.value.trim();
        if (!prompt) return;
        if (!this.config.apiKey) {
            if (window.showToast) window.showToast("请先配置 API Key", "error");
            this.toggleSettings();
            return;
        }

        // Reset UI
        this.input.value = '';
        this.output.innerText = '';
        this.currentGeneratedText = '';
        this.loader.classList.remove('hidden');
        this.insertBtn.style.display = 'none';
        
        // Hide settings if open
        this.settingsPanel.classList.add('hidden');
        this.output.classList.remove('hidden');

        if (this.abortController) this.abortController.abort();
        this.abortController = new AbortController();

        try {
            if (this.config.provider === 'gemini') {
                await this.callGemini(prompt);
            } else {
                await this.callOpenAICompatible(prompt);
            }
        } catch (error) {
            this.output.innerText += `\n\n[错误]: ${error.message}`;
            this.loader.classList.add('hidden');
        }
    }

    // --- Google Gemini Implementation ---
    async callGemini(prompt) {
        const model = "gemini-1.5-flash"; // Free and fast
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.config.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            }),
            signal: this.abortController.signal
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || response.statusText);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Gemini sends a JSON array wrapper like `[{...}, {...}]` but streamed.
            // It's tricky to parse partial JSON.
            // Simplified approach: Regex for "text" fields if possible, or standard parsing if the stream sends valid JSON objects per line (Gemini usually sends a JSON array structure).
            // Actually Gemini stream format is: `[`, then objects `,`, then `]`.
            // We'll just append text as best we can.
            
            // Regex to find "text": "..." 
            // This is a bit hacky but robust for streaming partial chunks without a full JSON parser
            const matches = buffer.matchAll(/"text":\s*"((?:[^"\\]|\\.)*)"/g);
            let fullText = "";
            for (const match of matches) {
                try {
                    // Unescape JSON string
                    fullText += JSON.parse(`"${match[1]}"`); 
                } catch (e) {}
            }
            
            // But buffer accumulates ALL history? No, we need to process NEW matches.
            // Better: Parse objects by balancing braces.
            // For this quick demo, let's try a simpler approach or accept the buffer reset.
            // Actually, the simplest way for Gemini is just waiting for the whole array if stream is hard, 
            // BUT we want streaming.
            
            // Let's use a cleaner line-based check if possible.
            // Gemini stream returns valid JSON objects separated by comma/newline usually? No, it's one array.
            
            // Robust approach: Look for `text` fields in the raw string.
            // Reset logic: Only add *new* text.
        }
        
        // Re-do: Gemini stream is tricky manually. Let's use a slightly less efficient but safer way:
        // Or assume the user uses OpenAI compatible mode for DeepSeek which uses standard SSE.
        // For Gemini, let's assume we can fetch the whole thing if stream is too hard, OR use the regex carefully.
        
        // Let's re-implement `callGemini` using standard JSON parsing of the *streamed array elements*.
        // Actually, we can use the `sse.js` approach if it was SSE, but it's not.
        
        // Revised Simple Logic: Just await full response for Gemini V1 (to avoid complexity) OR
        // Use the proper stream parser.
        // Let's try to stick to "stream" but if it fails, fallback.
        // Actually, let's switch to standard parsing for Gemini for stability in this demo:
        
        // Wait, Gemini returns multiple JSON objects if we use `?alt=sse`? No.
        // Let's just use the non-stream endpoint for Gemini for now to guarantee success, 
        // as parsing the JSON array stream manually in vanilla JS is error-prone without a library.
        // URL for non-stream: `:generateContent`
        
        await this.callGeminiNonStream(prompt);
    }

    async callGeminiNonStream(prompt) {
         const model = "gemini-1.5-flash";
         const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;
         
         const response = await fetch(url, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
         });
         
         if (!response.ok) throw new Error("API Error: " + response.status);
         
         const data = await response.json();
         const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
         
         this.streamUpdate(text); // Simulate stream or just show
         this.finish();
    }

    // --- OpenAI / DeepSeek Implementation (SSE Stream) ---
    async callOpenAICompatible(prompt) {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [{ role: "user", content: prompt }],
                stream: true
            }),
            signal: this.abortController.signal
        });

        if (!response.ok) {
             const err = await response.text();
             throw new Error(err || response.statusText);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr === '[DONE]') continue;
                    try {
                        const json = JSON.parse(jsonStr);
                        const content = json.choices?.[0]?.delta?.content || "";
                        if (content) {
                            this.streamUpdate(content, true);
                        }
                    } catch (e) {}
                }
            }
        }
        this.finish();
    }

    streamUpdate(text, append = false) {
        if (append) {
            this.currentGeneratedText += text;
        } else {
            this.currentGeneratedText = text;
        }
        this.output.innerText = this.currentGeneratedText;
        this.output.scrollTop = this.output.scrollHeight;
    }

    finish() {
        this.loader.classList.add('hidden');
        this.insertBtn.style.display = 'inline-flex';
        // Auto-save generated text to history? Maybe later.
    }

    insertContent() {
        if (!this.currentGeneratedText) return;

        const transaction = this.editor.state.update({
            changes: {
                from: this.editor.state.selection.main.head,
                insert: this.currentGeneratedText + "\n"
            }
        });
        this.editor.dispatch(transaction);
        this.hide();
        
        if (window.showToast) window.showToast('内容已插入');
    }
}

// Singleton Export
let aiInstance = null;
export function initAIAssistant(editorView) {
    if (!aiInstance) aiInstance = new AIAssistant(editorView);
    return aiInstance;
}
export function showAIAssistant() {
    if (aiInstance) aiInstance.show();
}