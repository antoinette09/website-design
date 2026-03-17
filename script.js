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
    if(!currentUser) return; // Only logged in users get XP
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

    // ---  FAQ ACCORDION (Fixed to close others) ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(button => {
        button.addEventListener('click', () => {
            const currentItem = button.parentElement;
            // Close all other FAQs first
            document.querySelectorAll('.faq-item').forEach(item => {
                if(item !== currentItem) item.classList.remove('active');
            });
            // Toggle the one we clicked
            currentItem.classList.toggle('active');
        });
    });

    // --- HOME PAGE (Index.html) ---
    if(document.getElementById('greeting-text')) {
        if (currentUser) document.getElementById('greeting-text').textContent = `¡Hola, ${currentUser.username}!`;

        // Stats System
        function loadStats() {
            const stats = JSON.parse(localStorage.getItem('userStats')) || { streak: 0, xp: 0, level: 1, lastLesson: 'Lesson 1' };
            document.getElementById('streak-display').textContent = stats.streak;
            document.getElementById('xp-display').textContent = stats.xp;
            document.getElementById('level-display').textContent = stats.level;

            const continueBtn = document.getElementById('continue-lesson-btn');
            if(continueBtn) {
                continueBtn.innerHTML = `<img src="refresh.svg" alt="Refresh" onerror="this.style.display='none'" style="height:25px; width:25px;"> Continue ${stats.lastLesson || 'Lesson 1'}`;
                continueBtn.onclick = () => {
                    window.awardXP(10, "Continued Learning!");
                    stats.lastLesson = `Lesson ${Math.floor(stats.xp / 100) + 1}`;
                    localStorage.setItem('userStats', JSON.stringify(stats));
                    loadStats();
                };
            }
        }
        loadStats();

                // Word of the Day
                const words = [
                    { spanish: 'El mar', english: 'The sea' },
                    { spanish: 'La playa', english: 'The beach' },
                    { spanish: 'El libro', english: 'The book' },
                    { spanish: 'La casa', english: 'The house' },
                    { spanish: 'El amigo', english: 'The friend' }
                ];
        
                let wordOfDay = JSON.parse(localStorage.getItem('wordOfDay'));
                if (!wordOfDay || new Date().toDateString() !== wordOfDay.date) {
                    wordOfDay = { date: new Date().toDateString(), word: words[Math.floor(Math.random() * words.length)] };
                    localStorage.setItem('wordOfDay', JSON.stringify(wordOfDay));
                }
        
                document.getElementById('word-spanish').textContent = wordOfDay.word.spanish;
                document.getElementById('word-english').textContent = wordOfDay.word.english;
        
                const listenBtn = document.getElementById('listen-btn');
                if(listenBtn) {
                    listenBtn.addEventListener('click', () => {
                        window.speechSynthesis.cancel(); 
                        const utterance = new SpeechSynthesisUtterance(wordOfDay.word.spanish);
                        utterance.lang = 'es-ES'; 
                        utterance.rate = 0.9;
                        window.speechSynthesis.speak(utterance);
                    });
                }

        function loadComingUp() {
            const siteEvents = JSON.parse(localStorage.getItem('siteEvents')) || [];
            const pendingEvents = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            let myEvents = siteEvents;
            
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
                delete evt.proposer; 
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

    // --- 5. CALENDAR SYSTEM ---
    if (document.getElementById('calendar')) {
        let date = new Date();
        let selectedDate = null;
        
        if(!currentUser) {
            document.getElementById('scheduleBtn').disabled = true;
            document.getElementById('scheduleBtn').innerHTML = "Log In to Schedule";
        } else if (currentUser.role === 'student') {
            document.getElementById('scheduleFormTitle').textContent = "Propose a Study Group";
            document.getElementById('scheduleBtn').innerHTML = "Submit Proposal";
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
            
            eventList.innerHTML = daysEvents.length ? '' : '<p style="color:var(--text-dark);">No official meetings.</p>';
            daysEvents.forEach(evt => {
                const isFull = (evt.totalSpots - evt.attendees.length) <= 0;
                const hasJoined = currentUser && evt.attendees.includes(currentUser.username);
                const deleteBtn = (currentUser?.role === 'admin') ? `<button onclick="deleteEvent('${evt.id}')" style="float:right; color:red; background:none; border:none; cursor:pointer; font-size:1.5rem;">&times;</button>` : '';
                eventList.innerHTML += `
                    <div class="event-item">
                        ${deleteBtn}
                        <strong>${evt.title}</strong><br>
                        <small>${evt.type.toUpperCase()}</small><br>
                        <small>Spots: ${evt.totalSpots - evt.attendees.length}/${evt.totalSpots}</small><br>
                        ${hasJoined ? '<button class="join-btn" disabled style="background:#2ecc71; color:white;">Joined</button>' 
                                    : `<button class="join-btn" onclick="joinEvent('${evt.id}')" ${isFull ? 'disabled' : ''}>${isFull ? 'Full' : 'Join'}</button>`}
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


    // --- 6. LEARNING MODULES & COMMUNITY SETS (WITH SEARCH/FILTER) ---
    let currentModuleType = null;
    let moduleConfig = {};
    let customFlashcards = [];
    let customCardIndex = 0;

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
        
        // --- Core Module Progress Tracking ---
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

        // --- Community Sets Default Data ---
        const defaultSets = [
            { id: "1", title: "Greetings Review", category: "vocab", author: "Admin", isPublic: true, resourceType: "flashcards", terms: [{term: "Hola", def: "Hello"}, {term: "Adiós", def: "Goodbye"}], notes: "", links: [] },
            { id: "2", title: "-AR Endings", category: "conjugation", author: "Admin", isPublic: true, resourceType: "notes", terms: [], notes: "**Rules for -AR verbs:**\n- yo = o\n- tú = as\n- él/ella = a", links: [] },
            { id: "3", title: "Helpful Grammar Links", category: "grammar", author: "Admin", isPublic: true, resourceType: "links", terms: [], notes: "", links: [{title: "SpanishDict Grammar", url: "https://spanishdict.com", description: "Best reference tool"}] }
        ];

        if(!localStorage.getItem('studySets')) {
            localStorage.setItem('studySets', JSON.stringify(defaultSets));
        }

        window.switchResourceTab = function(tab) {
            document.getElementById('tab-community')?.classList.remove('active');
            document.getElementById('tab-my')?.classList.remove('active');
            document.getElementById(`tab-${tab}`)?.classList.add('active');
            window.renderStudySets(); // Now relies on active tab class
        };

        // --- Render Community Sets (WITH SEARCH AND FILTER) ---
        window.renderStudySets = function() {
            const container = document.getElementById('study-sets-container');
            if (!container) return;

            const allSets = JSON.parse(localStorage.getItem('studySets')) || [];
            
            // 1. Filter by Page Category
            let filteredSets = allSets.filter(s => s.category === currentModuleType);

            // 2. Filter by Active Tab (Community vs My Sets)
            const activeTab = document.querySelector('.tab-btn.active')?.id.replace('tab-', '') || 'community';
            if(activeTab === 'community') {
                filteredSets = filteredSets.filter(s => s.isPublic);
            } else if (activeTab === 'my') {
                if(!currentUser) { 
                    container.innerHTML = '<p style="color:var(--text-dark); grid-column: 1 / -1;">Please log in to view your sets.</p>'; 
                    return; 
                }
                filteredSets = filteredSets.filter(s => s.author === currentUser.username);
            }

            // 3. Filter by Search Bar Text
            const searchQuery = document.getElementById('set-search')?.value.toLowerCase() || '';
            if (searchQuery) {
                filteredSets = filteredSets.filter(s => 
                    s.title.toLowerCase().includes(searchQuery) || 
                    s.author.toLowerCase().includes(searchQuery)
                );
            }

            // 4. Filter by Dropdown Type
            const typeFilter = document.getElementById('set-filter')?.value || 'all';
            if (typeFilter !== 'all') {
                filteredSets = filteredSets.filter(s => s.resourceType === typeFilter || s.resourceType === 'mixed');
            }

            // Render Results
            if(filteredSets.length === 0) {
                container.innerHTML = '<p style="color:var(--text-dark); grid-column: 1 / -1;">No sets match your search/filter.</p>';
                return;
            }

            container.innerHTML = filteredSets.map(set => {
                const isMine = currentUser && set.author === currentUser.username;
                const deleteBtn = isMine 
                    ? `<button onclick="deleteStudySet('${set.id}', event)" style="margin-top:10px; background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; width:100%; cursor:pointer;">Delete Set</button>` 
                    : '';
                
                let preview = '';
                if (set.resourceType === 'flashcards' || set.terms?.length) preview += `🃏 ${set.terms.length} cards `;
                if (set.resourceType === 'notes' || set.notes) preview += `📝 notes `;
                if (set.resourceType === 'links' || set.links?.length) preview += `🔗 ${set.links.length} links`;
                if (set.resourceType === 'mixed') preview = `✨ Mixed resources`;
                
                return `
                <div class="card" style="text-align:left; cursor:pointer; width: 100%; position: relative;" onclick="openStudySet('${set.id}')">
                    <span class="resource-badge ${set.resourceType || 'flashcards'}" style="position:absolute; top:10px; right:10px; font-size:0.75rem; background:var(--bg-white); padding:3px 8px; border-radius:12px; border:1px solid var(--border-gray); font-weight:bold;">${set.resourceType || 'flashcards'}</span>
                    <h3 style="color:var(--primary-orange); width:80%;">${set.title}</h3>
                    <p style="font-size:0.9rem; color:var(--text-dark); margin-bottom: 5px;">By: ${set.author} | ${preview}</p>
                    ${deleteBtn}
                </div>
                `;
            }).join('');
        };

        window.openStudySet = function(id) {
            const allSets = JSON.parse(localStorage.getItem('studySets')) || [];
            const set = allSets.find(s => s.id === id);
            if (!set) return alert("Set not found!");
            
            let contentHTML = '';
            
            if (set.terms?.length > 0) {
                contentHTML += `
                <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-gray);">
                    <h4 style="color: var(--accent-blue-dark); margin-bottom: 0.5rem;">🃏 Flashcards</h4>
                    <button class="form-button" onclick="startCustomFlashcardsFromSet('${set.id}')">Start Flashcard Mode</button>
                </div>
                `;
            }
            if (set.notes) {
                contentHTML += `
                <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-gray);">
                    <h4 style="color: var(--accent-blue-dark); margin-bottom: 0.5rem;">📝 Notes</h4>
                    <div style="background: var(--bg-light-orange); padding: 1rem; border-radius: 8px; text-align: left; white-space: pre-wrap; font-size: 0.95rem; color: var(--text-dark); border: 1px solid var(--border-gray);">${set.notes}</div>
                </div>
                `;
            }
            if (set.links?.length > 0) {
                contentHTML += `
                <div>
                    <h4 style="color: var(--accent-blue-dark); margin-bottom: 0.5rem;">🔗 Resources</h4>
                    ${set.links.map(link => `
                    <a href="${link.url}" target="_blank" rel="noopener" style="display: block; padding: 0.75rem; background: var(--bg-light-orange); border-radius: 8px; margin-bottom: 0.5rem; text-decoration: none; color: var(--accent-blue-dark); border-left: 4px solid var(--primary-orange); border: 1px solid var(--border-gray);">
                        <strong>${link.title}</strong>
                        ${link.description ? `<p style="font-size: 0.9rem; color: var(--text-dark); margin: 0.25rem 0 0;">${link.description}</p>` : ''}
                    </a>
                    `).join('')}
                </div>
                `;
            }
            
            document.getElementById('lessonTitle').textContent = set.title;
            document.getElementById('lessonContent').innerHTML = contentHTML;
            document.getElementById('lessonModal').classList.remove('hidden');
        };

        window.startCustomFlashcardsFromSet = function(setId) {
            const allSets = JSON.parse(localStorage.getItem('studySets')) || [];
            const set = allSets.find(s => s.id === setId);
            if (!set || !set.terms?.length) return;
            
            document.getElementById('lessonModal').classList.add('hidden');
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

        // Create Set Modal Flow
        window.openCreateSetModal = function() {
            if(!currentUser) return alert("You must be logged in to create sets.");
            document.getElementById('createSetModal').classList.remove('hidden');
            document.getElementById('terms-container').innerHTML = '';
            document.getElementById('links-container').innerHTML = '';
            if(document.getElementById('notes-content')) document.getElementById('notes-content').value = '';
            toggleResourceFields();
            addTermRow(); addTermRow();
        };
        window.closeCreateSetModal = function() { document.getElementById('createSetModal').classList.add('hidden'); };
        
        window.toggleResourceFields = function() {
            const type = document.querySelector('input[name="resource-type"]:checked')?.value || 'flashcards';
            const flashcardsSection = document.getElementById('flashcards-section');
            const notesSection = document.getElementById('notes-section');
            const linksSection = document.getElementById('links-section');
            
            if(flashcardsSection) flashcardsSection.classList.add('hidden');
            if(notesSection) notesSection.classList.add('hidden');
            if(linksSection) linksSection.classList.add('hidden');
            
            if (type === 'flashcards' || type === 'mixed') if(flashcardsSection) flashcardsSection.classList.remove('hidden');
            if (type === 'notes' || type === 'mixed') if(notesSection) notesSection.classList.remove('hidden');
            if (type === 'links' || type === 'mixed') if(linksSection) linksSection.classList.remove('hidden');
        };
        
        window.addTermRow = function() {
            const row = document.createElement('div');
            row.className = 'term-row';
            row.style.cssText = 'display:flex; gap:0.5rem; margin-bottom:0.5rem; align-items:center;';
            row.innerHTML = `
                <input type="text" class="term-input" placeholder="Term (e.g. Hola)" style="flex:1; padding:8px; border:1px solid var(--border-gray); border-radius:4px; font-family: var(--font-body);">
                <input type="text" class="def-input" placeholder="Definition (e.g. Hello)" style="flex:1; padding:8px; border:1px solid var(--border-gray); border-radius:4px; font-family: var(--font-body);">
                <button type="button" class="remove-term-btn" onclick="this.parentElement.remove()" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">×</button>
            `;
            document.getElementById('terms-container').appendChild(row);
        };
        
        window.addLinkRow = function() {
            const container = document.getElementById('links-container');
            const row = document.createElement('div');
            row.className = 'link-row';
            row.style.cssText = 'background:var(--bg-light-orange); padding:1rem; border-radius:8px; margin-bottom:0.75rem; border:1px solid var(--border-gray);';
            row.innerHTML = `
                <input type="text" placeholder="Link Title" class="link-title" required style="width:100%; padding:0.5rem; margin:0.25rem 0; border:1px solid var(--border-gray); border-radius:4px;">
                <input type="url" placeholder="https://..." class="link-url" required style="width:100%; padding:0.5rem; margin:0.25rem 0; border:1px solid var(--border-gray); border-radius:4px;">
                <input type="text" placeholder="Description (optional)" class="link-desc" style="width:100%; padding:0.5rem; margin:0.25rem 0; border:1px solid var(--border-gray); border-radius:4px;">
                <button type="button" class="form-button secondary" onclick="this.parentElement.remove()" style="width:auto; padding:0.3rem 0.8rem; margin-top:0.5rem;">Remove</button>
            `;
            container.appendChild(row);
        };
        
        window.saveStudySet = function() {
            const type = document.querySelector('input[name="resource-type"]:checked')?.value || 'flashcards';
            const setTitle = document.getElementById('set-title').value.trim();
            const setDesc = document.getElementById('set-desc').value.trim();
            const isPublic = document.getElementById('set-public').checked;
            
            if (!setTitle) return alert("Title is required!");
            
            const newSet = {
                id: Date.now().toString(),
                title: setTitle,
                description: setDesc,
                category: currentModuleType,
                resourceType: type,
                author: currentUser.username,
                isPublic: isPublic,
                terms: [], notes: '', links: []
            };
            
            if (type === 'flashcards' || type === 'mixed') {
                document.querySelectorAll('.term-row').forEach(row => {
                    const term = row.querySelector('.term-input')?.value.trim();
                    const def = row.querySelector('.def-input')?.value.trim();
                    if (term && def) newSet.terms.push({ term, def });
                });
            }
            if ((type === 'notes' || type === 'mixed') && document.getElementById('notes-content')) {
                newSet.notes = document.getElementById('notes-content').value.trim();
            }
            if (type === 'links' || type === 'mixed') {
                document.querySelectorAll('.link-row').forEach(row => {
                    const title = row.querySelector('.link-title')?.value.trim();
                    const url = row.querySelector('.link-url')?.value.trim();
                    const desc = row.querySelector('.link-desc')?.value.trim();
                    if (title && url) newSet.links.push({ title, url, description: desc });
                });
            }
            
            if (newSet.terms.length === 0 && !newSet.notes && newSet.links.length === 0) return alert("Add at least one flashcard, note, or link!");
            
            const sets = JSON.parse(localStorage.getItem('studySets')) || [];
            sets.push(newSet);
            localStorage.setItem('studySets', JSON.stringify(sets));
            
            closeCreateSetModal();
            showToast("Study Set Created! ✨");
            awardXP(25, "Created a Study Set!");
            document.getElementById('tab-my').click(); // Auto switch to 'My Sets' tab
        };
        
        window.deleteStudySet = function(id, event) {
            event.stopPropagation();
            if(confirm("Delete this study set?")) {
                let sets = JSON.parse(localStorage.getItem('studySets')) || [];
                sets = sets.filter(s => s.id !== id);
                localStorage.setItem('studySets', JSON.stringify(sets));
                renderStudySets();
            }
        };

        // Initialize Sets list
        window.renderStudySets();
    }

    // --- 7. NEW FORUM LOGIC (forum.html) ---
    if (document.getElementById('forum-container')) {
        let activePostId = null;

        const defaultPosts = [
            { id: "f1", title: "Help with Ser vs Estar?", content: "I keep getting confused when to use which one for location. Any tips?", author: "Student123", timestamp: "Oct 24, 10:00 AM", replies: [{author: "Admin", content: "Remember the acronym PLACE for Estar: Position, Location, Action, Condition, Emotion!", timestamp: "Oct 24, 10:05 AM"}] },
            { id: "f2", title: "Best way to memorize vocab?", content: "What works best for you guys? Flashcards or writing it down?", author: "SpanishLearner", timestamp: "Oct 23, 2:30 PM", replies: [] }
        ];

        if(!localStorage.getItem('forumPosts')) {
            localStorage.setItem('forumPosts', JSON.stringify(defaultPosts));
        }

        window.renderForum = function() {
            const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
            const container = document.getElementById('forum-container');
            container.innerHTML = '';

            if (posts.length === 0) {
                container.innerHTML = '<p style="text-align:center;">No posts yet. Be the first to ask a question!</p>';
                return;
            }

            // Render descending
            posts.slice().reverse().forEach(post => {
                container.innerHTML += `
                    <div class="card" style="text-align: left; width: 100%; box-sizing: border-box; cursor: pointer; border: 1px solid var(--border-gray); overflow: hidden;" onclick="openViewPostModal('${post.id}')">
                        <!-- 1. Fix the Header: Add min-width: 0 to the H3 so it truncates instead of pushing the badge out -->
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 5px;">
                            <h3 style="color: var(--primary-orange); margin: 0; min-width: 0; overflow: hidden;">${post.title}</h3>
                            <span style="flex-shrink: 0; background: var(--accent-blue-light); color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">${post.replies.length} Replies</span>
                        </div>
                        
                        <!-- 2. Fix the Paragraph: Ensure it's a block and box-sizing is correct -->
                        <p style="color: var(--text-dark); font-size: 0.95rem; margin-bottom: 10px; overflow: hidden; display: block; width: 100%; box-sizing: border-box;">${post.content}</p>
                        
                        <small style="color: #888;">Posted by ${post.author} • ${post.timestamp}</small>
                    </div>
                `;
            });
        };

        window.openCreatePostModal = function() {
            if(!currentUser) return alert("Log in to ask a question!");
            document.getElementById('post-title').value = '';
            document.getElementById('post-content').value = '';
            document.getElementById('createPostModal').classList.remove('hidden');
        };
        window.closeCreatePostModal = function() { document.getElementById('createPostModal').classList.add('hidden'); };

        window.saveForumPost = function() {
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            if(!title || !content) return alert("Fill out both fields!");

            const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
            const newPost = {
                id: Date.now().toString(),
                title: title,
                content: content,
                author: currentUser.username,
                timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }),
                replies: []
            };
            
            posts.unshift(newPost);
            localStorage.setItem('forumPosts', JSON.stringify(posts));
            closeCreatePostModal();
            showToast("Question posted!");
            awardXP(15, "Asked a question!");
            renderForum();
        };

        window.openViewPostModal = function(id) {
            activePostId = id;
            const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
            const post = posts.find(p => p.id === id);
            if(!post) return;

            document.getElementById('active-post-content').innerHTML = `
                <h2 style="color: var(--primary-orange); margin-bottom: 10px;">${post.title}</h2>
                <small style="color: #888;">Posted by <strong>${post.author}</strong> on ${post.timestamp}</small>
                <div style="background: var(--bg-white); padding: 15px; border-radius: 8px; border: 1px solid var(--border-gray); margin-top: 15px; color: var(--text-dark);">
                    ${post.content.replace(/\n/g, '<br>')}
                </div>
            `;

            const repliesContainer = document.getElementById('replies-container');
            repliesContainer.innerHTML = '';
            if (post.replies.length === 0) {
                repliesContainer.innerHTML = '<p style="color: #888; font-style: italic;">No replies yet. Help them out!</p>';
            } else {
                post.replies.forEach(reply => {
                    const isAuthor = reply.author === post.author;
                    const badge = isAuthor ? `<span style="background:var(--primary-orange); color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px;">Author</span>` : '';
                    repliesContainer.innerHTML += `
                        <div style="background: var(--bg-white); padding: 10px 15px; border-radius: 8px; border-left: 3px solid var(--accent-blue-light);">
                            <small style="color: var(--accent-blue-dark); font-weight: bold;">${reply.author} ${badge} • <span style="color:#888; font-weight:normal;">${reply.timestamp}</span></small>
                            <p style="color: var(--text-dark); margin-top: 5px; font-size: 0.95rem;">${reply.content.replace(/\n/g, '<br>')}</p>
                        </div>
                    `;
                });
            }

            document.getElementById('viewPostModal').classList.remove('hidden');
        };
        window.closeViewPostModal = function() { document.getElementById('viewPostModal').classList.add('hidden'); activePostId = null; };

        window.addReply = function() {
            if(!currentUser) return alert("Log in to reply!");
            const input = document.getElementById('reply-input');
            const content = input.value.trim();
            if(!content) return;

            const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
            const postIndex = posts.findIndex(p => p.id === activePostId);
            if(postIndex > -1) {
                posts[postIndex].replies.push({
                    author: currentUser.username,
                    content: content,
                    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
                });
                localStorage.setItem('forumPosts', JSON.stringify(posts));
                input.value = '';
                showToast("Reply posted!");
                awardXP(10, "Helped a peer!");
                openViewPostModal(activePostId); // Refresh modal
                renderForum(); // Refresh background list
            }
        };

        renderForum();
    }


    // --- DICTIONARY API ---
    if(document.getElementById('search-word')) {
        const API_KEY = '48b75fd2-def5-424a-8a81-c5b139ece004';
        const API_URL = 'https://www.dictionaryapi.com/api/v3/references/spanish/json/';
        let searchDirection = 'spanish';
        
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
                        let definitions = [];
                        if (entry.shortdef && entry.shortdef.length > 0) definitions = entry.shortdef;
                        if (definitions.length === 0) return;
                        let audioUrl = null;
                        const audioFile = entry.hwi?.prs?.[0]?.sound?.audio;
                        if (audioFile) {
                            let subdir = audioFile.charAt(0);
                            if (audioFile.startsWith('bix')) subdir = 'bix';
                            else if (audioFile.startsWith('gg')) subdir = 'gg';
                            else if (!isNaN(parseInt(subdir)) || /[^a-zA-Z]/.test(subdir)) subdir = 'number';
                            audioUrl = `https://media.merriam-webster.com/audio/prons/es/me/mp3/${subdir}/${audioFile}.mp3`;
                        }
                        html += `
                        <div class="card" style="margin-bottom: 1.5rem; text-align: left; width: 100%; border: 1px solid var(--border-gray);">
                            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; align-items: center; border-bottom: 2px solid var(--bg-white); padding-bottom: 10px;">
                                <h3 style="margin:0; font-size:1.8rem; color: var(--primary-orange); font-family: var(--font-heading);">${headword}</h3>
                                <span style="font-style:italic; color: var(--accent-blue-dark); font-weight: 600; background: var(--bg-white); padding: 4px 12px; border-radius: 20px;">${partOfSpeech}</span>
                            </div>
                            ${audioUrl ? `<button class="form-button" onclick="playAudio('${audioUrl}')" style="margin: 1rem 0; padding: 6px 15px; font-size: 0.9rem; background-color: var(--accent-blue-light); display: inline-flex; align-items: center; gap: 8px;"><img src="listen.svg" alt="Listen" style="height: 16px; filter: brightness(0) invert(1);"> Listen</button>` : ''}
                            <div style="margin-top: ${audioUrl ? '0' : '1rem'};">
                                <ul style="list-style-type: none; padding: 0;">
                                    ${definitions.map((def, i) => `<li style="margin-bottom: 8px; font-size: 1.05rem; display: flex; gap: 10px;"><strong style="color: var(--secondary-orange);">${i+1}.</strong><span style="color: var(--text-dark);">${def}</span></li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        `;
                    });
                    if(html === '') throw new Error('No definitions found');
                    resultsDiv.innerHTML = html;
                } else { throw new Error('No definitions'); }
            } catch (error) {
                loadingDiv.classList.add('hidden');
                errorText.textContent = 'Word not found. Check spelling or try the other language direction.';
                errorDiv.classList.remove('hidden');
            }
        };
        
        window.playAudio = function(url) { 
            new Audio(url).play(); 
        };
        
        window.clearResults = function() {
            document.getElementById('search-word').value = '';
            document.getElementById('error-message').classList.add('hidden');
            document.getElementById('ambiguity-warning').classList.add('hidden');
            document.getElementById('dictionary-results').innerHTML = `<div class="card" id="placeholder-message" style="margin: 0 auto;"><p style="text-align: center; color: var(--secondary-orange); font-size: 1.1rem; font-weight: 600;"><img src="book.svg" alt="Dictionary" style="height: 60px; width: 60px; margin: 0 auto 1rem auto; opacity: 0.5;">Search for a word to see its definition</p></div>`;
        };
        
        document.getElementById('search-word').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.searchWord(); });
        window.setSearchDirection('spanish');
    }

    // --- Modal Helpers ---
    window.openLesson = function() { document.getElementById('lessonModal')?.classList.remove('hidden'); };
    window.closeLesson = function() { document.getElementById('lessonModal')?.classList.add('hidden'); };
    window.openOldFlashcards = function() { document.getElementById('flashcardModal')?.classList.remove('hidden'); };
    window.closeOldFlashcards = function() { document.getElementById('flashcardModal')?.classList.add('hidden'); };
    window.openQuiz = function() { document.getElementById('quizModal')?.classList.remove('hidden'); };
    window.closeQuiz = function() { document.getElementById('quizModal')?.classList.add('hidden'); };
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
window.downloadAllCheatSheets = function() { window.showToast(`📥 Downloading...`); };
window.downloadCheatSheet = function() { window.showToast(`📥 Downloading...`); };
window.downloadPracticeWorkbook = function() { window.showToast('📘 Downloading...'); };
window.startRandomDrill = function() { window.showToast('🎲 Starting Drill...'); };
window.startSpeedMatch = function() { window.showToast('⏱️ Starting Game...'); };
window.openVerbFinder = function() { window.showToast('🔎 Finding verb...'); };
window.openGrammarChecker = function() { window.showToast('🔍 Checking...'); };
window.downloadAudioPack = function() { window.showToast('📘 Downloading...'); };
window.startChallenge = function() { window.showToast('⚡️ Starting Challenge!'); };

// Word of the Day
const words = [
    { spanish: 'El mar', english: 'The sea' },
    { spanish: 'La playa', english: 'The beach' },
    { spanish: 'El libro', english: 'The book' },
    { spanish: 'La casa', english: 'The house' },
    { spanish: 'El amigo', english: 'The friend' }
];

let wordOfDay = JSON.parse(localStorage.getItem('wordOfDay'));
if (!wordOfDay || new Date().toDateString() !== wordOfDay.date) {
    wordOfDay = { date: new Date().toDateString(), word: words[Math.floor(Math.random() * words.length)] };
    localStorage.setItem('wordOfDay', JSON.stringify(wordOfDay));
}

document.getElementById('word-spanish').textContent = wordOfDay.word.spanish;
document.getElementById('word-english').textContent = wordOfDay.word.english;