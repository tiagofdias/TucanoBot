// UI Components for TucanoBot Dashboard

const Components = {
    // Show toast notification
    toast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        
        toast.innerHTML = `
            <span>${icons[type] || ''}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Loading spinner
    loading() {
        return `
            <div class="loading-overlay">
                <div class="spinner"></div>
            </div>
        `;
    },

    // Toggle switch
    toggle(id, checked, label, onChange) {
        const html = `
            <div class="toggle-container">
                <span>${label}</span>
                <label class="toggle">
                    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
        
        // Attach event listener after render
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el && onChange) {
                el.addEventListener('change', (e) => onChange(e.target.checked));
            }
        }, 0);
        
        return html;
    },

    // Select dropdown
    select(id, options, selected, label, onChange) {
        const optionsHtml = options.map(opt => 
            `<option value="${opt.value}" ${opt.value === selected ? 'selected' : ''}>${opt.label}</option>`
        ).join('');
        
        const html = `
            <div class="form-group">
                <label>${label}</label>
                <select id="${id}" class="select">
                    <option value="">Select...</option>
                    ${optionsHtml}
                </select>
            </div>
        `;
        
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el && onChange) {
                el.addEventListener('change', (e) => onChange(e.target.value));
            }
        }, 0);
        
        return html;
    },

    // Number input
    numberInput(id, value, label, onChange) {
        const html = `
            <div class="form-group">
                <label>${label}</label>
                <input type="number" id="${id}" class="input" value="${value || 0}" min="0">
            </div>
        `;
        
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el && onChange) {
                el.addEventListener('change', (e) => onChange(parseInt(e.target.value) || 0));
            }
        }, 0);
        
        return html;
    },

    // Card component
    card(title, content, headerExtra = '') {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${title}</h3>
                    ${headerExtra}
                </div>
                <div class="card-body">
                    ${content}
                </div>
            </div>
        `;
    },

    // Leaderboard item
    leaderboardItem(rank, user) {
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const avatar = user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        return `
            <div class="leaderboard-item">
                <span class="rank ${rankClass}">#${rank}</span>
                <img src="${avatar}" alt="" class="leaderboard-avatar">
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${user.username}</div>
                    <div class="leaderboard-level">Level ${user.level}</div>
                </div>
                <span class="leaderboard-xp">${user.xp.toLocaleString()} XP</span>
            </div>
        `;
    },

    // List item with delete button
    listItem(id, content, color, onDelete) {
        const deleteBtn = onDelete ? `<button class="btn btn-danger btn-sm" data-delete="${id}">Delete</button>` : '';
        
        const html = `
            <div class="list-item" data-id="${id}">
                <div class="list-item-info">
                    ${color ? `<span class="role-dot" style="background: ${color}"></span>` : ''}
                    <span>${content}</span>
                </div>
                ${deleteBtn}
            </div>
        `;
        
        return html;
    },

    // Attach delete handlers to list items
    attachDeleteHandlers(container, onDelete) {
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.delete;
                onDelete(id);
            });
        });
    }
};
