(function() {
    const calendarHtml = `
    <div class="container py-3" style="max-width: 600px;">
        <div class="d-flex justify-content-between align-items-center mb-2 bg-white p-3 shadow-sm"
            style="border-radius: 12px;">
            <div>
                <span class="small text-muted d-block" style="font-size: 11px;">ผู้ใช้งานปัจจุบัน</span>
                <h6 class="fw-bold mb-0 text-dark" id="userDisplay">กำลังโหลด...</h6>
            </div>
            <span class="badge bg-primary px-3 py-2 small" id="roleDisplay">...</span>
        </div>

        <div class="alert alert-warning border-0 shadow-sm py-2 px-3 mb-3 d-flex align-items-center" style="border-radius: 12px; font-size: 12px;">
            <i class="fa-solid fa-circle-info me-2"></i>
            <div>ท่านสามารถ <strong>คลิกที่รายการเวรในปฏิทิน</strong> เพื่อส่งคำขอเข้าปฏิบัติงานแทนเพื่อนได้ค่ะ</div>
        </div>

        <div id="swapAlertArea" class="mb-2"></div>

        <div class="card shadow-sm border-0" style="border-radius: 15px;">
            <div class="card-body p-2">
                <div id="calendar" style="font-size: 13px;"></div>
            </div>
        </div>

        <div class="d-flex justify-content-center gap-2 mt-3 small fw-bold">
            <span class="badge" style="background-color: #ffc107; color: black;">🟡 เวรเช้า</span>
            <span class="badge" style="background-color: #fd7e14;">🟠 เวรบ่าย</span>
            <span class="badge" style="background-color: #6f42c1;">🟣 เวรดึก</span>
        </div>
    </div>

    <!-- Modals for Calendar -->
    <div class="modal fade" id="swapConfirmModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm p-3">
            <div class="modal-content" style="border-radius: 15px; border: none;">
                <div class="modal-body text-center p-4">
                    <div class="text-primary mb-3">
                        <i class="fa-solid fa-people-arrows fa-3x"></i>
                    </div>
                    <h5 class="fw-bold mb-2">ขอเข้าปฏิบัติงานแทน</h5>
                    <p class="text-muted small mb-4" id="swapModalText">
                        คุณต้องการส่งคำขอเข้าปฏิบัติงานแทนเพื่อนพยาบาลใช่หรือไม่คะ?</p>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-light w-50 small fw-bold" data-bs-dismiss="modal"
                            style="border-radius: 8px;">ยกเลิก</button>
                        <button type="button" id="btnSubmitSwap" class="btn btn-primary w-50 small fw-bold"
                            style="border-radius: 8px;" onclick="submitSwapRequest()">ส่งคำขอ</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="approveConfirmModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm p-3">
            <div class="modal-content" style="border-radius: 15px; border: none;">
                <div class="modal-body text-center p-4">
                    <div class="text-success mb-3">
                        <i class="fa-solid fa-circle-check fa-3x"></i>
                    </div>
                    <h5 class="fw-bold mb-2">ยืนยันการยกเวร</h5>
                    <p class="text-muted small mb-4">คุณยินยอมที่จะยกเวรกะนี้
                        และให้เพื่อนพยาบาลมาปฏิบัติหน้าที่แทนใช่หรือไม่คะ?</p>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-light w-50 small fw-bold" data-bs-dismiss="modal"
                            style="border-radius: 8px;">ยกเลิก</button>
                        <button type="button" id="btnSubmitApprove" class="btn btn-success w-50 small fw-bold"
                            style="border-radius: 8px;" onclick="executeApproveSwap()">ยินยอม</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="resultModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm p-3">
            <div class="modal-content" style="border-radius: 15px; border: none;">
                <div class="modal-body text-center p-4">
                    <div id="resultIcon" class="mb-3"></div>
                    <h5 class="fw-bold mb-2" id="resultTitle">แจ้งสถานะ</h5>
                    <p class="text-muted small mb-4" id="resultBody">ดำเนินการเรียบร้อยแล้วค่ะ</p>
                    <button type="button" class="btn btn-primary w-100 fw-bold small" data-bs-dismiss="modal"
                        style="border-radius: 8px;">ตกลง</button>
                </div>
            </div>
        </div>
    </div>
    `;

    document.getElementById('page-calendar').innerHTML = calendarHtml;
})();

var globalUserData = null;
var selectedEventData = null;
var pendingApproveSwapId = null;

async function loadCalendarData(userData) {
    globalUserData = userData;
    document.getElementById('userDisplay').innerText = userData.name;
    document.getElementById('roleDisplay').innerText = userData.role;
    await initCalendar();
    checkIncomingSwapRequests();
}

async function initCalendar() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'th',
        headerToolbar: { left: 'prev', center: 'title', right: 'next' },
        height: 'auto',
        eventDisplay: 'block',
        eventClick: function (info) {
            var props = info.event.extendedProps;
            selectedEventData = {
                scheduleId: info.event.id,
                ownerId: props.userId,
                nurseName: props.nurseName,
                shift: props.shift,
                date: info.event.startStr
            };
            document.getElementById('swapModalText').innerText = 'คุณต้องการส่งคำขอไปปฏิบัติงาน "เวร ' + props.shift + '" แทนคุณ "' + props.nurseName + '" ในวันที่ ' + info.event.startStr + ' ใช่หรือไม่คะ?';
            var myModal = new bootstrap.Modal(document.getElementById('swapConfirmModal'));
            myModal.show();
        }
    });
    calendar.render();

    try {
        const events = await apiCall('getCalendarEvents');
        calendar.addEventSource(events);
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function showResult(title, msg, isSuccess) {
    document.getElementById('resultTitle').innerText = title;
    document.getElementById('resultBody').innerText = msg;
    document.getElementById('resultIcon').innerHTML = isSuccess
        ? '<i class="fa-solid fa-circle-check fa-3x text-success"></i>'
        : '<i class="fa-solid fa-circle-xmark fa-3x text-danger"></i>';
    var myModal = new bootstrap.Modal(document.getElementById('resultModal'));
    myModal.show();
}

async function submitSwapRequest() {
    var btn = document.getElementById('btnSubmitSwap');
    btn.disabled = true;
    btn.innerText = 'กำลังส่ง...';

    var modalEl = document.getElementById('swapConfirmModal');
    var modalInstance = bootstrap.Modal.getInstance(modalEl);

    try {
        const res = await apiCall('createSwapRequest', {
            scheduleId: selectedEventData.scheduleId,
            ownerId: selectedEventData.ownerId,
            requesterEmail: globalUserData.email
        });
        if (modalInstance) modalInstance.hide();
        btn.disabled = false;
        btn.innerText = 'ส่งคำขอ';
        showResult(res.success ? 'สำเร็จ' : 'ขออภัย', res.message, res.success);
        initCalendar();
    } catch (error) {
        btn.disabled = false;
        btn.innerText = 'ส่งคำขอ';
        showResult('ขออภัย', error.message, false);
    }
}

async function checkIncomingSwapRequests() {
    var alertArea = document.getElementById('swapAlertArea');
    if (!alertArea) return;

    try {
        const requests = await apiCall('getMyPendingSwaps', { userEmail: globalUserData.email });
        alertArea.innerHTML = '';
        if (requests && requests.length > 0) {
            requests.forEach(function (req) {
                var card = document.createElement('div');
                card.className = 'alert alert-info shadow-sm p-3 border-0 d-flex flex-column gap-2 mb-2';
                card.style.borderRadius = '12px';
                card.innerHTML = `
          <div class="small text-dark"><i class="fa-solid fa-bell text-warning me-2"></i>คุณ <strong>${req.requesterName}</strong> ขอเข้าเวรแทนในวันที่ ${req.date} (${req.shift})</div>
          <button class="btn btn-sm btn-success fw-bold w-100" style="border-radius:6px;" onclick="handleApproveSwap('${req.swapId}')"><i class="fa-solid fa-circle-check me-1"></i>ยินยอมให้เข้าแทน</button>
        `;
                alertArea.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error checking swaps:', error);
    }
}

function handleApproveSwap(swapId) {
    pendingApproveSwapId = swapId;
    var myModal = new bootstrap.Modal(document.getElementById('approveConfirmModal'));
    myModal.show();
}

async function executeApproveSwap() {
    var modalEl = document.getElementById('approveConfirmModal');
    var modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    if (!pendingApproveSwapId) return;

    var btn = document.getElementById('btnSubmitApprove');
    btn.disabled = true;

    try {
        const res = await apiCall('approveSwap', { swapId: pendingApproveSwapId });
        btn.disabled = false;
        showResult(res.success ? 'สำเร็จ' : 'ขออภัย', res.message, res.success);
        checkIncomingSwapRequests();
        initCalendar();
    } catch (error) {
        btn.disabled = false;
        showResult('ขออภัย', error.message, false);
    }

    pendingApproveSwapId = null;
}
