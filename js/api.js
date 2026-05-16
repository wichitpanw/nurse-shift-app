const API_URL = 'https://script.google.com/macros/s/AKfycbxReQDcGFRa1ID_jK4iQCf6wjmI05PChplruetgT_OAbthsEw2jIHWwEWw5q57vjbpAHw/exec'; // ใส่ URL ที่ได้จากการ Deploy Web App นะคะ

async function apiCall(action, data = {}) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action, ...data }),
            // Note: fetch to Apps Script needs to handle redirects manually if not using mode: 'cors'
            // but for POST with body, standard fetch is usually okay if the server returns JSON correctly.
            // However, Apps Script's CORS can be tricky. Using a library or specific headers might be needed.
        });

        // Google Apps Script redirect logic (if needed for some environments)
        // Standard fetch usually handles the 302 redirect from doPost if configured correctly on GAS side.

        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
}

// Helper to use in place of google.script.run
const googleScriptRun = {
    withSuccessHandler: function (callback) {
        this.successHandler = callback;
        return this;
    },
    withFailureHandler: function (callback) {
        this.failureHandler = callback;
        return this;
    },
    // Dynamically handle function calls
    _call: async function (functionName, ...args) {
        try {
            // Map function names to API actions if they differ, or just use as is
            const res = await apiCall(functionName, args[0] && typeof args[0] === 'object' ? args[0] : { data: args });
            if (this.successHandler) this.successHandler(res);
        } catch (err) {
            if (this.failureHandler) this.failureHandler(err);
        }
    }
};

// Map original function calls to the new _call structure
const gas = {
    checkLogin: (email, password) => apiCall('checkLogin', { email, password }),
    getCalendarEvents: () => apiCall('getCalendarEvents'),
    getAllNurses: () => apiCall('getAllNurses'),
    saveShift: (userId, date, shift) => apiCall('saveShift', { userId, date, shift }),
    deleteShift: (userId, date) => apiCall('deleteShift', { userId, date }),
    createSwapRequest: (scheduleId, ownerId, requesterEmail) => apiCall('createSwapRequest', { scheduleId, ownerId, requesterEmail }),
    getMyPendingSwaps: (userEmail) => apiCall('getMyPendingSwaps', { userEmail }),
    approveSwap: (swapId) => apiCall('approveSwap', { swapId }),
    getManageUsersList: () => apiCall('getManageUsersList'),
    saveUser: (userData) => apiCall('saveUser', userData),
    deleteUser: (userId) => apiCall('deleteUser', { userId })
};
