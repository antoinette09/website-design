// ==========================================
// GLOBAL UTILITIES & ACCESSIBILITY
// ==========================================
const currentUserJSON = localStorage.getItem('currentUser');
const currentUser = currentUserJSON ? JSON.parse(currentUserJSON) : null;

const a11ySettings = JSON.parse(localStorage.getItem('a11ySettings')) || { dark: false, dyslexia: false, colorblind: false };
function applyA11y() {
    if(a11ySettings.dark) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode');
    if(a11ySettings.dyslexia) document.body.classList.add('dyslexia-mode'); else document.body.classList.remove('dyslexia-mode');
    if(a11ySettings.colorblind) document.body.classList.add('colorblind-mode'); else document.body.classList.remove('colorblind-mode');
}
applyA11y();

window.toggleA11y = function(type) {
    a11ySettings[type] = document.getElementById(`toggle-${type}`).checked;
    localStorage.setItem('a11ySettings', JSON.stringify(a11ySettings));
    applyA11y();
};

window.showToast = function(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000);
};

window.awardXP = function(amount, message) {
    if(!currentUser) return; 
    const stats = JSON.parse(localStorage.getItem(`stats_${currentUser.username}`)) || { streak: 0, xp: 0, level: 1, lastActivity: new Date().toLocaleDateString() };
    stats.xp += amount;
    stats.lastActivity = new Date().toLocaleDateString(); 
    const newLevel = Math.floor(stats.xp / 500) + 1;
    if (newLevel > stats.level) { stats.level = newLevel; window.showToast(`🎉 Level Up! You're now level ${stats.level}!`); }
    localStorage.setItem(`stats_${currentUser.username}`, JSON.stringify(stats));
    window.showToast(`<img src="sparkle.svg" style="width: 50px; vertical-align: middle;"> +${amount} XP: ${message}`);
    if(document.getElementById('xp-display')) { document.getElementById('xp-display').textContent = stats.xp; document.getElementById('level-display').textContent = stats.level; }
};

window.handleLogout = function(e) { if(e) e.preventDefault(); localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };

window.closeYouTubeModal = function() {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('videoContainer');
    if(modal) modal.classList.add('hidden');
    if(container) container.innerHTML = ''; // Stops the video from playing in background
};

// ==========================================
// PAGE LOAD INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Sync Checkboxes for A11y
    if(document.getElementById('toggle-dark')) document.getElementById('toggle-dark').checked = a11ySettings.dark;
    if(document.getElementById('toggle-dyslexia')) document.getElementById('toggle-dyslexia').checked = a11ySettings.dyslexia;
    if(document.getElementById('toggle-colorblind')) document.getElementById('toggle-colorblind').checked = a11ySettings.colorblind;

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
    // --- FAQ ACCORDION ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(button => {
        button.addEventListener('click', () => {
            const currentItem = button.parentElement;
            document.querySelectorAll('.faq-item').forEach(item => { if(item !== currentItem) item.classList.remove('active'); });
            currentItem.classList.toggle('active');
        });
    });

    // --- 1. HOME PAGE LOGIC ---
    if(document.getElementById('greeting-text')) {
        if (currentUser) document.getElementById('greeting-text').textContent = `¡Hola, ${currentUser.username}!`;

        function loadStats() {
            if(!currentUser) return;
            const stats = JSON.parse(localStorage.getItem(`stats_${currentUser.username}`)) || { streak: 0, xp: 0, level: 1, lastLesson: 'Lesson 1' };
            document.getElementById('streak-display').textContent = stats.streak;
            document.getElementById('xp-display').textContent = stats.xp;
            document.getElementById('level-display').textContent = stats.level;
            const continueBtn = document.getElementById('continue-lesson-btn');
            if(continueBtn) {
                continueBtn.innerHTML = `<img src="arrows.svg" alt="Refresh" style="height:50px; width:50px;"> Continue ${stats.lastLesson || 'Lesson 1'}`;
                continueBtn.onclick = () => { window.awardXP(10, "Continued Learning!"); stats.lastLesson = `Lesson ${Math.floor(stats.xp / 100) + 1}`; localStorage.setItem(`stats_${currentUser.username}`, JSON.stringify(stats)); loadStats(); };
            }
        }
        loadStats();

        // Word of the Day
        const words = [
            { spanish: 'El mar', english: 'The sea' }, { spanish: 'La playa', english: 'The beach' },
            { spanish: 'El libro', english: 'The book' }, { spanish: 'La casa', english: 'The house' }
        ];
        let wordOfDay = JSON.parse(localStorage.getItem('wordOfDay'));
        if (!wordOfDay || new Date().toDateString() !== wordOfDay.date) {
            wordOfDay = { date: new Date().toDateString(), word: words[Math.floor(Math.random() * words.length)] };
            localStorage.setItem('wordOfDay', JSON.stringify(wordOfDay));
        }
        if(document.getElementById('word-spanish')) document.getElementById('word-spanish').textContent = wordOfDay.word.spanish;
        if(document.getElementById('word-english')) document.getElementById('word-english').textContent = wordOfDay.word.english;

        const listenBtn = document.getElementById('listen-btn');
        if(listenBtn) {
            listenBtn.addEventListener('click', () => {
                window.speechSynthesis.cancel(); 
                const utterance = new SpeechSynthesisUtterance(wordOfDay.word.spanish);
                utterance.lang = 'es-ES'; utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
            });
        }

        // Coming Up Schedule 
        function loadComingUp() {
            const siteEvents = JSON.parse(localStorage.getItem('siteEvents')) || [];
            const pendingEvents = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            let myEvents = currentUser ? [...siteEvents, ...pendingEvents.filter(e => e.proposer === currentUser.username)] : siteEvents;
            
            const comingUpList = document.getElementById('coming-up-list');
            if(!comingUpList) return;
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const futureEvents = myEvents.filter(e => new Date(e.date.split('-')[0], e.date.split('-')[1] - 1, e.date.split('-')[2]) >= today).sort((a,b)=> new Date(a.date) - new Date(b.date)).slice(0, 3); 

            if (futureEvents.length === 0) return comingUpList.innerHTML = `<p style="font-size: 1.5rem;color: #888;">No upcoming sessions.</p>`;
            comingUpList.innerHTML = futureEvents.map(e => `
                <div class="event-item">
                    <div class="event-date" style="${e.proposer ? 'background:#95a5a6;' : ''}">${new Date(e.date.split('-')[0], e.date.split('-')[1] - 1, e.date.split('-')[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div><strong style="color: var(--primary-orange);">${e.title} ${e.proposer ? '(Pending)' : ''}</strong><br><small>${e.type.toUpperCase()}</small></div>
                </div>
            `).join('');
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
            const tbody = document.getElementById('user-metrics-body');
            if(tbody) {
                tbody.innerHTML = '';
                users.forEach(user => {
                    if(user.role === 'admin') return; // Only show students in metrics
                    // Pull mock metrics
                    const stats = JSON.parse(localStorage.getItem(`stats_${user.username}`)) || { xp: 0, level: 1, lastActivity: 'Never', lastLesson: 'None' };
                    
                    tbody.innerHTML += `
                        <tr>
                            <td><strong style="font-size: 1.5rem;">${user.username}</strong><br><small style="font-size: 1.5rem;">${user.email || 'No email'}</small></td>
                            <td style="font-size: 1.5rem;">${user.joined}</td>
                            <td><span style="font-size: 1.5rem;color: ${stats.lastActivity === new Date().toLocaleDateString() ? 'green' : 'var(--text-dark)'};">${stats.lastActivity}</span></td>
                            <td style="font-size: 1.5rem;"><strong style="font-size: 1.5rem;">${stats.xp} XP</strong> (Lvl ${stats.level})</td>
                            <td style="font-size: 1.5rem;">${stats.lastLesson}</td>
                            <td>
                                <button onclick="openDMModal('${user.username}')" style="font-size: 1.5rem;background:var(--accent-blue-light); color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Message</button>
                                <button onclick="deleteUser(${user.id})" style="font-size: 1.5rem;background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Remove</button>
                            </td>
                        </tr>`;
                });
            }

            const pending = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            const reqContainer = document.getElementById('pending-requests-container');
            if(reqContainer) {
                reqContainer.innerHTML = pending.length === 0 ? '<p style="font-size: 1.5rem;">No pending requests.</p>' : pending.map(evt => `
                    <div class="pending-event-card" style="border: 1px solid var(--border-gray); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                        <strong>${evt.title}</strong> (${evt.date})<br><small>By: ${evt.proposer} | Type: ${evt.type}</small>
                        <div style="margin-top: 5px;">
                            <button onclick="approveEvent('${evt.id}')" style="background:#2ecc71; color:white; border:none; padding:5px; border-radius:4px;">Approve</button>
                            <button onclick="denyEvent('${evt.id}')" style="background:#e74c3c; color:white; border:none; padding:5px; border-radius:4px;">Deny</button>
                        </div>
                    </div>`).join('');
            }
        };

        window.approveEvent = function(id) {
            let pending = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            let siteEvts = JSON.parse(localStorage.getItem('siteEvents')) || [];
            const evt = pending.find(e => e.id === id);
            if(evt) {
                delete evt.proposer; siteEvts.push(evt);
                localStorage.setItem('siteEvents', JSON.stringify(siteEvts));
                localStorage.setItem('pendingEvents', JSON.stringify(pending.filter(e => e.id !== id)));
                renderAdminDashboard(); showToast("Event Approved!");
            }
        };

        window.denyEvent = function(id) {
            let pending = JSON.parse(localStorage.getItem('pendingEvents')) || [];
            localStorage.setItem('pendingEvents', JSON.stringify(pending.filter(e => e.id !== id)));
            renderAdminDashboard(); showToast("Event Denied.");
        };

        window.deleteUser = function(id) {
            if (confirm("Delete this student?")) {
                let users = JSON.parse(localStorage.getItem('users')) || [];
                localStorage.setItem('users', JSON.stringify(users.filter(u => u.id !== id)));
                renderAdminDashboard();
            }
        };

        window.openDMModal = function(username) {
            document.getElementById('dm-title').textContent = `Message ${username}`;
            document.getElementById('dm-message').value = '';
            document.getElementById('dmModal').classList.remove('hidden');
        };
        window.sendDM = function() {
            const msg = document.getElementById('dm-message').value.trim();
            if(!msg) return alert("Type a message first.");
            document.getElementById('dmModal').classList.add('hidden');
            showToast("Message sent to student's inbox!");
        };

        window.saveAnnouncement = function(e) { e.preventDefault(); localStorage.setItem('siteAnnouncement', document.getElementById('announcement-input').value.trim()); alert("Posted!"); };
        window.clearAnnouncement = function() { localStorage.removeItem('siteAnnouncement'); document.getElementById('announcement-input').value = ''; alert("Removed."); };

   
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

    // --- 3. CALENDAR SYSTEM ---
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
            
            eventList.innerHTML = daysEvents.length ? '' : '<p style="font-size: 1.5rem;">No official meetings.</p>';
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

    // --- 4. COMMUNITY Q&A FORUM ---
    if (document.getElementById('forum-container')) {
        let activePostId = null;

        const defaultPosts = [
            { id: "f1", title: "Help with Ser vs Estar?", content: "I keep getting confused when to use which one for location. Any tips?", author: "Student123", timestamp: "Oct 24, 10:00 AM", replies: [{author: "Admin", content: "Remember the acronym PLACE for Estar: Position, Location, Action, Condition, Emotion!", timestamp: "Oct 24, 10:05 AM"}] }
        ];

        if(!localStorage.getItem('forumPosts')) localStorage.setItem('forumPosts', JSON.stringify(defaultPosts));

        window.renderForum = function() {
            const posts = JSON.parse(localStorage.getItem('forumPosts')) || [];
            const container = document.getElementById('forum-container');
            container.innerHTML = '';
            if (posts.length === 0) return container.innerHTML = '<p style="text-align:center; font-size: 1.5rem;">No posts yet. Be the first to ask a question!</p>';
            
            posts.slice().reverse().forEach(post => {
                container.innerHTML += `
                    <div class="card" style="font-size:1.5rem; text-align: left; width: 100%; cursor: pointer; border: 1px solid var(--border-gray);" onclick="openViewPostModal('${post.id}')">
                        <div style="font-size: 1.5rem; display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <h3 style=" font-size: 1.75rem; color: var(--primary-orange); margin: 0;">${post.title}</h3>
                            <span style="background: var(--accent-blue-light); height: 30px; width:120px; color: white; padding: 2px 10px; border-radius: 12px; font-size: 1.25rem; display: flex; font-weight: bold; align-items: center;">${post.replies.length} Replies</span>
                        </div>
                        <p style="color: var(--text-dark); font-size: 1.25rem; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${post.content}</p>
                        <small style="color: #888; font-size: 1.25rem;">Posted by ${post.author} • ${post.timestamp}</small>
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
            posts.push({ id: Date.now().toString(), title: title, content: content, author: currentUser.username, timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }), replies: [] });
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
                <h2 style="font-size: 1.5rem; color: var(--primary-orange); margin-bottom: 10px;">${post.title}</h2>
                <small style="font-size: 1.25rem;color: #888;">Posted by <strong>${post.author}</strong> on ${post.timestamp}</small>
                <div style="font-size: 1.5rem; background: var(--bg-white); padding: 15px; border-radius: 8px; border: 1px solid var(--border-gray); margin-top: 15px; color: var(--text-dark);">
                    ${post.content.replace(/\n/g, '<br>')}
                </div>
            `;

            const repliesContainer = document.getElementById('replies-container');
            repliesContainer.innerHTML = '';
            if (post.replies.length === 0) {
                repliesContainer.innerHTML = '<p style="font-size: 1.5rem; color: #888; font-style: italic;">No replies yet. Help them out!</p>';
            } else {
                post.replies.forEach(reply => {
                    const isAuthor = reply.author === post.author;
                    const badge = isAuthor ? `<span style="background:var(--primary-orange); color:white; padding:2px 6px; border-radius:4px; font-size:1.25rem; margin-left:5px;">Author</span>` : '';
                    repliesContainer.innerHTML += `
                        <div style="background: var(--bg-white); padding: 10px 15px; border-radius: 8px; border-left: 3px solid var(--accent-blue-light);">
                            <small style="font-size: 1.25rem; color: var(--accent-blue-dark); font-weight: bold;">${reply.author} ${badge} • <span style="color:#888; font-weight:normal;">${reply.timestamp}</span></small>
                            <p style="font-size: 1.5rem; color: var(--text-dark); margin-top: 5px;">${reply.content.replace(/\n/g, '<br>')}</p>
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
                posts[postIndex].replies.push({ author: currentUser.username, content: content, timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) });
                localStorage.setItem('forumPosts', JSON.stringify(posts));
                input.value = '';
                showToast("Reply posted!");
                awardXP(10, "Helped a peer!");
                openViewPostModal(activePostId); 
                renderForum(); 
            }
        };
        renderForum();
    }

    // --- 5. DICTIONARY API ---
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
                        <div class="card" style="font-size: 1.5rem; margin-bottom: 1.5rem; text-align: left; width: 100%; border: 1px solid var(--border-gray);">
                            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; align-items: center; border-bottom: 2px solid var(--bg-white); padding-bottom: 10px;">
                                <h3 style="margin:0; font-size:1.8rem; color: var(--primary-orange); font-family: var(--font-heading);">${headword}</h3>
                                <span style="font-style:italic; color: var(--accent-blue-dark); font-weight: 600; background: var(--bg-white); padding: 4px 12px; border-radius: 50px;">${partOfSpeech}</span>
                            </div>
                            ${audioUrl ? `<button class="form-button" onclick="playAudio('${audioUrl}')" style="margin: 1.5rem 0; padding: 6px 15px; font-size: 1.5rem; background-color: var(--accent-blue-light); display: inline-flex; align-items: center; gap: 8px;"><img src="listen.svg" alt="Listen" style="height: 50px;"> Listen</button>` : ''}
                            <div style="margin-top: ${audioUrl ? '0' : '1.5rem'};">
                                <ul style="list-style-type: none; padding: 0;">
                                    ${definitions.map((def, i) => `<li style="margin-bottom: 8px; font-size: 1.75rem; display: flex; gap: 10px;"><strong style="color: var(--secondary-orange);">${i+1}.</strong><span style="color: var(--text-dark);">${def}</span></li>`).join('')}
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
        
        window.playAudio = function(url) { new Audio(url).play().catch(e => console.error("Audio playback failed", e)); };
        
        window.clearResults = function() {
            document.getElementById('search-word').value = '';
            document.getElementById('error-message').classList.add('hidden');
            document.getElementById('dictionary-results').innerHTML = `<div class="card" id="placeholder-message" style="margin: 0 auto;"><p style="text-align: center; color: var(--secondary-orange); font-size: 1.1.5rem; font-weight: 600;"><img src="book.svg" alt="Dictionary" style="height: 60px; width: 60px; margin: 0 auto 1.5rem auto; opacity: 0.5;">Search for a word to see its definition</p></div>`;
        };
        
        document.getElementById('search-word').addEventListener('keypress', (e) => { if (e.key === 'Enter') window.searchWord(); });
    }

    // ==========================================
    // 6. LEARNING MODULES, QUIZLET IMPORT, YOUTUBE & QUIZZES
    // ==========================================
    let currentModuleType = null;
    let moduleConfig = {};

    if (document.getElementById('grammar-progress')) { currentModuleType = 'grammar'; moduleConfig = { total: 8, xp: 50, statId: 'topics-mastered', multiplier: 1 }; } 
    else if (document.getElementById('conjugation-progress')) { currentModuleType = 'conjugation'; moduleConfig = { total: 6, xp: 50, statId: 'verbs-mastered', multiplier: 15 }; } 
    else if (document.getElementById('vocab-progress')) { currentModuleType = 'vocab'; moduleConfig = { total: 10, xp: 50, statId: 'words-learned', multiplier: 55 }; }

    if (currentModuleType) {
        
        // --- Progress Tracking ---
        const completedKey = `${currentModuleType}Completed`;
        let completedItems = JSON.parse(localStorage.getItem(completedKey)) || [];

        function updateProgressUI() {
            const percent = Math.round((completedItems.length / moduleConfig.total) * 100);
            document.getElementById(`${currentModuleType}-progress`).textContent = percent;
            document.getElementById(`${currentModuleType}ProgressBar`).style.width = percent + '%';
            document.getElementById(`${currentModuleType}ProgressText`).textContent = `${completedItems.length} of ${moduleConfig.total} modules completed`;
            document.getElementById(moduleConfig.statId).textContent = completedItems.length * moduleConfig.multiplier;
        }
        updateProgressUI();

        window.toggleModuleComplete = function(itemStr) {
            const card = document.querySelector(`.activity-card[data-module="${itemStr}"]`);
            const button = card.querySelector('.complete-button');
            if (completedItems.includes(itemStr)) {
                card.classList.remove('completed'); button.textContent = 'Mark as Complete'; button.style.background = 'var(--primary-orange)'; button.style.color = 'var(--text-light)';
                completedItems = completedItems.filter(i => i !== itemStr);
            } else {
                card.classList.add('completed'); button.textContent = 'Undo'; button.style.background = 'var(--border-gray)'; button.style.color = 'var(--text-dark)';
                completedItems.push(itemStr); window.awardXP(moduleConfig.xp, `Completed module!`);
            }
            localStorage.setItem(completedKey, JSON.stringify(completedItems));
            updateProgressUI();
        };

        // --- Default Study Sets ---
        const defaultSets = [
            { id: "set-greetings", title: "Greetings & Basics", category: "vocab", author: "Paso a Paso", isPublic: true, resourceType: "mixed", terms: [{term: "Hola", def: "Hello"}, {term: "Adiós", def: "Goodbye"}, {term: "Por favor", def: "Please"}, {term: "Gracias", def: "Thank you"}], notes: "", links: [] },
            { id: "set-numbers", title: "Numbers 1-10", category: "vocab", author: "Paso a Paso", isPublic: true, resourceType: "flashcards", terms: [{term: "Uno", def: "One"}, {term: "Dos", def: "Two"}, {term: "Tres", def: "Three"}, {term: "Cuatro", def: "Four"}], notes: "", links: [] },
            { id: "set-present", title: "Present Tense -AR", category: "conjugation", author: "Paso a Paso", isPublic: true, resourceType: "mixed", terms: [{term: "Yo", def: "-o"}, {term: "Tú", def: "-as"}, {term: "Él/Ella", def: "-a"}, {term: "Nosotros", def: "-amos"}], notes: "Regular verbs drop the AR and add these endings.", links: [{title: "Video Lesson", url: "https://www.youtube.com/watch?v=1234567890", description: "Watch this explanation"}] },
            { id: "set-gender", title: "Gender Rules", category: "grammar", author: "Paso a Paso", isPublic: true, resourceType: "notes", terms: [], notes: "- O ending = Usually Masculine (el chico)\n- A ending = Usually Feminine (la chica)", links: [] },
            // Adding fallbacks so buttons on the pages work
            { id: "set-family", title: "Family Vocab", category: "vocab", author: "Paso a Paso", isPublic: true, resourceType: "flashcards", terms: [{term:"Madre", def:"Mother"},{term:"Padre", def:"Father"},{term:"Hermano", def:"Brother"},{term:"Hermana", def:"Sister"}], notes: "", links: [] },
            { id: "set-food", title: "Food Vocab", category: "vocab", author: "Paso a Paso", isPublic: true, resourceType: "flashcards", terms: [{term:"Manzana", def:"Apple"},{term:"Pan", def:"Bread"},{term:"Agua", def:"Water"},{term:"Leche", def:"Milk"}], notes: "", links: [] }
        ];

        if(!localStorage.getItem('studySets')) localStorage.setItem('studySets', JSON.stringify(defaultSets));

        window.switchResourceTab = function(tab) {
            document.getElementById('tab-community')?.classList.remove('active');
            document.getElementById('tab-my')?.classList.remove('active');
            document.getElementById(`tab-${tab}`)?.classList.add('active');
            window.renderStudySets(); 
        };

        // YouTube Detector
        function getYouTubeID(url) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }

        window.openYouTubeModal = function(videoId) {
            const container = document.getElementById('videoContainer');
            container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            document.getElementById('videoModal').classList.remove('hidden');
        };

        // --- Render Community Sets with Search & Filter ---
        window.renderStudySets = function() {
            const container = document.getElementById('study-sets-container');
            if (!container) return;
            const allSets = JSON.parse(localStorage.getItem('studySets')) || [];
            let filteredSets = allSets.filter(s => s.category === currentModuleType);

            const activeTab = document.querySelector('.tab-btn.active')?.id.replace('tab-', '') || 'community';
            if(activeTab === 'community') {
                filteredSets = filteredSets.filter(s => s.isPublic);
            } else if (activeTab === 'my') {
                if(!currentUser) return container.innerHTML = '<p style="color:var(--text-dark); grid-column: 1 / -1;">Please log in to view your sets.</p>';
                filteredSets = filteredSets.filter(s => s.author === currentUser.username);
            }

            // Search
            const searchQuery = document.getElementById('set-search')?.value.toLowerCase() || '';
            if (searchQuery) filteredSets = filteredSets.filter(s => s.title.toLowerCase().includes(searchQuery) || s.author.toLowerCase().includes(searchQuery));

            // Type Filter
            const typeFilter = document.getElementById('set-filter')?.value || 'all';
            if (typeFilter !== 'all') filteredSets = filteredSets.filter(s => s.resourceType === typeFilter || s.resourceType === 'mixed');

            if(filteredSets.length === 0) return container.innerHTML = '<p style="font-size: 1.5rem; color:var(--text-dark); grid-column: 1 / -1;">No sets found.</p>';

            container.innerHTML = filteredSets.map(set => {
                const isMine = currentUser && set.author === currentUser.username;
                const deleteBtn = isMine ? `<button onclick="deleteStudySet('${set.id}', event)" style="margin-top:10px; background:#e74c3c; color:white; border:none; padding:5px; border-radius:5px; width:100%; font-size: 1.25rem; cursor:pointer;">Delete Set</button>` : '';
                let preview = '';
                if (set.terms?.length) preview += `<img src="stack.svg" style="width: 50px; height: 50px; display:inline; vertical-align:middle; margin-right:5px;"> ${set.terms.length} terms `;
                if (set.notes) preview += `<img src="memopencil.svg" style="width: 50px; height: 50px; display:inline; vertical-align:middle; margin-left:10px; margin-right:5px;"> notes `;
                if (set.links?.length) preview += `<img src="download.svg" style="width: 50px; height: 50px; display:inline; vertical-align:middle; margin-left:10px; margin-right:5px;"> ${set.links.length} links`;
                
                return `
                <div class="card" style="align-items: flex-start; text-align: left; cursor:pointer; position:relative;" onclick="openStudySet('${set.id}')">
                    <span style="position:absolute; top:10px; right:10px; background:var(--bg-white); padding:3px 8px; border-radius:10px; font-size:1.25rem; border:1px solid var(--border-gray); font-weight:bold;">${set.resourceType || 'flashcards'}</span>
                    <h3 style="color:var(--primary-orange); margin-bottom:5px; width:80%;">${set.title}</h3>
                    <p style="font-size:1.5rem; color:var(--text-dark); margin-bottom:10px;">By: ${set.author}</p>
                    <div style="font-size:1.25rem; color:#666;">${preview}</div>
                    ${deleteBtn}
                </div>`;
            }).join('');
        };

        // For Hardcoded HTML Buttons on the page (Fallback routing)
        window.openOldFlashcards = function(moduleName) { openStudySet(`set-${moduleName}`); };
        window.openQuiz = function(moduleName) { startMCQ(`set-${moduleName}`); };
        window.openLesson = function(moduleName) { openStudySet(`set-${moduleName}`); };

        window.openStudySet = function(id) {
            const allSets = JSON.parse(localStorage.getItem('studySets')) || [];
            const set = allSets.find(s => s.id === id);
            
            // If the user clicks a hardcoded HTML button for a set that doesn't exist, show a toast.
            if (!set) {
                showToast("Set not created yet! Check the Community section.");
                return;
            }
            
            const container = document.getElementById('lessonContent');
            let contentHTML = '';
            
            if (set.terms?.length >= 4) { 
                contentHTML += `
                <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-gray); display: flex; gap: 10px;">
                    <button class="form-button" onclick="startCustomFlashcardsFromSet('${set.id}')" style="flex:1; align-items: center; display: flex; justify-content:center; gap:5px;"><img src="stack.svg" style="width: 50px;"> Flashcards</button>
                    <button class="form-button secondary" onclick="startMCQ('${set.id}')" style="flex:1; align-items: center; display: flex; justify-content:center; gap:5px;"><img src="memopencil.svg" style="width: 50px;"> Take Quiz</button>
                </div>`;
            } else if (set.terms?.length > 0) {
                contentHTML += `<div style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-gray); padding-bottom: 1.5rem;"><button class="form-button" onclick="startCustomFlashcardsFromSet('${set.id}')" style="width:100%; display: flex; align-items: center; justify-content:center; gap:5px;"><img src="stack.svg" style="width: 50px;"> Learn Flashcards</button></div>`;
            }
        
            if (set.notes) {
                contentHTML += `
                <h4 style="color: var(--accent-blue-dark); display: flex; align-items: center; gap:5px; font-size: 1.5rem; margin-bottom:10px;"><img src="memopencil.svg" style="width: 50px;">Notes</h4>
                <div style="background: var(--bg-light-orange); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-gray); margin-bottom: 1.5rem; font-size: 1.5rem; white-space: pre-wrap; color: var(--text-dark);">${set.notes}</div>`;
            }
        
            if (set.links && set.links.length > 0) {
                contentHTML += `<h4 style="color: var(--accent-blue-dark); display: flex; align-items: center; gap:5px; font-size: 1.5rem; margin-bottom:10px;"><img src="download.svg" style="width: 50px;">Resources</h4>`;
                set.links.forEach(link => {
                    const videoId = getYouTubeID(link.url);
                    if (videoId) {
                        contentHTML += `
                        <div style="background: var(--bg-light-orange); padding: 15px; border-radius: 8px; border-left: 4px solid #FF0000; border-top: 1px solid var(--border-gray); border-right: 1px solid var(--border-gray); border-bottom: 1px solid var(--border-gray); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: var(--text-dark); font-size: 1.1.5rem;">${link.title}</strong>
                                <p style="margin:0; font-size:1.25rem; color: #666;">YouTube Video</p>
                            </div>
                            <button class="form-button" style="background: #FF0000; display: flex; width: 200px; padding: 8px 50px; border-radius: 5px; margin:0;" onclick="openYouTubeModal('${videoId}')">▶ Play</button>
                        </div>`;
                    } else {
                        contentHTML += `
                        <a href="${link.url}" target="_blank" style="display: block; background: var(--bg-light-orange); padding: 15px; border-radius: 8px; border-left: 4px solid var(--primary-orange); border-top: 1px solid var(--border-gray); border-right: 1px solid var(--border-gray); border-bottom: 1px solid var(--border-gray); margin-bottom: 10px; text-decoration: none; color: var(--text-dark);">
                            <strong style="font-size: 1.1.5rem;">${link.title}</strong>
                            <p style="margin:0; font-size:1.25rem; color: var(--accent-blue-light); margin-top: 5px;">Click to open link ↗</p>
                        </a>`;
                    }
                });
            }
                
            document.getElementById('lessonTitle').textContent = set.title;
            document.getElementById('lessonContent').innerHTML = contentHTML;
            document.getElementById('lessonModal').classList.remove('hidden');
        };

        // --- SMART FLASHCARDS (Quizlet Learn Mode) ---
        window.currentPlayingSetId = null;
        let fcKnownCount = 0;
        let fcLearningCount = 0;

        window.startCustomFlashcardsFromSet = function(setId) {
            const allSets = JSON.parse(localStorage.getItem('studySets')) || [];
            const set = allSets.find(s => s.id === setId);
            if (!set || !set.terms?.length) return;
            
            window.currentPlayingSetId = setId;
            customFlashcards = [...set.terms].sort(() => Math.random() - 0.5); // Shuffle
            customCardIndex = 0;
            fcKnownCount = 0;
            fcLearningCount = 0;

            document.getElementById('lessonModal').classList.add('hidden');
            document.getElementById('flashcard-summary-area').classList.add('hidden');
            document.getElementById('flashcard-play-area').classList.remove('hidden');
            
            document.getElementById('customFlashcardTitle').textContent = set.title;
            document.getElementById('customFlashcardModal').classList.remove('hidden');
            updateCustomFlashcardUI();
        };

        function updateCustomFlashcardUI() {
            if(customCardIndex >= customFlashcards.length) {
                // End of stack summary
                document.getElementById('flashcard-play-area').classList.add('hidden');
                document.getElementById('fc-known-score').textContent = fcKnownCount;
                document.getElementById('fc-learning-score').textContent = fcLearningCount;
                document.getElementById('flashcard-summary-area').classList.remove('hidden');
                if(fcKnownCount > 0) awardXP(15, "Flashcard session completed!");
                return;
            }

            const card = customFlashcards[customCardIndex];
            const front = document.getElementById('customFlashcardFront');
            const back = document.getElementById('customFlashcardBack');
            const box = document.getElementById('customFlashcard');

            front.textContent = card.term;
            back.textContent = card.def;
            front.classList.remove('hidden');
            back.classList.add('hidden');
            
            // Re-trigger animation hack
            box.style.transform = 'none';
            box.offsetHeight; /* trigger reflow */
            box.style.transform = null; 

            document.getElementById('customCardCounter').textContent = `${customCardIndex + 1} / ${customFlashcards.length}`;
        }

        document.getElementById('customFlashcard')?.addEventListener('click', function() {
            document.getElementById('customFlashcardFront').classList.toggle('hidden');
            document.getElementById('customFlashcardBack').classList.toggle('hidden');
        });

        window.markFlashcard = function(knewIt) {
            if(knewIt) fcKnownCount++; else fcLearningCount++;
            customCardIndex++;
            updateCustomFlashcardUI();
        };

        // --- MULTIPLE CHOICE QUIZ GENERATOR ---
        let quizData = [];
        let currentQuizIndex = 0;
        let quizScore = 0;

        window.startMCQ = function(setId) {
            const allSets = JSON.parse(localStorage.getItem('studySets')) || [];
            const set = allSets.find(s => s.id === setId);
            if (!set || set.terms?.length < 4) return showToast("Need at least 4 terms for a quiz!");

            document.getElementById('lessonModal')?.classList.add('hidden');
            
            quizData = [];
            const terms = [...set.terms].sort(() => Math.random() - 0.5); 
            
            terms.forEach(t => {
                const wrongAnswers = terms.filter(x => x.def !== t.def).sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.def);
                const options = [...wrongAnswers, t.def].sort(() => Math.random() - 0.5);
                quizData.push({ question: t.term, answer: t.def, options: options });
            });

            currentQuizIndex = 0;
            quizScore = 0;
            
            document.getElementById('quizTitle').textContent = `Quiz: ${set.title}`;
            document.getElementById('quiz-summary-area').classList.add('hidden');
            document.getElementById('quiz-play-area').classList.remove('hidden');
            document.getElementById('quizModal').classList.remove('hidden');
            
            renderQuizQuestion();
        };

        function renderQuizQuestion() {
            const q = quizData[currentQuizIndex];
            document.getElementById('quizCounter').textContent = `Q: ${currentQuizIndex + 1}/${quizData.length}`;
            document.getElementById('quizQuestion').textContent = q.question;
            
            const container = document.getElementById('quizOptionsContainer');
            container.innerHTML = '';
            
            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = opt;
                btn.onclick = () => handleQuizAnswer(btn, opt === q.answer);
                container.appendChild(btn);
            });
            document.getElementById('quizNextBtn').classList.add('hidden');
        }

        function handleQuizAnswer(selectedBtn, isCorrect) {
            const buttons = document.querySelectorAll('.quiz-option');
            buttons.forEach(btn => {
                btn.disabled = true;
                if(btn.textContent === quizData[currentQuizIndex].answer) btn.classList.add('correct');
            });

            if(isCorrect) {
                selectedBtn.classList.add('correct');
                quizScore++;
            } else {
                selectedBtn.classList.add('wrong');
            }
            document.getElementById('quizNextBtn').classList.remove('hidden');
        }

        window.nextQuizQuestion = function() {
            currentQuizIndex++;
            if(currentQuizIndex >= quizData.length) {
                document.getElementById('quiz-play-area').classList.add('hidden');
                const finalPercentage = Math.round((quizScore / quizData.length) * 100);
                document.getElementById('quizFinalScore').textContent = `${finalPercentage}% (${quizScore}/${quizData.length})`;
                
                // Color grading
                const scoreDisplay = document.getElementById('quizFinalScore');
                if(finalPercentage >= 80) scoreDisplay.style.color = '#2ecc71';
                else if(finalPercentage >= 60) scoreDisplay.style.color = 'var(--secondary-orange)';
                else scoreDisplay.style.color = '#e74c3c';

                document.getElementById('quiz-summary-area').classList.remove('hidden');
                
                if(finalPercentage >= 80) awardXP(50, "Aced the Quiz!");
                else if(finalPercentage > 0) awardXP(20, "Completed Quiz Practice!");
                
            } else {
                renderQuizQuestion();
            }
        };

        // --- CREATE SET MODAL & QUIZLET IMPORT ---
        window.openCreateSetModal = function() {
            if(!currentUser) return alert("Log in to create sets.");
            document.getElementById('createSetModal').classList.remove('hidden');
            document.getElementById('terms-container').innerHTML = '';
            document.getElementById('links-container').innerHTML = '';
            document.getElementById('quizlet-import-text').value = '';
            addTermRow(); addTermRow();
        };
        
        window.importFromQuizlet = function() {
            const text = document.getElementById('quizlet-import-text').value.trim();
            if(!text) return alert("Paste text from Quizlet first!");
            
            const lines = text.split('\n');
            let addedCount = 0;
            
            lines.forEach(line => {
                const parts = line.split('\t'); 
                if(parts.length >= 2) {
                    const row = document.createElement('div');
                    row.className = 'term-row';
                    row.innerHTML = `
                        <input type="text" class="term-input" value="${parts[0].trim()}" style="flex:1; padding:8px; border:1px solid var(--border-gray); border-radius:4px; font-size: 1.75rem; color: var(--text-dark);">
                        <input type="text" class="def-input" value="${parts[1].trim()}" style="flex:1; padding:8px; border:1px solid var(--border-gray); border-radius:4px; font-size: 1.75rem; color: var(--text-dark);">
                        <button type="button" class="remove-term-btn" onclick="this.parentElement.remove()" style="background:#e74c3c; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer; font-weight: bold;">X</button>
                    `;
                    document.getElementById('terms-container').appendChild(row);
                    addedCount++;
                }
            });
            
            if(addedCount > 0) {
                document.getElementById('quizlet-import-text').value = '';
                showToast(`Successfully imported ${addedCount} terms!`);
                // Auto check the flashcards option so they see their imported terms
                document.querySelector('input[name="resource-type"][value="flashcards"]').checked = true;
                toggleResourceFields();
            } else {
                alert("Could not parse text. Make sure it's copied directly from Quizlet (Term [TAB] Definition).");
            }
        };

        window.toggleResourceFields = function() {
            const type = document.querySelector('input[name="resource-type"]:checked')?.value || 'flashcards';
            const fcSec = document.getElementById('flashcards-section');
            const ntSec = document.getElementById('notes-section');
            const lkSec = document.getElementById('links-section');
            
            if(fcSec) fcSec.classList.toggle('hidden', type !== 'flashcards' && type !== 'mixed');
            if(ntSec) ntSec.classList.toggle('hidden', type !== 'notes' && type !== 'mixed');
            if(lkSec) lkSec.classList.toggle('hidden', type !== 'links' && type !== 'mixed');
        };
        
        window.addTermRow = function() {
            const row = document.createElement('div');
            row.className = 'term-row';
            row.innerHTML = `
                <input type="text" class="term-input" placeholder="Term" style="flex:1; padding:8px; border:1px solid var(--border-gray); border-radius:4px; font-size: 1.5rem; color: var(--text-dark);">
                <input type="text" class="def-input" placeholder="Definition" style="flex:1; padding:8px; border:1px solid var(--border-gray); border-radius:4px; font-size: 1.5rem; color: var(--text-dark);">
                <button type="button" class="remove-term-btn" onclick="this.parentElement.remove()" style="background:#e74c3c; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer; font-weight: bold;">X</button>
            `;
            document.getElementById('terms-container').appendChild(row);
        };
        
        window.addLinkRow = function() {
            const container = document.getElementById('links-container');
            const row = document.createElement('div');
            row.className = 'link-row';
            row.style.cssText = 'background:var(--bg-light-orange); padding:15px; border-radius:8px; border:1px solid var(--border-gray); margin-bottom:10px; display: flex; flex-direction:column; gap:10px;';
            row.innerHTML = `
                <input type="text" placeholder="Title (e.g. Intro Video)" class="link-title" required style="width:100%; padding:10px; border:1px solid var(--border-gray); border-radius:4px; font-size:1.25rem;">
                <input type="url" placeholder="URL (e.g. YouTube link)" class="link-url" required style="width:100%; padding:10px; border:1px solid var(--border-gray); border-radius:4px; font-size:1.25rem;">
                <button type="button" class="form-button secondary" onclick="this.parentElement.remove()" style="width:auto; align-self:flex-start; padding:5px 15px;">Remove Link</button>
            `;
            container.appendChild(row);
        };
        
        window.saveStudySet = function() {
            const type = document.querySelector('input[name="resource-type"]:checked')?.value || 'flashcards';
            const setTitle = document.getElementById('set-title').value.trim();
            const setDesc = document.getElementById('set-desc').value.trim();
            
            if (!setTitle) return alert("Title is required!");
            
            const newSet = { id: Date.now().toString(), title: setTitle, description: setDesc, category: currentModuleType, resourceType: type, author: currentUser.username, isPublic: document.getElementById('set-public').checked, terms: [], notes: '', links: [] };
            
            if (type === 'flashcards' || type === 'mixed') {
                document.querySelectorAll('.term-row').forEach(row => {
                    const term = row.querySelector('.term-input')?.value.trim();
                    const def = row.querySelector('.def-input')?.value.trim();
                    if (term && def) newSet.terms.push({ term, def });
                });
            }
            if ((type === 'notes' || type === 'mixed') && document.getElementById('notes-content')) newSet.notes = document.getElementById('notes-content').value.trim();
            if (type === 'links' || type === 'mixed') {
                document.querySelectorAll('.link-row').forEach(row => {
                    const title = row.querySelector('.link-title')?.value.trim();
                    const url = row.querySelector('.link-url')?.value.trim();
                    if (title && url) newSet.links.push({ title, url });
                });
            }
            
            const sets = JSON.parse(localStorage.getItem('studySets')) || [];
            sets.push(newSet);
            localStorage.setItem('studySets', JSON.stringify(sets));
            
            closeCreateSetModal();
            showToast(`Study Set Created! <img src="sparkle.svg" style="width: 30px; height: 30px;">`);
            awardXP(25, "Created a Study Set!");
            window.renderStudySets();
            document.getElementById('tab-my').click(); 
        };

        window.deleteStudySet = function(id, event) {
            event.stopPropagation();
            if(confirm("Delete this study set?")) {
                let sets = JSON.parse(localStorage.getItem('studySets')) || [];
                localStorage.setItem('studySets', JSON.stringify(sets.filter(s => s.id !== id)));
                window.renderStudySets();
            }
        };

        // Initialize sets on load
        window.renderStudySets();
    }
    
    // 1. Separate the Hamburger Toggle
    const hamburgerBtn = document.querySelector('.hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburgerBtn.addEventListener('click', (e) => {
        // This stops the click from "bubbling" up to the window listener
        e.stopPropagation(); 
        navMenu.classList.toggle('show');
    });

    // 2. Global listener for closing when clicking OUTSIDE
    window.addEventListener('click', (e) => {
        // If the menu is open and we click anywhere else, close it
        if (navMenu.classList.contains('show') && !navMenu.contains(e.target)) {
            navMenu.classList.remove('show');
        }

        // Your existing Modal Logic
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
            if (typeof window.closeYouTubeModal === 'function') window.closeYouTubeModal();
        }
    });

    

});

// --- SETTINGS ---
window.updateProfile = function() {
    const newName = document.getElementById('edit-username')?.value;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if(!currentUser) return;
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if(userIndex > -1 && newName) {
        users[userIndex].username = newName;
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
window.downloadAllCheatSheets = function() { window.showToast(`<img src="pdf.svg" style="width: 30px;"> Downloading...`); };
window.downloadCheatSheet = function() { window.showToast(`<img src="pdf.svg" style="width: 30px;"> Downloading...`); };
window.downloadPracticeWorkbook = function() { window.showToast(`<img src="pdf.svg" style="width: 30px;"> Downloading...`); };
window.startRandomDrill = function() { window.showToast(`<img src="dice.svg" style="width: 30px;">Starting Drill...`); };
window.startSpeedMatch = function() { window.showToast(`<img src="clock.svg" style="width: 30px;"> Starting Game...`); };
window.openVerbFinder = function() { window.showToast(`<img src="search.svg" style="width: 30px;"> Finding verb...`); };
window.openGrammarChecker = function() { window.showToast(`<img src="search.svg" style="width: 30px;"> Checking...`); };
window.downloadAudioPack = function() { window.showToast(`<img src="pdf.svg" style="width: 30px;" Downloading...`); };
window.startChallenge = function() { window.showToast(`<img src="volt.svg" style="width: 30px; height: 30px;">️ Starting Challenge!`); };
window.downloadWordList = function() { window.showToast(`<img src="pdf.svg" style="width: 30px;"> Downloading...`); };