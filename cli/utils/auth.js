const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Simple config store (replaces `conf` to avoid ESM issues) ───────────────
const CONFIG_DIR = path.join(os.homedir(), '.alpha-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) return {};
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function writeConfig(data) {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

// ─── Token management ────────────────────────────────────────────────────────

function getToken() {
    return readConfig().jwt || null;
}

function clearToken() {
    const config = readConfig();
    delete config.jwt;
    writeConfig(config);
}

function setToken(token) {
    const config = readConfig();
    config.jwt = token;
    writeConfig(config);
}

// ─── Browser-based Phantom auth flow ─────────────────────────────────────────

async function authenticateViaBrowser() {
    return new Promise(async (resolve, reject) => {
        const server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);

            if (parsedUrl.pathname === '/') {
                const token = parsedUrl.query.token;

                if (token) {
                    setToken(token);

                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html><body style="background: #0a0a1a; color: #4ade80; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                            <div style="text-align: center;">
                                <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">✓ Authentication Complete</h1>
                                <p style="color: #666;">You can close this tab and return to your terminal.</p>
                            </div>
                            <script>setTimeout(() => window.close(), 3000);</script>
                        </body></html>
                    `);

                    server.close();
                    resolve(token);
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end('<h1>Failed to authenticate. No token returned.</h1>');
                    server.close();
                    reject(new Error('No token returned'));
                }
            }
        });

        server.listen(0, async () => {
            const FRONTEND_URL = process.env.FRONTEND_URL || 'https://alpha-cli-ui.vercel.app';
            const port = server.address().port;
            const loginUrl = `${FRONTEND_URL}/?callback=${encodeURIComponent(`http://localhost:${port}`)}`;

            // Dynamic import for `open` (ESM-only since v9)
            const open = (await import('open')).default;

            console.log(`Opening browser to authenticate via Phantom Wallet...`);
            await open(loginUrl);
        });

        // Timeout after 5 minutes
        setTimeout(() => {
            server.close();
            reject(new Error('Authentication timed out after 5 minutes'));
        }, 5 * 60 * 1000);
    });
}

module.exports = {
    authenticateViaBrowser,
    getToken,
    clearToken,
};
