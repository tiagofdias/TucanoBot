// TucanoBot Dashboard - Main Application

class Dashboard {
    constructor() {
        this.user = null;
        this.guilds = [];
        this.selectedGuild = null;
        this.guildData = null;
        this.currentSection = 'overview';
        
        this.init();
    }

    async init() {
        // Check for errors in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('error')) {
            Components.toast('Login failed. Please try again.', 'error');
        }

        // Try to get current user
        try {
            const data = await API.auth.getUser();
            if (data) {
                this.user = data.user;
                this.guilds = data.guilds;
                this.showDashboard();
            } else {
                this.showLogin();
            }
        } catch (error) {
            this.showLogin();
        }

        this.bindEvents();
    }

    bindEvents() {
        // Login button
        document.getElementById('login-btn')?.addEventListener('click', () => {
            API.auth.login();
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            API.auth.logout();
        });

        // Guild selector
        document.getElementById('guild-select')?.addEventListener('change', (e) => {
            this.selectGuild(e.target.value);
        });

        // Navigation
        document.getElementById('nav-menu')?.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const section = navItem.dataset.section;
                this.showSection(section);
            }
        });
    }

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');

        // Update user info
        const avatar = this.user.avatar 
            ? `https://cdn.discordapp.com/avatars/${this.user.id}/${this.user.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        document.getElementById('user-avatar').src = avatar;
        document.getElementById('user-name').textContent = this.user.username;

        // Load guilds
        this.loadGuilds();
    }

    async loadGuilds() {
        try {
            const guilds = await API.guilds.list();
            const select = document.getElementById('guild-select');
            
            select.innerHTML = '<option value="">Choose a server...</option>';
            
            guilds.forEach(guild => {
                const option = document.createElement('option');
                option.value = guild.id;
                option.textContent = guild.name;
                select.appendChild(option);
            });
        } catch (error) {
            Components.toast('Failed to load servers', 'error');
        }
    }

    async selectGuild(guildId) {
        if (!guildId) {
            this.selectedGuild = null;
            this.guildData = null;
            document.getElementById('guild-info').classList.add('hidden');
            this.showSection('overview');
            return;
        }

        try {
            this.guildData = await API.guilds.get(guildId);
            this.selectedGuild = guildId;

            // Update guild badge
            const guildInfo = document.getElementById('guild-info');
            guildInfo.classList.remove('hidden');
            document.getElementById('guild-icon').src = this.guildData.iconUrl || '';
            document.getElementById('guild-name').textContent = this.guildData.name;

            // Refresh current section
            this.showSection(this.currentSection);
        } catch (error) {
            Components.toast('Failed to load server', 'error');
        }
    }

    showSection(section) {
        this.currentSection = section;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update title
        const titles = {
            overview: 'Overview',
            levels: 'Level System',
            birthdays: 'Birthdays',
            autorole: 'Auto Role',
            autodelete: 'Auto Delete',
            autopublish: 'Auto Publish',
            suggestions: 'Suggestions',
            tempvcs: 'Temp Voice Channels',
            vanityroles: 'Vanity Roles',
            rolestatus: 'Role Status',
            chatgpt: 'ChatGPT',
            maintenance: 'Maintenance'
        };
        document.getElementById('section-title').textContent = titles[section] || section;

        // Hide all sections
        document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));

        // Show selected section
        const sectionEl = document.getElementById(`section-${section}`);
        if (sectionEl) {
            sectionEl.classList.remove('hidden');
        }

        // Load section content
        if (this.selectedGuild) {
            this.loadSectionContent(section);
        }
    }

    async loadSectionContent(section) {
        const sectionEl = document.getElementById(`section-${section}`);
        if (!sectionEl) return;

        sectionEl.innerHTML = Components.loading();

        try {
            switch (section) {
                case 'overview':
                    await this.renderOverview(sectionEl);
                    break;
                case 'levels':
                    await this.renderLevels(sectionEl);
                    break;
                case 'birthdays':
                    await this.renderBirthdays(sectionEl);
                    break;
                case 'autorole':
                    await this.renderAutoRole(sectionEl);
                    break;
                case 'autodelete':
                    await this.renderAutoDelete(sectionEl);
                    break;
                case 'autopublish':
                    await this.renderAutoPublish(sectionEl);
                    break;
                case 'suggestions':
                    await this.renderSuggestions(sectionEl);
                    break;
                case 'tempvcs':
                    await this.renderTempVcs(sectionEl);
                    break;
                case 'vanityroles':
                    await this.renderVanityRoles(sectionEl);
                    break;
                case 'rolestatus':
                    await this.renderRoleStatus(sectionEl);
                    break;
                case 'chatgpt':
                    await this.renderChatGpt(sectionEl);
                    break;
                case 'maintenance':
                    await this.renderMaintenance(sectionEl);
                    break;
            }
        } catch (error) {
            sectionEl.innerHTML = `<div class="card"><p>Failed to load: ${error.message}</p></div>`;
        }
    }

    // ============ Section Renderers ============

    async renderOverview(el) {
        el.innerHTML = `
            <div class="cards-grid">
                ${Components.card('📊 Server Stats', `
                    <p><strong>Members:</strong> ${this.guildData.memberCount}</p>
                    <p><strong>Channels:</strong> ${this.guildData.channels.length}</p>
                    <p><strong>Roles:</strong> ${this.guildData.roles.length}</p>
                `)}
                ${Components.card('⭐ Quick Actions', `
                    <p>Select a feature from the sidebar to manage your server settings.</p>
                `)}
            </div>
        `;
    }

    async renderLevels(el) {
        const [config, leaderboard, multipliers] = await Promise.all([
            API.levels.getConfig(this.selectedGuild),
            API.levels.getLeaderboard(this.selectedGuild, 10),
            API.levels.getMultipliers(this.selectedGuild)
        ]);

        el.innerHTML = `
            <div class="cards-grid">
                ${Components.card('Settings', `
                    ${Components.toggle('level-status', config.Status, 'Enable Level System', async (val) => {
                        await API.levels.updateConfig(this.selectedGuild, { Status: val });
                        Components.toast('Level system ' + (val ? 'enabled' : 'disabled'));
                    })}
                    <hr style="border-color: var(--border-color); margin: 1rem 0;">
                    ${Components.numberInput('text-xp', config.TextXP, 'XP per Message', async (val) => {
                        await API.levels.updateConfig(this.selectedGuild, { TextXP: val });
                    })}
                    ${Components.numberInput('voice-xp', config.VoiceXP, 'XP per Voice Minute', async (val) => {
                        await API.levels.updateConfig(this.selectedGuild, { VoiceXP: val });
                    })}
                    <button class="btn btn-primary" onclick="Components.toast('Settings saved!')">Save Changes</button>
                `)}
                
                ${Components.card('Role Multipliers', `
                    <div id="multipliers-list">
                        ${multipliers.map(m => Components.listItem(
                            m.roleId,
                            `${m.roleName} (${m.boost}x)`,
                            m.roleColor,
                            true
                        )).join('') || '<p>No multipliers set</p>'}
                    </div>
                    <hr style="border-color: var(--border-color); margin: 1rem 0;">
                    <div class="input-group">
                        <select id="new-mult-role" class="select">
                            <option value="">Select role...</option>
                            ${this.guildData.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                        </select>
                        <input type="number" id="new-mult-boost" class="input" placeholder="Boost" min="1" value="2" style="width: 80px;">
                        <button class="btn btn-success" id="add-multiplier">Add</button>
                    </div>
                `)}
            </div>
            
            ${Components.card('🏆 Leaderboard', `
                <div id="leaderboard">
                    ${leaderboard.leaderboard.map(u => Components.leaderboardItem(u.rank, u)).join('')}
                </div>
            `)}
        `;

        // Attach event handlers
        Components.attachDeleteHandlers(el.querySelector('#multipliers-list'), async (roleId) => {
            await API.levels.deleteMultiplier(this.selectedGuild, roleId);
            Components.toast('Multiplier removed');
            this.renderLevels(el);
        });

        document.getElementById('add-multiplier')?.addEventListener('click', async () => {
            const roleId = document.getElementById('new-mult-role').value;
            const boost = parseInt(document.getElementById('new-mult-boost').value);
            if (roleId && boost) {
                await API.levels.addMultiplier(this.selectedGuild, roleId, boost);
                Components.toast('Multiplier added');
                this.renderLevels(el);
            }
        });
    }

    async renderBirthdays(el) {
        const [config, birthdays] = await Promise.all([
            API.birthdays.getConfig(this.selectedGuild),
            API.birthdays.list(this.selectedGuild)
        ]);

        const channelOptions = this.guildData.channels.map(c => ({ value: c.id, label: '#' + c.name }));

        el.innerHTML = `
            <div class="cards-grid">
                ${Components.card('Settings', `
                    ${Components.toggle('birthday-status', config.Status, 'Enable Birthdays', async (val) => {
                        await API.birthdays.updateConfig(this.selectedGuild, { Status: val });
                        Components.toast('Birthday announcements ' + (val ? 'enabled' : 'disabled'));
                    })}
                    ${Components.select('birthday-channel', channelOptions, config.ChannelID, 'Announcement Channel', async (val) => {
                        await API.birthdays.updateConfig(this.selectedGuild, { ChannelID: val });
                        Components.toast('Channel updated');
                    })}
                `)}
            </div>
            
            ${Components.card('🎂 Registered Birthdays', `
                <div id="birthdays-list">
                    ${birthdays.map(b => Components.listItem(
                        b.memberId,
                        `${b.username} - ${b.day}/${b.month}`,
                        null,
                        true
                    )).join('') || '<p>No birthdays registered</p>'}
                </div>
            `)}
        `;

        Components.attachDeleteHandlers(el.querySelector('#birthdays-list'), async (memberId) => {
            await API.birthdays.delete(this.selectedGuild, memberId);
            Components.toast('Birthday removed');
            this.renderBirthdays(el);
        });
    }

    async renderAutoRole(el) {
        const roles = await API.autoRole.list(this.selectedGuild);

        el.innerHTML = `
            ${Components.card('Auto Roles', `
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Roles automatically assigned to new members.
                </p>
                <div id="autoroles-list">
                    ${roles.map(r => Components.listItem(
                        r.roleId,
                        r.roleName,
                        r.roleColor,
                        true
                    )).join('') || '<p>No auto-roles set</p>'}
                </div>
                <hr style="border-color: var(--border-color); margin: 1rem 0;">
                <div class="input-group">
                    <select id="new-autorole" class="select">
                        <option value="">Select role...</option>
                        ${this.guildData.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                    </select>
                    <button class="btn btn-success" id="add-autorole">Add Role</button>
                </div>
            `)}
        `;

        Components.attachDeleteHandlers(el.querySelector('#autoroles-list'), async (roleId) => {
            await API.autoRole.delete(this.selectedGuild, roleId);
            Components.toast('Auto-role removed');
            this.renderAutoRole(el);
        });

        document.getElementById('add-autorole')?.addEventListener('click', async () => {
            const roleId = document.getElementById('new-autorole').value;
            if (roleId) {
                await API.autoRole.add(this.selectedGuild, roleId);
                Components.toast('Auto-role added');
                this.renderAutoRole(el);
            }
        });
    }

    async renderAutoDelete(el) {
        const rules = await API.autoDelete.list(this.selectedGuild);

        el.innerHTML = `
            ${Components.card('Auto Delete Rules', `
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Automatically delete messages in specific channels.
                </p>
                <div id="autodelete-list">
                    ${rules.map(r => Components.listItem(
                        r.channelId,
                        `#${r.channelName} (${r.delay/1000}s delay)`,
                        null,
                        true
                    )).join('') || '<p>No auto-delete rules</p>'}
                </div>
                <hr style="border-color: var(--border-color); margin: 1rem 0;">
                <div class="input-group">
                    <select id="new-autodelete-channel" class="select">
                        <option value="">Select channel...</option>
                        ${this.guildData.channels.map(c => `<option value="${c.id}">#${c.name}</option>`).join('')}
                    </select>
                    <input type="number" id="new-autodelete-delay" class="input" placeholder="Delay (ms)" value="5000" style="width: 120px;">
                    <button class="btn btn-success" id="add-autodelete">Add</button>
                </div>
            `)}
        `;

        Components.attachDeleteHandlers(el.querySelector('#autodelete-list'), async (channelId) => {
            await API.autoDelete.delete(this.selectedGuild, channelId);
            Components.toast('Rule removed');
            this.renderAutoDelete(el);
        });

        document.getElementById('add-autodelete')?.addEventListener('click', async () => {
            const channelId = document.getElementById('new-autodelete-channel').value;
            const delay = parseInt(document.getElementById('new-autodelete-delay').value);
            if (channelId) {
                await API.autoDelete.add(this.selectedGuild, channelId, delay);
                Components.toast('Rule added');
                this.renderAutoDelete(el);
            }
        });
    }

    async renderAutoPublish(el) {
        const channels = await API.autoPublish.list(this.selectedGuild);

        el.innerHTML = `
            ${Components.card('Auto Publish Channels', `
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Automatically publish messages in announcement channels.
                </p>
                <div id="autopublish-list">
                    ${channels.map(c => Components.listItem(
                        c.channelId,
                        `#${c.channelName}`,
                        null,
                        true
                    )).join('') || '<p>No channels set</p>'}
                </div>
                <hr style="border-color: var(--border-color); margin: 1rem 0;">
                <div class="input-group">
                    <select id="new-autopublish" class="select">
                        <option value="">Select channel...</option>
                        ${this.guildData.channels.map(c => `<option value="${c.id}">#${c.name}</option>`).join('')}
                    </select>
                    <button class="btn btn-success" id="add-autopublish">Add</button>
                </div>
            `)}
        `;

        Components.attachDeleteHandlers(el.querySelector('#autopublish-list'), async (channelId) => {
            await API.autoPublish.delete(this.selectedGuild, channelId);
            Components.toast('Channel removed');
            this.renderAutoPublish(el);
        });

        document.getElementById('add-autopublish')?.addEventListener('click', async () => {
            const channelId = document.getElementById('new-autopublish').value;
            if (channelId) {
                await API.autoPublish.add(this.selectedGuild, channelId);
                Components.toast('Channel added');
                this.renderAutoPublish(el);
            }
        });
    }

    async renderSuggestions(el) {
        const config = await API.suggestions.get(this.selectedGuild);
        const channelOptions = this.guildData.channels.map(c => ({ value: c.id, label: '#' + c.name }));

        el.innerHTML = `
            ${Components.card('Suggestions Settings', `
                ${Components.toggle('suggestions-status', config.Status, 'Enable Suggestions', async (val) => {
                    await API.suggestions.update(this.selectedGuild, { Status: val });
                    Components.toast('Suggestions ' + (val ? 'enabled' : 'disabled'));
                })}
                ${Components.select('suggestions-channel', channelOptions, config.ChannelID, 'Suggestions Channel', async (val) => {
                    await API.suggestions.update(this.selectedGuild, { ChannelID: val });
                    Components.toast('Channel updated');
                })}
            `)}
        `;
    }

    async renderTempVcs(el) {
        const config = await API.tempVcs.get(this.selectedGuild);

        el.innerHTML = `
            ${Components.card('Temp Voice Channels Settings', `
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Configure the "Join to Create" voice channel system.
                </p>
                ${Components.numberInput('tempvc-limit', config.UserLimit, 'Default User Limit', async (val) => {
                    await API.tempVcs.update(this.selectedGuild, { UserLimit: val });
                    Components.toast('User limit updated');
                })}
                ${Components.numberInput('tempvc-bitrate', config.BitRate, 'Default Bitrate (bps)', async (val) => {
                    await API.tempVcs.update(this.selectedGuild, { BitRate: val });
                    Components.toast('Bitrate updated');
                })}
            `)}
        `;
    }

    async renderVanityRoles(el) {
        const roles = await API.vanityRoles.list(this.selectedGuild);

        el.innerHTML = `
            ${Components.card('Vanity Roles', `
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Assign roles based on custom status vanity URLs.
                </p>
                <div id="vanityroles-list">
                    ${roles.map(r => Components.listItem(
                        r.roleId,
                        `${r.roleName} → "${r.vanity}"`,
                        r.roleColor,
                        true
                    )).join('') || '<p>No vanity roles set</p>'}
                </div>
                <hr style="border-color: var(--border-color); margin: 1rem 0;">
                <div class="input-group">
                    <select id="new-vanity-role" class="select">
                        <option value="">Select role...</option>
                        ${this.guildData.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                    </select>
                    <input type="text" id="new-vanity-text" class="input" placeholder="Vanity URL text">
                    <button class="btn btn-success" id="add-vanity">Add</button>
                </div>
            `)}
        `;

        Components.attachDeleteHandlers(el.querySelector('#vanityroles-list'), async (roleId) => {
            await API.vanityRoles.delete(this.selectedGuild, roleId);
            Components.toast('Vanity role removed');
            this.renderVanityRoles(el);
        });

        document.getElementById('add-vanity')?.addEventListener('click', async () => {
            const roleId = document.getElementById('new-vanity-role').value;
            const vanity = document.getElementById('new-vanity-text').value;
            if (roleId && vanity) {
                await API.vanityRoles.add(this.selectedGuild, roleId, vanity);
                Components.toast('Vanity role added');
                this.renderVanityRoles(el);
            }
        });
    }

    async renderRoleStatus(el) {
        const configs = await API.roleStatus.list(this.selectedGuild);

        el.innerHTML = `
            ${Components.card('Role Status', `
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Assign roles based on custom status text.
                </p>
                <div id="rolestatus-list">
                    ${configs.map(c => Components.listItem(
                        c.roleId,
                        `${c.roleName} → "${c.status}"`,
                        c.roleColor,
                        true
                    )).join('') || '<p>No status roles set</p>'}
                </div>
                <hr style="border-color: var(--border-color); margin: 1rem 0;">
                <div class="input-group">
                    <select id="new-status-role" class="select">
                        <option value="">Select role...</option>
                        ${this.guildData.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                    </select>
                    <input type="text" id="new-status-text" class="input" placeholder="Status text">
                    <button class="btn btn-success" id="add-status">Add</button>
                </div>
            `)}
        `;

        Components.attachDeleteHandlers(el.querySelector('#rolestatus-list'), async (roleId) => {
            await API.roleStatus.delete(this.selectedGuild, roleId);
            Components.toast('Status role removed');
            this.renderRoleStatus(el);
        });

        document.getElementById('add-status')?.addEventListener('click', async () => {
            const roleId = document.getElementById('new-status-role').value;
            const status = document.getElementById('new-status-text').value;
            if (roleId && status) {
                await API.roleStatus.add(this.selectedGuild, roleId, status);
                Components.toast('Status role added');
                this.renderRoleStatus(el);
            }
        });
    }

    async renderChatGpt(el) {
        const config = await API.chatGpt.get(this.selectedGuild);
        const channelOptions = this.guildData.channels.map(c => ({ value: c.id, label: '#' + c.name }));

        el.innerHTML = `
            ${Components.card('ChatGPT Settings', `
                ${Components.toggle('chatgpt-status', config.Status, 'Enable ChatGPT', async (val) => {
                    await API.chatGpt.update(this.selectedGuild, { Status: val });
                    Components.toast('ChatGPT ' + (val ? 'enabled' : 'disabled'));
                })}
                ${Components.select('chatgpt-channel', channelOptions, config.ChannelID, 'ChatGPT Channel', async (val) => {
                    await API.chatGpt.update(this.selectedGuild, { ChannelID: val });
                    Components.toast('Channel updated');
                })}
            `)}
        `;
    }

    async renderMaintenance(el) {
        const config = await API.maintenance.get(this.selectedGuild);

        el.innerHTML = `
            ${Components.card('Maintenance Mode', `
                ${Components.toggle('maintenance-status', config.Status, 'Enable Maintenance Mode', async (val) => {
                    await API.maintenance.update(this.selectedGuild, { Status: val });
                    Components.toast('Maintenance mode ' + (val ? 'enabled' : 'disabled'));
                })}
                <div class="form-group" style="margin-top: 1rem;">
                    <label>Maintenance Message</label>
                    <input type="text" id="maintenance-message" class="input" 
                        value="${config.Message || ''}" 
                        placeholder="Bot is under maintenance...">
                </div>
                <button class="btn btn-primary" id="save-maintenance">Save Message</button>
            `)}
        `;

        document.getElementById('save-maintenance')?.addEventListener('click', async () => {
            const message = document.getElementById('maintenance-message').value;
            await API.maintenance.update(this.selectedGuild, { Message: message });
            Components.toast('Maintenance message saved');
        });
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
