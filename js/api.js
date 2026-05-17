const SUPABASE_URL = 'https://rjkwvdctflyimttybkrk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa3d2ZGN0Zmx5aW10dHlia3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjMxMTIsImV4cCI6MjA5NDU5OTExMn0.9B93rYhGUdySD9_x92huHQmgIKP7iOW2xqQerzNuOcs';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const gas = {
    // ⚡ LOGIN
    checkLogin: async (data) => {
        const { email, password } = data;
        const { data: user, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('Email', email)
            .eq('Password', password)
            .single();

        if (error || !user) return { success: false, message: 'อีเมล หรือ รหัสผ่านไม่ถูกต้องค่ะ' };
        
        return { 
            success: true, 
            id: user.User_ID, 
            name: user.Name, 
            role: user.Role, 
            email: user.Email,
            dept: user.Department
        };
    },

    // ⚡ CALENDAR
    getCalendarEvents: async () => {
        const { data, error } = await supabaseClient
            .from('schedules')
            .select('Schedule_ID, Date, Shift, profiles(Name, User_ID)');
        
        if (error) return [];

        return data.map(s => ({
            id: s.Schedule_ID,
            title: `${s.profiles.Name} (${s.Shift})`,
            start: s.Date,
            backgroundColor: s.Shift === 'เช้า' ? '#ffc107' : (s.Shift === 'บ่าย' ? '#fd7e14' : '#6f42c1'),
            borderColor: s.Shift === 'เช้า' ? '#ffc107' : (s.Shift === 'บ่าย' ? '#fd7e14' : '#6f42c1'),
            extendedProps: { 
                userId: s.profiles.User_ID, 
                nurseName: s.profiles.Name, 
                shift: s.Shift
            }
        }));
    },

    // ⚡ MANAGEMENT
    getManagementData: async (data) => {
        const { data: nurses } = await supabaseClient
            .from('profiles')
            .select('User_ID, Name, Department, Role')
            .not('Role', 'eq', 'SuperAdmin')
            .eq('Status', 'Active');
        
        const { data: shifts } = await supabaseClient
            .from('schedules')
            .select('User_ID, Shift')
            .eq('Date', data.date);
        
        const shiftMap = {};
        shifts?.forEach(s => { shiftMap[s.User_ID] = s.Shift; });

        return { 
            nurses: nurses ? nurses.map(n => ({ id: n.User_ID, name: n.Name, dept: n.Department })) : [], 
            shifts: shiftMap 
        };
    },

    saveShift: async (data) => {
        const { userId, date, shift } = data;
        // Delete existing for that person on that day
        await supabaseClient.from('schedules').delete().eq('User_ID', userId).eq('Date', date);
        // Insert new with custom Schedule_ID
        const scheduleId = "SCH-" + new Date().getTime();
        const { error } = await supabaseClient.from('schedules').insert([
            { "Schedule_ID": scheduleId, "User_ID": userId, "Date": date, "Shift": shift, "Status": "Confirmed" }
        ]);
        return { success: !error };
    },

    deleteShift: async (data) => {
        const { error } = await supabaseClient.from('schedules').delete().eq('User_ID', data.userId).eq('Date', data.date);
        return { success: !error };
    },

    // ⚡ SWAPS
    createSwapRequest: async (scheduleId, ownerId, requesterEmail) => {
        const { data: reqUser } = await supabaseClient.from('profiles').select('User_ID').eq('Email', requesterEmail).single();
        if (reqUser.User_ID === ownerId) return { success: false, message: 'ไม่ต้องแลกกับตัวเองน้า' };

        const swapId = "SWAP-" + new Date().getTime();
        const { error } = await supabaseClient.from('swaps').insert([
            { "Swap_ID": swapId, "Schedule_ID": scheduleId, "Requester_ID": reqUser.User_ID, "Owner_ID": ownerId, "Status": "Pending" }
        ]);
        return { success: !error, message: error ? error.message : 'ส่งคำขอสำเร็จแล้วค่ะ' };
    },

    getAllMySwaps: async (params) => {
        const { userEmail } = params;
        const { data: me } = await supabaseClient.from('profiles').select('User_ID').eq('Email', userEmail).single();
        if (!me) return { incoming: [], outgoing: [] };

        const { data: incoming } = await supabaseClient
            .from('swaps')
            .select('Swap_ID, Status, schedules(Date, Shift), profiles!Requester_ID(Name)')
            .eq('Owner_ID', me.User_ID);

        const { data: outgoing } = await supabaseClient
            .from('swaps')
            .select('Swap_ID, Status, schedules(Date, Shift), profiles!Owner_ID(Name)')
            .eq('Requester_ID', me.User_ID);

        return {
            incoming: incoming ? incoming.map(s => ({
                swapId: s.Swap_ID,
                status: s.Status,
                otherName: s.profiles.Name,
                date: s.schedules.Date,
                shift: s.schedules.Shift
            })) : [],
            outgoing: outgoing ? outgoing.map(s => ({
                swapId: s.Swap_ID,
                status: s.Status,
                otherName: s.profiles.Name,
                date: s.schedules.Date,
                shift: s.schedules.Shift
            })) : []
        };
    },

    approveSwap: async (params) => {
        const { swapId } = params;
        const { data: swap } = await supabaseClient.from('swaps').select('*').eq('Swap_ID', swapId).single();
        if (!swap) return { success: false };

        // Update schedule owner
        await supabaseClient.from('schedules').update({ "User_ID": swap.Requester_ID }).eq('Schedule_ID', swap.Schedule_ID);
        // Update swap status
        await supabaseClient.from('swaps').update({ "Status": 'Approved' }).eq('Swap_ID', swapId);
        return { success: true, message: 'อนุมัติเรียบร้อยค่ะ' };
    },

    rejectSwap: async (params) => {
        const { swapId } = params;
        const { error } = await supabaseClient.from('swaps').update({ "Status": 'Rejected' }).eq('Swap_ID', swapId);
        return { success: !error, message: error ? 'พังค่ะ' : 'ปฏิเสธเรียบร้อยค่ะ' };
    },

    // ⚡ SUMMARY
    getShiftSummary: async (data) => {
        const { month, year } = data;
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const { data: nurses } = await supabaseClient.from('profiles').select('User_ID, Name').not('Role', 'eq', 'SuperAdmin');
        const { data: shifts } = await supabaseClient.from('schedules').select('User_ID, Shift').gte('Date', startDate).lte('Date', endDate);

        const summaryMap = {};
        nurses?.forEach(n => {
            summaryMap[n.User_ID] = { id: n.User_ID, name: n.Name, total: 0, morning: 0, afternoon: 0, night: 0 };
        });

        shifts?.forEach(s => {
            if (summaryMap[s.User_ID]) {
                summaryMap[s.User_ID].total++;
                if (s.Shift === 'เช้า') summaryMap[s.User_ID].morning++;
                else if (s.Shift === 'บ่าย') summaryMap[s.User_ID].afternoon++;
                else if (s.Shift === 'ดึก') summaryMap[s.User_ID].night++;
            }
        });

        return Object.values(summaryMap);
    },

    getAllNurses: async () => {
        const { data } = await supabaseClient.from('profiles').select('User_ID, Name').eq('Status', 'Active').not('Role', 'eq', 'SuperAdmin');
        return data ? data.map(n => ({ id: n.User_ID, name: n.Name })) : [];
    },

    getNurseShifts: async (data) => {
        const { data: shifts } = await supabaseClient.from('schedules').select('Schedule_ID, Date, Shift').eq('User_ID', data.userId);
        return shifts ? shifts.map(s => ({ id: s.Schedule_ID, date: s.Date, shift: s.Shift })) : [];
    }
};

async function apiCall(action, data = {}) {
    if (gas[action]) return await gas[action](data);
    console.error('Unknown action:', action);
    return { success: false, message: 'Action not found' };
}
