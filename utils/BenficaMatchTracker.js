const https = require('https');

class BenficaMatchTracker {
    constructor(client) {
        this.client = client;
        this.pollInterval = 30 * 60 * 1000; // 30 minutes
        this.isThemeActive = false;
        this.currentMatchId = null;
        this.lastChecked = null;
        
        // Try multiple free APIs for better coverage
        this.apiSources = [
            {
                name: 'API-Football (free)',
                baseUrl: 'api-football-v1.p.rapidapi.com',
                headers: { 'X-RapidAPI-Key': 'demo', 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' }
            },
            {
                name: 'FootballAPI',
                baseUrl: 'www.footballapi.com',
                headers: {}
            },
            {
                name: 'OpenLigaDB (free)',
                baseUrl: 'www.openligadb.de',
                headers: {}
            }
        ];
        
        console.log('🔴⚪️ Benfica Match Tracker initialized (API-only mode)');
        
        // Start monitoring
        this.startMonitoring();
    }

    startMonitoring() {
        // Initial check
        this.checkUpcomingMatches();
        
        // Set up periodic checking
        setInterval(() => {
            this.checkUpcomingMatches();
        }, this.pollInterval);
    }

    async checkUpcomingMatches() {
        try {
            console.log('🔍 Checking for Benfica matches (API-only)...');
            
            // Try different free APIs
            const apiMethods = [
                () => this.fetchFromRapidAPI(),
                () => this.fetchFromFootballDataOrg(),
                () => this.fetchFromLiveScore(),
                () => this.fetchFromTheSportsDB()
            ];
            
            let allMatches = [];
            
            for (const method of apiMethods) {
                try {
                    console.log('🔄 Trying next API...');
                    const matches = await method();
                    if (matches && matches.length > 0) {
                        console.log(`✅ API SUCCESS: Found ${matches.length} Benfica matches`);
                        allMatches = matches;
                        break; // Use first successful API
                    }
                } catch (error) {
                    console.log(`⚠️ API failed: ${error.message}`);
                }
            }
            
            if (allMatches.length > 0) {
                // Sort matches by date
                allMatches.sort((a, b) => {
                    const dateA = new Date(a.dateEvent + 'T' + a.strTime);
                    const dateB = new Date(b.dateEvent + 'T' + b.strTime);
                    return dateA - dateB;
                });
                
                const nextMatch = allMatches[0];
                console.log(`🎯 NEXT MATCH: ${nextMatch.strHomeTeam} vs ${nextMatch.strAwayTeam} on ${nextMatch.dateEvent}`);
                await this.processMatch(nextMatch);
            } else {
                console.log('📅 No upcoming Benfica matches found in any API');
            }
            
            this.lastChecked = new Date();
            
        } catch (error) {
            console.error('❌ Error checking matches:', error.message);
        }
    }

    fetchUpcomingMatches() {
        return new Promise((resolve, reject) => {
            // Try TheSportsDB as fallback
            const options = {
                hostname: 'www.thesportsdb.com',
                path: '/api/v1/json/3/eventsnext.php?id=134108',
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.events && response.events.length > 0) {
                            const benficaMatches = response.events.filter(match => 
                                match.strHomeTeam === 'Benfica' || match.strAwayTeam === 'Benfica'
                            );
                            resolve(benficaMatches);
                        } else {
                            resolve([]);
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('TheSportsDB timeout'));
            });
            req.end();
        });
    }

    fetchFromRapidAPI() {
        return new Promise((resolve, reject) => {
            // Try RapidAPI's football API (has free tier)
            const options = {
                hostname: 'api-football-v1.p.rapidapi.com',
                path: '/v3/fixtures?team=211&next=10', // Benfica's ID
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo',
                    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.response && response.response.length > 0) {
                            const matches = response.response.map(fixture => ({
                                idEvent: fixture.fixture.id.toString(),
                                strEvent: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                                strHomeTeam: fixture.teams.home.name,
                                strAwayTeam: fixture.teams.away.name,
                                dateEvent: fixture.fixture.date.split('T')[0],
                                strTime: fixture.fixture.date.split('T')[1].substring(0, 8),
                                strLeague: fixture.league.name,
                                strVenue: fixture.fixture.venue.name || 'Unknown'
                            }));
                            resolve(matches);
                        } else {
                            resolve([]);
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('RapidAPI timeout'));
            });
            req.end();
        });
    }

    fetchFromFootballDataOrg() {
        return new Promise((resolve, reject) => {
            // Try football-data.org with demo key
            const options = {
                hostname: 'api.football-data.org',
                path: '/v4/teams/1903/matches?status=SCHEDULED&limit=10',
                method: 'GET',
                headers: {
                    'X-Auth-Token': process.env.FOOTBALL_DATA_KEY || 'demo'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.matches && response.matches.length > 0) {
                            const matches = response.matches.map(match => ({
                                idEvent: match.id.toString(),
                                strEvent: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                                strHomeTeam: match.homeTeam.name,
                                strAwayTeam: match.awayTeam.name,
                                dateEvent: match.utcDate.split('T')[0],
                                strTime: match.utcDate.split('T')[1].substring(0, 8),
                                strLeague: match.competition.name,
                                strVenue: 'Stadium'
                            }));
                            resolve(matches);
                        } else {
                            resolve([]);
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Football-data.org timeout'));
            });
            req.end();
        });
    }

    fetchFromLiveScore() {
        return new Promise((resolve, reject) => {
            // Try a different free API
            const options = {
                hostname: 'livescore-api.com',
                path: '/api-client/fixtures/matches.json?key=demo&secret=demo&competition_id=2&team=benfica',
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.data && response.data.fixtures) {
                            const matches = response.data.fixtures
                                .filter(match => 
                                    match.home_name.toLowerCase().includes('benfica') ||
                                    match.away_name.toLowerCase().includes('benfica')
                                )
                                .map(match => ({
                                    idEvent: match.id.toString(),
                                    strEvent: `${match.home_name} vs ${match.away_name}`,
                                    strHomeTeam: match.home_name,
                                    strAwayTeam: match.away_name,
                                    dateEvent: match.date.split(' ')[0],
                                    strTime: match.date.split(' ')[1] + ':00',
                                    strLeague: match.competition_name || 'Unknown',
                                    strVenue: 'Stadium'
                                }));
                            resolve(matches);
                        } else {
                            resolve([]);
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('LiveScore API timeout'));
            });
            req.end();
        });
    }

    fetchFromTheSportsDB() {
        return new Promise((resolve, reject) => {
            // Enhanced TheSportsDB search
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
                                    match.strHomeTeam === 'Benfica' || 
                                    match.strAwayTeam === 'Benfica' ||
                                    match.strHomeTeam === 'SL Benfica' || 
                                    match.strAwayTeam === 'SL Benfica'
                                )
                                .filter(match => {
                                    const matchDate = new Date(match.dateEvent + 'T' + match.strTime);
                                    return matchDate > new Date();
                                });
                            resolve(benficaMatches);
                        } else {
                            resolve([]);
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('TheSportsDB enhanced timeout'));
            });
            req.end();
        });
    }

    async tryFallbackAPI() {
        try {
            console.log('🔄 Trying alternative API...');
            
            // Try API-SPORTS free tier (different approach)
            const matches = await this.fetchFromAlternativeAPI();
            
            if (matches && matches.length > 0) {
                await this.processMatch(matches[0]);
            }
            
        } catch (error) {
            console.log('⚠️ Fallback API also failed. Will retry in next cycle.');
        }
    }

    fetchFromAlternativeAPI() {
        return new Promise((resolve, reject) => {
            // Try different API endpoint for Benfica by league
            const options = {
                hostname: 'www.thesportsdb.com',
                path: '/api/v1/json/3/eventsround.php?id=4344&r=1&s=2025-2026', // Portuguese Liga
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (response.events) {
                            // Filter Benfica matches from league fixtures
                            const benficaMatches = response.events
                                .filter(match => 
                                    match.strHomeTeam === 'Benfica' || match.strAwayTeam === 'Benfica'
                                )
                                .filter(match => {
                                    const matchDate = new Date(match.dateEvent + 'T' + match.strTime);
                                    return matchDate > new Date(); // Only future matches
                                });
                            
                            resolve(benficaMatches);
                        } else {
                            resolve([]);
                        }
                    } catch (parseError) {
                        reject(parseError);
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });
    }

    fetchFromPortugueseLiga() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'www.thesportsdb.com',
                path: '/api/v1/json/3/eventsround.php?id=4344&r=1&s=2025-2026', // Portuguese Liga
                method: 'GET'
            };

            this.makeAPIRequest(options, resolve, reject, 'Portuguese Liga');
        });
    }

    fetchFromChampionsLeague() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'www.thesportsdb.com',
                path: '/api/v1/json/3/eventsround.php?id=4480&r=1&s=2025-2026', // Champions League
                method: 'GET'
            };

            this.makeAPIRequest(options, resolve, reject, 'Champions League');
        });
    }

    fetchFromEuropaLeague() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'www.thesportsdb.com',
                path: '/api/v1/json/3/eventsround.php?id=4481&r=1&s=2025-2026', // Europa League
                method: 'GET'
            };

            this.makeAPIRequest(options, resolve, reject, 'Europa League');
        });
    }

    fetchFromAllCompetitions() {
        return new Promise(async (resolve, reject) => {
            try {
                // Manual check for known upcoming matches (fallback)
                const knownMatches = await this.getKnownUpcomingMatches();
                resolve(knownMatches);
            } catch (error) {
                reject(error);
            }
        });
    }

    makeAPIRequest(options, resolve, reject, competitionName) {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.events) {
                        const benficaMatches = response.events
                            .filter(match => 
                                match.strHomeTeam === 'Benfica' || 
                                match.strAwayTeam === 'Benfica' ||
                                match.strHomeTeam === 'SL Benfica' || 
                                match.strAwayTeam === 'SL Benfica'
                            )
                            .filter(match => {
                                const matchDate = new Date(match.dateEvent + 'T' + match.strTime);
                                return matchDate > new Date();
                            });
                        
                        console.log(`🔍 Found ${benficaMatches.length} Benfica matches in ${competitionName}`);
                        resolve(benficaMatches);
                    } else {
                        resolve([]);
                    }
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error(`${competitionName} API timeout`));
        });

        req.end();
    }

    async getKnownUpcomingMatches() {
        // As a fallback, we can manually define known upcoming matches
        // This would be updated based on real fixture lists
        const today = new Date();
        const knownMatches = [
            {
                idEvent: 'manual_001',
                strEvent: 'Benfica vs Fenerbahçe',
                strHomeTeam: 'Benfica',
                strAwayTeam: 'Fenerbahçe',
                dateEvent: '2025-08-21', // Next Wednesday as you mentioned
                strTime: '20:00:00',
                strLeague: 'UEFA Champions League',
                strVenue: 'Estádio da Luz'
            },
            {
                idEvent: 'manual_002',
                strEvent: 'Benfica vs Casa Pia',
                strHomeTeam: 'Benfica',
                strAwayTeam: 'Casa Pia',
                dateEvent: '2025-08-24', // Example Saturday match
                strTime: '18:00:00',
                strLeague: 'Portuguese Primeira Liga',
                strVenue: 'Estádio da Luz'
            }
            // Add more known matches here as needed
        ];

        const upcomingMatches = knownMatches.filter(match => {
            const matchDate = new Date(match.dateEvent + 'T' + match.strTime);
            return matchDate > today;
        });

        console.log(`🔍 Found ${upcomingMatches.length} manually added Benfica matches`);
        return upcomingMatches;
    }

    async processMatch(match) {
        try {
            const matchDate = new Date(match.dateEvent + 'T' + match.strTime);
            const now = new Date();
            const timeUntilMatch = matchDate.getTime() - now.getTime();
            
            // Convert to hours
            const hoursUntilMatch = timeUntilMatch / (1000 * 60 * 60);
            
            console.log(`📅 Next Benfica match: ${match.strHomeTeam} vs ${match.strAwayTeam} in ${Math.round(hoursUntilMatch)} hours`);
            
            // Activate theme 2 hours before match
            if (hoursUntilMatch <= 2 && hoursUntilMatch > 0 && !this.isThemeActive) {
                await this.activateBenficaTheme(match);
            }
            // Deactivate theme 3 hours after match start
            else if (hoursUntilMatch <= -3 && this.isThemeActive) {
                await this.deactivateBenficaTheme(match);
            }
            
        } catch (error) {
            console.error('❌ Error processing match:', error);
        }
    }

    async activateBenficaTheme(match) {
        try {
            console.log('🔴 Activating Benfica theme...');
            
            const guilds = this.client.guilds.cache;
            
            for (const guild of guilds.values()) {
                try {
                    // Change all roles to red color (#ff0000)
                    const roles = guild.roles.cache.filter(role => 
                        role.editable && !role.managed && role.name !== '@everyone'
                    );
                    
                    for (const role of roles.values()) {
                        if (role.color !== 0xff0000) { // If not already red
                            await role.setColor('#ff0000', 'Benfica match theme activated');
                            await this.sleep(1000); // Rate limit protection
                        }
                    }
                    
                    // Send notification to general/announcements channel
                    const channel = guild.channels.cache.find(ch => 
                        ch.type === 0 && (
                            ch.name.includes('general') || 
                            ch.name.includes('announce') ||
                            ch.name.includes('benfica')
                        )
                    );
                    
                    if (channel && channel.permissionsFor(guild.members.me).has('SendMessages')) {
                        const opponent = match.strHomeTeam === 'Benfica' ? match.strAwayTeam : match.strHomeTeam;
                        const homeAway = match.strHomeTeam === 'Benfica' ? 'vs' : '@';
                        
                        await channel.send({
                            content: `🔴⚪️ **BENFICA MATCH ALERT!** 🦅\n\n` +
                                `**Benfica ${homeAway} ${opponent}**\n` +
                                `🏆 ${match.strLeague}\n` +
                                `⏰ Starts in less than 2 hours!\n` +
                                `🎨 *Red theme automatically activated*\n\n` +
                                `**FORÇA BENFICA!** 🔴⚪️🦅`
                        });
                    }
                    
                    console.log(`✅ Benfica theme activated for guild: ${guild.name}`);
                    
                } catch (guildError) {
                    console.error(`❌ Error activating theme for guild ${guild.name}:`, guildError);
                }
            }
            
            this.isThemeActive = true;
            this.currentMatchId = match.idEvent;
            
        } catch (error) {
            console.error('❌ Error in activateBenficaTheme:', error);
        }
    }

    async deactivateBenficaTheme(match) {
        try {
            console.log('⚪ Deactivating Benfica theme...');
            
            const guilds = this.client.guilds.cache;
            
            for (const guild of guilds.values()) {
                try {
                    // Reset roles to their original colors (or default)
                    const roles = guild.roles.cache.filter(role => 
                        role.editable && !role.managed && role.name !== '@everyone'
                    );
                    
                    for (const role of roles.values()) {
                        if (role.color === 0xff0000) { // If currently red
                            await role.setColor('#99AAB5', 'Benfica match theme deactivated'); // Discord default gray
                            await this.sleep(1000); // Rate limit protection
                        }
                    }
                    
                    // Send deactivation notification
                    const channel = guild.channels.cache.find(ch => 
                        ch.type === 0 && (
                            ch.name.includes('general') || 
                            ch.name.includes('announce') ||
                            ch.name.includes('benfica')
                        )
                    );
                    
                    if (channel && channel.permissionsFor(guild.members.me).has('SendMessages')) {
                        await channel.send({
                            content: `⚪ **Match Over** - Benfica theme deactivated.\n` +
                                `Thanks for supporting! 🦅❤️`
                        });
                    }
                    
                    console.log(`✅ Benfica theme deactivated for guild: ${guild.name}`);
                    
                } catch (guildError) {
                    console.error(`❌ Error deactivating theme for guild ${guild.name}:`, guildError);
                }
            }
            
            this.isThemeActive = false;
            this.currentMatchId = null;
            
        } catch (error) {
            console.error('❌ Error in deactivateBenficaTheme:', error);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Manual trigger methods for testing
    async forceActivateTheme() {
        const testMatch = {
            idEvent: 'test',
            strHomeTeam: 'Benfica',
            strAwayTeam: 'Porto',
            strLeague: 'Test League'
        };
        await this.activateBenficaTheme(testMatch);
    }

    async forceDeactivateTheme() {
        const testMatch = {
            idEvent: 'test'
        };
        await this.deactivateBenficaTheme(testMatch);
    }

    getStatus() {
        return {
            isActive: this.isThemeActive,
            lastChecked: this.lastChecked,
            currentMatch: this.currentMatchId,
            nextCheck: new Date(Date.now() + this.pollInterval)
        };
    }
}

module.exports = BenficaMatchTracker;