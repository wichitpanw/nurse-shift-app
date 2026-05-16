(function() {
    const loginHtml = `
    <div class="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
        <div class="card shadow-sm p-4" style="width: 100%; max-width: 400px; border-radius: 15px;">
            <div class="text-center mb-4">
                <h4 class="fw-bold text-primary">Time Management</h4>
                <p class="text-muted small">ระบบจัดตารางเวรพยาบาล รองรับมือถือ</p>
            </div>

            <form id="loginForm" onsubmit="handleLoginSubmit(event)">
                <div class="mb-3">
                    <label for="email" class="form-label small">อีเมลโรงพยาบาล</label>
                    <input type="email" class="form-control" id="email" placeholder="name@hospital.com" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label small">รหัสผ่าน</label>
                    <input type="password" class="form-control" id="password" placeholder="••••••••" required>
                </div>

                <div id="alertMsg" class="alert alert-danger d-none small p-2" role="alert"></div>

                <button type="submit" id="btnLogin" class="btn btn-primary w-100 fw-bold py-2 mt-2"
                    style="border-radius: 8px;">
                    เข้าสู่ระบบ
                </button>
            </form>

            <div class="mt-4 p-3 bg-light border border-info" style="border-radius: 12px;">
                <div class="small fw-bold text-info mb-1"><i class="fa-solid fa-flask me-1"></i> สำหรับทดลองใช้งาน (Beta)</div>
                <div class="small text-muted">คุณบีมสามารถใช้บัญชีนี้ทดสอบระบบได้เลยค่ะ:</div>
                <div class="small mt-2"><strong>อีเมล:</strong> test@test.com</div>
                <div class="small"><strong>รหัสผ่าน:</strong> test</div>
                <div class="text-center mt-1" style="font-size: 10px; color: #aaa;">*ข้อมูลจริงจะแสดงเมื่อเปิดใช้งานระบบจริงค่ะ*</div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="welcomeModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm p-3">
            <div class="modal-content" style="border-radius: 15px; border: none;">
                <div class="modal-body text-center p-4">
                    <div class="text-success mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor"
                            class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                            <path
                                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                        </svg>
                    </div>
                    <h5 class="fw-bold mb-1" id="welcomeName">ยินดีต้อนรับ</h5>
                    <p class="text-muted small mb-3" id="welcomeRole">ระดับสิทธิ์: </p>
                    <button type="button" class="btn btn-primary w-100 fw-bold small" style="border-radius: 8px;"
                        onclick="goToMainPage()">
                        ตกลง
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;

    document.getElementById('page-login').innerHTML = loginHtml;
})();

var currentUserData = null;

async function handleLoginSubmit(event) {
    event.preventDefault();

    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    var btn = document.getElementById('btnLogin');
    var alertMsg = document.getElementById('alertMsg');

    btn.disabled = true;
    btn.innerText = 'กำลังตรวจสอบข้อมูล...';
    alertMsg.classList.add('d-none');

    try {
        const response = await gas.checkLogin(email, password);
        if (response.success) {
            btn.innerText = 'เข้าสู่ระบบสำเร็จ';
            currentUserData = response;

            document.getElementById('welcomeName').innerText = 'ยินดีต้อนรับคุณ ' + response.name;
            document.getElementById('welcomeRole').innerText = 'ระดับสิทธิ์: ' + response.role;

            var myModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
            myModal.show();
        } else {
            alertMsg.innerText = response.message;
            alertMsg.classList.remove('d-none');
            btn.disabled = false;
            btn.innerText = 'เข้าสู่ระบบ';
        }
    } catch (error) {
        alertMsg.innerText = 'เกิดข้อผิดพลาด: ' + error.message;
        alertMsg.classList.remove('d-none');
        btn.disabled = false;
        btn.innerText = 'เข้าสู่ระบบ';
    }
}

function goToMainPage() {
    var modalElement = document.getElementById('welcomeModal');
    var modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
    loginSuccess(currentUserData);
}
