const SUPABASE_URL = 'https://rjkwvdctflyimttybkrk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa3d2ZGN0Zmx5aW10dHlia3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjMxMTIsImV4cCI6MjA5NDU5OTExMn0.9B93rYhGUdySD9_x92huHQmgIKP7iOW2xqQerzNuOcs';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const gas = {
    checkLogin: async (data) => {
        const { email, password } = data;
        const { data: user, error } = await supabaseClient.from('profiles').select('*').eq('email', email).eq('password', password).single();
        if (error || !user) return { success: false, message: 'อีเมล หรือ รหัสผ่านไม่ถูกต้องค่ะ' };
        return { success: true, name: user.full_name, role: user.role, email: user.email, id: user.id };
    },
    getCalendarEvents: async () => {
        const { data, error } = await supabaseClient.from('schedules').select('id, shift_date, shift_type, profiles(full_name, id)');
        if (error) return [];
        return data.map(s => ({
            id: s.id, title: s.profiles.full_name + " (" + s.shift_type + ")", start: s.shift_date,
            backgroundColor: s.shift_type === "เช้า" ? "#ffc107" : (s.shift_type === "บ่าย" ? "#fd7e14" : "#6f42c1"),
            borderColor: s.shift_type === "เช้า" ? "#ffc107" : (s.shift_type === "บ่าย" ? "#fd7e14" : "#6f42c1"),
            extendedProps: { userId: s.profiles.id, nurseName: s.profiles.full_name, shift: s.shift_type }
        }));
    },
    getManagementData: async (data) => {
        const { data: nurses } = await supabaseClient.from('profiles').select('id, full_name, dept').eq('status', 'Active').not('role', 'eq', 'SuperAdmin');
        const { data: shifts } = await supabaseClient.from('schedules').select('user_id, shift_type').eq('shift_date', data.date);
        const shiftMap = {};
        shifts?.forEach(s => { shiftMap[s.user_id] = s.shift_type; });
        return { nurses: nurses || [], shifts: shiftMap };
    },
    saveShift: async (data) => {
        const { userId, date, shift } = data;
        await supabaseClient.from('schedules').delete().eq('user_id', userId).eq('shift_date', date);
        const { error } = await supabaseClient.from('schedules').insert([{ user_id: userId, shift_date: date, shift_type: shift }]);
        return { success: !error };
    },
    deleteShift: async (data) => {
        const { error } = await supabaseClient.from('schedules').delete().eq('user_id', data.userId).eq('shift_date', data.date);
        return { success: !error };
    },
    getShiftSummary: async (data) => {
        const { month, year } = data;
        const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const end = `${year}-${String(month + 1).padStart(2, '0')}-31`;
        const { data: nurses } = await supabaseClient.from('profiles').select('id, full_name').not('role', 'eq', 'SuperAdmin');
        const { data: shifts } = await supabaseClient.from('schedules').select('user_id, shift_type').gte('shift_date', start).lte('shift_date', end);
        const summary = {};
        nurses?.forEach(n => { summary[n.id] = { id: n.id, name: n.full_name, total: 0, morning: 0, afternoon: 0, night: 0 }; });
        shifts?.forEach(s => {
            if (summary[s.user_id]) {
                summary[s.user_id].total++;
                if (s.shift_type === 'เช้า') summary[s.user_id].morning++;
                else if (s.shift_type === 'บ่าย') summary[s.user_id].afternoon++;
                else if (s.shift_type === 'ดึก') summary[s.user_id].night++;
            }
        });
        return Object.values(summary);
    },
    getAllNurses: async () => {
        const { data } = await supabaseClient.from('profiles').select('id, full_name').eq('status', 'Active').not('role', 'eq', 'SuperAdmin');
        return data ? data.map(n => ({ id: n.id, name: n.full_name })) : [];
    },
    getNurseShifts: async (data) => {
        const { data: shifts } = await supabaseClient.from('schedules').select('id, shift_date, shift_type').eq('user_id', data.userId);
        return shifts ? shifts.map(s => ({ id: s.id, date: s.shift_date, shift: s.shift_type })) : [];
    }
};

async function apiCall(action, data = {}) {
    if (gas[action]) return await gas[action](data);
    return { success: false, message: 'Action not found' };
}
