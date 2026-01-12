document.addEventListener('DOMContentLoaded', () => {
    
    // global header
    const loginLink = document.getElementById('login-status-link');
    const currentUserJSON = localStorage.getItem('currentUser');
    const currentUser = currentUserJSON ? JSON.parse(currentUserJSON) : null;
  
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
  
    // global announcement
    const announcementBanner = document.getElementById('announcement-banner');
    if (announcementBanner) {
        const savedAnnouncement = localStorage.getItem('siteAnnouncement');
        if (savedAnnouncement) {
            announcementBanner.textContent = savedAnnouncement;
            announcementBanner.style.display = 'block';
        }
    }
  
    // global functions
    
    window.saveAnnouncement = function(e) {
        e.preventDefault();
        const text = document.getElementById('announcement-input').value.trim();
        if (text) {
            localStorage.setItem('siteAnnouncement', text);
            alert("Announcement posted!");
            document.getElementById('announcement-input').value = '';
        } else {
            alert("Please type something first.");
        }
    };
  
    window.clearAnnouncement = function() {
        if(confirm("Are you sure you want to remove the banner?")) {
            localStorage.removeItem('siteAnnouncement');
            alert("Announcement removed.");
        }
    };
  
    window.deleteUser = function(userId) {
        if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            users = users.filter(user => user.id !== userId);
            localStorage.setItem('users', JSON.stringify(users));
            
            // calls the render function if it exists
            if (renderUserList) {
                renderUserList();
            }
        }
    };
  
    // progress bar
    const buttons = document.querySelectorAll('.complete-button'); // Changed back to complete-button as that matches CSS class
    if (buttons.length > 0) {
        const total = buttons.length;
        let done = 0;
        const bar = document.getElementById('mainProgressBar');
        const text = document.getElementById('progressText');
  
        function update() {
            const percent = Math.round((done / total) * 100);
            bar.style.width = percent + '%';
            bar.textContent = percent + '%';
            text.textContent = `${done} of ${total} activities completed`;
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
  
    // login system
    if (document.getElementById('auth-form')) {
        
        const ADMIN_SECRET_CODE = "oa9043570"; 
        let isLoginMode = true;
  
        const authContainer = document.getElementById('auth-forms');
        const adminView = document.getElementById('admin-view');
        const formTitle = document.getElementById('form-title');
        const formSubtitle = document.getElementById('form-subtitle');
        const authForm = document.getElementById('auth-form');
        
        // FIXED: Changed submitbutton to submitbutton to match HTML ID
        const submitbutton = document.getElementById('submitbutton');
        
        const toggleTextSpan = document.getElementById('toggle-text-span');
        // Note: We use querySelector for this one because it relies on the onclick attribute
        const toggleModeButton = document.querySelector('.auth-container button[onclick="toggleAuthMode()"]');
        const adminCodeGroup = document.getElementById('admin-code-group');
        const messageArea = document.getElementById('message-area');
        const userListContainer = document.getElementById('user-list-container');
  
        // checks session once loaded
        if (currentUser) {
            if (currentUser.role === 'admin') {
                showAdminDashboard();
            } else {
                showMessage(`Welcome back, ${currentUser.username}! Redirecting to home...`, 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        }
  
        function renderUserList() {
          const users = JSON.parse(localStorage.getItem('users')) || [];
          const currentUser = JSON.parse(localStorage.getItem('currentUser'));
          const userListContainer = document.getElementById('user-list-container');
  
          userListContainer.innerHTML = '';
  
          if (users.length === 0) {
              userListContainer.innerHTML = '<div class="user-item">No users found.</div>';
              return;
          }
  
          users.forEach(user => {
              const div = document.createElement('div');
              div.className = 'user-item';
              
              const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
              
              // adds delete button if the logged-in user is not the user being displayed
              const isCurrentUser = (currentUser && currentUser.id === user.id);
              let deleteButtonHtml = '';
              
              // allows deleting unless it is yourself
              if (!isCurrentUser) {
                  deleteButtonHtml = `<button class="delete-user-button" onclick="deleteUser(${user.id})">Delete</button>`;
              }
  
              div.innerHTML = `
                  <div>
                      <strong>${user.username}</strong>
                      <div style="font-size: 0.85rem; color: #7f8c8d;">Joined: ${user.joined}</div>
                  </div>
                  <div style="display:flex; align-items:center;">
                      <span class="user-role-badge ${roleClass}">${user.role}</span>
                      ${deleteButtonHtml}
                  </div>
              `;
              userListContainer.appendChild(div);
          });
          
          // autofills the announcement box with current value if it exists
          const currentAnnouncement = localStorage.getItem('siteAnnouncement');
          const annInput = document.getElementById('announcement-input');
          if (annInput && currentAnnouncement) {
              annInput.value = currentAnnouncement;
          }
      };
  
          if(toggleModeButton) {
              toggleModeButton.addEventListener('click', toggleAuthMode);
          }
          authForm.addEventListener('submit', handleAuth);
  
          function toggleAuthMode() {
          isLoginMode = !isLoginMode;
          clearMessage();
          if (isLoginMode) {
              formTitle.textContent = "Student Login";
              formSubtitle.textContent = "Welcome back to the Learning Hub";
              submitbutton.textContent = "Log In";
              toggleTextSpan.textContent = "Don't have an account?";
              toggleModeButton.textContent = "Sign Up";
              adminCodeGroup.classList.add('hidden'); // hide in login mode
          } else {
              formTitle.textContent = "Create Account";
              formSubtitle.textContent = "Join the Spanish community today";
              submitbutton.textContent = "Sign Up";
              toggleTextSpan.textContent = "Already have an account?";
              toggleModeButton.textContent = "Log In";
              adminCodeGroup.classList.remove('hidden');
          }
        }
  
        function handleAuth(e) {
          e.preventDefault();
          const username = document.getElementById('username').value.trim();
          const password = document.getElementById('password').value.trim();
          const adminCodeInput = document.getElementById('admin-code').value.trim();
  
          if (!username || !password) {
              showMessage("Please fill in all required fields.", "error");
              return;
          }
  
          if (isLoginMode) {
              loginUser(username, password);
          } else {
              registerUser(username, password, adminCodeInput);
          }
  
        }
        function registerUser(username, password, adminCode) {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.find(u => u.username === username)) {
                showMessage("Username already exists. Please choose another.", "error");
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
                role: role,
                joined: new Date().toLocaleDateString()
            };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            showMessage("Account created successfully! You can now log in.", "success");
            authForm.reset();
            setTimeout(toggleAuthMode, 1500);
        }
  
        function loginUser(username, password) {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.username === username && u.password === password);
  
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showMessage("Login successful!", "success");
                if (user.role === 'admin') {
                    setTimeout(showAdminDashboard, 1000);
                } else {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            } else {
                showMessage("Invalid username or password.", "error");
            }
        }
  
        window.handleLogout = function() {
            localStorage.removeItem('currentUser');
            window.location.reload();
        };
  
        function showAdminDashboard() {
            authContainer.classList.add('hidden');
            adminView.style.display = 'block';
            renderUserList();
        }
  
        function showMessage(text, type) {
            messageArea.textContent = text;
            messageArea.className = `message-box ${type}`;
            if(type === 'success') {
                setTimeout(() => {
                    messageArea.style.display = 'none';
                }, 3000);
            }
        }
  
        function clearMessage() {
            messageArea.textContent = '';
            messageArea.className = 'message-box';
            messageArea.style.display = 'none';
        }
    }
  });