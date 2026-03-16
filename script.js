// ==========================================
// GLOBAL UTILITIES & VARIABLES
// ==========================================

// Global user state
const currentUserJSON = localStorage.getItem('currentUser');
const currentUser = currentUserJSON ? JSON.parse(currentUserJSON) : null;

// Global Toast Notification
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

// Global XP and Leveling System
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
    
    // Update displays if on home page
    if(document.getElementById('xp-display')) {
        document.getElementById('xp-display').textContent = stats.xp;
        document.getElementById('level-display').textContent = stats.level;
    }
};

// Global Logout Function (FIXED)
window.handleLogout = function(e) {
    if(e) e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html'; // Send them back to the home page!
};

// ==========================================
// INITIALIZATION ON PAGE LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. HEADER & NAVIGATION ---
    const loginLink = document.getElementById('login-status-link');
    const announcementBanner = document.getElementById('announcement-banner');

    if (loginLink) {
        if (currentUser) {
            if (currentUser.role === 'admin') {
                loginLink.innerHTML = `Admin Panel`;
                loginLink.href = "login.html";
            } else {
                loginLink.innerHTML = `Log Out`;
                loginLink.href = "#";
                loginLink.onclick = window.handleLogout; // Uses the fixed global function
            }
        }
    }

    if (announcementBanner) {
        const savedAnnouncement = localStorage.getItem('siteAnnouncement');
        if (savedAnnouncement) {
            announcementBanner.textContent = savedAnnouncement;
            announcementBanner.style.display = 'block';
        }
    }

    // --- 2. FAQ ACCORDION ---
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

    // --- 3. HOME PAGE ---
    if(document.getElementById('greeting-text')) {
        // Greeting
        const greetingText = document.getElementById('greeting-text');
        if (currentUser && currentUser.username) {
            greetingText.textContent = `¡Hola, ${currentUser.username}!`;
        }

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

        // Coming Up Schedule 
        function loadComingUp() {
            let events = JSON.parse(localStorage.getItem('siteEvents')) || [];
            if (events.length === 0) {
                const tmrw = new Date();
                tmrw.setDate(tmrw.getDate() + 1);
                events = [{
                    id: "dummy1", date: tmrw.toISOString().split('T')[0],
                    title: "Intro to Spanish Grammar", type: "group", totalSpots: 10, attendees: ["John"]
                }];
                localStorage.setItem('siteEvents', JSON.stringify(events));
            }

            const comingUpList = document.getElementById('coming-up-list');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const futureEvents = events.filter(event => {
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
                return `
                    <div class="event-item">
                        <div class="event-date">${dateStr}</div>
                        <div>
                            <strong style="color: var(--primary-orange);">${event.title}</strong><br>
                            <small style="color: var(--text-dark);">${event.type.toUpperCase()} | ${event.totalSpots - event.attendees.length} spots left</small>
                        </div>
                    </div>
                `;
            }).join('');
        }
        loadComingUp();
    }

    // --- 4. AUTHENTICATION SYSTEM (Login/Signup) ---
    if (document.getElementById('auth-form')) {
        const ADMIN_SECRET_CODE = "oa9043570"; 
        let isLoginMode = true;

        const authContainer = document.getElementById('auth-forms');
        const adminView = document.getElementById('admin-view');
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        const authForm = document.getElementById('auth-form');
        const submitButton = document.getElementById('submitbutton');
        const toggleTextSpan = document.getElementById('toggle-text-span');
        const toggleModeButton = document.querySelector('.auth-container button[onclick="toggleAuthMode()"]');
        const adminCodeGroup = document.getElementById('admin-code-group');
        const emailGroup = document.getElementById('email-group');
        const messageArea = document.getElementById('message-area');

        function showMessage(text, type) {
            messageArea.textContent = text;
            messageArea.className = `message-box ${type}`;
            messageArea.style.display = 'block';
        }

        window.toggleAuthMode = function() {
            isLoginMode = !isLoginMode;
            messageArea.style.display = 'none';
            if (isLoginMode) {
                formTitle.textContent = "Student Login";
                formSubtitle.textContent = "Welcome back to the Learning Hub";
                submitButton.textContent = "Log In";
                toggleTextSpan.textContent = "Don't have an account?";
                toggleModeButton.textContent = "Sign Up";
                adminCodeGroup.classList.add('hidden');
                emailGroup.classList.add('hidden');
            } else {
                formTitle.textContent = "Create Account";
                formSubtitle.textContent = "Join the Spanish community today";
                submitButton.textContent = "Sign Up";
                toggleTextSpan.textContent = "Already have an account?";
                toggleModeButton.textContent = "Log In";
                adminCodeGroup.classList.remove('hidden');
                emailGroup.classList.remove('hidden');
            }
        };

        window.renderUserList = function() {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const container = document.getElementById('user-list-container');
            const annInput = document.getElementById('announcement-input');
            const currentAnn = localStorage.getItem('siteAnnouncement');
            if (annInput && currentAnn) annInput.value = currentAnn;

            container.innerHTML = '';
            if (users.length === 0) {
                container.innerHTML = '<div class="user-item">No users found.</div>';
                return;
            }

            users.forEach(user => {
                const div = document.createElement('div');
                div.className = 'user-item';
                const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
                const isSelf = (currentUser && currentUser.id === user.id);
                const deleteBtn = isSelf ? '' : `<button class="delete-user-button" onclick="deleteUser(${user.id})">Delete</button>`;
                div.innerHTML = `
                    <div>
                        <strong>${user.username}</strong>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">${user.email || 'No email'} | Joined: ${user.joined}</div>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="user-role-badge ${roleClass}">${user.role}</span>
                        ${deleteBtn}
                    </div>
                `;
                container.appendChild(div);
            });
        };

        window.deleteUser = function(userId) {
            if (confirm("Permanently delete this user?")) {
                let users = JSON.parse(localStorage.getItem('users')) || [];
                users = users.filter(user => user.id !== userId);
                localStorage.setItem('users', JSON.stringify(users));
                window.renderUserList();
            }
        };

        function showAdminDashboard() {
            authContainer.style.display = 'none'; 
            adminView.classList.remove('hidden');
            adminView.style.display = 'block';
            window.renderUserList();
        }

        window.saveAnnouncement = function(e) {
            e.preventDefault();
            const text = document.getElementById('announcement-input').value.trim();
            if (text) {
                localStorage.setItem('siteAnnouncement', text);
                alert("Announcement Posted!");
            }
        };

        window.clearAnnouncement = function() {
            localStorage.removeItem('siteAnnouncement');
            document.getElementById('announcement-input').value = '';
            alert("Banner Removed.");
        };

        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
            const adminCode = document.getElementById('admin-code') ? document.getElementById('admin-code').value.trim() : '';

            if (!username || !password) return showMessage("Please fill in username+password.", "error");

            if (isLoginMode) {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.username === username && u.password === password);
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    showMessage("Success!", "success");
                    setTimeout(() => { user.role === 'admin' ? showAdminDashboard() : window.location.href = 'index.html'; }, 500);
                } else {
                    showMessage("Invalid username or password.", "error");
                }
            } else {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                if (users.find(u => u.username === username)) return showMessage("Username taken.", "error");
                
                const role = adminCode === ADMIN_SECRET_CODE ? 'admin' : 'student';
                users.push({ id: Date.now(), username, password, email, role, joined: new Date().toLocaleDateString() });
                localStorage.setItem('users', JSON.stringify(users));
                showMessage("Account created! Logging in...", "success");
                setTimeout(() => { document.getElementById('submitbutton').click(); }, 1000); 
            }
        });

        // Handle auto-redirect if already logged in
        if (currentUser) {
            if (currentUser.role === 'admin') {
                showAdminDashboard();
            }
            else {
                showMessage(`Welcome back, ${currentUser.username}! Redirecting...`, 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            }
        }
    }

    // --- 5. CALENDAR SYSTEM ---
    if (document.getElementById('calendar')) {
        let date = new Date();
        let selectedDate = null;
        let events = JSON.parse(localStorage.getItem('siteEvents')) || [];

        function renderCalendar() {
            const monthYear = document.getElementById('monthYear');
            const calendarDiv = document.getElementById('calendar');
            calendarDiv.innerHTML = ''; 
            date.setDate(1);
            
            const month = date.getMonth();
            const year = date.getFullYear();
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthYear.textContent = `${months[month]} ${year}`;

            const firstDayIndex = date.getDay();
            const lastDay = new Date(year, month + 1, 0).getDate();

            for (let x = 0; x < firstDayIndex; x++) {
                const blank = document.createElement('div');
                blank.style.visibility = 'hidden';
                calendarDiv.appendChild(blank);
            }

            for (let i = 1; i <= lastDay; i++) {
                const dayDiv = document.createElement('div');
                dayDiv.classList.add('calendar-day');
                if (i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                    dayDiv.classList.add('today');
                }
                dayDiv.innerHTML = `<div class="day-number">${i}</div>`;

                const dateString = `${year}-${month + 1}-${i}`;
                const daysEvents = events.filter(e => {
                    const eParts = e.date.split('-');
                    return parseInt(eParts[0]) === year && parseInt(eParts[1]) === (month + 1) && parseInt(eParts[2]) === i;
                });
                
                daysEvents.forEach(evt => {
                    const dot = document.createElement('div');
                    dot.className = `event-dot ${evt.type === 'tutoring' ? 'dot-tutoring' : 'dot-group'}`;
                    dayDiv.appendChild(dot);
                });

                dayDiv.addEventListener('click', () => {
                    selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    document.getElementById('modalDate').textContent = `Meetings: ${month+1}/${i}/${year}`;
                    document.getElementById('eventModal').classList.remove('hidden');
                    if (currentUser && currentUser.role === 'admin') document.getElementById('adminEventForm').classList.remove('hidden');
                    else document.getElementById('adminEventForm').classList.add('hidden');
                    window.renderEventsInModal();
                });
                calendarDiv.appendChild(dayDiv);
            }
        }

        window.renderEventsInModal = function() {
            const eventList = document.getElementById('existingEvents');
            eventList.innerHTML = '';
            
            const daysEvents = events.filter(e => e.date === selectedDate);
            if (daysEvents.length === 0) {
                eventList.innerHTML = '<p style="font-size: 0.9rem; color: #888;">No meetings scheduled for this date.</p>';
            }

            daysEvents.forEach((evt) => {
                const div = document.createElement('div');
                div.className = 'event-item';
                const spotsLeft = evt.totalSpots - evt.attendees.length;
                const hasJoined = currentUser && evt.attendees.includes(currentUser.username);
                const deleteBtn = (currentUser && currentUser.role === 'admin') ? `<button onclick="deleteEvent('${evt.id}')" style="float:right; color:red; background:none; border:none; cursor:pointer; font-size:1.5rem;">&times;</button>` : '';

                div.innerHTML = `
                    ${deleteBtn}
                    <strong>${evt.title}</strong><br>
                    <small>${evt.type.toUpperCase()}</small><br>
                    <small>Spots: ${spotsLeft} / ${evt.totalSpots}</small><br>
                    ${hasJoined ? '<button class="join-btn" disabled style="background:green; color:white;">Registered!</button>' 
                                : `<button class="join-btn" onclick="joinEvent('${evt.id}')" ${spotsLeft <= 0 ? 'disabled' : ''}>${spotsLeft <= 0 ? 'Full' : 'Join Meeting'}</button>`}
                `;
                eventList.appendChild(div);
            });
        };

        window.addEvent = function() {
            const title = document.getElementById('eventTitle').value;
            const type = document.getElementById('eventType').value;
            const spots = document.getElementById('eventSpots').value;
            if(!title || !spots) return alert("Fill all fields!");

            events.push({
                id: Date.now().toString(), date: selectedDate, title, type, totalSpots: parseInt(spots), attendees: []
            });
            localStorage.setItem('siteEvents', JSON.stringify(events));
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventSpots').value = '';
            window.renderEventsInModal();
            renderCalendar(); 
        };

        window.joinEvent = function(eventId) {
            if(!currentUser) return alert("Please Login to join meetings!");
            const evtIndex = events.findIndex(e => e.id === eventId);
            if(evtIndex > -1) {
                events[evtIndex].attendees.push(currentUser.username);
                localStorage.setItem('siteEvents', JSON.stringify(events));
                window.renderEventsInModal(); 
            }
        };

        window.deleteEvent = function(eventId) {
            if(confirm("Cancel this meeting?")) {
                events = events.filter(e => e.id !== eventId);
                localStorage.setItem('siteEvents', JSON.stringify(events));
                window.renderEventsInModal();
                renderCalendar();
            }
        };

        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        if(prevBtn) prevBtn.addEventListener('click', () => { date.setMonth(date.getMonth() - 1); renderCalendar(); });
        if(nextBtn) nextBtn.addEventListener('click', () => { date.setMonth(date.getMonth() + 1); renderCalendar(); });

        document.querySelector('.close-modal')?.addEventListener('click', () => document.getElementById('eventModal').classList.add('hidden'));
        
        renderCalendar();
    }


    // --- 6. DICTIONARY API ---
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
                    document.getElementById('search-word').placeholder = 'e.g. hola, gracias...';
                    document.getElementById('direction-hint').textContent = 'Searching Spanish words with English definitions';
                } else {
                    btnEnglish.classList.remove('secondary');
                    btnEnglish.style.borderColor = 'transparent';
                    
                    btnSpanish.classList.add('secondary');
                    btnSpanish.style.borderColor = 'var(--border-gray)';
                    
                    document.getElementById('search-label').textContent = 'Enter an English Word';
                    document.getElementById('search-word').placeholder = 'e.g. hello, thank you...';
                    document.getElementById('direction-hint').textContent = 'Searching English words with Spanish translations';
                }
            }
        };

        window.searchWord = async function() {
            const word = document.getElementById('search-word').value.trim().toLowerCase();
            const resultsDiv = document.getElementById('dictionary-results');
            const loadingDiv = document.getElementById('loading-indicator');
            const errorDiv = document.getElementById('error-message');
            const ambiguityWarning = document.getElementById('ambiguity-warning');
            const errorText = document.getElementById('error-text');
            
            if (!word) return;

            if (ambiguityWarning) {
                if (ambiguousWords.includes(word)) {
                    ambiguityWarning.classList.remove('hidden');
                } else {
                    ambiguityWarning.classList.add('hidden');
                }
            }

            errorDiv.classList.add('hidden');
            loadingDiv.classList.remove('hidden');
            resultsDiv.innerHTML = '';
            document.getElementById('placeholder-message')?.classList.add('hidden'); 

            try {
                const url = `${API_URL}${encodeURIComponent(word)}?key=${API_KEY}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
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
                        if (entry.shortdef && entry.shortdef.length > 0) {
                            definitions = entry.shortdef;
                        }

                        if (definitions.length === 0) return;

                        let audioUrl = null;
                        const audioFile = entry.hwi?.prs?.[0]?.sound?.audio;
                        if (audioFile) {
                            let subdir = audioFile.charAt(0);
                            if (audioFile.startsWith('bix')) subdir = 'bix';
                            else if (audioFile.startsWith('gg')) subdir = 'gg';
                            else if (/^[^a-zA-Z]/.test(audioFile)) subdir = 'number';
                            
                            audioUrl = `https://media.merriam-webster.com/audio/prons/es/me/mp3/${subdir}/${audioFile}.mp3`;
                        }

                        html += `
                            <div class="card" style="margin-bottom: 1.5rem; text-align: left; width: 100%; border: 1px solid var(--border-gray);">
                                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; align-items: center; border-bottom: 2px solid var(--bg-white); padding-bottom: 10px;">
                                    <h3 style="margin:0; font-size:1.8rem; color: var(--primary-orange); font-family: var(--font-heading);">${headword}</h3>
                                    <span style="font-style:italic; color: var(--accent-blue-dark); font-weight: 600; background: var(--bg-white); padding: 4px 12px; border-radius: 20px;">${partOfSpeech}</span>
                                </div>
                                
                                ${audioUrl ? `
                                <button class="form-button" onclick="playAudio('${audioUrl}')" style="margin: 1rem 0; padding: 6px 15px; font-size: 0.9rem; background-color: var(--accent-blue-light); display: inline-flex; align-items: center; gap: 8px;">
                                    <img src="listen.svg" alt="Listen" style="height: 16px; filter: brightness(0) invert(1);"> Listen
                                </button>` : ''}
                                
                                <div style="margin-top: ${audioUrl ? '0' : '1rem'};">
                                    <ul style="list-style-type: none; padding: 0;">
                                        ${definitions.map((def, i) => `
                                            <li style="margin-bottom: 8px; font-size: 1.05rem; display: flex; gap: 10px;">
                                                <strong style="color: var(--secondary-orange);">${i+1}.</strong> 
                                                <span style="color: var(--text-dark);">${def}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        `;
                    });

                    if(html === '') throw new Error('No definitions found');
                    resultsDiv.innerHTML = html;
                } else {
                    throw new Error('No definitions');
                }
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
            document.getElementById('dictionary-results').innerHTML = `
                <div class="card" id="placeholder-message" style="margin: 0 auto;">
                    <p style="text-align: center; color: var(--secondary-orange); font-size: 1.1rem; font-weight: 600;">
                        <img src="book.svg" alt="Dictionary" style="height: 60px; width: 60px; margin: 0 auto 1rem auto; opacity: 0.5;">
                        Search for a word to see its definition
                    </p>
                </div>
            `;
        };

        document.getElementById('search-word').addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') window.searchWord(); 
        });
        
        window.setSearchDirection('spanish');
    }

    // --- 7. LEARNING MODULES (Grammar, Conjugation, Vocab) ---
    let currentModuleType = null;
    let moduleConfig = {};

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
    }

    // Modals for Learning Sections
    window.openLesson = function(title, content) {
        document.getElementById('lessonTitle').textContent = "Lesson";
        document.getElementById('lessonContent').innerHTML = "<p>Lesson content loads here!</p>";
        document.getElementById('lessonModal').classList.remove('hidden');
    };
    window.closeLesson = function() { document.getElementById('lessonModal').classList.add('hidden'); };
    
    window.openQuiz = function(title, content) {
        document.getElementById('quizTitle').textContent = "Quiz";
        document.getElementById('quizContent').innerHTML = "<p>Quiz content loads here!</p>";
        document.getElementById('quizModal').classList.remove('hidden');
    };
    window.closeQuiz = function() { document.getElementById('quizModal').classList.add('hidden'); };
    
    window.openFlashcards = function() {
        document.getElementById('flashcardModal').classList.remove('hidden');
    };
    window.closeFlashcards = function() { document.getElementById('flashcardModal').classList.add('hidden'); };

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
    });

}); // End of DOMContentLoaded

// ==========================================
// SETTINGS / PROFILE MANAGEMENT
// ==========================================
window.updateProfile = function() {
    const newName = document.getElementById('edit-username')?.value;
    const newPass = document.getElementById('edit-password')?.value;
    let users = JSON.parse(localStorage.getItem('users')) || [];

    if(!currentUser) return alert("You must be logged in to edit settings."); 

    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if(userIndex > -1) {
        let changesMade = false;
        if(newName && newName.length > 2) { users[userIndex].username = newName; changesMade = true; }
        if(newPass && newPass.length > 2) { users[userIndex].password = newPass; changesMade = true; }

        if(changesMade) {
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
            window.showToast(`Profile Updated!`);
            document.getElementById('edit-username').value = '';
            document.getElementById('edit-password').value = '';
            setTimeout(() => window.location.reload(), 1500);
        } else {
            alert("Please enter a new username or password.");
        }
    }
};

window.deleteMyAccount = function() {
    if(confirm("WARNING: Are you sure? This will delete your records permanently.")) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        users = users.filter(u => u.id !== currentUser.id);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.removeItem('currentUser');
        alert("Account Deleted.");
        window.location.href = "index.html";
    }
};

// Placeholder Download and Tool functions used across HTML pages
window.downloadCheatSheet = function() { window.showToast(`📥 Downloading cheat sheet...`); };
window.downloadPracticeWorkbook = function() { window.showToast('📘 Downloading workbook...'); };
window.downloadFlashcards = function() { window.showToast('🃏 Downloading flashcards...'); };
window.downloadAllCheatSheets = function() { window.showToast('📥 Downloading full pack...'); };
window.downloadAudioPack = function() { window.showToast('🎧 Downloading audio files...'); };
window.downloadWordList = function() { window.showToast('📥 Downloading word list...'); };
window.downloadAllWordLists = function() { window.showToast('📥 Downloading all word lists...'); };
window.downloadFlashcardDeck = function() { window.showToast('🃏 Downloading flashcard deck...'); };

window.startRandomDrill = function() { window.showToast('🎲 Starting Random Drill...'); };
window.openGrammarChecker = function() { window.showToast('🔍 Opening Grammar Checker...'); };
window.startChallenge = function() { window.showToast('⏱️ Challenge started!'); };
window.openVerbFinder = function() { window.showToast('🔍 Opening Verb Finder...'); };
window.startSpeedMatch = function() { window.showToast('⏱️ Speed Match started!'); };