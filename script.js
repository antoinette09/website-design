// ==========================================
// GLOBAL UTILITIES & VARIABLES
// ==========================================
const currentUserJSON = localStorage.getItem('currentUser');
const currentUser = currentUserJSON ? JSON.parse(currentUserJSON) : null;

window.showToast = function(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

window.awardXP = function(amount, message) {
    const stats = JSON.parse(localStorage.getItem('userStats')) || { streak: 0, xp: 0, level: 1, lastActivity: null, lastLesson: 'Lesson 1' };
    stats.xp += amount;
    const newLevel = Math.floor(stats.xp / 500) + 1;
    if (newLevel > stats.level) {
        stats.level = newLevel;
        window.showToast(`🎉 Level Up! You're now level ${stats.level}!`);
    }
    localStorage.setItem('userStats', JSON.stringify(stats));
    window.showToast(`✨ +${amount} XP: ${message}`);
    if(document.getElementById('xp-display')) {
        document.getElementById('xp-display').textContent = stats.xp;
        document.getElementById('level-display').textContent = stats.level;
    }
};

window.handleLogout = function(e) {
    if(e) e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html'; 
};

// ==========================================
// INITIALIZATION ON PAGE LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- HEADER ---
    const loginLink = document.getElementById('login-status-link');
    const announcementBanner = document.getElementById('announcement-banner');

    if (loginLink && currentUser) {
        loginLink.innerHTML = currentUser.role === 'admin' ? `Admin Panel` : `Log Out`;
        loginLink.href = currentUser.role === 'admin' ? "login.html" : "#";
        if(currentUser.role !== 'admin') loginLink.onclick = window.handleLogout; 
    }

    if (announcementBanner) {
        const savedAnnouncement = localStorage.getItem('siteAnnouncement');
        if (savedAnnouncement) {
            announcementBanner.textContent = savedAnnouncement;
            announcementBanner.style.display = 'block';
        }
    }

    // --- HOME PAGE (Index.html) ---
    if(document.getElementById('greeting-text')) {
        if (currentUser) document.getElementById('greeting-text').textContent = `¡Hola, ${currentUser.username}!`;

        function loadStats() {
            const stats = JSON.parse(localStorage.getItem('userStats')) || { streak: 0, xp: 0, level: 1, lastLesson: 'Lesson 1' };
            document.getElementById('streak-display').textContent = stats.streak;
            document.getElementById('xp-display').textContent = stats.xp;
            document.getElementById('level-display').textContent = stats.level;
        }
        loadStats();

        // Coming Up Schedule (Now checks for both siteEvents and User's Pending Events)
        function loadComingUp() {
            const siteEvents = JSON.parse(localStorage.getItem('siteEvents')) || [];
            const pendingEvents = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            let myEvents = siteEvents;
            
            // Add user's pending events to their view so they know it's waiting
            if(currentUser) {
                const myPending = pendingEvents.filter(e => e.proposer === currentUser.username);
                myEvents = [...siteEvents, ...myPending];
            }

            const comingUpList = document.getElementById('coming-up-list');
            const today = new Date(); today.setHours(0, 0, 0, 0);
            
            const futureEvents = myEvents.filter(event => {
                const parts = event.date.split('-');
                const eventDate = new Date(parts[0], parts[1] - 1, parts[2]); 
                return eventDate >= today;
            }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3); 

            if (futureEvents.length === 0) {
                comingUpList.innerHTML = `<p style="color: #888;">No upcoming sessions.</p>`;
                return;
            }

            comingUpList.innerHTML = futureEvents.map(event => {
                const parts = event.date.split('-');
                const eventDate = new Date(parts[0], parts[1] - 1, parts[2]);
                const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const isPending = event.proposer ? `<span style="color:#e67e22; font-size:0.8rem;">(Pending Approval)</span>` : '';
                return `
                    <div class="event-item">
                        <div class="event-date" style="${event.proposer ? 'background:#95a5a6;' : ''}">${dateStr}</div>
                        <div>
                            <strong style="color: var(--primary-orange);">${event.title} ${isPending}</strong><br>
                            <small style="color: var(--text-dark);">${event.type.toUpperCase()}</small>
                        </div>
                    </div>
                `;
            }).join('');
        }
        loadComingUp();
    }

    // --- AUTHENTICATION & ADMIN DASHBOARD ---
    if (document.getElementById('auth-form')) {
        const ADMIN_SECRET_CODE = "oa9043570"; 
        let isLoginMode = true;
        const authContainer = document.getElementById('auth-forms');
        const adminView = document.getElementById('admin-view');
        const formTitle = document.getElementById('form-title');
        const messageArea = document.getElementById('message-area');

        function showMessage(text, type) {
            messageArea.textContent = text;
            messageArea.className = `message-box ${type}`;
            messageArea.style.display = 'block';
        }

        window.toggleAuthMode = function() {
            isLoginMode = !isLoginMode;
            messageArea.style.display = 'none';
            formTitle.textContent = isLoginMode ? "Student Login" : "Create Account";
            document.getElementById('submitbutton').textContent = isLoginMode ? "Log In" : "Sign Up";
            document.getElementById('toggle-text-span').textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
            document.querySelector('.auth-container button[onclick="toggleAuthMode()"]').textContent = isLoginMode ? "Sign Up" : "Log In";
            
            if(isLoginMode){
                document.getElementById('admin-code-group').classList.add('hidden');
                document.getElementById('email-group').classList.add('hidden');
            } else {
                document.getElementById('admin-code-group').classList.remove('hidden');
                document.getElementById('email-group').classList.remove('hidden');
            }
        };

        window.renderAdminDashboard = function() {
            // Render Users
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const container = document.getElementById('user-list-container');
            container.innerHTML = '';
            users.forEach(user => {
                const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
                const deleteBtn = (currentUser.id === user.id) ? '' : `<button class="delete-user-button" onclick="deleteUser(${user.id})">Delete</button>`;
                container.innerHTML += `
                    <div class="user-item">
                        <div><strong>${user.username}</strong><br><small>${user.email || 'No email'}</small></div>
                        <div><span class="user-role-badge ${roleClass}">${user.role}</span> ${deleteBtn}</div>
                    </div>`;
            });

            // Render Pending Requests
            const pendingEvents = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            const reqContainer = document.getElementById('pending-requests-container');
            reqContainer.innerHTML = '';
            if(pendingEvents.length === 0) reqContainer.innerHTML = '<p style="color:#666;">No pending requests.</p>';
            pendingEvents.forEach(evt => {
                reqContainer.innerHTML += `
                    <div class="pending-event-card">
                        <div>
                            <strong>${evt.title}</strong> (${evt.date})<br>
                            <small>Requested by: ${evt.proposer} | Type: ${evt.type} | Spots: ${evt.totalSpots}</small>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="approveEvent('${evt.id}')" style="background:#2ecc71; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Approve</button>
                            <button onclick="denyEvent('${evt.id}')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Deny</button>
                        </div>
                    </div>
                `;
            });
        };

        window.approveEvent = function(id) {
            let pending = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            let siteEvents = JSON.parse(localStorage.getItem('siteEvents')) || [];
            const evt = pending.find(e => e.id === id);
            if(evt) {
                delete evt.proposer; // Remove pending flag essentially
                siteEvents.push(evt);
                pending = pending.filter(e => e.id !== id);
                localStorage.setItem('siteEvents', JSON.stringify(siteEvents));
                localStorage.setItem('pendingEvents', JSON.stringify(pending));
                renderAdminDashboard();
                showToast("Event Approved & Added to Calendar!");
            }
        };

        window.denyEvent = function(id) {
            let pending = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            pending = pending.filter(e => e.id !== id);
            localStorage.setItem('pendingEvents', JSON.stringify(pending));
            renderAdminDashboard();
            showToast("Event Denied.");
        };

        window.deleteUser = function(userId) {
            if (confirm("Permanently delete this user?")) {
                let users = JSON.parse(localStorage.getItem('users')) || [];
                localStorage.setItem('users', JSON.stringify(users.filter(u => u.id !== userId)));
                renderAdminDashboard();
            }
        };

        window.saveAnnouncement = function(e) {
            e.preventDefault();
            localStorage.setItem('siteAnnouncement', document.getElementById('announcement-input').value.trim());
            alert("Announcement Posted!");
        };
        window.clearAnnouncement = function() {
            localStorage.removeItem('siteAnnouncement');
            document.getElementById('announcement-input').value = '';
            alert("Banner Removed.");
        };

        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const adminCode = document.getElementById('admin-code') ? document.getElementById('admin-code').value.trim() : '';

            if (isLoginMode) {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.username === username && u.password === password);
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = user.role === 'admin' ? 'login.html' : 'index.html';
                } else showMessage("Invalid credentials.", "error");
            } else {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                if (users.find(u => u.username === username)) return showMessage("Username taken.", "error");
                users.push({ id: Date.now(), username, password, role: adminCode === ADMIN_SECRET_CODE ? 'admin' : 'student', joined: new Date().toLocaleDateString() });
                localStorage.setItem('users', JSON.stringify(users));
                showMessage("Account created! Logging in...", "success");
                setTimeout(() => document.getElementById('submitbutton').click(), 1000); 
            }
        });

        if (currentUser) {
            if (currentUser.role === 'admin') {
                authContainer.style.display = 'none'; 
                adminView.classList.remove('hidden');
                renderAdminDashboard();
            } else {
                window.location.href = 'index.html';
            }
        }
    }

    // --- 5. CALENDAR SYSTEM (Now with Approval Flow) ---
    if (document.getElementById('calendar')) {
        let date = new Date();
        let selectedDate = null;
        
        if(!currentUser) {
            document.getElementById('scheduleBtn').disabled = true;
            document.getElementById('scheduleBtn').textContent = "Log In to Schedule";
        } else if (currentUser.role === 'student') {
            document.getElementById('scheduleFormTitle').textContent = "Propose a Study Group";
            document.getElementById('scheduleBtn').textContent = "Submit Proposal";
        }

        function renderCalendar() {
            const calendarDiv = document.getElementById('calendar');
            calendarDiv.innerHTML = ''; 
            date.setDate(1);
            const month = date.getMonth(), year = date.getFullYear();
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            document.getElementById('monthYear').textContent = `${months[month]} ${year}`;

            let siteEvents = JSON.parse(localStorage.getItem('siteEvents')) || [];
            let pendingEvents = JSON.parse(localStorage.getItem('pendingEvents')) || [];

            for (let x = 0; x < date.getDay(); x++) calendarDiv.innerHTML += `<div style="visibility:hidden;"></div>`;

            for (let i = 1; i <= new Date(year, month + 1, 0).getDate(); i++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = `calendar-day ${(i===new Date().getDate() && month===new Date().getMonth()) ? 'today' : ''}`;
                dayDiv.innerHTML = `<div class="day-number">${i}</div>`;

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                
                siteEvents.filter(e => e.date === dateStr).forEach(evt => {
                    dayDiv.innerHTML += `<div class="event-dot ${evt.type === 'tutoring' ? 'dot-tutoring' : 'dot-group'}"></div>`;
                });
                
                if(currentUser && currentUser.role === 'student') {
                    const hasPending = pendingEvents.some(e => e.date === dateStr && e.proposer === currentUser.username);
                    if(hasPending) dayDiv.innerHTML += `<div class="event-dot dot-pending"></div>`;
                }

                dayDiv.addEventListener('click', () => {
                    selectedDate = dateStr;
                    document.getElementById('modalDate').textContent = `Meetings: ${month+1}/${i}/${year}`;
                    document.getElementById('eventModal').classList.remove('hidden');
                    window.renderEventsInModal();
                });
                calendarDiv.appendChild(dayDiv);
            }
        }

        window.renderEventsInModal = function() {
            const eventList = document.getElementById('existingEvents');
            let siteEvents = JSON.parse(localStorage.getItem('siteEvents')) || [];
            let pendingEvents = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            
            const daysEvents = siteEvents.filter(e => e.date === selectedDate);
            
            eventList.innerHTML = daysEvents.length ? '' : '<p>No official meetings.</p>';
            daysEvents.forEach(evt => {
                const isFull = (evt.totalSpots - evt.attendees.length) <= 0;
                const hasJoined = currentUser && evt.attendees.includes(currentUser.username);
                const deleteBtn = (currentUser?.role === 'admin') ? `<button onclick="deleteEvent('${evt.id}')" style="float:right; color:red; background:none; border:none; cursor:pointer;">&times;</button>` : '';
                eventList.innerHTML += `
                    <div class="event-item">
                        ${deleteBtn}<strong>${evt.title}</strong><br><small>${evt.type}</small><br><small>Spots: ${evt.totalSpots - evt.attendees.length}/${evt.totalSpots}</small><br>
                        ${hasJoined ? '<button class="join-btn" disabled style="background:green;">Joined</button>' : `<button class="join-btn" onclick="joinEvent('${evt.id}')" ${isFull ? 'disabled' : ''}>${isFull ? 'Full' : 'Join'}</button>`}
                    </div>`;
            });

            if(currentUser && currentUser.role === 'student') {
                const myPending = pendingEvents.filter(e => e.date === selectedDate && e.proposer === currentUser.username);
                myPending.forEach(evt => {
                    eventList.innerHTML += `<div class="event-item" style="border-left-color: #95a5a6;"><strong style="color:#7f8c8d;">${evt.title} (Pending Admin Approval)</strong></div>`;
                });
            }
        };

        window.addEvent = function() {
            if(!currentUser) return;
            const title = document.getElementById('eventTitle').value;
            const type = document.getElementById('eventType').value;
            const spots = document.getElementById('eventSpots').value;
            if(!title || !spots) return alert("Fill all fields!");

            const newEvt = { id: Date.now().toString(), date: selectedDate, title, type, totalSpots: parseInt(spots), attendees: [] };

            if(currentUser.role === 'admin') {
                let evts = JSON.parse(localStorage.getItem('siteEvents')) || [];
                evts.push(newEvt);
                localStorage.setItem('siteEvents', JSON.stringify(evts));
                showToast("Meeting Added!");
            } else {
                let pending = JSON.parse(localStorage.getItem('pendingEvents')) || [];
                newEvt.proposer = currentUser.username;
                pending.push(newEvt);
                localStorage.setItem('pendingEvents', JSON.stringify(pending));
                showToast("Proposal sent to Admin!");
            }
            
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventSpots').value = '';
            window.renderEventsInModal();
            renderCalendar(); 
        };

        window.joinEvent = function(id) {
            if(!currentUser) return alert("Log in first!");
            let evts = JSON.parse(localStorage.getItem('siteEvents')) || [];
            const evt = evts.find(e => e.id === id);
            if(evt) { evt.attendees.push(currentUser.username); localStorage.setItem('siteEvents', JSON.stringify(evts)); window.renderEventsInModal(); }
        };

        window.deleteEvent = function(id) {
            if(confirm("Cancel meeting?")) {
                let evts = JSON.parse(localStorage.getItem('siteEvents')) || [];
                localStorage.setItem('siteEvents', JSON.stringify(evts.filter(e => e.id !== id)));
                window.renderEventsInModal(); renderCalendar();
            }
        };

        document.getElementById('prevMonth')?.addEventListener('click', () => { date.setMonth(date.getMonth() - 1); renderCalendar(); });
        document.getElementById('nextMonth')?.addEventListener('click', () => { date.setMonth(date.getMonth() + 1); renderCalendar(); });
        document.querySelector('.close-modal')?.addEventListener('click', () => document.getElementById('eventModal').classList.add('hidden'));
        renderCalendar();
    }


    // --- 6. LEARNING MODULES & COMMUNITY SETS ---
    let currentModuleType = null;
    let moduleConfig = {};

    // Detect which page we are on
    if (document.getElementById('grammar-progress')) {
        currentModuleType = 'grammar';
        moduleConfig = { total: 8, xp: 50, statId: 'topics-mastered', multiplier: 1 };
    } else if (document.getElementById('conjugation-progress')) {
        currentModuleType = 'conjugation';
        moduleConfig = { total: 6, xp: 50, statId: 'verbs-mastered', multiplier: 15 };
    } else if (document.getElementById('vocab-progress')) {
        currentModuleType = 'vocab';
        moduleConfig = { total: 10, xp: 50, statId: 'words-learned', multiplier: 55 };
    }

    if (currentModuleType) {
        
        // --- Core Module Tracking ---
        const completedKey = `${currentModuleType}Completed`;
        let completedItems = JSON.parse(localStorage.getItem(completedKey)) || [];

        function updateProgressUI() {
            const percent = Math.round((completedItems.length / moduleConfig.total) * 100);
            document.getElementById(`${currentModuleType}-progress`).textContent = percent;
            document.getElementById(`${currentModuleType}ProgressBar`).style.width = percent + '%';
            document.getElementById(`${currentModuleType}ProgressText`).textContent = `${completedItems.length} of ${moduleConfig.total} modules completed`;
            document.getElementById(moduleConfig.statId).textContent = completedItems.length * moduleConfig.multiplier;
        }

        completedItems.forEach(item => {
            const card = document.querySelector(`.activity-card[data-module="${item}"]`);
            if (card) {
                card.classList.add('completed');
                const btn = card.querySelector('.complete-button');
                if (btn) {
                    btn.textContent = 'Undo';
                    btn.style.backgroundColor = 'var(--border-gray)';
                    btn.style.color = 'var(--text-dark)';
                }
            }
        });
        updateProgressUI();

        window.toggleModuleComplete = function(itemStr) {
            const card = document.querySelector(`.activity-card[data-module="${itemStr}"]`);
            const button = card.querySelector('.complete-button');
            const isCompleted = completedItems.includes(itemStr);

            if (isCompleted) {
                card.classList.remove('completed');
                button.textContent = 'Mark as Complete';
                button.style.backgroundColor = 'var(--primary-orange)';
                button.style.color = 'var(--text-light)';
                completedItems = completedItems.filter(i => i !== itemStr);
            } else {
                card.classList.add('completed');
                button.textContent = 'Undo';
                button.style.backgroundColor = 'var(--border-gray)';
                button.style.color = 'var(--text-dark)';
                completedItems.push(itemStr);
                window.awardXP(moduleConfig.xp, `Completed module!`);
            }
            
            localStorage.setItem(completedKey, JSON.stringify(completedItems));
            updateProgressUI();
        };

        // --- Community Sets Logic ---
        let customFlashcards = [];
        let customCardIndex = 0;

        const defaultSets = [
            { id: "1", title: "Greetings Review", category: "vocab", author: "Admin", isPublic: true, terms: [{term: "Hola", def: "Hello"}, {term: "Adiós", def: "Goodbye"}] },
            { id: "2", title: "-AR Endings", category: "conjugation", author: "Admin", isPublic: true, terms: [{term: "yo", def: "-o"}, {term: "tú", def: "-as"}] },
            { id: "3", title: "Ser Rules", category: "grammar", author: "Admin", isPublic: true, terms: [{term: "DOCTOR", def: "Acronym for Ser"}, {term: "Date", def: "Hoy es lunes"}] }
        ];

        if(!localStorage.getItem('studySets')) localStorage.setItem('studySets', JSON.stringify(defaultSets));

        window.switchResourceTab = function(tab) {
            document.getElementById('tab-community').classList.remove('active');
            document.getElementById('tab-my').classList.remove('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
            window.renderStudySets(tab);
        };

        window.renderStudySets = function(filter) {
            const sets = JSON.parse(localStorage.getItem('studySets')) || [];
            const container = document.getElementById('study-sets-container');
            container.innerHTML = '';

            let filteredSets = sets.filter(s => s.category === currentModuleType); 

            if(filter === 'community') {
                filteredSets = filteredSets.filter(s => s.isPublic);
            } else if (filter === 'my') {
                if(!currentUser) { container.innerHTML = '<p style="color:var(--text-dark); grid-column: 1 / -1;">Please log in to view your sets.</p>'; return; }
                filteredSets = filteredSets.filter(s => s.author === currentUser.username);
            }

            if(filteredSets.length === 0) {
                container.innerHTML = '<p style="color:var(--text-dark); grid-column: 1 / -1;">No sets found for this category.</p>'; return;
            }

            filteredSets.forEach(set => {
                const isMine = currentUser && set.author === currentUser.username;
                const deleteBtn = isMine ? `<button onclick="deleteStudySet('${set.id}', event)" style="margin-top:10px; background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; width:100%; cursor:pointer;">Delete</button>` : '';
                container.innerHTML += `
                    <div class="card" style="text-align:left; cursor:pointer; width: 100%;" onclick="playCustomFlashcards('${set.id}')">
                        <h3 style="color:var(--primary-orange);">${set.title}</h3>
                        <p style="font-size:0.9rem; color:var(--text-dark); margin-bottom: 5px;">By: ${set.author} | ${set.terms.length} Terms</p>
                        ${deleteBtn}
                    </div>
                `;
            });
        };

        window.playCustomFlashcards = function(id) {
            const sets = JSON.parse(localStorage.getItem('studySets')) || [];
            const set = sets.find(s => s.id === id);
            if(!set || set.terms.length === 0) return alert("No terms in this set!");

            customFlashcards = set.terms;
            customCardIndex = 0;
            
            document.getElementById('customFlashcardTitle').textContent = set.title;
            document.getElementById('customFlashcardModal').classList.remove('hidden');
            updateCustomFlashcardUI();
        };

        function updateCustomFlashcardUI() {
            const card = customFlashcards[customCardIndex];
            document.getElementById('customFlashcardFront').textContent = card.term;
            document.getElementById('customFlashcardBack').textContent = card.def;
            document.getElementById('customFlashcardFront').classList.remove('hidden');
            document.getElementById('customFlashcardBack').classList.add('hidden');
            document.getElementById('customCardCounter').textContent = `${customCardIndex + 1} / ${customFlashcards.length}`;
        }

        document.getElementById('customFlashcard')?.addEventListener('click', function() {
            document.getElementById('customFlashcardFront').classList.toggle('hidden');
            document.getElementById('customFlashcardBack').classList.toggle('hidden');
        });

        window.nextCustomCard = function() { if (customCardIndex < customFlashcards.length - 1) { customCardIndex++; updateCustomFlashcardUI(); } };
        window.prevCustomCard = function() { if (customCardIndex > 0) { customCardIndex--; updateCustomFlashcardUI(); } };
        window.closeCustomFlashcards = function() { document.getElementById('customFlashcardModal').classList.add('hidden'); };

        window.openCreateSetModal = function() {
            if(!currentUser) return alert("You must be logged in to create sets.");
            document.getElementById('createSetModal').classList.remove('hidden');
            document.getElementById('terms-container').innerHTML = '';
            addTermRow(); addTermRow(); 
        };
        window.closeCreateSetModal = function() { document.getElementById('createSetModal').classList.add('hidden'); };
        
        window.addTermRow = function() {
            const row = document.createElement('div');
            row.className = 'term-row';
            row.innerHTML = `
                <input type="text" class="term-input" placeholder="Term (e.g. Hola)" style="padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px; font-family: var(--font-body);">
                <input type="text" class="def-input" placeholder="Definition (e.g. Hello)" style="padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px; font-family: var(--font-body);">
                <button type="button" class="remove-term-btn" onclick="this.parentElement.remove()">X</button>
            `;
            document.getElementById('terms-container').appendChild(row);
        };

        window.saveStudySet = function() {
            const title = document.getElementById('set-title').value;
            const desc = document.getElementById('set-desc').value;
            const isPublic = document.getElementById('set-public').checked;
            
            if(!title) return alert("Title is required!");

            const terms = [];
            document.querySelectorAll('.term-row').forEach(row => {
                const term = row.querySelector('.term-input').value.trim();
                const def = row.querySelector('.def-input').value.trim();
                if(term && def) terms.push({term, def});
            });

            if(terms.length === 0) return alert("You need at least one completed term!");

            const sets = JSON.parse(localStorage.getItem('studySets')) || [];
            sets.push({ id: Date.now().toString(), title, description: desc, category: currentModuleType, author: currentUser.username, isPublic, terms });
            localStorage.setItem('studySets', JSON.stringify(sets));
            
            closeCreateSetModal();
            showToast("Study Set Created!");
            awardXP(25, "Created a Study Set!");
            window.renderStudySets('my');
            document.getElementById('tab-my').click(); 
        };

        window.deleteStudySet = function(id, event) {
            event.stopPropagation();
            if(confirm("Delete this study set?")) {
                let sets = JSON.parse(localStorage.getItem('studySets')) || [];
                sets = sets.filter(s => s.id !== id);
                localStorage.setItem('studySets', JSON.stringify(sets));
                window.renderStudySets('my');
            }
        };

        // Initialize Sets
        window.renderStudySets('community');
    }

    // --- DICTIONARY API ---
    if(document.getElementById('search-word')) {
        const API_KEY = '48b75fd2-def5-424a-8a81-c5b139ece004';
        const API_URL = 'https://www.dictionaryapi.com/api/v3/references/spanish/json/';
        let searchDirection = 'spanish';
        const ambiguousWords = ['once', 'si', 'fin', 'red', 'pan', 'sal', 'fe', 'no', 'mi', 'tu'];

        window.setSearchDirection = function(direction) {
            searchDirection = direction;
            const btnSpanish = document.getElementById('btn-spanish');
            const btnEnglish = document.getElementById('btn-english');
            
            if(btnSpanish && btnEnglish) {
                if (direction === 'spanish') {
                    btnSpanish.classList.remove('secondary');
                    btnSpanish.style.borderColor = 'transparent';
                    btnEnglish.classList.add('secondary');
                    btnEnglish.style.borderColor = 'var(--border-gray)';
                    document.getElementById('search-label').textContent = 'Enter a Spanish Word';
                } else {
                    btnEnglish.classList.remove('secondary');
                    btnEnglish.style.borderColor = 'transparent';
                    btnSpanish.classList.add('secondary');
                    btnSpanish.style.borderColor = 'var(--border-gray)';
                    document.getElementById('search-label').textContent = 'Enter an English Word';
                }
            }
        };

        window.searchWord = async function() {
            const word = document.getElementById('search-word').value.trim().toLowerCase();
            const resultsDiv = document.getElementById('dictionary-results');
            const loadingDiv = document.getElementById('loading-indicator');
            const errorDiv = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');
            
            if (!word) return;

            errorDiv.classList.add('hidden');
            loadingDiv.classList.remove('hidden');
            resultsDiv.innerHTML = '';
            document.getElementById('placeholder-message')?.classList.add('hidden'); 

            try {
                const response = await fetch(`${API_URL}${encodeURIComponent(word)}?key=${API_KEY}`);
                if (!response.ok) throw new Error('Network error');
                const data = await response.json();
                loadingDiv.classList.add('hidden');

                if (data.length > 0 && typeof data[0] === 'string') {
                    errorText.textContent = `Word not found. Did you mean: ${data.slice(0, 3).join(', ')}?`;
                    errorDiv.classList.remove('hidden');
                    return;
                }

                if (data && data.length > 0 && typeof data[0] === 'object') {
                    let html = '';
                    data.forEach(entry => {
                        const headword = (entry.hwi?.hw || word).replace(/\*/g, ''); 
                        const partOfSpeech = entry.fl || 'Unknown Type';
                        let definitions = entry.shortdef || [];

                        if (definitions.length === 0) return;

                        html += `
                            <div class="card" style="margin-bottom: 1.5rem; text-align: left; width: 100%; border: 1px solid var(--border-gray);">
                                <h3 style="color: var(--primary-orange);">${headword}</h3>
                                <span style="font-style:italic;">${partOfSpeech}</span>
                                <ul>${definitions.map((def, i) => `<li>${def}</li>`).join('')}</ul>
                            </div>
                        `;
                    });
                    if(html === '') throw new Error('No definitions');
                    resultsDiv.innerHTML = html;
                } else throw new Error('No definitions');
            } catch (error) {
                loadingDiv.classList.add('hidden');
                errorText.textContent = 'Word not found.';
                errorDiv.classList.remove('hidden');
            }
        };
        window.clearResults = function() {
            document.getElementById('search-word').value = '';
            document.getElementById('dictionary-results').innerHTML = `<p style="text-align:center;">Search for a word</p>`;
        };
        document.getElementById('search-word').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.searchWord(); });
    }

    // Modal Helpers
    window.openLesson = function() { document.getElementById('lessonModal').classList.remove('hidden'); };
    window.closeLesson = function() { document.getElementById('lessonModal').classList.add('hidden'); };
    window.openQuiz = function() { document.getElementById('quizModal').classList.remove('hidden'); };
    window.closeQuiz = function() { document.getElementById('quizModal').classList.add('hidden'); };
    window.openFlashcards = function() { document.getElementById('flashcardModal').classList.remove('hidden'); };
    window.closeFlashcards = function() { document.getElementById('flashcardModal').classList.add('hidden'); };
    window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) e.target.classList.add('hidden'); });

});

// --- SETTINGS ---
window.updateProfile = function() {
    const newName = document.getElementById('edit-username')?.value;
    const newPass = document.getElementById('edit-password')?.value;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if(!currentUser) return; 

    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if(userIndex > -1) {
        if(newName) users[userIndex].username = newName;
        if(newPass) users[userIndex].password = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
        alert("Profile Updated!"); window.location.reload();
    }
};

window.deleteMyAccount = function() {
    if(confirm("Delete account?")) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        localStorage.setItem('users', JSON.stringify(users.filter(u => u.id !== currentUser.id)));
        localStorage.removeItem('currentUser');
        window.location.href = "index.html";
    }
};

// Tool Placeholders
window.downloadCheatSheet = function() { window.showToast(`📥 Downloading...`); };
window.downloadPracticeWorkbook = function() { window.showToast('📘 Downloading...'); };
window.startRandomDrill = function() { window.showToast('🎲 Starting Drill...'); };
window.openGrammarChecker = function() { window.showToast('🔍 Checking...'); };
window.startChallenge = function() { window.showToast('⏱️ Starting Challenge!'); };