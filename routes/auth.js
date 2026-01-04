const express = require('express');
const router = express.Router();

// Admin Key Authentication (bypasses Discord OAuth which is blocked by Cloudflare)
const ADMIN_KEY = process.env.ADMIN_KEY || 'tucano-admin-2024';
const GUILD_ID = process.env.GUILD_ID;

console.log('[Auth] Admin key authentication enabled');
console.log('[Auth] GUILD_ID:', GUILD_ID ? `${GUILD_ID.substring(0, 6)}...` : 'NOT SET');

// Login page - show a simple form
router.get('/login', (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session.isAdmin) {
        return res.redirect('/dashboard');
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TucanoBot Dashboard - Login</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }
                .login-box {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                }
                h1 { margin-bottom: 10px; }
                p { color: #aaa; margin-bottom: 30px; }
                input {
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 20px;
                    border: none;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    font-size: 16px;
                }
                input::placeholder { color: #888; }
                button {
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 10px;
                    background: #5865F2;
                    color: #fff;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                button:hover { background: #4752c4; }
                .error { color: #ff6b6b; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h1>🦜 TucanoBot</h1>
                <p>Enter admin key to access dashboard</p>
                ${req.query.error ? '<p class="error">Invalid admin key</p>' : ''}
                <form method="POST" action="/api/auth/login">
                    <input type="password" name="adminKey" placeholder="Admin Key" required>
                    <button type="submit">Login</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Handle login POST
router.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    const { adminKey } = req.body;
    
    if (adminKey === ADMIN_KEY) {
        // Set session as admin
        req.session.isAdmin = true;
        req.session.user = {
            id: 'admin',
            username: 'Admin',
            avatar: null
        };
        req.session.guilds = GUILD_ID ? [{ id: GUILD_ID, name: 'Managed Server' }] : [];
        
        // Save session explicitly before redirect
        req.session.save((err) => {
            if (err) {
                console.error('[Auth] Session save error:', err);
                return res.redirect('/api/auth/login?error=session');
            }
            console.log('[Auth] Admin logged in successfully');
            res.redirect('/dashboard');
        });
    } else {
        console.log('[Auth] Failed login attempt');
        res.redirect('/api/auth/login?error=invalid');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/dashboard');
});

// Get current user
router.get('/me', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({
        user: req.session.user,
        guilds: req.session.guilds
    });
});

module.exports = router;
