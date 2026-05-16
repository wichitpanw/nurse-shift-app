(function() {
    const manageUsersHtml = `
    <div class="container py-3" style="max-width: 600px;">
        <div class="card shadow-sm border-0 mb-3" style="border-radius: 15px;">
            <div class="card-body">
                <h5 class="fw-bold text-primary mb-3" id="formTitle"><i
                        class="fa-solid fa-user-plus me-2"></i>เพิ่มบุคคลากรใหม่</h5>
                <form id="userForm" onsubmit="handleSaveUser(event)">
                    <input type="hidden" id="userIdInput">

                    <div class="mb-2">
                        <label class="small text-muted mb-1">ชื่อ-นามสกุล</label>
                        <input type="text" id="userName" class="form-control" placeholder="เช่น พยาบาล สมใจ" required>
                    </div>
                    <div class="mb-2">
                        <label class="small text-muted mb-1">อีเมล (ใช้เป็น Login)</label>
                        <input type="email" id="userEmail" class="form-control" placeholder="name@hospital.com" required>
                    </div>
                    <div class="mb-2">
                        <label class="small text-muted mb-1">รหัสผ่าน</label>
                        <input type="text" id="userPassword" class="form-control" placeholder="ตั้งรหัสผ่านง่าย ๆ" required>
                    </div>
                    <div class="row">
                        <div class="col-6 mb-2">
                            <label class="small text-muted mb-1">สิทธิ์ระบบ (Role)</label>
                            <select id="userRole" class="form-select">
                                <option value="User">User (ดูเวรตัวเอง)</option>
                                <option value="SuperUser">SuperUser (ร่างเวรได้)</option>
                                <option value="Admin">Admin (จัดเวรได้)</option>
                                <option value="SuperAdmin">SuperAdmin (สิทธิ์สูงสุด)</option>
                            </select>
                        </div>
                        <div class="col-6 mb-2">
                            <label class="small text-muted mb-1">สถานะ</label>
                            <select id="userStatus" class="form-select">
                                <option value="Active">Active (เปิดใช้)</option>
                                <option value="Inactive">Inactive (ปิดใช้งาน)</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="small text-muted mb-1">ตึก/หน่วยงาน</label>
                        <input type="text" id="userDept" class="form-control" value="วอร์ดศัลยกรรม">
                    </div>

                    <button type="submit" id="btnSaveUser" class="btn btn-primary w-100 fw-bold small mb-2"
                        style="border-radius: 8px;">บันทึกข้อมูล</button>
                    <button type="button" id="btnCancelEdit" class="btn btn-light w-100 small d-none"
                        onclick="resetUserForm()" style="border-radius: 8px;">ยกเลิกการแก้ไข</button>
                </form>
            </div>
        </div>

        <div class="card shadow-sm border-0" style="border-radius: 15px;">
            <div class="card-body p-2">
                <h6 class="fw-bold text-secondary p-2 border-bottom mb-0">👥 รายชื่อบุคคลากรทั้งหมด</h6>
                <div id="usersListArea">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary spinner-border-sm"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    document.getElementById('page-users').innerHTML = manageUsersHtml;
})();

async function loadManageUsers() {
    var area = document.getElementById('usersListArea');
    if (!area) return;
    area.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm"></div></div>';

    try {
        const users = await gas.getManageUsersList();
        area.innerHTML = '';
        users.forEach(function (u) {
            var item = document.createElement('div');
            item.className = 'p-3 border-bottom d-flex justify-content-between align-items-center bg-white';

            var badgeColor = u.status === 'Active' ? 'bg-success' : 'bg-danger';
            var roleBadge = 'bg-light text-dark border';
            if (u.role === 'SuperAdmin') roleBadge = 'bg-primary text-white';
            if (u.role === 'Admin') roleBadge = 'bg-info text-white';

            item.innerHTML = `<div>
                <span class="fw-bold text-dark d-block">${u.name} <span class="badge ${badgeColor}" style="font-size:9px;">${u.status}</span></span>
                <small class="text-muted d-block" style="font-size:11px;">${u.email} | สิทธิ์: <span class="badge ${roleBadge}">${u.role}</span></small>
                </div>
                <div>
                <button class="btn btn-sm btn-outline-primary me-1" id="edit-btn-${u.id}"><i class="fa-solid fa-user-pen"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="handleDeleteUser('${u.id}')"><i class="fa-solid fa-user-xmark"></i></button>
                </div>`;
            area.appendChild(item);
            
            // Add click listener to the edit button to avoid JSON stringify escaping issues
            document.getElementById(`edit-btn-${u.id}`).addEventListener('click', function() {
                editUserField(u);
            });
        });
    } catch (error) {
        area.innerHTML = '<div class="text-center py-4 text-danger small">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
    }
}

async function handleSaveUser(event) {
    event.preventDefault();
    var btn = document.getElementById('btnSaveUser');
    btn.disabled = true;

    var userData = {
        action: 'saveUser',
        id: document.getElementById('userIdInput').value,
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        role: document.getElementById('userRole').value,
        status: document.getElementById('userStatus').value,
        dept: document.getElementById('userDept').value
    };

    try {
        const res = await gas.saveUser(userData);
        alert(res.message || 'บันทึกสำเร็จ');
        btn.disabled = false;
        resetUserForm();
        loadManageUsers();
        if (typeof loadNursesForManage === 'function') loadNursesForManage();
    } catch (error) {
        alert('บันทึกไม่สำเร็จ: ' + error.message);
        btn.disabled = false;
    }
}

function editUserField(u) {
    document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-pen me-2"></i>แก้ไขข้อมูลบุคคลากร';
    document.getElementById('userIdInput').value = u.id;
    document.getElementById('userName').value = u.name;
    document.getElementById('userEmail').value = u.email;
    document.getElementById('userPassword').value = u.password;
    document.getElementById('userRole').value = u.role;
    document.getElementById('userStatus').value = u.status;
    document.getElementById('userDept').value = u.dept || 'วอร์ดศัลยกรรม';

    document.getElementById('btnCancelEdit').classList.remove('d-none');
    document.getElementById('btnSaveUser').innerText = 'บันทึกการแก้ไข';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleDeleteUser(userId) {
    if (confirm('คุณต้องการปิดการใช้งานและลบบุคคลากรท่านนี้ออกจากระบบใช่หรือไม่คะ?')) {
        try {
            const res = await gas.deleteUser(userId);
            alert(res.message || 'ลบสำเร็จ');
            loadManageUsers();
        } catch (error) {
            alert('ลบไม่สำเร็จ: ' + error.message);
        }
    }
}

function resetUserForm() {
    document.getElementById('userForm').reset();
    document.getElementById('userIdInput').value = '';
    document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-user-plus me-2"></i>เพิ่มบุคคลากรใหม่';
    document.getElementById('btnCancelEdit').classList.add('d-none');
    document.getElementById('btnSaveUser').innerText = 'บันทึกข้อมูล';
}
