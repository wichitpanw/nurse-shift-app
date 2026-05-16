(function() {
    const manageScheduleHtml = `
    <div class="container py-3" style="max-width: 600px;">
        <div class="card shadow-sm border-0 mb-3" style="border-radius: 15px;">
            <div class="card-body">
                <h5 class="fw-bold text-primary mb-2"><i class="fa-solid fa-calendar-check me-2"></i>จัดการตารางเวร</h5>
                
                <div class="mb-3">
                    <label class="small text-muted fw-bold mb-1">เลือกวันที่จัดเวร</label>
                    <div class="d-flex gap-2">
                        <input type="date" id="targetDate" class="form-control" onchange="loadNursesForManage()">
                        <button class="btn btn-outline-primary btn-sm fw-bold" style="white-space: nowrap;" onclick="copyFromYesterday()">
                            <i class="fa-solid fa-copy me-1"></i>จากเมื่อวาน
                        </button>
                    </div>
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

    <!-- Modal for Schedule Confirmation (Only for non-paint mode) -->
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

var pendingAction = null;
var activePaintMode = 'select'; // Default
var fullNurseData = [];
var currentShifts = {};

function updatePaintMode() {
    activePaintMode = document.querySelector('input[name="paintMode"]:checked').value;
}

async function loadNursesForManage() {
    var dateInput = document.getElementById('targetDate');
    var area = document.getElementById('nurseListArea');
    if (!dateInput || !area) return;

    var date = dateInput.value;
    if (!date) {
        area.innerHTML = '<div class="text-center py-5 text-muted bg-white">กรุณาเลือกวันที่ด้านบนก่อนนะคะ</div>';
        return;
    }

    area.innerHTML = '<div class="text-center py-5 bg-white"><div class="spinner-border text-primary spinner-border-sm"></div> <span class="small text-muted ms-2">กำลังโหลดรายชื่อ...</span></div>';

    try {
        const res = await apiCall('getManagementData', { date: date });
        fullNurseData = res.nurses;
        currentShifts = res.shifts;

        // Update Dept Filter
        const deptSelect = document.getElementById('filterDept');
        const depts = [...new Set(fullNurseData.map(n => n.dept))].sort();
        deptSelect.innerHTML = '<option value="">ทุกแผนก</option>';
        depts.forEach(d => {
            deptSelect.innerHTML += `<option value="${d}">${d}</option>`;
        });

        renderNurseList(fullNurseData);
    } catch (error) {
        area.innerHTML = '<div class="text-center py-5 text-danger bg-white">เกิดข้อผิดพลาด: ' + error.message + '</div>';
    }
}

function renderNurseList(nurses) {
    const area = document.getElementById('nurseListArea');
    area.innerHTML = '';
    
    if (!nurses || nurses.length === 0) {
        area.innerHTML = '<div class="text-center py-5 text-muted bg-white">ไม่พบรายชื่อพยาบาลตามเงื่อนไขค่ะ</div>';
        return;
    }

    nurses.forEach(function (nurse) {
        var item = document.createElement('div');
        item.className = 'list-group-item p-2 bg-white border-0 border-bottom d-flex justify-content-between align-items-center nurse-manage-item';
        item.style.cursor = 'pointer';
        
        var currentShift = currentShifts[nurse.id] || null;
        var badgeHtml = '<span class="badge bg-light text-muted border p-1" style="font-size: 10px; font-weight: normal;" id="status-' + nurse.id + '">ยังไม่มีเวร</span>';
        
        if (currentShift === 'เช้า') badgeHtml = `<span class="badge bg-warning text-dark p-1" id="status-${nurse.id}">เวรเช้า</span>`;
        if (currentShift === 'บ่าย') badgeHtml = `<span class="badge bg-danger text-white p-1" id="status-${nurse.id}">เวรบ่าย</span>`;
        if (currentShift === 'ดึก') badgeHtml = `<span class="badge text-white p-1" style="background-color: #6f42c1;" id="status-${nurse.id}">เวรดึก</span>`;

        item.innerHTML = `
            <div class="flex-grow-1" onclick="handleNurseItemClick('${nurse.id}', '${nurse.name}')">
                <span class="fw-bold d-block text-dark" style="font-size: 13px;">${nurse.name}</span>
                <div class="d-flex align-items-center gap-2">
                    <small class="text-muted" style="font-size: 10px;">${nurse.dept}</small>
                    ${badgeHtml}
                </div>
            </div>
            <div class="d-flex flex-column align-items-end gap-1">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-warning text-dark fw-bold" onclick="event.stopPropagation(); assignShift('${nurse.id}', '${nurse.name}', 'เช้า')">เช้า</button>
                    <button class="btn btn-outline-danger fw-bold" onclick="event.stopPropagation(); assignShift('${nurse.id}', '${nurse.name}', 'บ่าย')">บ่าย</button>
                    <button class="btn btn-outline-secondary fw-bold" onclick="event.stopPropagation(); assignShift('${nurse.id}', '${nurse.name}', 'ดึก')">ดึก</button>
                </div>
            </div>`;

        area.appendChild(item);
    });
}

function filterNurseList() {
    const searchTerm = document.getElementById('searchNurse').value.toLowerCase();
    const deptFilter = document.getElementById('filterDept').value;
    
    const filtered = fullNurseData.filter(n => {
        const matchesSearch = n.name.toLowerCase().includes(searchTerm);
        const matchesDept = deptFilter === "" || n.dept === deptFilter;
        return matchesSearch && matchesDept;
    });
    
    renderNurseList(filtered);
}

function handleNurseItemClick(userId, name) {
    if (activePaintMode === 'select') return;
    
    if (activePaintMode === 'clear') {
        quickAction(userId, 'delete');
    } else {
        quickAction(userId, 'save', activePaintMode);
    }
}

async function quickAction(userId, type, shift) {
    const statusLabel = document.getElementById('status-' + userId);
    const targetDate = document.getElementById('targetDate').value;
    
    if (statusLabel) {
        statusLabel.className = 'badge bg-info text-white p-1';
        statusLabel.innerText = 'บันทึก...';
    }

    try {
        let res;
        if (type === 'save') {
            res = await gas.saveShift(userId, targetDate, shift);
            if (res.success) {
                currentShifts[userId] = shift;
                updateBadge(userId, shift);
            }
        } else {
            res = await gas.deleteShift(userId, targetDate);
            if (res.success) {
                delete currentShifts[userId];
                updateBadge(userId, null);
            }
        }
    } catch (e) {
        console.error(e);
        if (statusLabel) statusLabel.innerText = 'Error';
    }
}

function updateBadge(userId, shift) {
    const label = document.getElementById('status-' + userId);
    if (!label) return;
    
    if (!shift) {
        label.className = 'badge bg-light text-muted border p-1';
        label.innerText = 'ยังไม่มีเวร';
    } else if (shift === 'เช้า') {
        label.className = 'badge bg-warning text-dark p-1';
        label.innerText = 'เวรเช้า';
    } else if (shift === 'บ่าย') {
        label.className = 'badge bg-danger text-white p-1';
        label.innerText = 'เวรบ่าย';
    } else if (shift === 'ดึก') {
        label.className = 'badge text-white p-1';
        label.style.backgroundColor = '#6f42c1';
        label.innerText = 'เวรดึก';
    }
}

async function copyFromYesterday() {
    const targetDate = document.getElementById('targetDate').value;
    if (!targetDate) return alert('กรุณาเลือกวันที่ก่อนนะคะ');
    
    const d = new Date(targetDate);
    d.setDate(d.getDate() - 1);
    const sourceDate = d.toISOString().split('T')[0];
    
    if (!confirm(`คุณต้องการคัดลอกตารางจากเมื่อวาน (${sourceDate}) มาที่วันนี้หรือไม่คะ?\n(ข้อมูลเดิมของวันนี้จะถูกลบทั้งหมดค่ะ)`)) return;
    
    try {
        const res = await apiCall('copySchedule', { targetDate, sourceDate });
        alert(res.message);
        loadNursesForManage();
    } catch (e) {
        alert('เกิดข้อผิดพลาด: ' + e.message);
    }
}

// Keep original modal functions for individual button clicks
function assignShift(userId, nurseName, shift) {
    var dateInput = document.getElementById('targetDate');
    var date = dateInput.value;
    pendingAction = { type: 'save', userId: userId, date: date, shift: shift };
    document.getElementById('confirmBodyText').innerText = 'คุณต้องการจัดให้คุณ "' + nurseName + '" ขึ้นเวร "' + shift + '" ในวันที่ ' + date + ' ใช่หรือไม่คะ?';
    document.getElementById('confirmIcon').innerHTML = '<i class="fa-solid fa-calendar-check text-primary fa-3x"></i>';
    var myModal = new bootstrap.Modal(document.getElementById('customConfirmModal'));
    myModal.show();
}

async function executePendingAction() {
    var modalElement = document.getElementById('customConfirmModal');
    var modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    if (!pendingAction) return;

    await quickAction(pendingAction.userId, pendingAction.type, pendingAction.shift);
    pendingAction = null;
}
