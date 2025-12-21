const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const guildsRoutes = require('./routes/guilds');
const levelsRoutes = require('./routes/levels');
const birthdaysRoutes = require('./routes/birthdays');
const autoRoutes = require('./routes/auto');
const settingsRoutes = require('./routes/settings');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.DASHBOARD_URL || true,
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'tucanobot-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Serve static dashboard files
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// Health check
app.get('/', (req, res) => {
    res.send('ok');
});

app.get('/health', (req, res) => {
    res.send('ok');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guilds', guildsRoutes);
app.use('/api/guilds', levelsRoutes);
app.use('/api/guilds', birthdaysRoutes);
app.use('/api/guilds', autoRoutes);
app.use('/api/guilds', settingsRoutes);

// Dashboard SPA fallback - serve index.html for all dashboard routes
app.get('/dashboard/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

module.exports = app;
