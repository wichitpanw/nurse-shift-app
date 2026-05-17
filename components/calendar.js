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

        <div class="card shadow-sm border-0 mb-3" style="border-radius: 15px;">
            <div class="card-body p-2">
                <div id="calendar"></div>
            </div>
        </div>

        <div class="d-flex justify-content-center gap-2 mt-2 mb-3 small fw-bold">
            <span class="badge" style="background-color: #ffc107; color: black;">🟡 เช้า</span>
            <span class="badge" style="background-color: #fd7e14;">🟠 บ่าย</span>
            <span class="badge" style="background-color: #6f42c1;">🟣 ดึก</span>
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
    `;

    document.getElementById('page-calendar').innerHTML = calendarHtml;
})();

var globalUserData = null;
var selectedEventData = null;
var pendingApproveSwapId = null;
var calendarInstance = null;

async function loadCalendarData(userData) {
    globalUserData = userData;
    document.getElementById('userDisplay').innerText = userData.name;
    document.getElementById('roleDisplay').innerText = userData.role;
    await initCalendar();
    checkIncomingSwapRequests();
}

async function initCalendar() {
    var calendarEl = document.getElementById('calendar');
    if (calendarInstance) {
        calendarInstance.destroy();
    }
    
    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView: window.innerWidth < 500 ? 'listMonth' : 'dayGridMonth',
        locale: 'th',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth'
        },
        buttonText: {
            today: 'วันนี้',
            month: 'ปฏิทิน',
            list: 'รายการ'
        },
        height: 'auto',
        eventDisplay: 'block',
        displayEventTime: false,
        eventClick: function (info) {
            var props = info.event.extendedProps;
            selectedEventData = {
                scheduleId: info.event.id,
                ownerId: props.userId,
                nurseName: props.nurseName,
                shift: props.shift,
                date: info.event.startStr
            };
            
            // Check if clicking own shift
            const savedUser = JSON.parse(localStorage.getItem('currentUser'));
            if (selectedEventData.ownerId === savedUser.id) {
                Swal.fire('นี่คือเวรของคุณ', 'ท่านไม่สามารถขอแลกเวรกับตัวเองได้ค่ะ', 'info');
                return;
            }

            document.getElementById('swapModalText').innerText = 'คุณต้องการส่งคำขอไปปฏิบัติงาน "เวร ' + props.shift + '" แทนคุณ "' + props.nurseName + '" ในวันที่ ' + info.event.startStr + ' ใช่หรือไม่คะ?';
            var myModal = new bootstrap.Modal(document.getElementById('swapConfirmModal'));
            myModal.show();
        }
    });
    calendarInstance.render();

    try {
        const events = await apiCall('getCalendarEvents');
        calendarInstance.addEventSource(events);
    } catch (error) {
        console.error('Error loading events:', error);
    }
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
        
        Swal.fire({
            icon: res.success ? 'success' : 'error',
            title: res.success ? 'สำเร็จ' : 'ขออภัย',
            text: res.message
        });
        
        if (res.success) initCalendar();
    } catch (error) {
        btn.disabled = false;
        btn.innerText = 'ส่งคำขอ';
        Swal.fire('ขออภัย', error.message, 'error');
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
        
        Swal.fire({
            icon: res.success ? 'success' : 'error',
            title: res.success ? 'สำเร็จ' : 'ขออภัย',
            text: res.message
        });
        
        checkIncomingSwapRequests();
        initCalendar();
    } catch (error) {
        btn.disabled = false;
        Swal.fire('ขออภัย', error.message, 'error');
    }

    pendingApproveSwapId = null;
}
