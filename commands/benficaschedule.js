const { SlashCommandBuilder } = require('discord.js');
const https = require('https');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('benficaschedule')
        .setDescription('Show all upcoming Benfica matches (next 5 games)'),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Get all matches from multiple sources
            const allMatches = await this.getAllBenficaMatches();
            
            if (allMatches.length === 0) {
                await interaction.editReply('❌ No upcoming Benfica matches found.');
                return;
            }

            // Sort by date
            allMatches.sort((a, b) => {
                const dateA = new Date(a.dateEvent + 'T' + a.strTime);
                const dateB = new Date(b.dateEvent + 'T' + b.strTime);
                return dateA - dateB;
            });

            // Take first 5 matches
            const upcomingMatches = allMatches.slice(0, 5);
            
            let response = `🔴⚪️ **BENFICA UPCOMING MATCHES** 🦅\n\n`;
            
            upcomingMatches.forEach((match, index) => {
                const matchDate = new Date(match.dateEvent + 'T' + match.strTime);
                const now = new Date();
                const timeDiff = matchDate.getTime() - now.getTime();
                const daysUntil = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hoursUntil = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                let timeString = '';
                if (timeDiff > 0) {
                    if (daysUntil > 0) {
                        timeString = `in ${daysUntil}d ${hoursUntil}h`;
                    } else if (hoursUntil > 0) {
                        timeString = `in ${hoursUntil}h`;
                    } else {
                        timeString = 'soon!';
                    }
                } else {
                    timeString = 'started/finished';
                }

                const isHome = match.strHomeTeam === 'Benfica';
                const opponent = isHome ? match.strAwayTeam : match.strHomeTeam;
                const emoji = index === 0 ? '🎯' : `${index + 1}️⃣`;
                
                response += `${emoji} **Benfica ${isHome ? 'vs' : '@'} ${opponent}**\n`;
                response += `📅 ${matchDate.toLocaleDateString('en-GB')} at ${matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\n`;
                response += `🏆 ${match.strLeague}\n`;
                response += `⏳ ${timeString}\n\n`;
            });

            response += `*Automatic red theme activates 2 hours before each match* 🔴\n`;
            response += `**FORÇA BENFICA!** 🦅❤️`;

            await interaction.editReply(response);

        } catch (error) {
            console.error('Schedule command error:', error);
            await interaction.editReply('❌ Error fetching Benfica schedule.');
        }
    },

    async getAllBenficaMatches() {
        const allMatches = [];

        // Method 1: Portuguese Liga
        try {
            const ligaMatches = await this.fetchFromPortugueseLiga();
            if (ligaMatches) allMatches.push(...ligaMatches);
        } catch (error) {
            console.log('Liga API failed');
        }

        // Method 2: Manual matches
        try {
            const manualMatches = await this.getKnownUpcomingMatches();
            if (manualMatches) allMatches.push(...manualMatches);
        } catch (error) {
            console.log('Manual matches failed');
        }

        // Remove duplicates
        const uniqueMatches = allMatches.filter((match, index, self) => 
            index === self.findIndex(m => 
                m.dateEvent === match.dateEvent && 
                m.strTime === match.strTime &&
                (m.strHomeTeam === match.strHomeTeam || m.strAwayTeam === match.strAwayTeam)
            )
        );

        return uniqueMatches;
    },

    fetchFromPortugueseLiga() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'www.thesportsdb.com',
                path: '/api/v1/json/3/eventsround.php?id=4344&r=1&s=2025-2026',
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.events) {
                            const benficaMatches = response.events
                                .filter(match => 
                                    match.strHomeTeam === 'Benfica' || match.strAwayTeam === 'Benfica'
                                )
                                .filter(match => {
                                    const matchDate = new Date(match.dateEvent + 'T' + match.strTime);
                                    return matchDate > new Date();
                                });
                            resolve(benficaMatches);
                        } else {
                            resolve([]);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            req.end();
        });
    },

    getKnownUpcomingMatches() {
        const today = new Date();
        const knownMatches = [
            {
                idEvent: 'manual_001',
                strEvent: 'Benfica vs Fenerbahçe',
                strHomeTeam: 'Benfica',
                strAwayTeam: 'Fenerbahçe',
                dateEvent: '2025-08-21',
                strTime: '20:00:00',
                strLeague: 'UEFA Champions League',
                strVenue: 'Estádio da Luz'
            },
            {
                idEvent: 'manual_002',
                strEvent: 'Benfica vs Casa Pia',
                strHomeTeam: 'Benfica',
                strAwayTeam: 'Casa Pia',
                dateEvent: '2025-08-24',
                strTime: '18:00:00',
                strLeague: 'Portuguese Primeira Liga',
                strVenue: 'Estádio da Luz'
            }
        ];

        return knownMatches.filter(match => {
            const matchDate = new Date(match.dateEvent + 'T' + match.strTime);
            return matchDate > today;
        });
    }
};
