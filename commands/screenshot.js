const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('screenshot')
        .setDescription('Take a screenshot of a website')
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('The website URL to screenshot')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 }); // Make command only visible to user
        
        const url = interaction.options.getString('url');
        
        // Validate URL format
        const urlRegex = /^https?:\/\/.+/i;
        if (!urlRegex.test(url)) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Invalid URL')
                        .setDescription('Please provide a valid URL starting with http:// or https://')
                        .setColor('#ED4245')
                ],
                flags: 64 // Error message also only visible to user
            });
        }

        let browser;
        try {
            // Launch browser
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080'
                ]
            });
            
            const page = await browser.newPage();
            
            // Set viewport and user agent
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            // Set timeout and navigate
            await page.goto(url, { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });
            
            // Wait a bit for dynamic content to load (using Promise instead of page.waitForTimeout)
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Take screenshot
            const screenshot = await page.screenshot({ 
                type: 'png',
                fullPage: false // Just the viewport, not full page
            });
            
            // Create attachment
            const attachment = new AttachmentBuilder(screenshot, { 
                name: 'website-screenshot.png',
                description: `Screenshot of ${url}`
            });
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('📸 Website Screenshot')
                .setImage('attachment://website-screenshot.png')
                .setColor('#5865F2')
                .setFooter({ text: `Requested by ${interaction.user.displayName}` })
                .setTimestamp();
            
            // Send screenshot
            await interaction.editReply({ 
                embeds: [embed], 
                files: [attachment],
                flags: 64 // Screenshot only visible to user
            });
            
        } catch (error) {
            console.log(`Screenshot command error for ${url}:`, error.message);
            
            // Send error message if screenshot fails
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Screenshot Failed')
                .setDescription(`Could not capture screenshot of: [${url}](${url})\n\`\`\`${error.message}\`\`\`\n\n**Possible reasons:**\n• Website blocks automated access\n• Page took too long to load\n• Network/connection issues\n• Invalid or inaccessible URL`)
                .setColor('#ED4245')
                .setFooter({ text: 'Try again or use a different URL' });
            
            await interaction.editReply({ 
                embeds: [errorEmbed],
                flags: 64 // Error message only visible to user
            });
            
        } finally {
            // Always close browser
            if (browser) {
                await browser.close();
            }
        }
    },
};
