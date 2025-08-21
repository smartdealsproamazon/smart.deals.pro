(function() {
	function isAffiliateRegistered() {
		try {
			return !!(localStorage.getItem('smartdeals_currentUser') && localStorage.getItem('smartdeals_affiliateRegistered'));
		} catch (e) {
			return false;
		}
	}

	function swapAffiliateLinksToDashboard() {
		if (!isAffiliateRegistered()) return;

		var links = document.querySelectorAll('a[href="affiliate-register.html"]');
		links.forEach(function(link) {
			link.setAttribute('href', 'affiliate-dashboard.html');
			var text = (link.textContent || '').trim();
			if (/join/i.test(text) || /register/i.test(text) || /start/i.test(text)) {
				link.textContent = 'Go to Dashboard';
			}
		});
	}

	document.addEventListener('DOMContentLoaded', swapAffiliateLinksToDashboard);
})();