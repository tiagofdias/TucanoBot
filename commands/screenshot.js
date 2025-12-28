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
        await interaction.deferReply({ flags: 64 }); // Ephemeral reply
        
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
            // Launch browser optimized for cloud environments (Render, Heroku, etc.)
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
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-web-security',
                    '--disable-features=site-per-process',
                    '--js-flags=--max-old-space-size=512',
                    '--window-size=1280,720'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                timeout: 120000
            });
            
            const page = await browser.newPage();
            
            // Use smaller viewport for faster rendering on limited resources
            await page.setViewport({ width: 1280, height: 720 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
            
            // Block unnecessary resources to speed up loading
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                // Block heavy resources that aren't needed for screenshots
                if (['media', 'font', 'websocket'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            // Navigate with longer timeout and less strict wait condition
            await page.goto(url, { 
                waitUntil: 'domcontentloaded', // Faster than networkidle0
                timeout: 60000 // Increased to 60 seconds
            });
            
            // Brief wait for initial render
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Take screenshot
            const screenshot = await page.screenshot({ 
                type: 'jpeg', // JPEG is faster and smaller than PNG
                quality: 85,
                fullPage: false
            });
            
            await browser.close();
            browser = null;
            
            // Create attachment
            const attachment = new AttachmentBuilder(screenshot, { 
                name: 'screenshot.jpg',
                description: `Screenshot of ${url}`
            });
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('📸 Website Screenshot')
                .setDescription(`**URL:** [${url}](${url})`)
                .setImage('attachment://screenshot.jpg')
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
            
            // Better error classification
            let errorMessage = error.message;
            let suggestions = [
                '• Website blocks automated access',
                '• Page took too long to load',
                '• Network or connection issues'
            ];
            
            if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                errorMessage = 'The website took too long to respond';
                suggestions = [
                    '• Complex websites with lots of JavaScript may timeout',
                    '• Try a simpler website or the homepage instead of deep links',
                    '• Try again in a few moments'
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
                .setDescription(`**URL:** [${url}](${url})\n\n**Error:** ${errorMessage}\n\n**Suggestions:**\n${suggestions.join('\n')}`)
                .setColor('#ED4245')
                .setFooter({ text: 'Try a simpler URL or try again later' });
            
            await interaction.editReply({ 
                embeds: [errorEmbed],
                flags: 64
            });
            
        } finally {
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
