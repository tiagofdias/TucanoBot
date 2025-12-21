// API Client for TucanoBot Dashboard

const API = {
    baseUrl: '/api',

    // Generic fetch wrapper with error handling
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (response.status === 401) {
                // Not authenticated, redirect to login
                window.location.href = '/api/auth/login';
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        async getUser() {
            return API.request('/auth/me');
        },
        login() {
            window.location.href = '/api/auth/login';
        },
        logout() {
            window.location.href = '/api/auth/logout';
        }
    },

    // Guilds endpoints
    guilds: {
        async list() {
            return API.request('/guilds');
        },
        async get(guildId) {
            return API.request(`/guilds/${guildId}`);
        }
    },

    // Levels endpoints
    levels: {
        async getConfig(guildId) {
            return API.request(`/guilds/${guildId}/levels/config`);
        },
        async updateConfig(guildId, config) {
            return API.request(`/guilds/${guildId}/levels/config`, {
                method: 'PUT',
                body: JSON.stringify(config)
            });
        },
        async getLeaderboard(guildId, limit = 25, offset = 0) {
            return API.request(`/guilds/${guildId}/levels/leaderboard?limit=${limit}&offset=${offset}`);
        },
        async getMultipliers(guildId) {
            return API.request(`/guilds/${guildId}/levels/multipliers`);
        },
        async addMultiplier(guildId, roleId, boost) {
            return API.request(`/guilds/${guildId}/levels/multipliers`, {
                method: 'POST',
                body: JSON.stringify({ roleId, boost })
            });
        },
        async deleteMultiplier(guildId, roleId) {
            return API.request(`/guilds/${guildId}/levels/multipliers/${roleId}`, {
                method: 'DELETE'
            });
        }
    },

    // Birthdays endpoints
    birthdays: {
        async getConfig(guildId) {
            return API.request(`/guilds/${guildId}/birthdays/config`);
        },
        async updateConfig(guildId, config) {
            return API.request(`/guilds/${guildId}/birthdays/config`, {
                method: 'PUT',
                body: JSON.stringify(config)
            });
        },
        async list(guildId) {
            return API.request(`/guilds/${guildId}/birthdays`);
        },
        async delete(guildId, memberId) {
            return API.request(`/guilds/${guildId}/birthdays/${memberId}`, {
                method: 'DELETE'
            });
        }
    },

    // Auto Delete endpoints
    autoDelete: {
        async list(guildId) {
            return API.request(`/guilds/${guildId}/autodelete`);
        },
        async add(guildId, channelId, delay) {
            return API.request(`/guilds/${guildId}/autodelete`, {
                method: 'POST',
                body: JSON.stringify({ channelId, delay })
            });
        },
        async delete(guildId, channelId) {
            return API.request(`/guilds/${guildId}/autodelete/${channelId}`, {
                method: 'DELETE'
            });
        }
    },

    // Auto Publish endpoints
    autoPublish: {
        async list(guildId) {
            return API.request(`/guilds/${guildId}/autopublish`);
        },
        async add(guildId, channelId) {
            return API.request(`/guilds/${guildId}/autopublish`, {
                method: 'POST',
                body: JSON.stringify({ channelId })
            });
        },
        async delete(guildId, channelId) {
            return API.request(`/guilds/${guildId}/autopublish/${channelId}`, {
                method: 'DELETE'
            });
        }
    },

    // Auto Role endpoints
    autoRole: {
        async list(guildId) {
            return API.request(`/guilds/${guildId}/autorole`);
        },
        async add(guildId, roleId) {
            return API.request(`/guilds/${guildId}/autorole`, {
                method: 'POST',
                body: JSON.stringify({ roleId })
            });
        },
        async delete(guildId, roleId) {
            return API.request(`/guilds/${guildId}/autorole/${roleId}`, {
                method: 'DELETE'
            });
        }
    },

    // Suggestions endpoints
    suggestions: {
        async get(guildId) {
            return API.request(`/guilds/${guildId}/suggestions`);
        },
        async update(guildId, config) {
            return API.request(`/guilds/${guildId}/suggestions`, {
                method: 'PUT',
                body: JSON.stringify(config)
            });
        }
    },

    // Temp VCs endpoints
    tempVcs: {
        async get(guildId) {
            return API.request(`/guilds/${guildId}/tempvcs`);
        },
        async update(guildId, config) {
            return API.request(`/guilds/${guildId}/tempvcs`, {
                method: 'PUT',
                body: JSON.stringify(config)
            });
        }
    },

    // Vanity Roles endpoints
    vanityRoles: {
        async list(guildId) {
            return API.request(`/guilds/${guildId}/vanityroles`);
        },
        async add(guildId, roleId, vanity) {
            return API.request(`/guilds/${guildId}/vanityroles`, {
                method: 'POST',
                body: JSON.stringify({ roleId, vanity })
            });
        },
        async delete(guildId, roleId) {
            return API.request(`/guilds/${guildId}/vanityroles/${roleId}`, {
                method: 'DELETE'
            });
        }
    },

    // Role Status endpoints
    roleStatus: {
        async list(guildId) {
            return API.request(`/guilds/${guildId}/rolestatus`);
        },
        async add(guildId, roleId, status) {
            return API.request(`/guilds/${guildId}/rolestatus`, {
                method: 'POST',
                body: JSON.stringify({ roleId, status })
            });
        },
        async delete(guildId, roleId) {
            return API.request(`/guilds/${guildId}/rolestatus/${roleId}`, {
                method: 'DELETE'
            });
        }
    },

    // ChatGPT endpoints
    chatGpt: {
        async get(guildId) {
            return API.request(`/guilds/${guildId}/chatgpt`);
        },
        async update(guildId, config) {
            return API.request(`/guilds/${guildId}/chatgpt`, {
                method: 'PUT',
                body: JSON.stringify(config)
            });
        }
    },

    // Maintenance endpoints
    maintenance: {
        async get(guildId) {
            return API.request(`/guilds/${guildId}/maintenance`);
        },
        async update(guildId, config) {
            return API.request(`/guilds/${guildId}/maintenance`, {
                method: 'PUT',
                body: JSON.stringify(config)
            });
        }
    },

    // Persistent Roles endpoints
    persistentRoles: {
        async get(guildId) {
            return API.request(`/guilds/${guildId}/persistentroles`);
        },
        async update(guildId, config) {
            return API.request(`/guilds/${guildId}/persistentroles`, {
                method: 'PUT',
                body: JSON.stringify(config)
            });
        }
    }
};
