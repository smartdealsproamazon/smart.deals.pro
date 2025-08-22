// Scroll Position Restoration System
// This script handles saving and restoring scroll positions when navigating between pages

(function() {
  'use strict';

  // Function to restore scroll position
  function restoreScrollPosition() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const restorePosition = sessionStorage.getItem('restoreScrollPosition');
    const restorePage = sessionStorage.getItem('restoreScrollPage');
    
    // Check if we need to restore scroll position for this page
    if (restorePosition && restorePage && restorePage === currentPage) {
      const scrollPos = parseInt(restorePosition, 10);
      
      console.log(`Restoring scroll position ${scrollPos} for page ${currentPage}`);
      
      // Use requestAnimationFrame to ensure the page is fully rendered
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos);
        
        // Clean up the session storage
        sessionStorage.removeItem('restoreScrollPosition');
        sessionStorage.removeItem('restoreScrollPage');
      });
    }
  }

  // Function to save scroll position before navigation
  function saveScrollPosition() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollPosition > 0) {
      localStorage.setItem('scrollPosition_' + currentPage, scrollPosition.toString());
      console.log(`Saved scroll position ${scrollPosition} for page ${currentPage}`);
    }
  }

  // Save scroll position before page unload
  window.addEventListener('beforeunload', saveScrollPosition);

  // Restore scroll position when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreScrollPosition);
  } else {
    // DOM is already loaded
    restoreScrollPosition();
  }

  // Also try to restore after a short delay to ensure all content is loaded
  window.addEventListener('load', function() {
    setTimeout(restoreScrollPosition, 100);
  });

})();