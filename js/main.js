function showPage(pageId) {
    var sections = document.querySelectorAll('.page-section');
    sections.forEach(function (section) {
        section.classList.remove('active');
    });

    var target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
    } else {
        alert('ระบบหาหน้าจอ ' + pageId + ' ไม่เจอค่ะ');
    }
}

function navigateTo(pageId, element) {
    showPage(pageId);
    document.querySelectorAll('.nav-link-custom').forEach(function (nav) {
        nav.classList.remove('active');
    });
    if (element) element.classList.add('active');

    if (pageId === 'page-users' && typeof loadManageUsers === 'function') {
        loadManageUsers();
    }
    if (pageId === 'page-pending' && typeof loadPendingSwaps === 'function') {
        loadPendingSwaps();
    }
    if (pageId === 'page-summary' && typeof loadShiftSummary === 'function') {
        loadShiftSummary();
    }
}

function loginSuccess(userData) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    document.getElementById('app-nav').classList.remove('d-none');

    if (userData.role === "SuperAdmin" || userData.role === "Admin") {
        document.getElementById('nav-manage').classList.remove('d-none');
    } else {
        document.getElementById('nav-manage').classList.add('d-none');
    }

    if (userData.role === "SuperAdmin") {
        document.getElementById('nav-users').classList.remove('d-none');
    } else {
        document.getElementById('nav-users').classList.add('d-none');
    }

    navigateTo('page-calendar', document.getElementById('nav-calendar'));

    setTimeout(function () {
        if (typeof loadCalendarData === 'function') loadCalendarData(userData);
        if (typeof loadPendingSwaps === 'function') loadPendingSwaps();
    }, 300);
}

function handleLogout() {
    var logModal = new bootstrap.Modal(document.getElementById('logoutConfirmModal'));
    logModal.show();
}

function executeLogout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// Auto-login if session exists
window.onload = function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        loginSuccess(JSON.parse(savedUser));
    }

    // Periodic check for new swap requests
    setInterval(function() {
        const user = localStorage.getItem('currentUser');
        if (user && typeof loadPendingSwaps === 'function') {
            loadPendingSwaps();
        }
    }, 60000); // Check every 60 seconds
};
