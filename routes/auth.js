const express = require('express');
const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 
    (process.env.NODE_ENV === 'production' 
        ? 'https://tucanobot-zdbi.onrender.com/api/auth/callback'
        : 'http://localhost:3000/api/auth/callback');

// Debug: Log OAuth config on startup (without revealing secrets)
console.log('[OAuth] Config loaded:');
console.log('[OAuth] CLIENT_ID:', CLIENT_ID ? `${CLIENT_ID.substring(0, 6)}...` : 'NOT SET');
console.log('[OAuth] CLIENT_SECRET:', CLIENT_SECRET ? `${CLIENT_SECRET.substring(0, 4)}...` : 'NOT SET');
console.log('[OAuth] REDIRECT_URI:', REDIRECT_URI);

// Redirect to Discord OAuth2
router.get('/login', (req, res) => {
    if (!CLIENT_ID) {
        return res.status(500).send('OAuth not configured: CLIENT_ID missing');
    }
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds'
    });
    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// OAuth2 callback
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.redirect('/dashboard?error=no_code');
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('[OAuth] Missing credentials - CLIENT_ID:', !!CLIENT_ID, 'CLIENT_SECRET:', !!CLIENT_SECRET);
        return res.redirect('/dashboard?error=config_error');
    }

    try {
        // Exchange code for token
        const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            })
        });

        // Check if response is JSON before parsing
        const contentType = tokenResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const rawText = await tokenResponse.text();
            console.error('[OAuth] Discord returned non-JSON response:');
            console.error('[OAuth] Status:', tokenResponse.status);
            console.error('[OAuth] Content-Type:', contentType);
            console.error('[OAuth] Body preview:', rawText.substring(0, 500));
            return res.redirect('/dashboard?error=discord_error');
        }

        const tokens = await tokenResponse.json();
        
        if (tokens.error) {
            console.error('[OAuth] Token error:', tokens.error, '-', tokens.error_description);
            return res.redirect('/dashboard?error=token_error');
        }

        // Get user info
        const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const user = await userResponse.json();

        // Get user's guilds
        const guildsResponse = await fetch(`${DISCORD_API}/users/@me/guilds`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const guilds = await guildsResponse.json();

        // Store in session
        req.session.user = user;
        req.session.guilds = guilds;
        req.session.accessToken = tokens.access_token;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Auth error:', error);
        res.redirect('/dashboard?error=auth_failed');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/dashboard');
});

// Get current user
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({
        user: req.session.user,
        guilds: req.session.guilds
    });
});

module.exports = router;
