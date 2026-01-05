document.addEventListener('DOMContentLoaded', () => {
    
  // ==========================================
  // 1. GLOBAL HEADER LOGIC (Runs on every page)
  // ==========================================
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

  // ==========================================
  // 2. GLOBAL ANNOUNCEMENT LOGIC (Runs on every page)
  // ==========================================
  const announcementBanner = document.getElementById('announcement-banner');
  if (announcementBanner) {
      const savedAnnouncement = localStorage.getItem('siteAnnouncement');
      if (savedAnnouncement) {
          announcementBanner.textContent = savedAnnouncement;
          announcementBanner.style.display = 'block';
      }
  }

  // ==========================================
  // 3. GLOBAL FUNCTIONS (Exposed for onclick)
  // ==========================================
  
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

  // Helper to render list (Defined globally so deleteUser can see it)
  // We will define the actual function inside the Login System block below,
  // but we need to make sure deleteUser can access it. 
  // Actually, defining it in the shared scope is safer.
  let renderUserList = null; 

  window.deleteUser = function(userId) {
      if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
          let users = JSON.parse(localStorage.getItem('users')) || [];
          users = users.filter(user => user.id !== userId);
          localStorage.setItem('users', JSON.stringify(users));
          
          // Call the render function if it exists
          if (renderUserList) {
              renderUserList();
          }
      }
  };

  // ==========================================
  // 4. PROGRESS BAR LOGIC (Specific pages)
  // ==========================================
  const buttons = document.querySelectorAll('.complete-btn');
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

      buttons.forEach(btn => {
          btn.addEventListener('click', () => {
              const card = btn.closest('.activity-card');
              const isDone = btn.textContent === 'Undo';

              if (isDone) {
                  card.querySelectorAll('h4, p').forEach(el => {
                      el.style.textDecoration = 'none';
                      el.style.color = '';
                  });
                  btn.textContent = 'Mark as Done';
                  done--;
              } else {
                  card.querySelectorAll('h4, p').forEach(el => {
                      el.style.textDecoration = 'line-through';
                      el.style.color = '#888';
                  });
                  btn.textContent = 'Undo';
                  done++;
              }
              update();
          });
      });
      update();
  }

  // ==========================================
  // 5. LOGIN SYSTEM LOGIC (Login page only)
  // ==========================================
  if (document.getElementById('auth-form')) {
      
      const ADMIN_SECRET_CODE = "oa9043570"; 
      let isLoginMode = true;

      const authContainer = document.getElementById('auth-forms');
      const adminView = document.getElementById('admin-view');
      const formTitle = document.getElementById('form-title');
      const formSubtitle = document.getElementById('form-subtitle');
      const authForm = document.getElementById('auth-form');
      const submitBtn = document.getElementById('submit-btn');
      const toggleTextSpan = document.getElementById('toggle-text-span');
      const toggleModeBtn = document.querySelector('.auth-container button[onclick="toggleAuthMode()"]');
      const adminCodeGroup = document.getElementById('admin-code-group');
      const messageArea = document.getElementById('message-area');
      const userListContainer = document.getElementById('user-list-container');

      // Check Session on Load
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
            
            // Logic: Add delete button IF the logged-in user is NOT the user being displayed
            // (Optional: You can prevent deleting admins if you want, but here I'll allow deleting anyone except yourself maybe?)
            const isCurrentUser = (currentUser && currentUser.id === user.id);
            let deleteButtonHtml = '';
            
            // Allow deleting unless it is yourself (deleting yourself while logged in causes weirdness)
            if (!isCurrentUser) {
                deleteButtonHtml = `<button class="delete-user-btn" onclick="deleteUser(${user.id})">Delete</button>`;
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
        
        // Pre-fill the announcement box with current value if it exists
        const currentAnnouncement = localStorage.getItem('siteAnnouncement');
        const annInput = document.getElementById('announcement-input');
        if (annInput && currentAnnouncement) {
            annInput.value = currentAnnouncement;
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

      function handleLogout() {
          localStorage.removeItem('currentUser');
          window.location.reload();
      }

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