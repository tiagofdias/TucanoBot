# TucanoBot

Discord bot project ready for Discloud deployment.

## ✨ Features

- **Beautiful Rank Cards**: Custom-designed professional rank cards with gradient backgrounds, glow effects, sparkles, and smooth animations
- **Level System**: Track user XP and levels with customizable settings
- **Auto Moderation**: Auto-delete, auto-publish, and suggestion systems
- **ChatGPT Integration**: AI-powered chat responses
- **Voice & Text Analytics**: Comprehensive user activity tracking
- **Custom Role Management**: Vanity roles, persistent roles, and XP multipliers

## Local Setup
1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
```
npm install
```
3. Run:
```
npm start
```

## Discloud Deployment
1. Ensure `discloud.config` is present (it is) and `MAIN=index.js` matches the entry file.
2. Make sure the events directory path in `index.js` matches actual casing (`events`). Done.
3. (Optional) Remove dev-only large files before upload.
4. Zip the project contents (all files including `package.json`, `index.js`, `discloud.config`, folders like `commands/`, `events/`, `models/`, `database/`). Do not include `node_modules` (Discloud installs dependencies automatically).
5. Use Discloud CLI:
```
discloud app:upload
```
   Or upload via panel.

## Environment Variables on Discloud
Set the following on Discloud dashboard or CLI secrets:
- DISCORD_TOKEN
- CLIENT_ID
- GUILD_ID (if you have guild specific commands)
- OPENAI_API_KEY (for ChatGPT functionality)

## Rank Card System
The bot now features a completely custom-designed rank card system with:
- **Professional Design**: Gradient backgrounds with glass morphism effects
- **Visual Effects**: Glow effects, sparkles, and smooth borders
- **Status Indicators**: Live user status with beautiful indicators
- **Progress Bars**: Animated XP progress with gradient fills
- **Level Badges**: Golden level badges with glow effects
- **Fallback System**: Automatic fallback to canvacord if custom rendering fails

## Notes
- Node 18+ required (declared in `package.json`).
- Canvas library used for custom rank card rendering.
- Memory optimized with lazy loading and cache limits.
- If you add more environment variables, remember to set them both locally and on Discloud.
