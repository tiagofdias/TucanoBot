const { createCanvas, loadImage, registerFont } = require('canvas');

class BirthdayCardDesigner {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  async registerFonts() {
    try {
      registerFont('./Poppins/Poppins-Bold.ttf', { family: 'Poppins', weight: 'bold' });
      registerFont('./Poppins/Poppins-SemiBold.ttf', { family: 'Poppins', weight: '600' });
      registerFont('./Poppins/Poppins-Medium.ttf', { family: 'Poppins', weight: '500' });
      registerFont('./Poppins/Poppins-Regular.ttf', { family: 'Poppins', weight: 'normal' });
    } catch (error) {
      console.log('Poppins font loading failed:', error.message);
    }
  }

  async createBirthdayList(birthdaysData) {
    await this.registerFonts();
    
    const cardHeight = 100;
    const cardSpacing = 20;
    const padding = 40;
    const width = 800;
    const height = padding * 2 + (cardHeight * birthdaysData.length) + (cardSpacing * (birthdaysData.length - 1));
    
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');

    // Modern gradient background
    const bgGradient = this.ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#E6F3FF');
    bgGradient.addColorStop(1, '#F0F8FF');
    
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, width, height);

    // Draw birthday cards
    for (let i = 0; i < birthdaysData.length; i++) {
      const birthday = birthdaysData[i];
      const cardY = padding + (cardHeight + cardSpacing) * i;
      await this.drawBirthdayCard(birthday, cardY);
    }

    return this.canvas.toBuffer('image/png');
  }

  async drawBirthdayCard(birthdayData, cardY) {
    const ctx = this.ctx;
    const cardX = 40;
    const cardWidth = 720;
    const cardHeight = 100;
    
    // Card background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#2C2F36';
    this.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 20);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw avatar
    await this.drawAvatar(birthdayData.avatar, cardX + 20, cardY + 20, 60);
    
    // Draw user info
    this.drawUserInfo(birthdayData, cardX + 100, cardY);
    
    // Draw date pill
    this.drawDatePill(birthdayData.date, birthdayData.month, cardX + cardWidth - 200, cardY + 25);
  }

  async drawAvatar(avatarUrl, x, y, size) {
    const ctx = this.ctx;
    
    try {
      if (avatarUrl && avatarUrl !== 'undefined' && !avatarUrl.includes('null')) {
        const avatar = await loadImage(avatarUrl);
        
        // Draw avatar with clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
      } else {
        // Fallback avatar
        ctx.fillStyle = '#4F545C';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#72767D';
        ctx.font = `${size/2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👤', x + size/2, y + size/2);
      }
    } catch (error) {
      console.error('Avatar loading failed:', error);
      // Fallback avatar
      ctx.fillStyle = '#4F545C';
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawUserInfo(birthdayData, x, y) {
    const ctx = this.ctx;
    
    // Username - sanitize to remove emojis, special Unicode, and Discord decorations
    // Keep only printable ASCII and common Latin characters
    const sanitizedUsername = birthdayData.username
      .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, '') // Keep ASCII + Latin Extended
      .trim();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Poppins, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(sanitizedUsername || birthdayData.username, x, y + 20);
    
    // Birthday text
    ctx.fillStyle = '#B9BBBE';
    ctx.font = '16px Poppins, Arial, sans-serif';
    ctx.fillText('Birthday', x, y + 55);
  }

  drawDatePill(date, monthName, x, y) {
    const ctx = this.ctx;
    
    // Month colors (different color for each month)
    const monthColors = {
      'January': '#FF6B9D',
      'February': '#FF8A65', 
      'March': '#AED581',
      'April': '#81C784',
      'May': '#4DB6AC',
      'June': '#4FC3F7',
      'July': '#64B5F6',
      'August': '#9575CD',
      'September': '#F06292',
      'October': '#FFB74D',
      'November': '#FF8A65',
      'December': '#E57373'
    };

    const color = monthColors[monthName] || '#5865F2';
    const pillWidth = 150;
    const pillHeight = 50;
    
    // Date pill background
    ctx.fillStyle = color;
    this.drawRoundedRect(x, y, pillWidth, pillHeight, 25);
    
    // Date text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Poppins, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(date, x + pillWidth/2, y + pillHeight/2);
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
}

module.exports = BirthdayCardDesigner;
