const { createCanvas, loadImage, registerFont } = require('canvas');

class LeaderboardDesigner {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.setupRoundRect();
  }

  setupRoundRect() {
    // Add roundRect method if it doesn't exist
    const { createCanvas } = require('canvas');
    const tempCanvas = createCanvas(1, 1);
    const CanvasRenderingContext2D = tempCanvas.getContext('2d').constructor;
    
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      };
    }
  }

  async createLeaderboard(data) {
    const { players, title = 'Server Leaderboard' } = data;
    
    // Canvas dimensions
    const width = 800;
    const height = Math.max(600, 100 + players.length * 70);
    
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');

    // Draw background
    await this.drawBackground();
    
    // Draw title
    this.drawTitle(title);
    
    // Draw players
    await this.drawPlayers(players);
    
    return this.canvas.toBuffer('image/png');
  }

  async drawBackground() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Simple, clean gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2C2F33');
    gradient.addColorStop(1, '#23272A');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Simple header background
    ctx.fillStyle = '#7289DA';
    ctx.fillRect(0, 0, width, 80);
  }

  drawTitle(title) {
    const ctx = this.ctx;
    const width = this.canvas.width;

    // Clean, readable title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText('🏆 ' + title, width / 2, 40);
  }

  async drawPlayers(players) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    let yPos = 100;

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const position = i + 1;
      
      await this.drawPlayerCard(player, position, yPos);
      yPos += 70;
    }
  }

  async drawPlayerCard(player, position, yPos) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const cardHeight = 60;
    const margin = 20;

    // Simple card background
    ctx.fillStyle = position <= 3 ? '#36393F' : '#2F3136';
    ctx.fillRect(margin, yPos, width - (margin * 2), cardHeight);

    // Position number/medal
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(medal, margin + 30, yPos + cardHeight / 2);

    // Load and draw avatar
    let avatarDrawn = false;
    try {
      if (player.avatar && player.avatar !== 'undefined' && !player.avatar.includes('null')) {
        const avatar = await loadImage(player.avatar);
        
        // Draw avatar with proper clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(margin + 80, yPos + cardHeight / 2, 18, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, margin + 80 - 18, yPos + cardHeight / 2 - 18, 36, 36);
        ctx.restore();
        avatarDrawn = true;
      }
    } catch (error) {
      console.log('Avatar load failed, using default');
    }

    if (!avatarDrawn) {
      // Draw clean default avatar
      ctx.fillStyle = '#7289DA';
      ctx.beginPath();
      ctx.arc(margin + 80, yPos + cardHeight / 2, 18, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👤', margin + 80, yPos + cardHeight / 2);
    }

    // Player name - clean and readable
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(player.tag || 'Unknown User', margin + 110, yPos + 20);

    // Level - positioned clearly below name
    ctx.fillStyle = '#B9BBBE';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`Level ${player.level}`, margin + 110, yPos + 40);

    // XP Progress bar - cleaner design
    const progressBarX = margin + 250;
    const progressBarY = yPos + 15;
    const progressBarWidth = 200;
    const progressBarHeight = 12;
    const progress = Math.min(player.xp / player.max_xp, 1);

    // Progress bar background
    ctx.fillStyle = '#4F545C';
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    // Progress bar fill
    ctx.fillStyle = position <= 3 ? '#7289DA' : '#43B581';
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight);

    // XP text - positioned BELOW progress bar for readability
    ctx.fillStyle = '#B9BBBE';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.xp} / ${player.max_xp} XP`, progressBarX + progressBarWidth / 2, yPos + 42);
  }
}

module.exports = LeaderboardDesigner;
