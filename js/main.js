// --- Session Configuration ---
const SESSION_TIMEOUT_HOURS = 12; // ระบบจะ Logout อัตโนมัติหลังผ่านไป 12 ชั่วโมง

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
    // ⚡ บันทึกเวลาที่ Login เข้ามาด้วย
    userData.loginTimestamp = new Date().getTime();
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    document.getElementById('app-nav').classList.remove('d-none');

    // SuperAdmin, Admin, AND SuperUser can manage schedules
    if (userData.role === "SuperAdmin" || userData.role === "Admin" || userData.role === "SuperUser") {
        document.getElementById('nav-manage').classList.remove('d-none');
    } else {
        document.getElementById('nav-manage').classList.add('d-none');
    }

    if (userData.role === "SuperAdmin" || userData.role === "Admin") {
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
    const savedUserStr = localStorage.getItem('currentUser');
    if (savedUserStr) {
        const userData = JSON.parse(savedUserStr);
        const now = new Date().getTime();
        const sessionAgeHours = (now - (userData.loginTimestamp || 0)) / (1000 * 60 * 60);

        // ⚡ ตรวจสอบว่า Session หมดอายุหรือยัง
        if (sessionAgeHours > SESSION_TIMEOUT_HOURS) {
            console.warn('Session expired. Logging out...');
            localStorage.removeItem('currentUser');
            // ไม่ต้องทำอะไรต่อ ปล่อยให้อยู่หน้า Login
        } else {
            loginSuccess(userData);
        }
    }

    // Periodic check for new swap requests
    setInterval(function() {
        const user = localStorage.getItem('currentUser');
        if (user && typeof loadPendingSwaps === 'function') {
            loadPendingSwaps();
        }
    }, 60000); // Check every 60 seconds
};
