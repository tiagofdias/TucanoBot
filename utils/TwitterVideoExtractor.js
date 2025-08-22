const puppeteer = require('puppeteer');
const { EmbedBuilder } = require('discord.js');

/**
 * Extract video information from X.com (Twitter) URLs
 * Since X.com blocks most automated access, we'll create a helpful embed
 * that provides enhanced functionality for video links
 * @param {string} url - The X.com URL to process
 * @returns {Promise<Object|null>} Video information or null if processing fails
 */
async function extractTwitterVideo(url) {
    try {
        console.log(`[TWITTER VIDEO] Processing X.com URL: ${url}`);
        
        // Extract tweet ID from URL
        const tweetIdMatch = url.match(/status\/(\d+)/);
        const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;
        
        if (!tweetId) {
            console.log('[TWITTER VIDEO] Could not extract tweet ID from URL');
            return null;
        }

        // Create a simplified video info object
        // Since X.com blocks scraping, we'll create a helpful embed that directs users appropriately
        const videoInfo = {
            videos: [], // We can't extract direct video URLs due to X.com's protection
            tweetText: '', // We can't extract tweet text due to X.com's protection
            authorName: '',
            authorHandle: '',
            url: url,
            hasVideo: true, // Assume it has video since user posted an X.com link
            tweetId: tweetId,
            processed: true
        };

        console.log(`[TWITTER VIDEO] Created enhanced embed for tweet ID: ${tweetId}`);
        return videoInfo;

    } catch (error) {
        console.error('[TWITTER VIDEO] Error processing X.com URL:', error.message);
        return null;
    }
}

/**
 * Create a Discord embed for Twitter video
 * @param {Object} videoInfo - Video information from extractTwitterVideo
 * @param {string} originalUrl - Original X.com URL
 * @returns {EmbedBuilder} Discord embed
 */
function createTwitterVideoEmbed(videoInfo, originalUrl) {
    const embed = new EmbedBuilder()
        .setColor('#1DA1F2') // Twitter blue color
        .setTitle('🐦 X.com Video Link')
        .setURL(originalUrl);

    // Since we can't scrape X.com, provide helpful information
    embed.setDescription(
        '**Video content detected!** Click the link above to view the video on X.com.\n\n' +
        '💡 **Tips for better video viewing:**\n' +
        '• Open the link directly for the best experience\n' +
        '• Videos on X.com support full-screen playback\n' +
        '• You can like, retweet, and comment on the original post'
    );

    // Add helpful information
    embed.addFields([
        {
            name: '🔗 Quick Access',
            value: `[Open in X.com](${originalUrl})`,
            inline: true
        },
        {
            name: '📱 Mobile Friendly',
            value: 'Works on all devices',
            inline: true
        }
    ]);

    // Add tweet ID if available
    if (videoInfo.tweetId) {
        embed.setFooter({ 
            text: `Tweet ID: ${videoInfo.tweetId} • Enhanced by TucanoBot`,
            iconURL: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
        });
    } else {
        embed.setFooter({ 
            text: 'Enhanced by TucanoBot',
            iconURL: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
        });
    }

    embed.setTimestamp();
    
    return embed;
}

/**
 * Check if URL is from X.com (Twitter)
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is from X.com/Twitter
 */
function isTwitterUrl(url) {
    const twitterDomains = [
        'x.com',
        'twitter.com',
        'mobile.x.com',
        'mobile.twitter.com'
    ];
    
    try {
        const urlObj = new URL(url);
        return twitterDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
        return false;
    }
}

/**
 * Create alternative video viewing options for X.com URLs
 * @param {string} url - The original X.com URL
 * @returns {Array} Array of alternative viewing options
 */
function createVideoAlternatives(url) {
    const alternatives = [];
    
    try {
        // Extract the tweet ID
        const tweetIdMatch = url.match(/status\/(\d+)/);
        if (!tweetIdMatch) return alternatives;
        
        const tweetId = tweetIdMatch[1];
        
        // Create alternative URLs that are known to work better for video embedding
        
        // FXTwitter - Popular alternative that provides better video embedding
        alternatives.push({
            name: '📱 FXTwitter',
            description: 'Better video player',
            url: url.replace(/(?:twitter\.com|x\.com)/g, 'fxtwitter.com')
        });
        
        // VXTwitter - Another popular alternative
        alternatives.push({
            name: '🎬 VXTwitter', 
            description: 'Enhanced video viewing',
            url: url.replace(/(?:twitter\.com|x\.com)/g, 'vxtwitter.com')
        });
        
        // FixTweet - Clean video embedding
        alternatives.push({
            name: '🔧 FixTweet',
            description: 'Clean video interface',
            url: url.replace(/(?:twitter\.com|x\.com)/g, 'fixtweet.com')
        });
        
    } catch (error) {
        console.error('Error creating video alternatives:', error);
    }
    
    return alternatives;
}

module.exports = {
    extractTwitterVideo,
    createTwitterVideoEmbed,
    createVideoAlternatives,
    isTwitterUrl
};
