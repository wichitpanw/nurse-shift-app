(function() {
    const pendingSwapsHtml = `
    <div class="container py-3" style="max-width: 600px;">
        <h5 class="fw-bold text-primary mb-3"><i class="fa-solid fa-bell me-2"></i>รายการแลกเวร</h5>
        
        <div class="mb-4">
            <h6 class="fw-bold text-secondary mb-2"><i class="fa-solid fa-inbox me-2"></i>คำขอที่ส่งถึงคุณ (Incoming)</h6>
            <div id="incomingSwapsList" class="list-group shadow-sm" style="border-radius: 12px; overflow: hidden;">
                <div class="text-center py-4 bg-white text-muted">กำลังโหลด...</div>
            </div>
        </div>

        <div class="mb-4">
            <h6 class="fw-bold text-secondary mb-2"><i class="fa-solid fa-paper-plane me-2"></i>คำขอที่คุณส่ง (Outgoing)</h6>
            <div id="outgoingSwapsList" class="list-group shadow-sm" style="border-radius: 12px; overflow: hidden;">
                <div class="text-center py-4 bg-white text-muted">กำลังโหลด...</div>
            </div>
        </div>
    </div>
    `;

    document.getElementById('page-pending').innerHTML = pendingSwapsHtml;
})();

async function loadPendingSwaps() {
    const incomingArea = document.getElementById('incomingSwapsList');
    const outgoingArea = document.getElementById('outgoingSwapsList');
    const badge = document.getElementById('pending-badge');
    
    if (!incomingArea || !outgoingArea) return;
    
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) return;
    const userData = JSON.parse(savedUser);

    try {
        const res = await apiCall('getAllMySwaps', { userEmail: userData.email });
        
        // Render Incoming
        incomingArea.innerHTML = '';
        if (res.incoming.length === 0) {
            incomingArea.innerHTML = '<div class="text-center py-4 bg-white text-muted small">ไม่มีคำขอสลับเวรส่งถึงคุณค่ะ</div>';
        } else {
            let pendingCount = 0;
            res.incoming.forEach(swap => {
                if (swap.status === 'Pending') pendingCount++;
                
                const item = document.createElement('div');
                item.className = 'list-group-item p-3 bg-white border-0 border-bottom';
                
                let statusBadge = '';
                if (swap.status === 'Pending') statusBadge = '<span class="badge bg-warning text-dark">รอคุณยืนยัน</span>';
                else if (swap.status === 'Approved') statusBadge = '<span class="badge bg-success">อนุมัติแล้ว</span>';
                else if (swap.status === 'Rejected') statusBadge = '<span class="badge bg-danger">ปฏิเสธแล้ว</span>';

                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="small">
                            <div class="fw-bold text-dark">${swap.otherName}</div>
                            <div class="text-muted">ขอเข้าเวรแทนวันที่ ${swap.date} (${swap.shift})</div>
                        </div>
                        ${statusBadge}
                    </div>
                `;

                if (swap.status === 'Pending') {
                    const btnGroup = document.createElement('div');
                    btnGroup.className = 'd-flex gap-2 mt-2';
                    btnGroup.innerHTML = `
                        <button class="btn btn-sm btn-success fw-bold flex-grow-1" onclick="handleSwapAction('${swap.swapId}', 'approve')">ยินยอม</button>
                        <button class="btn btn-sm btn-outline-danger fw-bold flex-grow-1" onclick="handleSwapAction('${swap.swapId}', 'reject')">ปฏิเสธ</button>
                    `;
                    item.appendChild(btnGroup);
                }
                
                incomingArea.appendChild(item);
            });
            
            // Update notification badge
            if (pendingCount > 0) {
                badge.innerText = pendingCount;
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        }

        // Render Outgoing
        outgoingArea.innerHTML = '';
        if (res.outgoing.length === 0) {
            outgoingArea.innerHTML = '<div class="text-center py-4 bg-white text-muted small">คุณยังไม่มีการส่งคำขอสลับเวรให้ผู้อื่นค่ะ</div>';
        } else {
            res.outgoing.forEach(swap => {
                const item = document.createElement('div');
                item.className = 'list-group-item p-3 bg-white border-0 border-bottom';
                
                let statusBadge = '';
                if (swap.status === 'Pending') statusBadge = '<span class="badge bg-warning text-dark">รอเพื่อนยืนยัน</span>';
                else if (swap.status === 'Approved') statusBadge = '<span class="badge bg-success">เพื่อนอนุมัติแล้ว</span>';
                else if (swap.status === 'Rejected') statusBadge = '<span class="badge bg-danger">เพื่อนปฏิเสธ</span>';

                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="small">
                            <div class="text-muted">ขอสลับเวรกับคุณ <span class="fw-bold text-dark">${swap.otherName}</span></div>
                            <div class="text-muted">วันที่ ${swap.date} (${swap.shift})</div>
                        </div>
                        ${statusBadge}
                    </div>
                `;
                outgoingArea.appendChild(item);
            });
        }

    } catch (error) {
        console.error('Error loading swaps:', error);
    }
}

async function handleSwapAction(swapId, action) {
    if (!confirm(`คุณต้องการ ${action === 'approve' ? 'ยินยอม' : 'ปฏิเสธ'} คำขอนี้ใช่หรือไม่คะ?`)) return;
    
    try {
        const functionName = action === 'approve' ? 'approveSwap' : 'rejectSwap';
        const res = await apiCall(functionName, { swapId: swapId });
        alert(res.message);
        loadPendingSwaps();
        if (typeof initCalendar === 'function') initCalendar();
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}
