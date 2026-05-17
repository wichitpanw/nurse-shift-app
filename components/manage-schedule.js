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
                            <label class="btn btn-outline-dark btn-sm fw-bold" for="mode-clear">ล้าง</label>
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
            <div class="card shadow-sm border-0 mb-3" style="border-radius: 15px;">
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
            <div id="nurseMonthArea" class="list-group shadow-sm" style="border-radius: 12px; overflow: hidden;">
                <div class="text-center py-5 text-muted bg-white border border-light">กรุณาเลือกรายชื่อและเดือนด้านบนค่ะ</div>
            </div>
        </div>
    </div>

    <!-- Modal for Confirmation -->
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
var pendingAction = null;
var activePaintMode = 'select';
var fullNurseData = [];
var currentShifts = {};
var cachedMonthData = { key: null, data: null }; // ⚡ Data Cache

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
        currentShifts = res.shifts;

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
        var currentShift = currentShifts[nurse.id] || null;
        var badgeHtml = getShiftBadge(nurse.id, currentShift);

        item.innerHTML = `
            <div class="flex-grow-1" onclick="handleNurseItemClick('${nurse.id}', '${nurse.name}')">
                <span class="fw-bold d-block text-dark" style="font-size: 13px;">${nurse.name}</span>
                <div class="d-flex align-items-center gap-2">
                    <small class="text-muted" style="font-size: 10px;">${nurse.dept}</small>
                    ${badgeHtml}
                </div>
            </div>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-warning text-dark fw-bold" onclick="event.stopPropagation(); assignShift('${nurse.id}', '${nurse.name}', 'เช้า')">เช้า</button>
                <button class="btn btn-outline-danger fw-bold" onclick="event.stopPropagation(); assignShift('${nurse.id}', '${nurse.name}', 'บ่าย')">บ่าย</button>
                <button class="btn btn-outline-secondary fw-bold" onclick="event.stopPropagation(); assignShift('${nurse.id}', '${nurse.name}', 'ดึก')">ดึก</button>
            </div>`;
        area.appendChild(item);
    });
}

function getShiftBadge(userId, shift) {
    if (!shift) return `<span class="badge bg-light text-muted border p-1" style="font-size: 10px; font-weight: normal;" id="status-${userId}">ยังไม่มีเวร</span>`;
    const config = {
        'เช้า': { class: 'bg-warning text-dark', label: 'เวรเช้า' },
        'บ่าย': { class: 'bg-danger text-white', label: 'เวรบ่าย' },
        'ดึก': { style: 'background-color: #6f42c1;', class: 'text-white', label: 'เวรดึก' }
    };
    const c = config[shift];
    return `<span class="badge ${c.class} p-1" ${c.style ? `style="${c.style}"` : ''} id="status-${userId}">${c.label}</span>`;
}

function filterNurseList() {
    const searchTerm = document.getElementById('searchNurse').value.toLowerCase();
    const deptFilter = document.getElementById('filterDept').value;
    const filtered = fullNurseData.filter(n => (n.name.toLowerCase().includes(searchTerm)) && (deptFilter === "" || n.dept === deptFilter));
    renderNurseList(filtered);
}

// --- BY NURSE LOGIC ---
async function loadNurseMonthView() {
    const userId = document.getElementById('nurseSelect').value;
    const monthStr = document.getElementById('nurseMonth').value;
    const area = document.getElementById('nurseMonthArea');
    if (!userId || !monthStr) return;

    area.innerHTML = '<div class="text-center py-5 bg-white"><div class="spinner-border text-primary spinner-border-sm"></div></div>';

    try {
        const [year, month] = monthStr.split('-').map(Number);
        const cacheKey = `${year}-${month}`;
        
        // ⚡ Smart Caching for Team Coverage
        let allShifts;
        if (cachedMonthData.key === cacheKey) {
            allShifts = cachedMonthData.data;
        } else {
            allShifts = await apiCall('getMonthShifts', { month: month - 1, year });
            cachedMonthData = { key: cacheKey, data: allShifts };
        }

        const shifts = await apiCall('getNurseShifts', { userId, month: month - 1, year });
        const shiftMap = {};
        shifts.forEach(s => { shiftMap[s.date] = s.shift; });

        // Group all shifts by date and type for the summary
        const dailySummary = {};
        allShifts.forEach(s => {
            if (!dailySummary[s.Date]) {
                dailySummary[s.Date] = { 'เช้า': [], 'บ่าย': [], 'ดึก': [] };
            }
            if (dailySummary[s.Date][s.Shift]) {
                dailySummary[s.Date][s.Shift].push(s.profiles.Name);
            }
        });

        const daysInMonth = new Date(year, month, 0).getDate();
        area.innerHTML = '';
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const currentShift = shiftMap[dateStr] || null;
            const summary = dailySummary[dateStr] || { 'เช้า': [], 'บ่าย': [], 'ดึก': [] };
            
            const item = document.createElement('div');
            // ⚡ Highlight row if the nurse has a shift
            const highlightClass = currentShift ? 'border-start border-4 border-primary bg-primary-subtle' : '';
            item.className = `list-group-item p-2 bg-white border-0 border-bottom ${highlightClass}`;
            
            const badgeHtml = getShiftBadge(`nurse-${d}`, currentShift);
            const dateLabel = new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <div>
                        <span class="fw-bold small text-dark">${dateLabel}</span>
                        ${badgeHtml.replace(`id="status-nurse-${d}"`, `id="nurse-date-${dateStr}"`)}
                    </div>
                    <div class="btn-group btn-group-sm shadow-sm">
                        <button class="btn btn-outline-warning text-dark fw-bold" onclick="quickNurseAction('${userId}', '${dateStr}', 'เช้า')">เช้า</button>
                        <button class="btn btn-outline-danger fw-bold" onclick="quickNurseAction('${userId}', '${dateStr}', 'บ่าย')">บ่าย</button>
                        <button class="btn btn-outline-secondary fw-bold" onclick="quickNurseAction('${userId}', '${dateStr}', 'ดึก')">ดึก</button>
                        <button class="btn btn-outline-dark" onclick="quickNurseAction('${userId}', '${dateStr}', null)"><i class="fa-solid fa-xmark"></i></button>
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
    } catch (e) { 
        console.error(e);
        area.innerHTML = '<div class="text-center py-5 text-danger bg-white">Error: ' + e.message + '</div>'; 
    }
}

async function quickNurseAction(userId, date, shift) {
    const label = document.getElementById('nurse-date-' + date);
    if (label) { label.className = 'badge bg-info text-white p-1'; label.innerText = 'บันทึก...'; }

    try {
        const res = shift 
            ? await apiCall('saveShift', { userId, date, shift })
            : await apiCall('deleteShift', { userId, date });
            
        if (res.success) {
            // ⚡ Update local cache to reflect changes immediately
            cachedMonthData.key = null; 

            if (!shift) { 
                label.className = 'badge bg-light text-muted border p-1'; label.innerText = 'ยังไม่มีเวร'; label.style.backgroundColor = ''; 
                label.closest('.list-group-item').classList.remove('bg-primary-subtle', 'border-start', 'border-4', 'border-primary');
            }
            else {
                const config = { 'เช้า': 'bg-warning text-dark', 'บ่าย': 'bg-danger text-white', 'ดึก': 'text-white' };
                label.className = 'badge ' + config[shift] + ' p-1';
                label.innerText = 'เวร' + shift;
                label.style.backgroundColor = shift === 'ดึก' ? '#6f42c1' : '';
                label.closest('.list-group-item').classList.add('bg-primary-subtle', 'border-start', 'border-4', 'border-primary');
            }
        }
    } catch (e) { console.error(e); }
}

// --- SHARED ACTIONS ---
function handleNurseItemClick(userId, name) {
    if (activePaintMode === 'select') return;
    activePaintMode === 'clear' ? quickAction(userId, 'delete') : quickAction(userId, 'save', activePaintMode);
}

async function quickAction(userId, type, shift) {
    const statusLabel = document.getElementById('status-' + userId);
    const targetDate = document.getElementById('targetDate').value;
    if (statusLabel) { statusLabel.className = 'badge bg-info text-white p-1'; statusLabel.innerText = 'บันทึก...'; }
    try {
        const res = type === 'save' 
            ? await apiCall('saveShift', { userId, date: targetDate, shift }) 
            : await apiCall('deleteShift', { userId, date: targetDate });
            
        if (res.success) {
            cachedMonthData.key = null; // Clear cache on change
            type === 'save' ? (currentShifts[userId] = shift) : (delete currentShifts[userId]);
            updateBadge(userId, type === 'save' ? shift : null);
        }
    } catch (e) { if (statusLabel) statusLabel.innerText = 'Error'; }
}

function updateBadge(userId, shift) {
    const label = document.getElementById('status-' + userId);
    if (!label) return;
    if (!shift) { label.className = 'badge bg-light text-muted border p-1'; label.innerText = 'ยังไม่มีเวร'; label.style.backgroundColor = ''; }
    else {
        const config = { 'เช้า': 'bg-warning text-dark', 'บ่าย': 'bg-danger text-white', 'ดึก': 'text-white' };
        label.className = 'badge ' + config[shift] + ' p-1'; label.innerText = 'เวร' + shift;
        label.style.backgroundColor = shift === 'ดึก' ? '#6f42c1' : '';
    }
}

function assignShift(userId, nurseName, shift) {
    var date = document.getElementById('targetDate').value;
    if (!date) return alert('กรุณาเลือกวันที่ก่อนนะคะ');
    pendingAction = { type: 'save', userId: userId, date: date, shift: shift };
    document.getElementById('confirmBodyText').innerText = 'คุณต้องการจัดให้คุณ "' + nurseName + '" ขึ้นเวร "' + shift + '" ในวันที่ ' + date + ' ใช่หรือไม่คะ?';
    document.getElementById('confirmIcon').innerHTML = '<i class="fa-solid fa-calendar-check text-primary fa-3x"></i>';
    new bootstrap.Modal(document.getElementById('customConfirmModal')).show();
}

async function executePendingAction() {
    var modal = bootstrap.Modal.getInstance(document.getElementById('customConfirmModal'));
    if (modal) modal.hide();
    if (!pendingAction) return;
    await quickAction(pendingAction.userId, pendingAction.type, pendingAction.shift);
    pendingAction = null;
}
