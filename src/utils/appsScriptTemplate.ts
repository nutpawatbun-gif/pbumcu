/**
 * Ready-to-deploy Google Apps Script (.gs) template
 * Sets up 6 Sheets tables and Private Drive structure for MCU Phokhun Pha Mueang Monastic College
 */
export const APPS_SCRIPT_SOURCE_CODE = `/**
 * ==============================================================================================
 * มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU) · วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์
 * สคริปต์ติดตั้งระบบฐานข้อมูล Google Sheets และโครงสร้างโฟลเดอร์ Google Drive แบบปลอดภัย
 * 
 * ฟังก์ชันหลัก:
 * 1. setupUniversitySpreadsheet() - สร้าง 6 แผ่นงาน (Tabs) พร้อมฟิลด์และข้อมูลเริ่มต้น
 * 2. setupDriveFolderStructure()   - สร้างโครงสร้างโฟลเดอร์ใน Google Drive แบบจำกัดสิทธิ์ (Private)
 * 3. syncFromWebPortal(e)          - Webhook Endpoint รับคำสั่งซิงค์ข้อมูลจาก Server
 * ==============================================================================================
 */

const UNIVERSITY_CONFIG = {
  INSTITUTION_NAME: "วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์",
  ACADEMIC_YEAR: "1/2569",
  CENTRAL_DRIVE_FOLDER_ID: ""
};

function setupUniversitySpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const tables = [
    {
      name: "Accounts",
      color: "#9D174D",
      headers: [
        "accountId", "googleEmail", "fullName", "role", "status", 
        "assignedScope", "canReadExamContent", "createdAt", "lastLoginAt"
      ],
      sampleRows: [
        [
          "acc-superadmin-01", "nutpawatbun@gmail.com", "Nutpawat Bun (Super Admin)", 
          "admin", "active", "all", true, new Date().toISOString(), new Date().toISOString()
        ],
        [
          "acc-admin-01", "admin@mcu.ac.th", "ผู้ดูแลระบบกลาง วิทยาลัยสงฆ์พ่อขุนผาเมือง", 
          "admin", "active", "all", true, new Date().toISOString(), new Date().toISOString()
        ],
        [
          "acc-staff-01", "exam.staff@mcu.ac.th", "เจ้าหน้าที่ฝ่ายวัดและประเมินผลการศึกษา", 
          "staff", "active", "all", true, new Date().toISOString(), new Date().toISOString()
        ],
        [
          "acc-teacher-01", "panya@mcu.ac.th", "ผศ.ปัญญา กันภัย", 
          "teacher", "active", "course-001,course-002", false, new Date().toISOString(), new Date().toISOString()
        ]
      ]
    },
    {
      name: "Courses",
      color: "#BE185D",
      headers: [
        "courseId", "courseCode", "courseName", "yearLevel", "faculty", "major", 
        "studentStatus", "examDateThai", "examDateISO", "examTimeThai", "room", 
        "submissionStatus", "currentVersion", "latestFileName", "latestFileSize", 
        "submittedAt", "submittedByAccountName", "verifiedAt", "verifiedByAccountName", "rejectionReason"
      ],
      sampleRows: [
        [
          "course-001", "000 136", "ภาษาบาลี", 1, "พุทธศาสตร์", "สาขาวิชาพระพุทธศาสนา", 
          "บรรพชิต", "5 ตุลาคม 2569", "2026-10-05", "09.00 - 11.30 น.", "ห้องประชุมชั้น 1", 
          "pending", 0, "", 0, "", "", "", "", ""
        ],
        [
          "course-002", "000 137", "ภาษาสันสกฤต", 1, "พุทธศาสตร์", "สาขาวิชาพระพุทธศาสนา", 
          "บรรพชิต", "5 ตุลาคม 2569", "2026-10-05", "13.00 - 15.30 น.", "ห้องประชุมชั้น 1", 
          "pending", 0, "", 0, "", "", "", "", ""
        ]
      ]
    },
    {
      name: "CourseAssignments",
      color: "#DB2777",
      headers: [
        "assignmentId", "courseId", "accountId", "roleInCourse", "assignedAt", "assignedByAccountId"
      ],
      sampleRows: [
        ["asg-001", "course-001", "acc-teacher-01", "primary_instructor", new Date().toISOString(), "acc-admin-01"],
        ["asg-002", "course-002", "acc-teacher-01", "primary_instructor", new Date().toISOString(), "acc-admin-01"]
      ]
    },
    {
      name: "ExamSubmissions",
      color: "#E11D48",
      headers: [
        "submissionId", "courseId", "latestVersion", "submissionStatus", 
        "submittedAt", "submittedByAccountId", "verifiedAt", "verifiedByAccountId", 
        "rejectionReason", "printCopiesLogged"
      ],
      sampleRows: []
    },
    {
      name: "ExamVersions",
      color: "#F43F5E",
      headers: [
        "versionId", "submissionId", "courseId", "version", "driveFileId", 
        "driveFileName", "fileMime", "fileSizeBytes", "sha256", 
        "uploadedByAccountId", "uploadedAt", "notes", "scanStatus"
      ],
      sampleRows: []
    },
    {
      name: "AuditLogs",
      color: "#475569",
      headers: [
        "logId", "timestamp", "accountId", "accountEmail", "action", 
        "targetType", "targetId", "ipAddress", "userAgent", "detailsJson"
      ],
      sampleRows: [
        [
          "log-init-01", new Date().toISOString(), "system", "system@mcu.ac.th", 
          "DATABASE_INITIALIZED", "system", "sheets", "127.0.0.1", "MCU-Setup-Agent", 
          JSON.stringify({ status: "success", tablesCount: 6 })
        ]
      ]
    }
  ];

  tables.forEach(function(tableDef) {
    let sheet = ss.getSheetByName(tableDef.name);
    if (!sheet) {
      sheet = ss.insertSheet(tableDef.name);
      Logger.log("✅ สร้างชีตใหม่: " + tableDef.name);
    } else {
      Logger.log("ℹ️ พบชีตเดิม: " + tableDef.name);
    }

    try {
      sheet.setTabColor(tableDef.color);
    } catch(e) {}

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, tableDef.headers.length).setValues([tableDef.headers]);
      const headerRange = sheet.getRange(1, 1, 1, tableDef.headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground(tableDef.color);
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);

      if (tableDef.sampleRows.length > 0) {
        sheet.getRange(2, 1, tableDef.sampleRows.length, tableDef.headers.length).setValues(tableDef.sampleRows);
      }

      for (let col = 1; col <= tableDef.headers.length; col++) {
        sheet.autoResizeColumn(col);
      }
    }
  });

  const defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("แผ่นงาน1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch(e) {}
  }

  Logger.log("🎉 ติดตั้งฐานข้อมูล 6 แผ่นงานสำเร็จเรียบร้อย!");
}

function setupDriveFolderStructure() {
  let rootFolder;
  if (UNIVERSITY_CONFIG.CENTRAL_DRIVE_FOLDER_ID) {
    rootFolder = DriveApp.getFolderById(UNIVERSITY_CONFIG.CENTRAL_DRIVE_FOLDER_ID);
  } else {
    const existing = DriveApp.getFoldersByName("MCU_Exam_Repository_Private");
    if (existing.hasNext()) {
      rootFolder = existing.next();
    } else {
      rootFolder = DriveApp.createFolder("MCU_Exam_Repository_Private");
    }
  }

  Logger.log("📁 โฟลเดอร์หลัก: " + rootFolder.getName() + " (ID: " + rootFolder.getId() + ")");

  try {
    rootFolder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    Logger.log("🔒 ตั้งค่าสิทธิ์โฟลเดอร์เป็นแบบส่วนตัว (Private Only)");
  } catch(e) {
    Logger.log("ℹ️ สิทธิ์ถูกควบคุมโดยผู้ดูแลระบบ Workspace");
  }

  const subFolders = [
    "ชั้นปีที่ 1 (บรรพชิต)", "ชั้นปีที่ 1 (คฤหัสถ์)",
    "ชั้นปีที่ 2 (บรรพชิต)", "ชั้นปีที่ 2 (คฤหัสถ์)",
    "ชั้นปีที่ 3 (บรรพชิต)", "ชั้นปีที่ 3 (คฤหัสถ์)",
    "ชั้นปีที่ 4 (บรรพชิต)", "ชั้นปีที่ 4 (คฤหัสถ์)",
    "Quarantine"
  ];

  subFolders.forEach(function(sub) {
    const it = rootFolder.getFoldersByName(sub);
    if (!it.hasNext()) {
      rootFolder.createFolder(sub);
      Logger.log("  └── 📁 สร้างโฟลเดอร์ย่อย: " + sub);
    } else {
      Logger.log("  └── ℹ️ โฟลเดอร์ย่อยมีอยู่แล้ว: " + sub);
    }
  });

  return {
    rootFolderId: rootFolder.getId(),
    rootFolderName: rootFolder.getName()
  };
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No POST body received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "sync_course_submission") {
      const sheet = ss.getSheetByName("Courses");
      if (!sheet) throw new Error("Courses sheet not found");

      const courseId = payload.courseId;
      const data = sheet.getDataRange().getValues();
      let updated = false;

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === courseId) {
          sheet.getRange(i + 1, 12).setValue(payload.submissionStatus || "submitted");
          sheet.getRange(i + 1, 13).setValue(payload.currentVersion || 1);
          sheet.getRange(i + 1, 14).setValue(payload.latestFileName || "");
          sheet.getRange(i + 1, 16).setValue(new Date().toISOString());
          sheet.getRange(i + 1, 17).setValue(payload.submittedByAccountName || "");
          updated = true;
          break;
        }
      }

      const auditSheet = ss.getSheetByName("AuditLogs");
      if (auditSheet) {
        auditSheet.appendRow([
          "log-" + Date.now(),
          new Date().toISOString(),
          payload.submittedByAccountId || "unknown",
          payload.submittedByEmail || "unknown",
          "EXAM_SUBMISSION_SYNCED",
          "course",
          courseId,
          "server",
          "NodeJS-Backend",
          JSON.stringify(payload)
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        updated: updated
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "unknown_action",
      action: action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "MCU Exam Google Sheets & Drive Synchronizer",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
