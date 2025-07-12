// SmartDeals Pro User Authentication & Notification System

class SmartDealsAuth {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.loadCurrentUser();
    this.updateHeaderUI();
    this.setupNotifications();
    this.checkDailyNotifications();
  }

  loadCurrentUser() {
    const userData = localStorage.getItem('smartdeals_currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  updateHeaderUI() {
    const signInLink = document.querySelector('a[href="sign-in.html"]');
    if (!signInLink) return;

    if (this.currentUser) {
      // User is logged in - show user menu
      signInLink.outerHTML = `
        <div class="user-menu">
          <button class="user-menu-toggle" onclick="toggleUserMenu()">
            <i class="fas fa-user"></i>
            <span>${this.currentUser.name}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="user-menu-dropdown" id="userMenuDropdown">
            <div class="user-info">
              <h4>${this.currentUser.name}</h4>
              <p>${this.currentUser.email}</p>
            </div>
            <div class="user-menu-divider"></div>
            <a href="#" onclick="showUserProfile()">
              <i class="fas fa-user-circle"></i> My Profile
            </a>
            <a href="#" onclick="showNotificationSettings()">
              <i class="fas fa-bell"></i> Notifications
            </a>
            <a href="#" onclick="showUserPreferences()">
              <i class="fas fa-cog"></i> Settings
            </a>
            <div class="user-menu-divider"></div>
            <a href="#" onclick="signOut()" class="sign-out">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </a>
          </div>
        </div>
      `;
    }
  }

  signOut() {
    if (confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('smartdeals_currentUser');
      this.currentUser = null;
      window.location.reload();
    }
  }

  // Notification System
  setupNotifications() {
    if (!this.currentUser || !this.currentUser.notificationConsent) {
      return;
    }

    // Request notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }

  checkDailyNotifications() {
    if (!this.currentUser || !this.currentUser.notificationConsent) {
      return;
    }

    const lastNotification = this.currentUser.lastNotification;
    const today = new Date().toDateString();
    const lastNotificationDate = lastNotification ? new Date(lastNotification).toDateString() : null;

    if (lastNotificationDate !== today) {
      this.sendDailyNotification();
      this.updateLastNotification();
    }
  }

  sendDailyNotification() {
    const products = this.getRandomProducts();
    const message = `🎉 Hi ${this.currentUser.name}! Check out today's featured deals: ${products.join(', ')}`;

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SmartDeals Pro - Daily Deals', {
        body: message,
        icon: '/logo.png',
        tag: 'daily-deals'
      });
    }

    // In-app notification
    this.showInAppNotification(message);
    
    // Store notification history
    this.storeNotificationHistory(message);
  }

  getRandomProducts() {
    const productCategories = [
      'New Smartwatches',
      'Gaming Accessories',
      'Fashion Deals',
      'Electronics',
      'Home & Garden',
      'Tech Gadgets'
    ];
    
    const shuffled = productCategories.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  showInAppNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'in-app-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-bell"></i>
        <p>${message}</p>
        <button onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  updateLastNotification() {
    if (!this.currentUser) return;

    this.currentUser.lastNotification = new Date().toISOString();
    localStorage.setItem('smartdeals_currentUser', JSON.stringify(this.currentUser));

    // Update in users array
    const users = JSON.parse(localStorage.getItem('smartdeals_users') || '[]');
    const userIndex = users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = this.currentUser;
      localStorage.setItem('smartdeals_users', JSON.stringify(users));
    }
  }

  storeNotificationHistory(message) {
    const history = JSON.parse(localStorage.getItem('smartdeals_notifications') || '[]');
    history.unshift({
      id: Date.now(),
      userId: this.currentUser.id,
      message,
      timestamp: new Date().toISOString(),
      read: false
    });
    
    // Keep only last 50 notifications
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('smartdeals_notifications', JSON.stringify(history));
  }

  getNotificationHistory() {
    const history = JSON.parse(localStorage.getItem('smartdeals_notifications') || '[]');
    return history.filter(n => n.userId === this.currentUser?.id);
  }

  // User Profile Management
  showUserProfile() {
    const modal = this.createModal('User Profile', `
      <div class="profile-form">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="profileName" value="${this.currentUser.name}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="profileEmail" value="${this.currentUser.email}">
        </div>
        <div class="form-group">
          <label>Member Since</label>
          <input type="text" value="${new Date(this.currentUser.joinDate).toLocaleDateString()}" disabled>
        </div>
        <div class="form-group">
          <label>Last Login</label>
          <input type="text" value="${new Date(this.currentUser.lastLogin).toLocaleDateString()}" disabled>
        </div>
        <div class="form-actions">
          <button onclick="updateProfile()" class="btn btn-primary">Update Profile</button>
          <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    `);
  }

  showNotificationSettings() {
    const modal = this.createModal('Notification Settings', `
      <div class="notification-settings">
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="notificationConsent" ${this.currentUser.notificationConsent ? 'checked' : ''}>
            Receive daily product notifications
          </label>
        </div>
        <div class="form-group">
          <label>Notification History</label>
          <div class="notification-history" id="notificationHistory">
            ${this.renderNotificationHistory()}
          </div>
        </div>
        <div class="form-actions">
          <button onclick="updateNotificationSettings()" class="btn btn-primary">Save Settings</button>
          <button onclick="closeModal()" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    `);
  }

  renderNotificationHistory() {
    const history = this.getNotificationHistory();
    if (history.length === 0) {
      return '<p>No notifications yet.</p>';
    }
    
    return history.slice(0, 10).map(notification => `
      <div class="notification-item">
        <p>${notification.message}</p>
        <small>${new Date(notification.timestamp).toLocaleString()}</small>
      </div>
    `).join('');
  }

  createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'user-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button onclick="closeModal()" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  updateProfile() {
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    
    if (!name || !email) {
      alert('Please fill in all fields');
      return;
    }
    
    this.currentUser.name = name;
    this.currentUser.email = email;
    
    localStorage.setItem('smartdeals_currentUser', JSON.stringify(this.currentUser));
    
    // Update in users array
    const users = JSON.parse(localStorage.getItem('smartdeals_users') || '[]');
    const userIndex = users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = this.currentUser;
      localStorage.setItem('smartdeals_users', JSON.stringify(users));
    }
    
    this.updateHeaderUI();
    this.closeModal();
    alert('Profile updated successfully!');
  }

  updateNotificationSettings() {
    const consent = document.getElementById('notificationConsent').checked;
    
    this.currentUser.notificationConsent = consent;
    
    localStorage.setItem('smartdeals_currentUser', JSON.stringify(this.currentUser));
    
    // Update in users array
    const users = JSON.parse(localStorage.getItem('smartdeals_users') || '[]');
    const userIndex = users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = this.currentUser;
      localStorage.setItem('smartdeals_users', JSON.stringify(users));
    }
    
    this.closeModal();
    alert('Notification settings updated successfully!');
  }

  closeModal() {
    const modal = document.querySelector('.user-modal');
    if (modal) {
      modal.remove();
    }
  }
}

// Global functions for UI interactions
function toggleUserMenu() {
  const dropdown = document.getElementById('userMenuDropdown');
  dropdown.classList.toggle('active');
}

function showUserProfile() {
  window.smartDealsAuth.showUserProfile();
}

function showNotificationSettings() {
  window.smartDealsAuth.showNotificationSettings();
}

function showUserPreferences() {
  alert('User preferences feature coming soon!');
}

function signOut() {
  window.smartDealsAuth.signOut();
}

function updateProfile() {
  window.smartDealsAuth.updateProfile();
}

function updateNotificationSettings() {
  window.smartDealsAuth.updateNotificationSettings();
}

function closeModal() {
  window.smartDealsAuth.closeModal();
}

// Initialize the authentication system
document.addEventListener('DOMContentLoaded', function() {
  window.smartDealsAuth = new SmartDealsAuth();
});

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.user-menu')) {
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) {
      dropdown.classList.remove('active');
    }
  }
});