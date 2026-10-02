/**
 * Ready-to-deploy Google Apps Script (.gs) template
 * Integrates Google Sheets + Google Apps Script Webhook + Firebase Realtime DB + LINE Notify
 */
export const APPS_SCRIPT_SOURCE_CODE = `/**
 * ==============================================================
 * ระบบบริหารจัดการตารางสอบออนไลน์ และแจ้งเตือนอัตโนมัติ (MCU Exam Portal)
 * จัดทำโดย: ระบบตารางสอบออนไลน์และแจ้งเตือนการสอบ
 * ความสามารถ:
 * 1. Web App API (doGet / doPost) เชื่อมต่อกับ Web App แบบเรียลไทม์
 * 2. ซิงค์ข้อมูลกับ Google Sheets และ Firebase Realtime Database
 * 3. แจ้งเตือนผ่าน LINE Notify อัตโนมัติทุกเช้า 07:00 น. ก่อนสอบ
 * ==============================================================
 */

// ⚙️ การตั้งค่าหลัก (Configuration)
const CONFIG = {
  // ใส่ LINE Notify Token ของกลุ่มนิสิต หรือกลุ่มอาจารย์
  LINE_NOTIFY_TOKEN: "YOUR_LINE_NOTIFY_TOKEN_HERE",
  
  // (ถ้ามี) ใส่ Firebase Realtime Database URL เช่น https://my-exam-app-default-rtdb.firebaseio.com
  FIREBASE_DB_URL: "https://YOUR_FIREBASE_PROJECT.firebaseio.com",
  FIREBASE_AUTH_SECRET: "", // หรือ Database Secret (ถ้ามี)
  
  // ชื่อ Sheet ใน Google Spreadsheet
  SHEET_NAME: "ตารางสอบ"
};

/**
 * 0. ⚠️ สำคัญมาก: ฟังก์ชันกดเพื่อยืนยันสิทธิ์เข้าถึง Google Drive (แก้อาการ "ไม่ได้รับอนุญาตให้เข้าถึง: DriveApp")
 * วิธีทำ:
 * 1) ในหน้า Google Apps Script เลือกฟังก์ชัน "initialSetupAndAuthorize" ที่แถบด้านบน
 * 2) กดปุ่ม ▶️ "เรียกใช้" (Run)
 * 3) Google จะขึ้นหน้าต่างเตือน: กด "ตรวจสอบสิทธิ์" -> เลือกบัญชี Google -> กด "ขั้นสูง (Advanced)" -> กด "ไปที่... (ไม่ปลอดภัย)" -> กด "อนุญาต (Allow)"
 * 4) จากนั้นกดปุ่ม "การทำให้ใช้งานได้" (Deploy) -> "การทำให้ใช้งานได้รายการใหม่" (New Deployment) -> คัดลอก Webhook URL มาวางในเว็บ
 */
function initialSetupAndAuthorize() {
  const root = DriveApp.getRootFolder();
  Logger.log("✅ อนุญาตสิทธิ์ DriveApp สำเร็จ: " + root.getName());
  
  const folderId = "1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa";
  try {
    const parentFolder = DriveApp.getFolderById(folderId);
    Logger.log("✅ เชื่อมต่อโฟลเดอร์ Google Drive รับข้อสอบสำเร็จ: " + parentFolder.getName());

    // สร้างโฟลเดอร์ตามโครงสร้างรูปแบบ ข (แยกชั้นปีและกลุ่มบรรพชิต/คฤหัสถ์ 8 โฟลเดอร์)
    const folderList = [
      "ชั้นปีที่ 1 (บรรพชิต)", "ชั้นปีที่ 1 (คฤหัสถ์)",
      "ชั้นปีที่ 2 (บรรพชิต)", "ชั้นปีที่ 2 (คฤหัสถ์)",
      "ชั้นปีที่ 3 (บรรพชิต)", "ชั้นปีที่ 3 (คฤหัสถ์)",
      "ชั้นปีที่ 4 (บรรพชิต)", "ชั้นปีที่ 4 (คฤหัสถ์)"
    ];

    folderList.forEach(function(folderName) {
      const it = parentFolder.getFoldersByName(folderName);
      if (!it.hasNext()) {
        parentFolder.createFolder(folderName);
        Logger.log("📁 สร้างโฟลเดอร์เตรียมไว้: " + folderName);
      } else {
        Logger.log("📁 โฟลเดอร์มีอยู่แล้ว: " + folderName);
      }
    });
    Logger.log("🎉 ตั้งค่าและเตรียมโฟลเดอร์ทั้ง 8 โฟลเดอร์ (บรรพชิต & คฤหัสถ์ ชั้นปี 1-4) สำเร็จสมบูรณ์!");
  } catch (err) {
    Logger.log("⚠️ ข้อผิดพลาด: " + err.toString());
  }
}

/**
 * Helper: สแกนไฟล์ข้อสอบทั้งหมดในโฟลเดอร์ Google Drive รับข้อสอบ
 */
function scanGoogleDriveExamFiles(parentFolderId) {
  const folderId = parentFolderId || "1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa";
  const filesList = [];
  try {
    const parentFolder = DriveApp.getFolderById(folderId);
    
    // สแกนโฟลเดอร์ย่อย (เช่น ชั้นปีที่ 1 (บรรพชิต), ชั้นปีที่ 1 (คฤหัสถ์))
    const subfolders = parentFolder.getFolders();
    while (subfolders.hasNext()) {
      const sub = subfolders.next();
      const files = sub.getFiles();
      while (files.hasNext()) {
        const file = files.next();
        filesList.push({
          id: file.getId(),
          name: file.getName(),
          url: file.getUrl(),
          downloadUrl: file.getDownloadUrl(),
          folderName: sub.getName(),
          folderId: sub.getId(),
          size: file.getSize(),
          updated: file.getLastUpdated().toISOString()
        });
      }
    }

    // สแกนโฟลเดอร์หลักด้วย
    const rootFiles = parentFolder.getFiles();
    while (rootFiles.hasNext()) {
      const rFile = rootFiles.next();
      filesList.push({
        id: rFile.getId(),
        name: rFile.getName(),
        url: rFile.getUrl(),
        downloadUrl: rFile.getDownloadUrl(),
        folderName: parentFolder.getName(),
        folderId: parentFolder.getId(),
        size: rFile.getSize(),
        updated: rFile.getLastUpdated().toISOString()
      });
    }
  } catch (err) {
    Logger.log("Drive scan error: " + err.toString());
  }
  return filesList;
}

/**
 * 1. Web App GET: ส่งข้อมูลตารางสอบ และสแกนไฟล์ข้อสอบใน Google Drive แบบเรียลไทม์
 */
function doGet(e) {
  try {
    const folderId = (e && e.parameter && e.parameter.folderId) ? e.parameter.folderId : "1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa";
    const driveFiles = scanGoogleDriveExamFiles(folderId);

    // ดึงข้อมูล Sheet (ถ้ามี)
    let exams = [];
    try {
      const sheet = getOrCreateSheet();
      const data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        const headers = data[0];
        const rows = data.slice(1);
        exams = rows.map((row, index) => {
          const obj = { id: "exam-" + (index + 1) };
          headers.forEach((header, colIdx) => {
            obj[header] = row[colIdx];
          });
          return obj;
        });
      }
    } catch (sheetErr) {
      Logger.log("Sheet read error: " + sheetErr.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: exams.length,
      data: exams,
      driveFilesCount: driveFiles.length,
      driveFiles: driveFiles
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 2. Web App POST: รับข้อมูลอัปเดตจากหน้าเว็บ (เช่น อาจารย์แก้ไขวิชา, สั่งยิง LINE Notify)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action || "notify";

    // กรณีที่ 0: สแกนไฟล์ข้อสอบจาก Google Drive (สำหรับซิงค์สถานะข้ามเบราว์เซอร์)
    if (action === "get_drive_status" || action === "sync_from_drive") {
      const parentFolderId = postData.folderId || "1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa";
      const driveFiles = scanGoogleDriveExamFiles(parentFolderId);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: action,
        driveFilesCount: driveFiles.length,
        driveFiles: driveFiles
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // กรณีที่ 1: สั่งส่ง LINE Notify
    if (action === "notify" || postData.message) {
      const token = postData.token || CONFIG.LINE_NOTIFY_TOKEN;
      const sendResult = sendLineNotify(postData.message, token);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "notify",
        result: sendResult
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // กรณีที่ 2: บันทึกข้อมูลตารางสอบใหม่ (Sync from Web)
    if (action === "sync_exams" && Array.isArray(postData.exams)) {
      const sheet = getOrCreateSheet();
      sheet.clearContents();
      
      const headers = [
        "ชั้นปี", "คณะ", "สาขาวิชา", "วันสอบ", "เวลาสอบ", 
        "รหัสวิชา", "รายวิชา", "อาจารย์ผู้บรรยาย", "หมายเหตุ", "สถานะ", "ห้องสอบ"
      ];
      const rows = [headers];
      
      postData.exams.forEach(item => {
        rows.push([
          item.yearLevel || "",
          item.faculty || "",
          item.major || "",
          item.examDateThai || "",
          item.examTimeThai || "",
          item.courseCode || "",
          item.courseName || "",
          item.lecturer || "",
          item.notes || "",
          item.status || "",
          item.room || "ห้องประชุมชั้น 1"
        ]);
      });
      
      sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
      
      // ส่งต่อไปยัง Firebase Realtime Database (ถ้ามีการตั้งค่าไว้)
      if (CONFIG.FIREBASE_DB_URL && !CONFIG.FIREBASE_DB_URL.includes("YOUR_FIREBASE")) {
        syncToFirebase(postData.exams);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        updatedRows: rows.length - 1
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // กรณีที่ 3: อัปโหลดข้อสอบเข้า Google Drive (แยกโฟลเดอร์ตามรูปแบบ ข: ชั้นปี 1-4 บรรพชิต/คฤหัสถ์)
    if (action === "upload_exam" || action === "uploadExamFile") {
      const parentFolderId = postData.folderId || "1yc7VLWVCYtH8n1NqWymKmeu1kaNJRDBa";
      const yearLevel = (postData.yearLevel || "1").toString().trim();
      const studentStatus = (postData.studentStatus || postData.status || "บรรพชิต").toString().trim();
      const major = (postData.major || postData.faculty || "").trim();
      const teacherName = (postData.teacherName || postData.lecturer || "อาจารย์ผู้สอน").trim();
      const courseCode = (postData.courseCode || "").trim();
      const courseName = (postData.courseName || "").trim();
      const fileData = postData.fileData || postData.fileContent; // Base64
      const originalFileName = postData.fileName || "exam.pdf";
      const fileMime = postData.fileMime || postData.mimeType || "application/pdf";

      const parentFolder = DriveApp.getFolderById(parentFolderId);

      // 📁 จัดระเบียบแยกเข้าโฟลเดอร์รูปแบบ ข เช่น "ชั้นปีที่ 1 (บรรพชิต)" หรือ "ชั้นปีที่ 1 (คฤหัสถ์)"
      const targetFolderName = "ชั้นปีที่ " + yearLevel + " (" + studentStatus + ")";
      let targetFolder;
      const folderIterator = parentFolder.getFoldersByName(targetFolderName);
      if (folderIterator.hasNext()) {
        targetFolder = folderIterator.next();
      } else {
        targetFolder = parentFolder.createFolder(targetFolderName);
      }

      // ดึงนามสกุลไฟล์
      const ext = originalFileName.includes(".") 
        ? originalFileName.substring(originalFileName.lastIndexOf(".")) 
        : ".pdf";

      // 📄 ตั้งชื่อไฟล์มาตรฐาน: [ปี X][บรรพชิต/คฤหัสถ์][สาขาวิชา][รหัสวิชา] ชื่อวิชา - อาจารย์ผู้สอน.ext
      const newFileName = postData.fileName && postData.fileName.startsWith("[ปี")
        ? postData.fileName
        : "[ปี " + yearLevel + "][" + studentStatus + "][" + (major || "วิทยาลัยสงฆ์") + "][" + courseCode + "] " + courseName + " - " + teacherName + ext;

      // ถอดรหัส Base64 แล้วสร้างไฟล์ในโฟลเดอร์ชั้นปี
      const decodedBytes = Utilities.base64Decode(fileData);
      const blob = Utilities.newBlob(decodedBytes, fileMime, newFileName);
      const uploadedFile = targetFolder.createFile(blob);

      // อนุญาตให้เข้าถึงผ่านลิงก์ได้
      uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        success: true,
        fileId: uploadedFile.getId(),
        fileName: newFileName,
        fileUrl: uploadedFile.getUrl(),
        downloadUrl: uploadedFile.getDownloadUrl(),
        folderName: targetFolderName,
        folderUrl: targetFolder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "unknown_action",
      receivedAction: action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ฟังก์ชันส่งข้อความเข้า LINE Notify
 */
function sendLineNotify(message, token) {
  const lineToken = token || CONFIG.LINE_NOTIFY_TOKEN;
  if (!lineToken || lineToken.includes("YOUR_")) {
    return { success: false, message: "Token not configured" };
  }

  const options = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + lineToken
    },
    payload: {
      "message": message
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
  return {
    code: response.getResponseCode(),
    body: response.getContentText()
  };
}

/**
 * 3. ฟังก์ชันแจ้งเตือนนิสิตอัตโนมัติประจำวัน (Time-Driven Trigger)
 * แนะนำให้ตั้ง Trigger ทำงานทุกเช้า 07:00 น. หรือล่วงหน้า 1 วัน
 */
function sendDailyExamReminders() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const rows = data.slice(1);
  const today = new Date();
  
  // จัดฟอร์แมตวันไทยเปรียบเทียบ เช่น "5 ตุลาคม 2569"
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const todayDay = today.getDate();
  const todayMonth = thaiMonths[today.getMonth()];
  const todayYear = today.getFullYear() + 543;
  const todayThaiStr = todayDay + " " + todayMonth + " " + todayYear;

  // ค้นหาวิชาที่สอบวันนี้
  const todayExams = rows.filter(row => {
    const examDate = (row[4] || "").toString().trim();
    return examDate.includes(todayDay + " " + todayMonth);
  });

  if (todayExams.length === 0) {
    Logger.log("วันนี้ไม่มีการสอบ");
    return;
  }

  let msg = "\\n🔔 [แจ้งเตือนการสอบวันนี้: " + todayThaiStr + "]\\n";
  msg += "━━━━━━━━━━━━━━━━━━━━\\n";
  msg += "มีวิชาสอบทั้งหมด " + todayExams.length + " รายวิชา:\\n\\n";

  todayExams.forEach((row, i) => {
    msg += (i + 1) + ". " + row[6] + " " + row[7] + "\\n";
    msg += "   ⏰ เวลา: " + row[5] + "\\n";
    msg += "   👨‍🏫 อาจารย์: " + row[8] + "\\n";
    msg += "   📍 สถานที่: " + (row[11] || "มหาวิทยาลัย") + "\\n";
    msg += "   👥 ชั้นปี: " + row[1] + " (" + row[10] + ")\\n";
    msg += "──────────────────\\n";
  });
  msg += "⚠️ กรุณาเข้าห้องสอบก่อนเวลา 15 นาที และแต่งกายให้สุภาพเรียบร้อย";

  sendLineNotify(msg, CONFIG.LINE_NOTIFY_TOKEN);
}

/**
 * 4. ซิงค์ไปยัง Firebase Realtime Database
 */
function syncToFirebase(exams) {
  try {
    const url = CONFIG.FIREBASE_DB_URL + "/exams.json" + 
      (CONFIG.FIREBASE_AUTH_SECRET ? "?auth=" + CONFIG.FIREBASE_AUTH_SECRET : "");
    const options = {
      method: "put",
      contentType: "application/json",
      payload: JSON.stringify(exams),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Firebase sync error: " + e.toString());
  }
}

/**
 * Helper: ดึงหรือสร้าง Sheet
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  return sheet;
}
`;
