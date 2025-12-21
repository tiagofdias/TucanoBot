const express = require('express');
const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

// Redirect to Discord OAuth2
router.get('/login', (req, res) => {
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

        const tokens = await tokenResponse.json();
        
        if (tokens.error) {
            console.error('Token error:', tokens);
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
