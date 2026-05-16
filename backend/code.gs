function doPost(e) {
  var action, data;
  try {
    var contents = JSON.parse(e.postData.contents);
    action = contents.action;
    data = contents;
  } catch (err) {
    action = e.parameter.action;
    data = e.parameter;
  }
  
  var response;
  
  try {
    switch (action) {
      case 'checkLogin':
        response = checkLogin(data.email, data.password);
        break;
      case 'getCalendarEvents':
        response = getCalendarEvents();
        break;
      case 'getAllNurses':
        response = getAllNurses();
        break;
      case 'saveShift':
        response = saveShift(data.userId, data.date, data.shift);
        break;
      case 'deleteShift':
        response = deleteShift(data.userId, data.date);
        break;
      case 'createSwapRequest':
        response = createSwapRequest(data.scheduleId, data.ownerId, data.requesterEmail);
        break;
      case 'getMyPendingSwaps':
        response = getMyPendingSwaps(data.userEmail);
        break;
      case 'getAllMySwaps':
        response = getAllMySwaps(data.userEmail);
        break;
      case 'approveSwap':
        response = approveSwap(data.swapId);
        break;
      case 'rejectSwap':
        response = rejectSwap(data.swapId);
        break;
      case 'getManageUsersList':
        response = getManageUsersList();
        break;
      case 'saveUser':
        response = saveUser(data);
        break;
      case 'deleteUser':
        response = deleteUser(data.userId);
        break;
      case 'getShiftSummary': // New action
        response = getShiftSummary();
        break;
      default:
        response = { success: false, message: "Unknown action: " + action };
    }
  } catch (err) {
    response = { success: false, message: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "running", message: "Nurse Shift API is active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// === เดิมจาก code.gs ===

function checkLogin(email, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("tb_users");
  if (!userSheet) return { success: false, message: "ไม่พบตาราง tb_users ในระบบค่ะ" };
  var data = userSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var dbEmail = data[i][2].toString().trim().toLowerCase();
    var dbPassword = data[i][3].toString().trim();
    var dbName = data[i][1].toString();
    var dbRole = data[i][4].toString();
    if (dbEmail === email.trim().toLowerCase() && dbPassword === password) {
      return { success: true, message: "เข้าสู่ระบบสำเร็จ", name: dbName, role: dbRole, email: dbEmail };
    }
  }
  return { success: false, message: "อีเมล หรือ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้งค่ะ" };
}

function getCalendarEvents() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scheduleSheet = ss.getSheetByName("tb_schedules");
  var userSheet = ss.getSheetByName("tb_users");
  if (!scheduleSheet || !userSheet) return [];
  var scheduleData = scheduleSheet.getDataRange().getValues();
  var userData = userSheet.getDataRange().getValues();
  var userMap = {};
  for (var i = 1; i < userData.length; i++) {
    userMap[userData[i][0].toString()] = userData[i][1].toString();
  }
  var events = [];
  for (var j = 1; j < scheduleData.length; j++) {
    var schId = scheduleData[j][0].toString();
    var userId = scheduleData[j][1].toString();
    var nurseName = userMap[userId] || "ไม่ระบุชื่อ";
    var shiftDate = scheduleData[j][2];
    var shiftType = scheduleData[j][3].toString();
    var status = scheduleData[j][4].toString();
    if (!shiftDate) continue;
    var formattedDate = Utilities.formatDate(new Date(shiftDate), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
    var eventColor = "#0d6efd"; 
    if (shiftType === "เช้า") eventColor = "#ffc107"; 
    if (shiftType === "บ่าย") eventColor = "#fd7e14"; 
    if (shiftType === "ดึก") eventColor = "#6f42c1";  
    events.push({
      id: schId,
      title: nurseName + " (" + shiftType + ")",
      start: formattedDate,
      backgroundColor: eventColor,
      borderColor: eventColor,
      extendedProps: { userId: userId, nurseName: nurseName, shift: shiftType, status: status }
    });
  }
  return events;
}

function getAllNurses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("tb_users");
  if (!userSheet) return [];
  var data = userSheet.getDataRange().getValues();
  var nurses = [];
  for (var i = 1; i < data.length; i++) {
    if(data[i][6].toString().trim().toLowerCase() === "active") {
      nurses.push({ id: data[i][0].toString(), name: data[i][1].toString() });
    }
  }
  return nurses;
}

function saveShift(userId, date, shift) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("tb_schedules");
    if (!sheet) return { success: false, message: "ไม่พบตาราง tb_schedules ค่ะ" };
    deleteShift(userId, date);
    var scheduleId = "SCH-" + new Date().getTime();
    sheet.appendRow([scheduleId, userId, new Date(date), shift, "Confirmed"]);
    return { success: true };
  } catch(e) { return { success: false, message: e.message }; }
}

function deleteShift(userId, date) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("tb_schedules");
    if (!sheet) return { success: false, message: "ไม่พบตาราง" };
    var data = sheet.getDataRange().getValues();
    var targetDateStr = Utilities.formatDate(new Date(date), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][1] == undefined || data[i][2] == undefined) continue;
      var rowDateStr = Utilities.formatDate(new Date(data[i][2]), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      if (data[i][1].toString() === userId && rowDateStr === targetDateStr) {
        sheet.deleteRow(i + 1);
      }
    }
    return { success: true };
  } catch(e) { return { success: false }; }
}

function createSwapRequest(scheduleId, ownerId, requesterEmail) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("tb_users");
  var swapSheet = ss.getSheetByName("tb_swaps");
  if (!swapSheet) return { success: false, message: "ไม่พบตาราง tb_swaps" };
  var userData = userSheet.getDataRange().getValues();
  var requesterId = "";
  for(var i=1; i<userData.length; i++) {
    if(userData[i][2].toString().trim().toLowerCase() === requesterEmail.trim().toLowerCase()) {
      requesterId = userData[i][0].toString();
      break;
    }
  }
  if(!requesterId) return { success: false, message: "ไม่พบข้อมูลผู้ส่งคำขอค่ะ" };
  
  // ⚡ Block self-swap
  if(requesterId === ownerId) {
    return { success: false, message: "นี่คือเวรของคุณอยู่แล้วนะคะ ไม่ต้องส่งคำขอแลกกับตัวเองน้า" };
  }
  
  // Check for existing pending request
  var swapData = swapSheet.getDataRange().getValues();
  for(var k=1; k<swapData.length; k++) {
    if(swapData[k][1].toString() === scheduleId && swapData[k][2].toString() === requesterId && swapData[k][4].toString() === "Pending") {
       return { success: false, message: "คุณส่งคำขอสำหรับเวรนี้ไปแล้วนะคะ รอเพื่อนตอบกลับก่อนน้า" };
    }
  }

  var swapId = "SWAP-" + new Date().getTime();
  swapSheet.appendRow([swapId, scheduleId, requesterId, ownerId, "Pending"]);
  return { success: true, message: "ส่งคำขอเข้าเวรแทนสำเร็จแล้วค่ะ" };
}

function getMyPendingSwaps(userEmail) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("tb_users");
  var swapSheet = ss.getSheetByName("tb_swaps");
  var scheduleSheet = ss.getSheetByName("tb_schedules");
  if (!swapSheet || !scheduleSheet) return [];
  var userData = userSheet.getDataRange().getValues();
  var swapData = swapSheet.getDataRange().getValues();
  var scheduleData = scheduleSheet.getDataRange().getValues();
  var myId = "";
  var userMap = {}; 
  for(var i=1; i<userData.length; i++) {
    userMap[userData[i][0].toString()] = userData[i][1].toString();
    if(userData[i][2].toString().trim().toLowerCase() === userEmail.trim().toLowerCase()) {
      myId = userData[i][0].toString();
    }
  }
  var scheduleMap = {};
  for(var k=1; k<scheduleData.length; k++) {
    scheduleMap[scheduleData[k][0].toString()] = {
      date: Utilities.formatDate(new Date(scheduleData[k][2]), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd"),
      shift: scheduleData[k][3].toString()
    };
  }
  var myRequests = [];
  for(var j=1; j<swapData.length; j++) {
    if(swapData[j][3].toString() === myId && swapData[j][4].toString() === "Pending") {
      var schId = swapData[j][1].toString();
      var schInfo = scheduleMap[schId] || { date: "ไม่ระบุ", shift: "ไม่ระบุ" };
      myRequests.push({
        swapId: swapData[j][0].toString(),
        scheduleId: schId,
        requesterName: userMap[swapData[j][2].toString()] || "บุคคลากรภายนอก",
        date: schInfo.date,
        shift: schInfo.shift
      });
    }
  }
  return myRequests;
}

function getAllMySwaps(userEmail) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("tb_users");
  var swapSheet = ss.getSheetByName("tb_swaps");
  var scheduleSheet = ss.getSheetByName("tb_schedules");
  if (!swapSheet || !scheduleSheet) return { incoming: [], outgoing: [] };
  
  var userData = userSheet.getDataRange().getValues();
  var swapData = swapSheet.getDataRange().getValues();
  var scheduleData = scheduleSheet.getDataRange().getValues();
  
  var myId = "";
  var userMap = {}; 
  for(var i=1; i<userData.length; i++) {
    userMap[userData[i][0].toString()] = userData[i][1].toString();
    if(userData[i][2].toString().trim().toLowerCase() === userEmail.trim().toLowerCase()) {
      myId = userData[i][0].toString();
    }
  }
  
  var scheduleMap = {};
  for(var k=1; k<scheduleData.length; k++) {
    scheduleMap[scheduleData[k][0].toString()] = {
      date: Utilities.formatDate(new Date(scheduleData[k][2]), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd"),
      shift: scheduleData[k][3].toString()
    };
  }

  var incoming = [];
  var outgoing = [];
  
  for(var j=1; j<swapData.length; j++) {
    var swap = {
      swapId: swapData[j][0].toString(),
      scheduleId: swapData[j][1].toString(),
      requesterId: swapData[j][2].toString(),
      ownerId: swapData[j][3].toString(),
      status: swapData[j][4].toString()
    };
    
    var schInfo = scheduleMap[swap.scheduleId] || { date: "ไม่ระบุ", shift: "ไม่ระบุ" };
    swap.date = schInfo.date;
    swap.shift = schInfo.shift;

    if (swap.ownerId === myId) {
      swap.otherName = userMap[swap.requesterId] || "บุคคลากรภายนอก";
      incoming.push(swap);
    } else if (swap.requesterId === myId) {
      swap.otherName = userMap[swap.ownerId] || "บุคคลากรภายนอก";
      outgoing.push(swap);
    }
  }
  
  return { incoming: incoming, outgoing: outgoing };
}

function approveSwap(swapId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var swapSheet = ss.getSheetByName("tb_swaps");
  var scheduleSheet = ss.getSheetByName("tb_schedules");
  var swapData = swapSheet.getDataRange().getValues();
  for(var i=1; i<swapData.length; i++) {
    if(swapData[i][0].toString() === swapId && swapData[i][4].toString() === "Pending") {
      var schId = swapData[i][1].toString();
      var requesterId = swapData[i][2].toString();
      var schData = scheduleSheet.getDataRange().getValues();
      for(var j=1; j<schData.length; j++) {
        if(schData[j][0].toString() === schId) {
          scheduleSheet.getRange(j + 1, 2).setValue(requesterId); 
          break;
        }
      }
      swapSheet.getRange(i + 1, 5).setValue("Approved");
      return { success: true, message: "อนุมัติสลับตารางเวรเรียบร้อยแล้วค่ะ" };
    }
  }
  return { success: false, message: "เกิดข้อผิดพลาดในการอนุมัติค่ะ" };
}

function rejectSwap(swapId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var swapSheet = ss.getSheetByName("tb_swaps");
  var swapData = swapSheet.getDataRange().getValues();
  for(var i=1; i<swapData.length; i++) {
    if(swapData[i][0].toString() === swapId && swapData[i][4].toString() === "Pending") {
      swapSheet.getRange(i + 1, 5).setValue("Rejected");
      return { success: true, message: "ปฏิเสธคำขอสลับตารางเวรเรียบร้อยแล้วค่ะ" };
    }
  }
  return { success: false, message: "เกิดข้อผิดพลาดในการปฏิเสธค่ะ" };
}

// === Dashboard Summary Function ===
function getShiftSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scheduleSheet = ss.getSheetByName("tb_schedules");
  var userSheet = ss.getSheetByName("tb_users");
  if (!scheduleSheet || !userSheet) return [];
  
  var scheduleData = scheduleSheet.getDataRange().getValues();
  var userData = userSheet.getDataRange().getValues();
  
  var summaryMap = {};
  
  // Initialize map with active nurses
  for (var i = 1; i < userData.length; i++) {
    if(userData[i][6].toString().trim().toLowerCase() === "active") {
      summaryMap[userData[i][0].toString()] = {
        name: userData[i][1].toString(),
        total: 0,
        morning: 0,
        afternoon: 0,
        night: 0
      };
    }
  }
  
  // Count shifts
  for (var j = 1; j < scheduleData.length; j++) {
    var userId = scheduleData[j][1].toString();
    var shiftType = scheduleData[j][3].toString();
    
    if (summaryMap[userId]) {
      summaryMap[userId].total++;
      if (shiftType === "เช้า") summaryMap[userId].morning++;
      else if (shiftType === "บ่าย") summaryMap[userId].afternoon++;
      else if (shiftType === "ดึก") summaryMap[userId].night++;
    }
  }
  
  return Object.keys(summaryMap).map(function(key) { return summaryMap[key]; });
}

// === เพิ่มเติมสำหรับ Manage Users ===

function getManageUsersList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("tb_users");
  if (!userSheet) return [];
  var data = userSheet.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < data.length; i++) {
    users.push({
      id: data[i][0],
      name: data[i][1],
      email: data[i][2],
      password: data[i][3],
      role: data[i][4],
      dept: data[i][5],
      status: data[i][6]
    });
  }
  return users;
}

function saveUser(userData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("tb_users");
  if (!userSheet) return { success: false, message: "ไม่พบตาราง tb_users" };
  var data = userSheet.getDataRange().getValues();
  var userId = userData.id || ("USR-" + new Date().getTime());
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === userId.toString()) {
      userSheet.getRange(i + 1, 2, 1, 6).setValues([[
        userData.name, userData.email, userData.password || data[i][3], 
        userData.role, userData.dept || data[i][5], userData.status
      ]]);
      return { success: true, message: "แก้ไขข้อมูลสำเร็จแล้วค่ะ" };
    }
  }
  userSheet.appendRow([userId, userData.name, userData.email, userData.password, userData.role, userData.dept, userData.status]);
  return { success: true, message: "เพิ่มบุคคลากรใหม่สำเร็จแล้วค่ะ" };
}

function deleteUser(userId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("tb_users");
  var data = userSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === userId.toString()) {
      userSheet.deleteRow(i + 1);
      return { success: true, message: "ลบข้อมูลสำเร็จแล้วค่ะ" };
    }
  }
  return { success: false, message: "ไม่พบข้อมูลที่ต้องการลบค่ะ" };
}
