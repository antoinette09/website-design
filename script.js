document.addEventListener('DOMContentLoaded', () => {
    
    // global variables
    const loginLink = document.getElementById('login-status-link');
    const currentUserJSON = localStorage.getItem('currentUser');
    const currentUser = currentUserJSON ? JSON.parse(currentUserJSON) : null;
    const announcementBanner = document.getElementById('announcement-banner');

    // header + navigation
    if (loginLink) {
        if (currentUser) {
            if (currentUser.role === 'admin') {
                loginLink.textContent = "Admin Panel";
                loginLink.href = "login.html";
            } else {
                loginLink.textContent = "Log Out";
                loginLink.href = "#";
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('currentUser');
                    window.location.reload(); 
                });
            }
        } else {
            loginLink.textContent = "Login";
            loginLink.href = "login.html";
        }
    }

    // annoucement banner
    if (announcementBanner) {
        const savedAnnouncement = localStorage.getItem('siteAnnouncement');
        if (savedAnnouncement) {
            announcementBanner.textContent = savedAnnouncement;
            announcementBanner.style.display = 'block';
        }
    }

    // faq accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(button => {
        button.addEventListener('click', () => {
            const item = button.parentElement;
            item.classList.toggle('active');
        });
    });

    //  progress bar
    const buttons = document.querySelectorAll('.complete-button'); 
    if (buttons.length > 0) {
        const total = buttons.length;
        let done = 0;
        const bar = document.getElementById('mainProgressBar');
        const text = document.getElementById('progressText');

        function update() {
            const percent = Math.round((done / total) * 100);
            if(bar) {
                bar.style.width = percent + '%';
                bar.textContent = percent + '%';
            }
            if(text) {
                text.textContent = `${done} of ${total} activities completed`;
            }
        }

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const card = button.closest('.activity-card');
                const isDone = button.textContent === 'Undo';

                if (isDone) {
                    card.querySelectorAll('h4, p').forEach(el => {
                        el.style.textDecoration = 'none';
                        el.style.color = '';
                    });
                    button.textContent = 'Mark as Done';
                    done--;
                } else {
                    card.querySelectorAll('h4, p').forEach(el => {
                        el.style.textDecoration = 'line-through';
                        el.style.color = '#888';
                    });
                    button.textContent = 'Undo';
                    done++;
                }
                update();
            });
        });
        update();
    }

    // authentication system
    if (document.getElementById('auth-form')) {
        
        const ADMIN_SECRET_CODE = "oa9043570"; 
        let isLoginMode = true;

        // elements
        const authContainer = document.getElementById('auth-forms');
        const adminView = document.getElementById('admin-view');
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        const authForm = document.getElementById('auth-form');
        const submitButton = document.getElementById('submitbutton');
        const toggleTextSpan = document.getElementById('toggle-text-span');
        const toggleModeButton = document.querySelector('.auth-container button[onclick="toggleAuthMode()"]');
        
        // inpits
        const adminCodeGroup = document.getElementById('admin-code-group');
        const emailGroup = document.getElementById('email-group');
        const messageArea = document.getElementById('message-area');

        // helps for messages
        function showMessage(text, type) {
            messageArea.textContent = text;
            messageArea.className = `message-box ${type}`;
            messageArea.style.display = 'block';
        }
        
        function clearMessage() {
            messageArea.style.display = 'none';
        }

        // toggle for login + sign up
        window.toggleAuthMode = function() {
            isLoginMode = !isLoginMode;
            clearMessage();
            
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

        // renders admin list
        window.renderUserList = function() {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const container = document.getElementById('user-list-container');
            const annInput = document.getElementById('announcement-input');

            // fills announcement box
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

        // deletes User
        window.deleteUser = function(userId) {
            if (confirm("Permanently delete this user?")) {
                let users = JSON.parse(localStorage.getItem('users')) || [];
                users = users.filter(user => user.id !== userId);
                localStorage.setItem('users', JSON.stringify(users));
                renderUserList();
            }
        };

        // admin dashboard
        function showAdminDashboard() {
            authContainer.style.display = 'none'; 
            adminView.style.display = 'block';
            renderUserList();
        }

        // annoucement logic
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

        window.handleLogout = function() {
            localStorage.removeItem('currentUser');
            window.location.reload();
        };

        // sign up logic
        function registerUser(username, password, email, adminCode) {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.find(u => u.username === username)) {
                showMessage("Username taken.", "error");
                return;
            }

            let role = 'student';
            if (adminCode === ADMIN_SECRET_CODE) {
                role = 'admin';
            }

            const newUser = {
                id: Date.now(), 
                username: username,
                password: password,
                email: email,
                role: role,
                joined: new Date().toLocaleDateString()
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            showMessage("Account created! Logging in...", "success");
            setTimeout(() => loginUser(username, password), 1000);
        }

        // login logic
        function loginUser(username, password) {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showMessage("Success!", "success");
                
                if (user.role === 'admin') {
                    setTimeout(showAdminDashboard, 500);
                } else {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                }
            } else {
                showMessage("Invalid username or password.", "error");
            }
        }

        // form submission
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const email = document.getElementById('email').value.trim();
            const adminCode = document.getElementById('admin-code').value.trim();

            if (!username || !password) {
                showMessage("Please fill in username+password.", "error");
                return;
            }

            if (isLoginMode) {
                loginUser(username, password);
            } else {
                registerUser(username, password, email, adminCode);
            }
        });

        // checks login status
        if (currentUser) {
            if (currentUser.role === 'admin') {
                showAdminDashboard();
            } else {
                showMessage(`Welcome back, ${currentUser.username}! Redirecting...`, 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        }
    }

    // calendar system
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

                const dateString = `${year}-${month}-${i}`;
                const daysEvents = events.filter(e => e.date === dateString);
                
                daysEvents.forEach(evt => {
                    const dot = document.createElement('div');
                    dot.classList.add('event-dot');
                    dot.classList.add(evt.type === 'tutoring' ? 'dot-tutoring' : 'dot-group');
                    dayDiv.appendChild(dot);
                });

                dayDiv.addEventListener('click', () => openModal(i, month, year));
                calendarDiv.appendChild(dayDiv);
            }
        }

        // modal logic
        const modal = document.getElementById('eventModal');
        const closeModal = document.querySelector('.close-modal');
        const eventList = document.getElementById('existingEvents');
        const adminForm = document.getElementById('adminEventForm');

        function openModal(day, month, year) {
            selectedDate = `${year}-${month}-${day}`; 
            document.getElementById('modalDate').textContent = `Meeting Schedule: ${month+1}/${day}/${year}`;
            modal.classList.remove('hidden');

            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.role === 'admin') {
                adminForm.classList.remove('hidden');
            } else {
                adminForm.classList.add('hidden');
            }

            renderEventsInModal();
        }

        function renderEventsInModal() {
            eventList.innerHTML = '';
            const daysEvents = events.filter(e => e.date === selectedDate);

            if (daysEvents.length === 0) {
                eventList.innerHTML = '<p style="font-size: 0.9rem; color: #888;">No meetings scheduled for this date.</p>';
            }

            daysEvents.forEach((evt) => {
                const div = document.createElement('div');
                div.className = 'event-item';
                const spotsLeft = evt.totalSpots - evt.attendees.length;
                const isFull = spotsLeft <= 0;
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                const hasJoined = currentUser && evt.attendees.includes(currentUser.username);
                
                const deleteBtn = (currentUser && currentUser.role === 'admin') 
                    ? `<button onclick="deleteEvent('${evt.id}')" style="float:right; color:red; background:none; border:none; cursor:pointer;">&times;</button>` 
                    : '';

                div.innerHTML = `
                    ${deleteBtn}
                    <strong>${evt.title}</strong><br>
                    <small>${evt.type.toUpperCase()}</small><br>
                    <small style="color: var(--accent-blue);">Spots: ${spotsLeft} / ${evt.totalSpots}</small><br>
                    ${hasJoined 
                        ? '<button class="join-btn" disabled style="background:green;">Registered!</button>' 
                        : `<button class="join-btn" onclick="joinEvent('${evt.id}')" ${isFull ? 'disabled' : ''}>${isFull ? 'Full' : 'Join Meeting'}</button>`
                    }
                `;
                eventList.appendChild(div);
            });
        }

        if(closeModal) {
            closeModal.addEventListener('click', () => modal.classList.add('hidden'));
        }

        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if(prevBtn) prevBtn.addEventListener('click', () => {
            date.setMonth(date.getMonth() - 1);
            renderCalendar();
        });

        if(nextBtn) nextBtn.addEventListener('click', () => {
            date.setMonth(date.getMonth() + 1);
            renderCalendar();
        });

        // initializes calendar
        renderCalendar();

        // calendar helper functions
        window.addEvent = function() {
            const title = document.getElementById('eventTitle').value;
            const type = document.getElementById('eventType').value;
            const spots = document.getElementById('eventSpots').value;

            if(!title || !spots) return alert("Fill all fields!");

            const newEvent = {
                id: Date.now().toString(),
                date: selectedDate,
                title: title,
                type: type,
                totalSpots: parseInt(spots),
                attendees: []
            };

            events.push(newEvent);
            localStorage.setItem('siteEvents', JSON.stringify(events));
            
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventSpots').value = '';
            renderEventsInModal();
            renderCalendar(); 
        };

        window.joinEvent = function(eventId) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if(!currentUser) return alert("Please Login to join meetings!");

            const evtIndex = events.findIndex(e => e.id === eventId);
            if(evtIndex > -1) {
                events[evtIndex].attendees.push(currentUser.username);
                localStorage.setItem('siteEvents', JSON.stringify(events));
                renderEventsInModal(); 
            }
        };

        window.deleteEvent = function(eventId) {
            if(confirm("Cancel this meeting?")) {
                events = events.filter(e => e.id !== eventId);
                localStorage.setItem('siteEvents', JSON.stringify(events));
                renderEventsInModal();
                renderCalendar();
            }
        };
    }

});

//  settings + profile management
window.updateProfile = function() {
    const newName = document.getElementById('edit-username').value;
    const newPass = document.getElementById('edit-password').value;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let users = JSON.parse(localStorage.getItem('users')) || [];

    if(!currentUser) { 
        alert("You must be logged in to edit settings."); 
        return; 
    }

    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if(userIndex > -1) {
        let changesMade = false;
        if(newName && newName.length > 2) {
            users[userIndex].username = newName;
            changesMade = true;
        }
        if(newPass && newPass.length > 2) {
            users[userIndex].password = newPass;
            changesMade = true;
        }

        if(changesMade) {
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
            showToast(`Profile Updated! Confirmation sent to ${currentUser.email || 'user'}`);
            document.getElementById('edit-username').value = '';
            document.getElementById('edit-password').value = '';
        } else {
            alert("Please enter a new username or password.");
        }
    }
};

window.deleteMyAccount = function() {
    if(confirm("WARNING: Are you sure? This will delete your flight records permanently.")) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        let users = JSON.parse(localStorage.getItem('users')) || [];
        users = users.filter(u => u.id !== currentUser.id);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.removeItem('currentUser');
        alert("Account Deleted. Returning to Earth...");
        window.location.href = "index.html";
    }
};

//  toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fa-solid fa-envelope-circle-check"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}