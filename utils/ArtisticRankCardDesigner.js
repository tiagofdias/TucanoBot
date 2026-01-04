const { createCanvas, loadImage, registerFont } = require('canvas');

class ArtisticRankCardDesigner {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.setupFonts();
  }

  setupFonts() {
    try {
      registerFont('./Poppins/Poppins-Bold.ttf', { family: 'Poppins', weight: 'bold' });
      registerFont('./Poppins/Poppins-SemiBold.ttf', { family: 'Poppins', weight: '600' });
      registerFont('./Poppins/Poppins-Medium.ttf', { family: 'Poppins', weight: '500' });
      registerFont('./Poppins/Poppins-Regular.ttf', { family: 'Poppins', weight: 'normal' });
      console.log('Poppins fonts loaded for artistic rank card');
    } catch (error) {
      console.log('Poppins font loading failed:', error.message);
    }
  }

  async createRankCard(data) {
    const { username, avatar, level, currentXP, requiredXP, rank, status } = data;
    
    // Beautiful card dimensions
    const width = 934;
    const height = 282;
    
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');

    // Draw artistic watercolor-style background
    this.drawArtisticBackground();
    
    // Draw avatar with artistic frame
    await this.drawArtisticAvatar(avatar, status);
    
    // Draw user info with artistic typography
    this.drawArtisticUserInfo(username, level, rank);
    
    // Draw artistic XP progress bar
    this.drawArtisticXPProgress(currentXP, requiredXP);
    
    return this.canvas.toBuffer('image/png');
  }

  drawArtisticBackground() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Create a beautiful watercolor-inspired gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1a1a2e');     // Deep purple-blue
    bgGradient.addColorStop(0.3, '#16213e');   // Dark blue
    bgGradient.addColorStop(0.6, '#0f3460');   // Rich blue
    bgGradient.addColorStop(1, '#1a1a2e');     // Back to deep purple-blue
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add watercolor texture effect with organic shapes
    this.drawWatercolorTexture();

    // Add main card with soft edges
    this.drawMainCard();
  }

  drawWatercolorTexture() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Soft organic blob shapes for watercolor effect
    const colors = [
      'rgba(139, 92, 246, 0.08)',   // Purple
      'rgba(59, 130, 246, 0.06)',   // Blue
      'rgba(236, 72, 153, 0.05)',   // Pink
      'rgba(16, 185, 129, 0.04)',   // Green
      'rgba(251, 191, 36, 0.03)',   // Yellow
    ];

    for (let i = 0; i < 12; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 50 + Math.random() * 150;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const color = colors[Math.floor(Math.random() * colors.length)];
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color.replace('0.0', '0.0'));
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add subtle sparkle/star effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawMainCard() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Soft rounded rectangle as main card
    const cardX = 20;
    const cardY = 20;
    const cardWidth = width - 40;
    const cardHeight = height - 40;
    const radius = 25;

    // Glassmorphism background
    const glassGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    glassGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
    glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    
    ctx.fillStyle = glassGradient;
    this.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, radius);

    // Elegant border glow
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 1.5;
    this.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, radius);
  }

  async drawArtisticAvatar(avatarUrl, status) {
    const ctx = this.ctx;
    const avatarSize = 140;
    const avatarX = 55;
    const avatarY = 55;

    try {
      if (avatarUrl && avatarUrl !== 'undefined' && !avatarUrl.includes('null')) {
        const avatar = await loadImage(avatarUrl);

        // Decorative rings around avatar
        for (let i = 3; i >= 0; i--) {
          const ringRadius = avatarSize/2 + 8 + (i * 4);
          const gradient = ctx.createRadialGradient(
            avatarX + avatarSize/2, avatarY + avatarSize/2, ringRadius - 2,
            avatarX + avatarSize/2, avatarY + avatarSize/2, ringRadius + 2
          );
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.1 - i * 0.02})`);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, ringRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Avatar glow
        const glowGradient = ctx.createRadialGradient(
          avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 - 5,
          avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 15
        );
        glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 10, 0, Math.PI * 2);
        ctx.fill();

        // Avatar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Draw avatar with clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Status indicator
        this.drawArtisticStatus(avatarX + avatarSize - 20, avatarY + avatarSize - 20, status);
      }
    } catch (error) {
      console.error('Avatar loading failed:', error);
      // Fallback avatar
      const fallbackGradient = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
      fallbackGradient.addColorStop(0, '#8b5cf6');
      fallbackGradient.addColorStop(1, '#ec4899');
      
      ctx.fillStyle = fallbackGradient;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawArtisticStatus(x, y, status) {
    const ctx = this.ctx;
    const statusColors = {
      online: '#10b981',    // Emerald green
      idle: '#f59e0b',      // Amber
      dnd: '#ef4444',       // Red
      offline: '#6b7280'    // Gray
    };

    const color = statusColors[status] || statusColors.offline;

    // Outer glow
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
    glowGradient.addColorStop(0, color);
    glowGradient.addColorStop(0.3, color);
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Background circle
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Status dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawArtisticUserInfo(username, level, rank) {
    const ctx = this.ctx;
    
    // Username with elegant shadow
    ctx.save();
    ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px Poppins, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Sanitize username
    const sanitized = username.replace(/[^\x20-\x7E\u00C0-\u00FF]/g, '').trim() || username;
    ctx.fillText(sanitized, 230, 55);
    ctx.restore();

    // Level badge with gradient background
    const levelX = 230;
    const levelY = 110;
    const levelText = `LEVEL ${level}`;
    
    // Measure text width for pill
    ctx.font = 'bold 16px Poppins, Arial, sans-serif';
    const pillWidth = ctx.measureText(levelText).width + 30;
    const pillHeight = 32;

    // Gradient pill background
    const pillGradient = ctx.createLinearGradient(levelX, levelY, levelX + pillWidth, levelY);
    pillGradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
    pillGradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');
    
    ctx.fillStyle = pillGradient;
    this.drawRoundedRect(levelX, levelY, pillWidth, pillHeight, 16);
    
    // Level text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Poppins, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(levelText, levelX + pillWidth/2, levelY + pillHeight/2);

    // Rank with artistic styling - top right
    ctx.save();
    ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
    ctx.shadowBlur = 15;
    
    // Rank number with gradient
    ctx.font = 'bold 56px Poppins, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    const rankGradient = ctx.createLinearGradient(800, 45, 880, 100);
    rankGradient.addColorStop(0, '#8b5cf6');
    rankGradient.addColorStop(1, '#ec4899');
    
    ctx.fillStyle = rankGradient;
    ctx.fillText(`#${rank}`, 890, 45);
    ctx.restore();
  }

  drawArtisticXPProgress(currentXP, requiredXP) {
    const ctx = this.ctx;
    const progress = Math.min(currentXP / requiredXP, 1);
    
    // Progress bar dimensions
    const barX = 230;
    const barY = 170;
    const barWidth = 640;
    const barHeight = 24;
    const radius = 12;

    // Background with inner shadow effect
    const bgGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    bgGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    
    ctx.fillStyle = bgGradient;
    this.drawRoundedRect(barX, barY, barWidth, barHeight, radius);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    this.strokeRoundedRect(barX, barY, barWidth, barHeight, radius);

    // Progress fill with beautiful gradient
    if (progress > 0) {
      const fillWidth = Math.max((barWidth - 4) * progress, barHeight);
      
      const fillGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      fillGradient.addColorStop(0, '#8b5cf6');     // Purple
      fillGradient.addColorStop(0.5, '#a855f7');   // Lighter purple
      fillGradient.addColorStop(1, '#ec4899');     // Pink
      
      ctx.fillStyle = fillGradient;
      this.drawRoundedRect(barX + 2, barY + 2, fillWidth, barHeight - 4, radius - 2);
      
      // Glow effect
      ctx.save();
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 15;
      ctx.fillStyle = fillGradient;
      this.drawRoundedRect(barX + 2, barY + 2, fillWidth, barHeight - 4, radius - 2);
      ctx.restore();

      // Shine effect on progress bar
      const shineGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight/2);
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      shineGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = shineGradient;
      this.drawRoundedRect(barX + 2, barY + 2, fillWidth, barHeight/2 - 2, radius - 2);
    }

    // XP text with artistic styling
    const xpTextY = barY + barHeight + 18;
    
    ctx.font = '16px Poppins, Arial, sans-serif';
    ctx.textBaseline = 'top';
    
    // Current / Required XP
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(`${currentXP.toLocaleString()} / ${requiredXP.toLocaleString()} XP`, barX, xpTextY);
    
    // Percentage
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px Poppins, Arial, sans-serif';
    ctx.fillText(`${Math.round(progress * 100)}%`, barX + barWidth, xpTextY);
  }

  drawRoundedRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    if (width < 0) return;
    
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

  strokeRoundedRect(x, y, width, height, radius) {
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
    ctx.stroke();
  }
}

module.exports = ArtisticRankCardDesigner;
