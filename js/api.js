const SUPABASE_URL = 'https://rjkwvdctflyimttybkrk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa3d2ZGN0Zmx5aW10dHlia3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjMxMTIsImV4cCI6MjA5NDU5OTExMn0.9B93rYhGUdySD9_x92huHQmgIKP7iOW2xqQerzNuOcs';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const gas = {
    // ⚡ LOGIN
    checkLogin: async (email, password) => {
        let uEmail = email, uPass = password;
        if (typeof email === 'object' && email !== null) { uEmail = email.email; uPass = email.password; }
        const { data: user, error } = await supabaseClient.from('profiles').select('*').eq('Email', uEmail).eq('Password', uPass).single();
        if (error || !user) return { success: false, message: 'อีเมล หรือ รหัสผ่านไม่ถูกต้องค่ะ' };
        return { success: true, id: user.User_ID, name: user.Name, role: user.Role, email: user.Email, dept: user.Department };
    },

    // ⚡ CALENDAR
    getCalendarEvents: async () => {
        const { data, error } = await supabaseClient.from('schedules').select('Schedule_ID, Date, Shift, profiles(Name, User_ID)');
        if (error) return [];
        return data.map(s => ({
            id: s.Schedule_ID, title: `${s.profiles.Name} (${s.Shift})`, start: s.Date,
            backgroundColor: s.Shift === 'เช้า' ? '#ffc107' : (s.Shift === 'บ่าย' ? '#fd7e14' : '#6f42c1'),
            borderColor: s.Shift === 'เช้า' ? '#ffc107' : (s.Shift === 'บ่าย' ? '#fd7e14' : '#6f42c1'),
            extendedProps: { userId: s.profiles.User_ID, nurseName: s.profiles.Name, shift: s.Shift }
        }));
    },

    // ⚡ MANAGEMENT
    getManagementData: async (data) => {
        const targetDate = typeof data === 'object' ? data.date : data;
        const { data: nurses } = await supabaseClient.from('profiles').select('User_ID, Name, Department, Role').not('Role', 'eq', 'SuperAdmin').eq('Status', 'Active');
        const { data: shifts } = await supabaseClient.from('schedules').select('User_ID, Shift').eq('Date', targetDate);
        const shiftMap = {};
        shifts?.forEach(s => { shiftMap[s.User_ID] = s.Shift; });
        return { nurses: nurses ? nurses.map(n => ({ id: n.User_ID, name: n.Name, dept: n.Department })) : [], shifts: shiftMap };
    },

    saveShift: async (userId, date, shift) => {
        let uId = userId, uDate = date, uShift = shift;
        if (typeof userId === 'object') { uId = userId.userId; uDate = userId.date; uShift = userId.shift; }
        await supabaseClient.from('schedules').delete().eq('User_ID', uId).eq('Date', uDate);
        const { error } = await supabaseClient.from('schedules').insert([{ "Schedule_ID": "SCH-" + new Date().getTime(), "User_ID": uId, "Date": uDate, "Shift": uShift, "Status": "Confirmed" }]);
        return { success: !error };
    },

    deleteShift: async (userId, date) => {
        let uId = userId, uDate = date;
        if (typeof userId === 'object') { uId = userId.userId; uDate = userId.date; }
        const { error } = await supabaseClient.from('schedules').delete().eq('User_ID', uId).eq('Date', uDate);
        return { success: !error };
    },

    getMyPendingSwaps: async (email) => {
        const uEmail = typeof email === 'object' ? email.userEmail : email;
        const { data: me } = await supabaseClient.from('profiles').select('User_ID').eq('Email', uEmail).single();
        if (!me) return [];
        const { data: incoming } = await supabaseClient.from('swaps').select('Swap_ID, Status, schedules(Date, Shift), profiles!Requester_ID(Name)').eq('Owner_ID', me.User_ID).eq('Status', 'Pending');
        return incoming ? incoming.map(s => ({ swapId: s.Swap_ID, requesterName: s.profiles.Name, date: s.schedules.Date, shift: s.schedules.Shift })) : [];
    },

    // ⚡ SWAPS
    createSwapRequest: async (scheduleId, ownerId, requesterEmail) => {
        let sId = scheduleId, oId = ownerId, rEmail = requesterEmail;
        if (typeof scheduleId === 'object') { sId = scheduleId.scheduleId; oId = scheduleId.ownerId; rEmail = scheduleId.requesterEmail; }
        const { data: reqUser } = await supabaseClient.from('profiles').select('User_ID').eq('Email', rEmail).single();
        if (!reqUser || reqUser.User_ID === oId) return { success: false, message: 'ไม่ต้องแลกกับตัวเองน้า' };
        const { error } = await supabaseClient.from('swaps').insert([{ "Swap_ID": "SWAP-" + new Date().getTime(), "Schedule_ID": sId, "Requester_ID": reqUser.User_ID, "Owner_ID": oId, "Status": "Pending" }]);
        return { success: !error, message: error ? error.message : 'ส่งคำขอสำเร็จแล้วค่ะ' };
    },

    getAllMySwaps: async (params) => {
        const email = typeof params === 'object' ? params.userEmail : params;
        const { data: me } = await supabaseClient.from('profiles').select('User_ID').eq('Email', email).single();
        if (!me) return { incoming: [], outgoing: [] };
        const { data: incoming } = await supabaseClient.from('swaps').select('Swap_ID, Status, schedules(Date, Shift), profiles!Requester_ID(Name)').eq('Owner_ID', me.User_ID);
        const { data: outgoing } = await supabaseClient.from('swaps').select('Swap_ID, Status, schedules(Date, Shift), profiles!Owner_ID(Name)').eq('Requester_ID', me.User_ID);
        return {
            incoming: incoming ? incoming.map(s => ({ swapId: s.Swap_ID, status: s.Status, otherName: s.profiles.Name, date: s.schedules.Date, shift: s.schedules.Shift })) : [],
            outgoing: outgoing ? outgoing.map(s => ({ swapId: s.Swap_ID, status: s.Status, otherName: s.profiles.Name, date: s.schedules.Date, shift: s.schedules.Shift })) : []
        };
    },

    approveSwap: async (params) => {
        const swapId = typeof params === 'object' ? params.swapId : params;
        const { data: swap } = await supabaseClient.from('swaps').select('*').eq('Swap_ID', swapId).single();
        if (!swap) return { success: false };
        await supabaseClient.from('schedules').update({ "User_ID": swap.Requester_ID }).eq('Schedule_ID', swap.Schedule_ID);
        await supabaseClient.from('swaps').update({ "Status": 'Approved' }).eq('Swap_ID', swapId);
        return { success: true, message: 'อนุมัติเรียบร้อยค่ะ' };
    },

    rejectSwap: async (params) => {
        const swapId = typeof params === 'object' ? params.swapId : params;
        const { error } = await supabaseClient.from('swaps').update({ "Status": 'Rejected' }).eq('Swap_ID', swapId);
        return { success: !error, message: error ? 'พังค่ะ' : 'ปฏิเสธเรียบร้อยค่ะ' };
    },

    // ⚡ SUMMARY & OPTIMIZATION
    getShiftSummary: async (data) => {
        const { month, year } = data;
        const start = `${year}-${String(month + 1).padStart(2, '0')}-01`, end = `${year}-${String(month + 1).padStart(2, '0')}-31`;
        const { data: nurses } = await supabaseClient.from('profiles').select('User_ID, Name').not('Role', 'eq', 'SuperAdmin');
        const { data: shifts } = await supabaseClient.from('schedules').select('User_ID, Shift').gte('Date', start).lte('Date', end);
        const summaryMap = {};
        nurses?.forEach(n => { summaryMap[n.User_ID] = { id: n.User_ID, name: n.Name, total: 0, morning: 0, afternoon: 0, night: 0 }; });
        shifts?.forEach(s => { if (summaryMap[s.User_ID]) { summaryMap[s.User_ID].total++; if (s.Shift === 'เช้า') summaryMap[s.User_ID].morning++; else if (s.Shift === 'บ่าย') summaryMap[s.User_ID].afternoon++; else if (s.Shift === 'ดึก') summaryMap[s.User_ID].night++; } });
        return Object.values(summaryMap);
    },

    getAllNurses: async () => {
        const { data } = await supabaseClient
            .from('profiles')
            .select('User_ID, Name')
            .eq('Status', 'Active')
            .not('Role', 'in', '("SuperAdmin","Admin")');
        return data ? data.map(n => ({ id: n.User_ID, name: n.Name })) : [];
    },

    getNurseShifts: async (data) => {
        const uId = typeof data === 'object' ? data.userId : data;
        let query = supabaseClient.from('schedules').select('Schedule_ID, Date, Shift').eq('User_ID', uId);
        if (typeof data === 'object' && data.month !== undefined) {
            const start = `${data.year}-${String(data.month + 1).padStart(2, '0')}-01`, end = `${data.year}-${String(data.month + 1).padStart(2, '0')}-31`;
            query = query.gte('Date', start).lte('Date', end);
        }
        const { data: shifts } = await query;
        return shifts ? shifts.map(s => ({ id: s.Schedule_ID, date: s.Date, shift: s.Shift })) : [];
    },

    getMonthShifts: async (data) => {
        const start = `${data.year}-${String(data.month + 1).padStart(2, '0')}-01`, end = `${data.year}-${String(data.month + 1).padStart(2, '0')}-31`;
        const { data: shifts } = await supabaseClient.from('schedules').select('User_ID, Date, Shift').gte('Date', start).lte('Date', end);
        return shifts || [];
    },

    getManageUsersList: async () => {
        const { data } = await supabaseClient.from('profiles').select('*');
        return data?.map(u => ({ id: u.User_ID, name: u.Name, email: u.Email, password: u.Password, role: u.Role, dept: u.Department, status: u.Status })) || [];
    },

    saveUser: async (userData) => {
        const payload = { "User_ID": userData.id || ("USR-" + new Date().getTime()), "Name": userData.name, "Email": userData.email, "Password": userData.password, "Role": userData.role, "Department": userData.dept, "Status": userData.status };
        const { error } = await supabaseClient.from('profiles').upsert(payload, { onConflict: 'User_ID' });
        return { success: !error, message: error ? error.message : 'บันทึกสำเร็จค่ะ' };
    },

    deleteUser: async (userId) => {
        const { error } = await supabaseClient.from('profiles').delete().eq('User_ID', typeof userId === 'object' ? userId.userId : userId);
        return { success: !error, message: error ? error.message : 'ลบข้อมูลสำเร็จค่ะ' };
    }
};

async function apiCall(action, data = {}) {
    if (gas[action]) return await gas[action](data);
    return { success: false, message: 'Action not found' };
}
t gas[action](data);
    return { success: false, message: 'Action not found' };
}
