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
        await interaction.deferReply({ flags: 64 }); // Ephemeral reply (only visible to user)
        
        const url = interaction.options.getString('url');
        
        // Validate URL format
        const urlRegex = /^https?:\/\/.+/i;
        if (!urlRegex.test(url)) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Invalid URL')
                        .setDescription('Please provide a valid URL starting with `http://` or `https://`')
                        .setColor('#ED4245')
                ],
                flags: 64
            });
        }

        let browser;
        try {
            // Launch browser with comprehensive cloud-compatible arguments
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--window-size=1920,1080'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                timeout: 60000
            });
            
            const page = await browser.newPage();
            
            // Set viewport and realistic user agent
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
            
            // Navigate with timeout
            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            // Wait for dynamic content
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Take screenshot
            const screenshot = await page.screenshot({ 
                type: 'png',
                fullPage: false // Viewport only
            });
            
            await browser.close();
            browser = null;
            
            // Create attachment
            const attachment = new AttachmentBuilder(screenshot, { 
                name: 'screenshot.png',
                description: `Screenshot of ${url}`
            });
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('📸 Website Screenshot')
                .setDescription(`**URL:** [${url}](${url})`)
                .setImage('attachment://screenshot.png')
                .setColor('#5865F2')
                .setFooter({ text: `Requested by ${interaction.user.username}` })
                .setTimestamp();
            
            // Send screenshot
            await interaction.editReply({ 
                embeds: [embed], 
                files: [attachment],
                flags: 64
            });
            
        } catch (error) {
            console.error(`Screenshot command error for ${url}:`, error.message);
            
            // Determine error type for better feedback
            let errorMessage = error.message;
            let suggestions = [
                '• Website blocks automated access',
                '• Page took too long to load',
                '• Network or connection issues',
                '• Invalid or inaccessible URL'
            ];
            
            if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                errorMessage = 'The website took too long to respond (timeout after 30 seconds)';
                suggestions = [
                    '• The website may be slow or down',
                    '• Try again in a few moments',
                    '• Use a different URL'
                ];
            } else if (error.message.includes('net::ERR')) {
                errorMessage = 'Network error - could not reach the website';
                suggestions = [
                    '• The website may be down or blocked',
                    '• Check if the URL is correct',
                    '• Try a different website'
                ];
            }
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Screenshot Failed')
                .setDescription(`**URL:** [${url}](${url})\n\n**Error:** ${errorMessage}\n\n**Possible reasons:**\n${suggestions.join('\n')}`)
                .setColor('#ED4245')
                .setFooter({ text: 'Please try again or use a different URL' });
            
            await interaction.editReply({ 
                embeds: [errorEmbed],
                flags: 64
            });
            
        } finally {
            // Ensure browser is always closed
            if (browser) {
                try {
                    await browser.close();
                } catch (e) {
                    console.error('Error closing browser:', e.message);
                }
            }
        }
    },
};
