const { createCanvas, loadImage, registerFont } = require('canvas');

class CleanRankCardDesigner {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.setupFonts();
    this.setupRoundRect();
  }

  async setupFonts() {
    try {
      // Register Poppins fonts with correct paths
      registerFont('./Poppins/Poppins-Bold.ttf', { family: 'Poppins', weight: 'bold' });
      registerFont('./Poppins/Poppins-SemiBold.ttf', { family: 'Poppins', weight: '600' });
      registerFont('./Poppins/Poppins-Medium.ttf', { family: 'Poppins', weight: '500' });
      registerFont('./Poppins/Poppins-Regular.ttf', { family: 'Poppins', weight: 'normal' });
      console.log('Poppins fonts loaded successfully');
    } catch (error) {
      console.log('Poppins font loading failed:', error.message);
    }
  }

  async createRankCard(data) {
    const { username, avatar, level, currentXP, requiredXP, rank, status } = data;
    
    // Modern card dimensions like the reference image
    const width = 900;
    const height = 350;
    
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');

    // Draw modern glass morphism background
    this.drawModernBackground();
    
    // Draw avatar with modern styling
    await this.drawModernAvatar(avatar, status);
    
    // Draw user info in modern layout
    this.drawModernUserInfo(username, level, rank);
    
    // Draw modern XP progress bar
    this.drawModernXPProgress(currentXP, requiredXP, status);
    
    return this.canvas.toBuffer('image/png');
  }

  drawModernBackground() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Create smooth gradient background similar to the reference
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#4A5568');
    bgGradient.addColorStop(0.5, '#2D3748');
    bgGradient.addColorStop(1, '#1A202C');
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle geometric pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = 0; x < width; x += 50) {
      for (let y = 0; y < height; y += 50) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Main glass card with rounded corners
    const cardX = 30;
    const cardY = 30;
    const cardWidth = width - 60;
    const cardHeight = height - 60;
    const cornerRadius = 20;

    // Glass morphism effect
    const glassGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    
    ctx.fillStyle = glassGradient;
    this.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, cornerRadius);

    // Subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cornerRadius);
    ctx.stroke();
  }

  async drawModernAvatar(avatarUrl, status) {
    const ctx = this.ctx;
    const avatarSize = 120;
    const avatarX = 70;
    const avatarY = 70;

    try {
      if (avatarUrl && avatarUrl !== 'undefined' && !avatarUrl.includes('null')) {
        const avatar = await loadImage(avatarUrl);
        
        // Draw avatar background with glass effect
        const avatarBgGradient = ctx.createRadialGradient(avatarX + avatarSize/2, avatarY + avatarSize/2, 0, avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2);
        avatarBgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        avatarBgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        
        ctx.fillStyle = avatarBgGradient;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw avatar with clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Modern status indicator
        this.drawModernStatusIndicator(avatarX + avatarSize - 15, avatarY + avatarSize - 15, status);
      }
    } catch (error) {
      console.error('Avatar loading failed:', error);
      // Draw fallback avatar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawModernStatusIndicator(x, y, status) {
    const ctx = this.ctx;
    const statusColors = {
      online: '#3BA55D',    // Discord Green
      idle: '#FAA81A',      // Discord Yellow  
      dnd: '#ED4245',       // Discord Red
      offline: '#747F8D'    // Discord Gray
    };

    const color = statusColors[status] || statusColors.offline;
    
    // Background ring
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Status circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawModernUserInfo(username, level, rank) {
    const ctx = this.ctx;
    
    // Username - large and prominent
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Poppins, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(username, 220, 80);

    // Rank - top right corner style
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Poppins, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`#${rank}`, 820, 60);

    // Level info - modern layout
    const levelX = 220;
    const levelY = 140;
    
    // Level background pill
    const pillWidth = 120;
    const pillHeight = 35;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.drawRoundedRect(levelX, levelY, pillWidth, pillHeight, 17);
    
    // Level text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Poppins, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LEVEL ${level}`, levelX + pillWidth/2, levelY + pillHeight/2);
  }

  drawModernXPProgress(currentXP, requiredXP, status) {
    const ctx = this.ctx;
    const progress = Math.min(currentXP / requiredXP, 1);
    
    // Status-based progress bar colors
    const statusColors = {
      online: '#3BA55D',    // Discord Green
      idle: '#FAA81A',      // Discord Yellow  
      dnd: '#ED4245',       // Discord Red
      offline: '#747F8D'    // Discord Gray
    };

    const progressColor = statusColors[status] || statusColors.offline;
    
    // Progress bar positioning - modern layout like reference image
    const progressX = 220;
    const progressY = 230;
    const progressWidth = 580;
    const progressHeight = 25;

    // Progress background with glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this.drawRoundedRect(progressX, progressY, progressWidth, progressHeight, 12);

    // Progress fill with gradient
    if (progress > 0) {
      const fillGradient = ctx.createLinearGradient(progressX, progressY, progressX + progressWidth, progressY);
      fillGradient.addColorStop(0, progressColor);
      fillGradient.addColorStop(1, this.lightenColor(progressColor, 20)); // Lighter shade
      
      ctx.fillStyle = fillGradient;
      this.drawRoundedRect(progressX, progressY, progressWidth * progress, progressHeight, 12);
      
      // Add glow effect
      ctx.shadowColor = progressColor;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      this.drawRoundedRect(progressX, progressY, progressWidth * progress, progressHeight, 12);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    // XP text - positioned like reference image
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Poppins, Arial, sans-serif';
    ctx.textBaseline = 'top';
    
    // Current XP / Required XP format
    const xpText = `${currentXP.toLocaleString()} / ${requiredXP.toLocaleString()}`;
    ctx.textAlign = 'left';
    ctx.fillText(xpText, progressX, progressY + progressHeight + 10);
    
    // Percentage
    const percentText = `${Math.round(progress * 100)}%`;
    ctx.textAlign = 'right';
    ctx.fillText(percentText, progressX + progressWidth, progressY + progressHeight + 10);
  }

  lightenColor(color, percent) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Lighten by percentage
    const factor = (100 + percent) / 100;
    const newR = Math.min(255, Math.round(r * factor));
    const newG = Math.min(255, Math.round(g * factor));
    const newB = Math.min(255, Math.round(b * factor));
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  async drawAvatar(avatarUrl, status) {
    const ctx = this.ctx;
    const avatarSize = 100;
    const avatarX = 50;
    const avatarY = 50;

    let avatarDrawn = false;
    
    try {
      if (avatarUrl && avatarUrl !== 'undefined' && !avatarUrl.includes('null')) {
        const avatar = await loadImage(avatarUrl);
        
        // Draw avatar with clean clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        avatarDrawn = true;
      }
    } catch (error) {
      console.log('Avatar load failed, using default');
    }

    if (!avatarDrawn) {
      // Clean default avatar
      ctx.fillStyle = '#5865F2';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '40px Poppins, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👤', avatarX + avatarSize/2, avatarY + avatarSize/2);
    }

    // Simple status indicator
    this.drawStatusIndicator(avatarX + avatarSize - 15, avatarY + avatarSize - 15, status);
  }

  drawStatusIndicator(x, y, status) {
    const ctx = this.ctx;
    const statusColors = {
      online: '#3BA55D',    // Discord Green
      idle: '#FAA81A',      // Discord Yellow  
      dnd: '#ED4245',       // Discord Red
      offline: '#747F8D'    // Discord Gray
    };

    const color = statusColors[status] || statusColors.offline;
    
    // Background circle (Discord dark theme background)
    ctx.fillStyle = '#36393F';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Status circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawUserInfo(username, level, rank) {
    const ctx = this.ctx;
    
    // Username with Poppins Bold
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Poppins, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(username, 180, 60);

    // Level text
    ctx.fillStyle = '#B9BBBE';
    ctx.font = '20px Poppins, Arial, sans-serif';
    ctx.fillText('LEVEL', 180, 110);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Poppins, Arial, sans-serif';
    ctx.fillText(level.toString(), 180, 135);

    // Rank text
    ctx.fillStyle = '#B9BBBE';
    ctx.font = '20px Poppins, Arial, sans-serif';
    ctx.fillText('RANK', 300, 110);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Poppins, Arial, sans-serif';
    ctx.fillText(`#${rank}`, 300, 135);
  }

  drawXPProgress(currentXP, requiredXP, status = 'offline') {
    const ctx = this.ctx;
    const progress = Math.min(currentXP / requiredXP, 1);
    
    // Status-based progress bar colors
    const statusColors = {
      online: '#3BA55D',    // Discord Green
      idle: '#FAA81A',      // Discord Yellow  
      dnd: '#ED4245',       // Discord Red
      offline: '#747F8D'    // Discord Gray
    };

    const progressColor = statusColors[status] || statusColors.offline;
    
    // Progress section
    const progressX = 180;
    const progressY = 190;
    const progressWidth = 550;
    const progressHeight = 30;

    // XP Label
    ctx.fillStyle = '#B9BBBE';
    ctx.font = '18px Poppins, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('EXPERIENCE', progressX, progressY);

    // Progress bar background (using manual rounded rectangle)
    ctx.fillStyle = '#40444B';
    this.drawRoundedRect(progressX, progressY + 25, progressWidth, progressHeight, 15);

    // Progress bar fill with status-based color
    if (progress > 0) {
      const fillGradient = ctx.createLinearGradient(progressX, progressY + 25, progressX + progressWidth, progressY + 25);
      fillGradient.addColorStop(0, progressColor);
      fillGradient.addColorStop(1, this.darkenColor(progressColor, 20)); // Darker shade
      
      ctx.fillStyle = fillGradient;
      this.drawRoundedRect(progressX, progressY + 25, progressWidth * progress, progressHeight, 15);
    }

    // XP text below progress bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Poppins, Arial, sans-serif';
    ctx.textBaseline = 'top';
    
    ctx.textAlign = 'left';
    ctx.fillText(`${currentXP.toLocaleString()} XP`, progressX, progressY + 65);
    
    ctx.textAlign = 'right';
    ctx.fillText(`${requiredXP.toLocaleString()} XP`, progressX + progressWidth, progressY + 65);
    
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(progress * 100)}%`, progressX + progressWidth/2, progressY + 65);
  }

  darkenColor(color, percent) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Darken by percentage
    const factor = (100 - percent) / 100;
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  drawRoundedRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  // Add roundRect method if it doesn't exist
  setupRoundRect() {
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
}

module.exports = CleanRankCardDesigner;
