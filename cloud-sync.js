// SmartDeals Pro Cloud Sync System
// Provides cross-device synchronization for authentication and user data

class CloudSync {
  constructor() {
    this.syncKey = 'smartdeals_cloud_sync';
    this.syncInterval = 30000; // 30 seconds
    this.init();
  }

  init() {
    console.log('CloudSync initializing...');
    this.setupPeriodicSync();
    this.setupStorageListener();
    this.performInitialSync();
  }

  // Setup periodic synchronization
  setupPeriodicSync() {
    setInterval(() => {
      this.performSync();
    }, this.syncInterval);
  }

  // Setup storage listener for real-time sync
  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === this.syncKey || e.key === 'smartdeals_currentUser') {
        console.log('Cloud sync triggered by storage change:', e.key);
        this.handleStorageChange(e);
      }
    });
  }

  // Perform initial sync on page load
  performInitialSync() {
    setTimeout(() => {
      this.performSync();
    }, 1000);
  }

  // Perform synchronization
  performSync() {
    try {
      const currentData = this.getCurrentData();
      const cloudData = this.getCloudData();
      
      if (this.shouldUpdateCloud(currentData, cloudData)) {
        this.updateCloudData(currentData);
        console.log('Cloud data updated');
      }
      
      if (this.shouldUpdateLocal(currentData, cloudData)) {
        this.updateLocalData(cloudData);
        console.log('Local data updated from cloud');
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Get current local data
  getCurrentData() {
    return {
      currentUser: localStorage.getItem('smartdeals_currentUser'),
      session: localStorage.getItem('smartdeals_session'),
      users: localStorage.getItem('smartdeals_users'),
      timestamp: new Date().toISOString(),
      deviceId: this.getDeviceId()
    };
  }

  // Get cloud data
  getCloudData() {
    try {
      const cloudData = localStorage.getItem(this.syncKey);
      return cloudData ? JSON.parse(cloudData) : null;
    } catch (error) {
      console.error('Error getting cloud data:', error);
      return null;
    }
  }

  // Update cloud data
  updateCloudData(data) {
    try {
      localStorage.setItem(this.syncKey, JSON.stringify(data));
      console.log('Cloud data updated successfully');
    } catch (error) {
      console.error('Error updating cloud data:', error);
    }
  }

  // Update local data from cloud
  updateLocalData(cloudData) {
    if (!cloudData) return;

    try {
      // Only update if cloud data is newer
      const currentTimestamp = localStorage.getItem('smartdeals_last_sync');
      if (!currentTimestamp || new Date(cloudData.timestamp) > new Date(currentTimestamp)) {
        
        // Update current user if different
        if (cloudData.currentUser && cloudData.currentUser !== localStorage.getItem('smartdeals_currentUser')) {
          localStorage.setItem('smartdeals_currentUser', cloudData.currentUser);
          console.log('Current user updated from cloud');
        }

        // Update session if different
        if (cloudData.session && cloudData.session !== localStorage.getItem('smartdeals_session')) {
          localStorage.setItem('smartdeals_session', cloudData.session);
          console.log('Session updated from cloud');
        }

        // Update users if different
        if (cloudData.users && cloudData.users !== localStorage.getItem('smartdeals_users')) {
          localStorage.setItem('smartdeals_users', cloudData.users);
          console.log('Users updated from cloud');
        }

        localStorage.setItem('smartdeals_last_sync', cloudData.timestamp);
        
        // Trigger UI update
        this.triggerUIUpdate();
      }
    } catch (error) {
      console.error('Error updating local data:', error);
    }
  }

  // Check if cloud should be updated
  shouldUpdateCloud(currentData, cloudData) {
    if (!cloudData) return true;
    
    const currentTimestamp = new Date(currentData.timestamp);
    const cloudTimestamp = new Date(cloudData.timestamp);
    
    return currentTimestamp > cloudTimestamp;
  }

  // Check if local should be updated
  shouldUpdateLocal(currentData, cloudData) {
    if (!cloudData) return false;
    
    const currentTimestamp = new Date(currentData.timestamp);
    const cloudTimestamp = new Date(cloudData.timestamp);
    
    return cloudTimestamp > currentTimestamp;
  }

  // Handle storage change events
  handleStorageChange(event) {
    if (event.key === this.syncKey) {
      // Cloud data changed, update local if needed
      const cloudData = this.getCloudData();
      if (cloudData) {
        this.updateLocalData(cloudData);
      }
    } else if (event.key === 'smartdeals_currentUser' || event.key === 'smartdeals_session') {
      // Local auth data changed, update cloud
      setTimeout(() => {
        this.performSync();
      }, 100);
    }
  }

  // Get unique device ID
  getDeviceId() {
    let deviceId = localStorage.getItem('smartdeals_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('smartdeals_device_id', deviceId);
    }
    return deviceId;
  }

  // Trigger UI update
  triggerUIUpdate() {
    // Dispatch custom event for UI updates
    const event = new CustomEvent('smartdeals-auth-update', {
      detail: { source: 'cloud-sync' }
    });
    window.dispatchEvent(event);
  }

  // Force sync now
  forceSync() {
    console.log('Forcing cloud sync...');
    this.performSync();
  }

  // Get sync status
  getSyncStatus() {
    const cloudData = this.getCloudData();
    const lastSync = localStorage.getItem('smartdeals_last_sync');
    
    return {
      lastSync: lastSync,
      cloudDataExists: !!cloudData,
      deviceId: this.getDeviceId(),
      isOnline: navigator.onLine
    };
  }

  // Clear all sync data
  clearSyncData() {
    localStorage.removeItem(this.syncKey);
    localStorage.removeItem('smartdeals_last_sync');
    localStorage.removeItem('smartdeals_device_id');
    console.log('Cloud sync data cleared');
  }
}

// Initialize cloud sync
let cloudSync = null;

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing CloudSync...');
  cloudSync = new CloudSync();
  
  // Listen for auth updates
  window.addEventListener('smartdeals-auth-update', (event) => {
    console.log('Auth update received from cloud sync:', event.detail);
    // Trigger auth system update if available
    if (window.smartDealsAuth) {
      window.smartDealsAuth.loadCurrentUser();
      window.smartDealsAuth.updateHeaderUI();
    }
  });
});

// Global functions for cloud sync
function forceCloudSync() {
  if (cloudSync) {
    cloudSync.forceSync();
  }
}

function getCloudSyncStatus() {
  if (cloudSync) {
    return cloudSync.getSyncStatus();
  }
  return null;
}

function clearCloudSyncData() {
  if (cloudSync) {
    cloudSync.clearSyncData();
  }
}

console.log('CloudSync module loaded');