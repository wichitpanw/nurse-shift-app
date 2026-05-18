(function() {
    const manageScheduleHtml = `
    <div class="container py-3" style="max-width: 600px;">
        <div class="card shadow-sm border-0 mb-3" style="border-radius: 15px;">
            <div class="card-body p-2">
                <ul class="nav nav-pills nav-justified bg-light rounded-pill p-1" id="manageTabs" role="tablist">
                    <li class="nav-item">
                        <button class="nav-link active rounded-pill fw-bold small" id="tab-by-date" onclick="switchManageMode('date')">
                            <i class="fa-solid fa-calendar-day me-1"></i>จัดตามวัน
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link rounded-pill fw-bold small" id="tab-by-nurse" onclick="switchManageMode('nurse')">
                            <i class="fa-solid fa-user-tag me-1"></i>จัดตามชื่อคน
                        </button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Mode 1: By Date -->
        <div id="view-by-date" class="manage-view active">
            <div class="card shadow-sm border-0 mb-3" style="border-radius: 15px;">
                <div class="card-body">
                    <div class="mb-3">
                        <label class="small text-muted fw-bold mb-1">เลือกวันที่จัดเวร</label>
                        <input type="date" id="targetDate" class="form-control" onchange="loadNursesForManage()">
                    </div>

                    <div class="p-2 bg-light rounded-3 mb-2">
                        <label class="small text-muted fw-bold mb-1 d-block text-center">🎨 Paint Mode (เลือกเวรแล้วจิ้มชื่อได้เลยค่ะ)</label>
                        <div class="btn-group w-100 shadow-sm" role="group">
                            <input type="radio" class="btn-check" name="paintMode" id="mode-select" value="select" checked onchange="updatePaintMode()">
                            <label class="btn btn-outline-secondary btn-sm fw-bold" for="mode-select">ปกติ</label>
                            <input type="radio" class="btn-check" name="paintMode" id="mode-เช้า" value="เช้า" onchange="updatePaintMode()">
                            <label class="btn btn-outline-warning btn-sm fw-bold text-dark" for="mode-เช้า">เช้า</label>
                            <input type="radio" class="btn-check" name="paintMode" id="mode-บ่าย" value="บ่าย" onchange="updatePaintMode()">
                            <label class="btn btn-outline-danger btn-sm fw-bold" for="mode-บ่าย">บ่าย</label>
                            <input type="radio" class="btn-check" name="paintMode" id="mode-ดึก" value="ดึก" onchange="updatePaintMode()">
                            <label class="btn btn-outline-secondary btn-sm fw-bold" style="background-color: #6f42c1; color: white; border-color: #6f42c1;" for="mode-ดึก">ดึก</label>
                            <input type="radio" class="btn-check" name="paintMode" id="mode-clear" value="clear" onchange="updatePaintMode()">
                            <label class="btn btn-outline-dark btn-sm fw-bold" for="mode-clear">ล้างทั้งหมด</label>
                        </div>
                    </div>

                    <div class="row g-2">
                        <div class="col-7">
                            <input type="text" id="searchNurse" class="form-control form-control-sm" placeholder="🔍 ค้นหาพยาบาล..." onkeyup="filterNurseList()">
                        </div>
                        <div class="col-5">
                            <select id="filterDept" class="form-select form-select-sm" onchange="filterNurseList()">
                                <option value="">ทุกแผนก</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div id="nurseListArea" class="list-group shadow-sm" style="border-radius: 12px; overflow: hidden;">
                <div class="text-center py-5 text-muted bg-white border border-light">กรุณาเลือกวันที่ด้านบนก่อนนะคะ</div>
            </div>
        </div>

        <!-- Mode 2: By Nurse -->
        <div id="view-by-nurse" class="manage-view d-none">
            <div class="card shadow-sm border-0 mb-2" style="border-radius: 15px;">
                <div class="card-body">
                    <div class="mb-2">
                        <label class="small text-muted fw-bold mb-1">เลือกบุคคลากร</label>
                        <select id="nurseSelect" class="form-select" onchange="loadNurseMonthView()">
                            <option value="">-- กรุณาเลือกรายชื่อ --</option>
                        </select>
                    </div>
                    <div class="mb-0">
                        <label class="small text-muted fw-bold mb-1">เลือกเดือนที่ต้องการจัด</label>
                        <input type="month" id="nurseMonth" class="form-control" onchange="loadNurseMonthView()">
                    </div>
                </div>
            </div>

            <!-- Weekly Navigation -->
            <div id="weekNavArea" class="mb-2 d-none">
                <div class="btn-group w-100 shadow-sm" role="group">
                    <button class="btn btn-light btn-sm fw-bold week-btn active" id="week-1" onclick="switchWeek(1)">สัปดาห์ 1</button>
                    <button class="btn btn-light btn-sm fw-bold week-btn" id="week-2" onclick="switchWeek(2)">2</button>
                    <button class="btn btn-light btn-sm fw-bold week-btn" id="week-3" onclick="switchWeek(3)">3</button>
                    <button class="btn btn-light btn-sm fw-bold week-btn" id="week-4" onclick="switchWeek(4)">4</button>
                    <button class="btn btn-light btn-sm fw-bold week-btn" id="week-5" onclick="switchWeek(5)">5</button>
                </div>
            </div>

            <div id="nurseMonthArea" class="list-group shadow-sm" style="border-radius: 12px; overflow: hidden;">
                <div class="text-center py-5 text-muted bg-white border border-light">กรุณาเลือกรายชื่อและเดือนด้านบนค่ะ</div>
            </div>
        </div>
    </div>

    <!-- Modal for Confirmation (Legacy) -->
    <div class="modal fade" id="customConfirmModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm p-3">
            <div class="modal-content" style="border-radius: 15px; border: none;">
                <div class="modal-body text-center p-4">
                    <div class="mb-3" id="confirmIcon">
                        <i class="fa-solid fa-circle-question fa-3x text-primary"></i>
                    </div>
                    <h5 class="fw-bold mb-2">ยืนยันทำรายการ</h5>
                    <p class="text-muted small mb-4" id="confirmBodyText">คุณต้องการทำรายการนี้ใช่หรือไม่คะ?</p>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-light w-50 small fw-bold" data-bs-dismiss="modal"
                            style="border-radius: 8px;">ยกเลิก</button>
                        <button type="button" id="btnConfirmSubmit" class="btn btn-primary w-50 small fw-bold"
                            style="border-radius: 8px;" onclick="executePendingAction()">ตกลง</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    document.getElementById('page-manage').innerHTML = manageScheduleHtml;
})();

var manageMode = 'date'; 
var activePaintMode = 'select';
var fullNurseData = [];
var currentShifts = {};
var cachedMonthData = { key: null, data: null };

// Global Month View State
var currentMonthState = {
    userId: null,
    userName: null,
    month: null,
    year: null,
    nurseShifts: {},
    dailySummary: {},
    daysInMonth: 0,
    currentWeek: 1
};

function switchManageMode(mode) {
    manageMode = mode;
    document.querySelectorAll('.manage-view').forEach(v => v.classList.add('d-none'));
    document.getElementById('view-by-' + mode).classList.remove('d-none');
    
    document.getElementById('tab-by-date').classList.toggle('active', mode === 'date');
    document.getElementById('tab-by-nurse').classList.toggle('active', mode === 'nurse');

    if (mode === 'nurse' && fullNurseData.length === 0) {
        fetchAllNursesForSelect();
    }
}

async function fetchAllNursesForSelect() {
    try {
        const res = await apiCall('getAllNurses');
        fullNurseData = res;
        const select = document.getElementById('nurseSelect');
        select.innerHTML = '<option value="">-- กรุณาเลือกรายชื่อ --</option>';
        res.forEach(n => {
            select.innerHTML += `<option value="${n.id}">${n.name}</option>`;
        });
    } catch (e) { console.error(e); }
}

function updatePaintMode() {
    activePaintMode = document.querySelector('input[name="paintMode"]:checked').value;
}

// --- BY DATE LOGIC ---
async function loadNursesForManage() {
    var date = document.getElementById('targetDate').value;
    var area = document.getElementById('nurseListArea');
    if (!date) return;

    area.innerHTML = '<div class="text-center py-5 bg-white"><div class="spinner-border text-primary spinner-border-sm"></div></div>';

    try {
        const res = await apiCall('getManagementData', { date: date });
        fullNurseData = res.nurses;
        currentShifts = res.shifts || {};

        const deptSelect = document.getElementById('filterDept');
        const depts = [...new Set(fullNurseData.map(n => n.dept))].sort();
        deptSelect.innerHTML = '<option value="">ทุกแผนก</option>';
        depts.forEach(d => { deptSelect.innerHTML += `<option value="${d}">${d}</option>`; });

        renderNurseList(fullNurseData);
    } catch (error) { area.innerHTML = '<div class="text-center py-5 text-danger bg-white">Error: ' + error.message + '</div>'; }
}

function renderNurseList(nurses) {
    const area = document.getElementById('nurseListArea');
    area.innerHTML = '';
    nurses.forEach(function (nurse) {
        var item = document.createElement('div');
        item.className = 'list-group-item p-2 bg-white border-0 border-bottom d-flex justify-content-between align-items-center';
        
        var nurseShifts = currentShifts[nurse.id] || [];
        var badgeHtml = getShiftBadgesList(nurse.id, nurseShifts);

        item.innerHTML = `
            <div class="flex-grow-1" onclick="handleNurseItemClick('${nurse.id}', '${nurse.name}')">
                <span class="fw-bold d-block text-dark" style="font-size: 13px;">${nurse.name}</span>
                <div class="d-flex align-items-center gap-2">
                    <small class="text-muted" style="font-size: 10px;">${nurse.dept}</small>
                    <div id="badges-${nurse.id}" class="d-flex gap-1">${badgeHtml}</div>
                </div>
            </div>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-warning text-dark fw-bold" onclick="event.stopPropagation(); toggleShift('${nurse.id}', '${nurse.name}', 'เช้า')">เช้า</button>
                <button class="btn btn-outline-danger fw-bold" onclick="event.stopPropagation(); toggleShift('${nurse.id}', '${nurse.name}', 'บ่าย')">บ่าย</button>
                <button class="btn btn-outline-secondary fw-bold" onclick="event.stopPropagation(); toggleShift('${nurse.id}', '${nurse.name}', 'ดึก')">ดึก</button>
            </div>`;
        area.appendChild(item);
    });
}

function getShiftBadgesList(userId, shifts) {
    if (!shifts || shifts.length === 0) return `<span class="badge bg-light text-muted border p-1" style="font-size: 10px; font-weight: normal;">ยังไม่มีเวร</span>`;
    
    let html = '';
    const config = {
        'เช้า': { class: 'bg-warning text-dark', label: 'เช้า' },
        'บ่าย': { class: 'bg-danger text-white', label: 'บ่าย' },
        'ดึก': { style: 'background-color: #6f42c1;', class: 'text-white', label: 'ดึก' }
    };
    
    const order = ['เช้า', 'บ่าย', 'ดึก'];
    order.forEach(type => {
        if (shifts.includes(type)) {
            const c = config[type];
            html += `<span class="badge ${c.class} p-1" ${c.style ? `style="${c.style}"` : ''}>${c.label}</span>`;
        }
    });
    return html;
}

function filterNurseList() {
    const searchTerm = document.getElementById('searchNurse').value.toLowerCase();
    const deptFilter = document.getElementById('filterDept').value;
    const filtered = fullNurseData.filter(n => (n.name.toLowerCase().includes(searchTerm)) && (deptFilter === "" || n.dept === deptFilter));
    renderNurseList(filtered);
}

// --- BY NURSE LOGIC (Weekly View) ---

async function loadNurseMonthView() {
    const userId = document.getElementById('nurseSelect').value;
    const userName = document.getElementById('nurseSelect').options[document.getElementById('nurseSelect').selectedIndex]?.text;
    const monthStr = document.getElementById('nurseMonth').value;
    const area = document.getElementById('nurseMonthArea');
    const navArea = document.getElementById('weekNavArea');
    
    if (!userId || !monthStr) {
        navArea.classList.add('d-none');
        return;
    }

    area.innerHTML = '<div class="text-center py-5 bg-white"><div class="spinner-border text-primary spinner-border-sm"></div></div>';

    try {
        const [year, month] = monthStr.split('-').map(Number);
        const cacheKey = `${year}-${month}`;
        
        let allShifts;
        if (cachedMonthData.key === cacheKey) {
            allShifts = cachedMonthData.data;
        } else {
            allShifts = await apiCall('getMonthShifts', { month: month - 1, year });
            cachedMonthData = { key: cacheKey, data: allShifts };
        }

        const shifts = await apiCall('getNurseShifts', { userId, month: month - 1, year });
        
        const shiftMap = {};
        shifts.forEach(s => { 
            if (!shiftMap[s.date]) shiftMap[s.date] = [];
            shiftMap[s.date].push(s.shift);
        });

        const dailySummary = {};
        allShifts.forEach(s => {
            if (!dailySummary[s.Date]) { dailySummary[s.Date] = { 'เช้า': [], 'บ่าย': [], 'ดึก': [] }; }
            if (dailySummary[s.Date][s.Shift]) { dailySummary[s.Date][s.Shift].push(s.profiles.Name); }
        });

        const daysInMonth = new Date(year, month, 0).getDate();

        // Update State
        currentMonthState = {
            userId, userName, month, year,
            nurseShifts: shiftMap,
            dailySummary: dailySummary,
            daysInMonth,
            currentWeek: currentMonthState.currentWeek || 1
        };

        navArea.classList.remove('d-none');
        renderWeeklyList();

    } catch (e) { 
        console.error(e);
        area.innerHTML = '<div class="text-center py-5 text-danger bg-white">Error: ' + e.message + '</div>'; 
    }
}

function switchWeek(weekNum) {
    currentMonthState.currentWeek = weekNum;
    document.querySelectorAll('.week-btn').forEach(btn => btn.classList.remove('active', 'btn-primary'));
    document.querySelectorAll('.week-btn').forEach(btn => btn.classList.add('btn-light'));
    
    const activeBtn = document.getElementById('week-' + weekNum);
    activeBtn.classList.remove('btn-light');
    activeBtn.classList.add('active', 'btn-primary');
    
    renderWeeklyList();
}

function renderWeeklyList() {
    const area = document.getElementById('nurseMonthArea');
    area.innerHTML = '';

    const startDay = (currentMonthState.currentWeek - 1) * 7 + 1;
    let endDay = currentMonthState.currentWeek * 7;
    if (currentMonthState.currentWeek === 5 || endDay > currentMonthState.daysInMonth) {
        endDay = currentMonthState.daysInMonth;
    }
    
    // Safety check for empty month
    if (startDay > currentMonthState.daysInMonth) {
        switchWeek(1);
        return;
    }

    for (let d = startDay; d <= endDay; d++) {
        const dateStr = `${currentMonthState.year}-${String(currentMonthState.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const nurseShifts = currentMonthState.nurseShifts[dateStr] || [];
        const summary = currentMonthState.dailySummary[dateStr] || { 'เช้า': [], 'บ่าย': [], 'ดึก': [] };
        
        const item = document.createElement('div');
        item.className = `list-group-item p-2 bg-white border-0 border-bottom`;
        
        const badgesHtml = getShiftBadgesList(`nurse-${d}`, nurseShifts);
        const dateObj = new Date(dateStr);
        const dateLabel = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        const dayLabel = dateObj.toLocaleDateString('th-TH', { weekday: 'short' });

        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <div>
                    <span class="text-primary fw-bold" style="font-size: 11px;">${dayLabel}</span>
                    <span class="fw-bold small text-dark ms-1">${dateLabel}</span>
                    <div id="nurse-badges-${dateStr}" class="d-inline-flex gap-1 ms-1">${badgesHtml}</div>
                </div>
                <div class="btn-group btn-group-sm shadow-sm">
                    <button class="btn btn-outline-warning text-dark fw-bold" onclick="toggleNurseShift('${currentMonthState.userId}', '${dateStr}', 'เช้า')">เช้า</button>
                    <button class="btn btn-outline-danger fw-bold" onclick="toggleNurseShift('${currentMonthState.userId}', '${dateStr}', 'บ่าย')">บ่าย</button>
                    <button class="btn btn-outline-secondary fw-bold" onclick="toggleNurseShift('${currentMonthState.userId}', '${dateStr}', 'ดึก')">ดึก</button>
                </div>
            </div>
            <div class="text-muted" style="font-size: 9px; padding-left: 2px;">
                <div class="mb-1"><span class="fw-bold text-warning">เช้า:</span> ${summary['เช้า'].join(', ') || '-'}</div>
                <div class="mb-1"><span class="fw-bold text-danger">บ่าย:</span> ${summary['บ่าย'].join(', ') || '-'}</div>
                <div class="mb-1"><span class="fw-bold text-purple" style="color: #6f42c1;">ดึก:</span> ${summary['ดึก'].join(', ') || '-'}</div>
            </div>
        `;
        area.appendChild(item);
    }
}

// --- TOGGLE LOGIC ---
async function toggleShift(userId, name, shift) {
    const badgeArea = document.getElementById('badges-' + userId);
    const targetDate = document.getElementById('targetDate').value;
    const currentList = currentShifts[userId] || [];
    const hasShift = currentList.includes(shift);
    
    badgeArea.innerHTML = `<span class="badge bg-info text-white p-1">...</span>`;

    try {
        if (hasShift) {
            await apiCall('deleteShift', { userId, date: targetDate, shift });
            currentShifts[userId] = currentList.filter(s => s !== shift);
        } else {
            await apiCall('saveShift', { userId, date: targetDate, shift });
            if (!currentShifts[userId]) currentShifts[userId] = [];
            currentShifts[userId].push(shift);
        }
        badgeArea.innerHTML = getShiftBadgesList(userId, currentShifts[userId]);
        cachedMonthData.key = null; 
    } catch (e) { console.error(e); badgeArea.innerHTML = 'Error'; }
}

async function toggleNurseShift(userId, date, shift) {
    const badgeArea = document.getElementById('nurse-badges-' + date);
    const hasShift = badgeArea.innerText.includes(shift);
    
    badgeArea.innerHTML = `<span class="badge bg-info text-white p-1">...</span>`;

    try {
        if (hasShift) {
            await apiCall('deleteShift', { userId, date, shift });
        } else {
            await apiCall('saveShift', { userId, date, shift });
        }
        cachedMonthData.key = null; 
        loadNurseMonthView(); 
    } catch (e) { console.error(e); }
}

function handleNurseItemClick(userId, name) {
    if (activePaintMode === 'select') return;
    if (activePaintMode === 'clear') {
        clearAllShifts(userId);
    } else {
        toggleShift(userId, name, activePaintMode);
    }
}

async function clearAllShifts(userId) {
    const badgeArea = document.getElementById('badges-' + userId);
    const targetDate = document.getElementById('targetDate').value;
    badgeArea.innerHTML = `<span class="badge bg-dark text-white p-1">ล้าง...</span>`;
    try {
        const res = await apiCall('deleteShift', { userId, date: targetDate });
        if (res.success) {
            currentShifts[userId] = [];
            badgeArea.innerHTML = getShiftBadgesList(userId, []);
            cachedMonthData.key = null;
        }
    } catch (e) { console.error(e); }
}

function assignShift(userId, nurseName, shift) {
    toggleShift(userId, nurseName, shift);
}

async function executePendingAction() {
    var modal = bootstrap.Modal.getInstance(document.getElementById('customConfirmModal'));
    if (modal) modal.hide();
}
