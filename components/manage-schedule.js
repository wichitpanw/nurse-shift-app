(function() {
    const manageScheduleHtml = `
    <div class="container py-3" style="max-width: 600px;">
        <div class="card shadow-sm border-0 mb-3" style="border-radius: 15px;">
            <div class="card-body">
                <h5 class="fw-bold text-primary mb-2"><i class="fa-solid fa-calendar-check me-2"></i>จัดการตารางเวร</h5>
                <p class="text-muted small mb-3">กรุณาเลือกวันที่ก่อน แล้วกดปุ่มลงเวรให้พยาบาลแต่ละท่านค่ะ</p>
                <div class="mb-2">
                    <label class="small text-muted fw-bold mb-1">เลือกวันที่จัดเวร</label>
                    <input type="date" id="targetDate" class="form-control" onchange="loadNursesForManage()">
                </div>
            </div>
        </div>

        <div id="nurseListArea" class="list-group shadow-sm" style="border-radius: 12px; overflow: hidden;">
            <div class="text-center py-5 text-muted bg-white border border-light">กรุณาเลือกวันที่ด้านบนก่อนนะคะ</div>
        </div>
    </div>

    <!-- Modal for Schedule Confirmation -->
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
        const nurses = await gas.getAllNurses();
        area.innerHTML = '';
        if (!nurses || nurses.length === 0) {
            area.innerHTML = '<div class="text-center py-5 text-muted bg-white">ไม่พบรายชื่อพยาบาลที่มีสถานะ Active ในตารางค่ะ</div>';
            return;
        }

        nurses.forEach(function (nurse) {
            var item = document.createElement('div');
            item.className = 'list-group-item p-3 bg-white border-0 border-bottom d-flex justify-content-between align-items-center';

            item.innerHTML = `<div>
                <span class="fw-bold d-block text-dark">${nurse.name}</span>
                <span class="badge bg-light text-muted border p-1" style="font-size: 10px; font-weight: normal;" id="status-${nurse.id}">ยังไม่ได้ลงเวรวันนี้</span>
                </div>
                <div class="d-flex flex-column align-items-end gap-1">
                <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-warning text-dark fw-bold" onclick="assignShift('${nurse.id}', '${nurse.name}', 'เช้า')">เช้า</button>
                <button class="btn btn-outline-danger fw-bold" onclick="assignShift('${nurse.id}', '${nurse.name}', 'บ่าย')">บ่าย</button>
                <button class="btn btn-outline-secondary fw-bold" onclick="assignShift('${nurse.id}', '${nurse.name}', 'ดึก')">ดึก</button>
                </div>
                <button class="btn btn-sm btn-link text-danger p-0 mt-1 small" style="font-size: 11px; text-decoration: none;" onclick="removeShift('${nurse.id}', '${nurse.name}')"><i class="fa-solid fa-trash-can me-1"></i>ล้างเวรวันนี้</button>
                </div>`;

            area.appendChild(item);
        });
    } catch (error) {
        area.innerHTML = '<div class="text-center py-5 text-danger bg-white">เกิดข้อผิดพลาด: ' + error.message + '</div>';
    }
}

function assignShift(userId, nurseName, shift) {
    var dateInput = document.getElementById('targetDate');
    if (!dateInput) return;
    var date = dateInput.value;

    pendingAction = {
        type: 'save',
        userId: userId,
        date: date,
        shift: shift
    };

    document.getElementById('confirmBodyText').innerText = 'คุณต้องการจัดให้คุณ "' + nurseName + '" ขึ้นเวร "' + shift + '" ในวันที่ ' + date + ' ใช่หรือไม่คะ?';
    document.getElementById('confirmIcon').innerHTML = '<i class="fa-solid fa-calendar-check text-primary fa-3x"></i>';
    document.getElementById('btnConfirmSubmit').className = 'btn btn-primary w-50 small fw-bold';

    var myModal = new bootstrap.Modal(document.getElementById('customConfirmModal'));
    myModal.show();
}

function removeShift(userId, nurseName) {
    var dateInput = document.getElementById('targetDate');
    if (!dateInput) return;
    var date = dateInput.value;

    pendingAction = {
        type: 'delete',
        userId: userId,
        date: date
    };

    document.getElementById('confirmBodyText').innerText = 'คุณต้องการลบข้อมูลตารางเวรทั้งหมดของ คุณ "' + nurseName + '" ในวันที่ ' + date + ' ใช่หรือไม่คะ?';
    document.getElementById('confirmIcon').innerHTML = '<i class="fa-solid fa-trash-can text-danger fa-3x"></i>';
    document.getElementById('btnConfirmSubmit').className = 'btn btn-danger w-50 small fw-bold';

    var myModal = new bootstrap.Modal(document.getElementById('customConfirmModal'));
    myModal.show();
}

async function executePendingAction() {
    var modalElement = document.getElementById('customConfirmModal');
    var modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();

    if (!pendingAction) return;

    var userId = pendingAction.userId;
    var date = pendingAction.date;
    var statusLabel = document.getElementById('status-' + userId);

    try {
        if (pendingAction.type === 'save') {
            var shift = pendingAction.shift;
            if (statusLabel) {
                statusLabel.className = 'badge bg-info text-white p-1';
                statusLabel.innerText = 'กำลังบันทึก...';
            }

            const res = await gas.saveShift(userId, date, shift);
            if (res.success) {
                if (statusLabel) {
                    statusLabel.className = 'badge bg-success text-white p-1';
                    statusLabel.innerText = 'ลงเวร ' + shift + ' สำเร็จ';
                }
            } else {
                alert('บันทึกไม่สำเร็จ: ' + res.message);
            }

        } else if (pendingAction.type === 'delete') {
            if (statusLabel) {
                statusLabel.className = 'badge bg-warning text-dark p-1';
                statusLabel.innerText = 'กำลังลบเวร...';
            }

            const res = await gas.deleteShift(userId, date);
            if (res.success) {
                if (statusLabel) {
                    statusLabel.className = 'badge bg-light text-muted border p-1';
                    statusLabel.innerText = 'ยังไม่ได้ลงเวรวันนี้';
                }
            } else {
                alert('ลบไม่สำเร็จ: ' + res.message);
            }
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }

    pendingAction = null;
}
