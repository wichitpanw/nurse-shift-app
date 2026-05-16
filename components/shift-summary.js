(function() {
    const shiftSummaryHtml = `
    <div class="container py-3" style="max-width: 600px;">
        <h5 class="fw-bold text-primary mb-3"><i class="fa-solid fa-chart-pie me-2"></i>สรุปภาระงาน (Workload)</h5>
        
        <div class="card shadow-sm border-0 mb-3" style="border-radius: 15px;">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0" style="font-size: 13px;">
                        <thead class="bg-light">
                            <tr>
                                <th class="ps-3">ชื่อพยาบาล</th>
                                <th class="text-center">เช้า</th>
                                <th class="text-center">บ่าย</th>
                                <th class="text-center">ดึก</th>
                                <th class="text-center pe-3">รวม</th>
                            </tr>
                        </thead>
                        <tbody id="summaryTableBody">
                            <tr>
                                <td colspan="5" class="text-center py-4 text-muted">กำลังโหลดข้อมูล...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="alert alert-info border-0 shadow-sm small" style="border-radius: 12px;">
            <i class="fa-solid fa-circle-info me-2"></i>ข้อมูลนี้สรุปจากตารางเวรทั้งหมดที่มีในระบบ เพื่อช่วยให้บริหารจัดการภาระงานได้อย่างทั่วถึงค่ะ
        </div>
    </div>
    `;

    document.getElementById('page-summary').innerHTML = shiftSummaryHtml;
})();

async function loadShiftSummary() {
    const tableBody = document.getElementById('summaryTableBody');
    if (!tableBody) return;

    try {
        const data = await apiCall('getShiftSummary');
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">ไม่พบข้อมูลเวรในระบบค่ะ</td></tr>';
            return;
        }

        // Sort by total shifts descending
        data.sort((a, b) => b.total - a.total);

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="ps-3 fw-bold text-dark">${item.name}</td>
                <td class="text-center"><span class="badge bg-warning text-dark" style="min-width: 25px;">${item.morning}</span></td>
                <td class="text-center"><span class="badge bg-orange text-white" style="background-color: #fd7e14; min-width: 25px;">${item.afternoon}</span></td>
                <td class="text-center"><span class="badge bg-purple text-white" style="background-color: #6f42c1; min-width: 25px;">${item.night}</span></td>
                <td class="text-center"><span class="badge bg-primary" style="min-width: 30px; font-size: 11px;">${item.total}</span></td>
                <td class="text-center pe-3">
                    <button class="btn btn-sm btn-outline-primary p-1" style="font-size: 10px;" onclick="openQuickSwap('${item.id}', '${item.name}')">
                        <i class="fa-solid fa-right-left"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading summary:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    }
}

// Global modal for quick swap (added dynamically)
if (!document.getElementById('quickSwapModal')) {
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = `
    <div class="modal fade" id="quickSwapModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm p-3">
            <div class="modal-content" style="border-radius: 15px; border: none;">
                <div class="modal-body p-4">
                    <h6 class="fw-bold mb-3 text-center">เลือกเวรของคุณ <span id="quickSwapTargetName" class="text-primary"></span></h6>
                    <div id="quickSwapList" class="list-group list-group-flush small overflow-auto" style="max-height: 300px;">
                        <div class="text-center py-3">กำลังโหลดเวร...</div>
                    </div>
                    <button type="button" class="btn btn-light w-100 mt-3 small fw-bold" data-bs-dismiss="modal">ปิด</button>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.appendChild(modalDiv);
}

async function openQuickSwap(userId, nurseName) {
    document.getElementById('quickSwapTargetName').innerText = nurseName;
    const listArea = document.getElementById('quickSwapList');
    listArea.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>';
    
    const myModal = new bootstrap.Modal(document.getElementById('quickSwapModal'));
    myModal.show();

    try {
        const events = await gas.getCalendarEvents();
        const targets = events.filter(ev => ev.extendedProps.userId === userId && ev.extendedProps.status !== 'Swap Requested');
        
        listArea.innerHTML = '';
        if (targets.length === 0) {
            listArea.innerHTML = '<div class="text-center py-3 text-muted">ไม่พบเวรที่สามารถแลกได้ค่ะ</div>';
            return;
        }

        targets.forEach(ev => {
            const btn = document.createElement('button');
            btn.className = 'list-group-item list-group-item-action py-2';
            btn.innerHTML = `<strong>${ev.start}</strong> (${ev.extendedProps.shift})`;
            btn.onclick = () => confirmQuickSwap(ev.id, userId, nurseName, ev.start, ev.extendedProps.shift);
            listArea.appendChild(btn);
        });
    } catch (error) {
        listArea.innerHTML = '<div class="text-center py-3 text-danger">เกิดข้อผิดพลาด</div>';
    }
}

async function confirmQuickSwap(schId, ownerId, name, date, shift) {
    if (!confirm(`ยืนยันการส่งคำขอสลับเวรกับคุณ ${name}\\nวันที่ ${date} (${shift}) ใช่หรือไม่คะ?`)) return;
    
    try {
        const savedUser = JSON.parse(localStorage.getItem('currentUser'));
        const res = await gas.createSwapRequest(schId, ownerId, savedUser.email);
        alert(res.message);
        bootstrap.Modal.getInstance(document.getElementById('quickSwapModal')).hide();
        loadShiftSummary();
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}
