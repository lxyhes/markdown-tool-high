// Git Service Wrapper
// In a real Tauri app, this would use @tauri-apps/api/shell
// For this environment, we'll implement a mock structure or use standard APIs if available.
// Since we are in a web view, we can't directly call system git unless via Tauri Invoke or Shell.

// We will assume a global `window.__TAURI__` exists if in Tauri, 
// otherwise we mock it for UI demonstration.

const isTauri = !!window.__TAURI__;

export class GitService {
    constructor() {
        this.projectPath = null; // Should be set to current opened folder
    }

    async setProjectPath(path) {
        this.projectPath = path;
    }

    // Mock runner or Real Tauri runner
    async runGit(args) {
        if (!isTauri) {
            console.log(`[Mock Git] Executing: git ${args.join(' ')}`);
            return this.mockGitResponse(args);
        }

        try {
            const { Command } = window.__TAURI__.shell;
            // 'git' must be defined in tauri.conf.json allowlist > shell > scope
            const command = new Command('git', args, { cwd: this.projectPath });
            const output = await command.execute();
            if (output.code !== 0) {
                throw new Error(output.stderr);
            }
            return output.stdout;
        } catch (e) {
            console.error("Git Error:", e);
            throw e;
        }
    }

    // --- Core Commands ---

    async getStatus() {
        // Returns list of modified files
        // Output format of `git status -s`:
        //  M modified.txt
        // ?? new.txt
        const output = await this.runGit(['status', '-s']);
        return this.parseStatus(output);
    }

    async stageAll() {
        return this.runGit(['add', '.']);
    }

    async commit(message) {
        return this.runGit(['commit', '-m', message]);
    }

    async push() {
        return this.runGit(['push']);
    }

    async pull() {
        return this.runGit(['pull']);
    }

    // --- Helpers ---

    parseStatus(stdout) {
        if (!stdout) return [];
        return stdout.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                const status = line.substring(0, 2).trim();
                const file = line.substring(3).trim();
                return { status, file };
            });
    }

    mockGitResponse(args) {
        return new Promise(resolve => {
            setTimeout(() => {
                const cmd = args[0];
                if (cmd === 'status') {
                    resolve(" M src/main.js\n?? new_draft.md\n D old_doc.md");
                } else {
                    resolve(`Mock success: git ${args.join(' ')}`);
                }
            }, 500);
        });
    }
}

export const gitService = new GitService();
