# คู่มือการติดตั้งและบริหารจัดการระบบรับและพิมพ์ข้อสอบ (MCU Exam Portal)
**วิทยาลัยสงฆ์พ่อขุนผาเมือง เพชรบูรณ์ · มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)**

---

## 1. ภาพรวมและสถาปัตยกรรมความปลอดภัย (Security Architecture)

ระบบนี้ถูกออกแบบเป็น **ระบบสารสนเทศภายในแบบปิด (Closed Internal System)** โดยไม่มีหน้าสาธารณะ (No Public Pages) ข้อมูลตารางสอบ รายวิชา ข้อสอบ และข้อมูลนิสิตทั้งหมด จะถูกปิดกั้นอย่างสมบูรณ์จนกว่าผู้ใช้งานจะผ่านการยืนยันตัวตนด้วยบัญชี Google Workspace ของมหาวิทยาลัยที่ได้รับอนุมัติแล้วเท่านั้น

### สถาปัตยกรรมความปลอดภัยหลัก (Security Highlights):
1. **Zero Public Access / Default Deny:**
   - ผู้เยี่ยมชมภายนอกหรือผู้ที่ยังไม่ล็อกอิน จะเห็นเพียงหน้าลงชื่อเข้าใช้ (Google Sign-In) เท่านั้น
   - การเรียกดู API Endpoint ทั้งหมด ต้องมี Session Cookie (`HttpOnly`, `SameSite=Lax`, `Secure`) และส่ง CSRF Token ผ่าน Header `X-CSRF-Token`
2. **ตัดช่องโหว่ความปลอดภัยและรหัสผ่านตายตัว:**
   - ตัด Quick Login หรือ Dropdown เลือกสิทธิ์ออกทั้งหมด
   - ตัดรหัสผ่านตายตัว (`MCUADMIN2026`, `PANYA99`) ออกอย่างสิ้นเชิง
   - ลบแพ็กเกจ `xlsx` ที่มีช่องโหว่ Prototype Pollution / ReDoS และแทนที่ด้วยตัวส่งออกไฟล์ที่ป้องกัน Formula Injection
   - นำ LINE Notify (ซึ่งปิดบริการแล้ว) ออกอย่างสมบูรณ์
3. **การควบคุมการเข้าถึงตามบทบาท (Role-Based Access Control - RBAC):**
   - **อาจารย์ผู้สอน (Teacher):** เข้าถึงและอัปโหลดข้อสอบได้เฉพาะรายวิชาที่ตนได้รับมอบหมายใน `CourseAssignments` เท่านั้น หากส่งคำขออัปโหลดหรือเปิดดูวิชาของอาจารย์ท่านอื่น เซิร์ฟเวอร์จะปฏิเสธด้วย `403 Forbidden` ทันที
   - **เจ้าหน้าที่สอบ (Staff):** ตรวจสอบไฟล์ข้อสอบ, อนุมัติ (Accept), ตีกลับพร้อมเหตุผล (Reject), เปิดดูไฟล์ PDF เพื่อสั่งพิมพ์เป็นชุด และบันทึกประวัติการพิมพ์ (Print Run Audit Log)
   - **ผู้ดูแลระบบ (Admin):** จัดการสิทธิ์, อนุมัติบัญชีผู้ใช้, จับคู่อาจารย์กับรายวิชา, เรียกดู Audit Logs ทั้งหมด **โดย Admin จะไม่สามารถเปิดอ่านเนื้อหาไฟล์ข้อสอบได้ เว้นแต่จะได้รับสิทธิ์พิเศษ `canReadExamContent = true` อย่างชัดเจน**
4. **การจัดเก็บไฟล์บน Google Drive แบบส่วนตัว (Private University Storage):**
   - ข้อสอบถูกจัดเก็บในโฟลเดอร์ของมหาวิทยาลัยที่ไม่อนุญาต `Anyone with the link`
   - การเปิดอ่านหรือดาวน์โหลดข้อสอบ ทำผ่านสตรีมมิ่งพร็อกซีฝั่งเซิร์ฟเวอร์ (`/api/exams/:courseId/files/:versionId/view`) ตามสิทธิ์ RBAC เท่านั้น
   - แยกเวอร์ชันของไฟล์ (`v1`, `v2`, ...) โดยไม่เขียนทับไฟล์เดิม (Immutable Versioning)
5. **การคัดกรองไฟล์ฝั่งเซิร์ฟเวอร์ (Strict Server-Side Validation):**
   - ตรวจสอบ Magic Bytes จริงของไฟล์:
     - PDF: ต้องขึ้นต้นด้วย `%PDF-` (`0x25 0x50 0x44 0x46`)
     - Word (.docx): ต้องขึ้นต้นด้วย Zip Magic Bytes `PK\x03\x04` (`0x50 0x4B 0x03 0x04`)
   - จำกัดขนาดไฟล์ไม่เกิน 25MB ต่อไฟล์
   - ป้องกัน Path Traversal (`../`, `\`, NULL byte) และสร้างชื่อไฟล์มาตรฐานที่ปลอดภัย เช่น `EXAM_[code]_v[n]_[hash].[ext]`
6. **บันทึกประวัติความปลอดภัยครบถ้วน (Audit Logging):**
   - บันทึกทุกกิจกรรมสำคัญ: การเข้าสู่ระบบ, การอัปโหลดข้อสอบ, การเปิดดู, การอนุมัติ/ตีกลับ, การสั่งพิมพ์, การแก้ไขสิทธิ์

---

## 2. สิ่งที่ต้องจัดเตรียมล่วงหน้า (Prerequisites)

1. **เครื่องเซิร์ฟเวอร์ / สภาพแวดล้อมใช้งาน:**
   - Node.js เวอร์ชัน 18.x, 20.x หรือ 22.x LTS ขึ้นไป
   - npm เวอร์ชัน 9.x หรือ 10.x ขึ้นไป
2. **Google Cloud Platform (GCP) Project:**
   - บัญชี Google Workspace ของมหาวิทยาลัย หรือ Google Cloud Console สำหรับเปิดใช้งาน Google Identity Services
3. **Google Sheets & Google Drive:**
   - ไฟล์ Google Spreadsheet กลางสำหรับเก็บข้อมูล 6 ตาราง
   - โฟลเดอร์ Google Drive แบบ Private สำหรับรับไฟล์ข้อสอบ

---

## 3. ขั้นตอนการตั้งค่า Google Cloud Console (OAuth 2.0 & APIs)

1. เข้าสู่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่ เช่น `MCU-Exam-Portal`
3. ไปที่เมนู **APIs & Services** $\rightarrow$ **OAuth consent screen**:
   - เลือก User Type เป็น **Internal** (สำหรับผู้ใช้โดเมนมหาวิทยาลัย เช่น `@mcu.ac.th`)
   - กรอกข้อมูลชื่อแอป: `MCU Exam Reception & Printing Portal`
   - ใส่อีเมลผู้ดูแลระบบ และกดบันทึก
4. ไปที่เมนู **Credentials** $\rightarrow$ **Create Credentials** $\rightarrow$ **OAuth client ID**:
   - Application type: เลือก **Web application**
   - Name: `MCU Exam Web Client`
   - Authorized JavaScript origins:
     - Development: `http://localhost:5173`, `http://localhost:3001`
     - Production: ใส่โดเมนจริง เช่น `https://exam.mcu-phokhun.ac.th`
   - Authorized redirect URIs:
     - Development: `http://localhost:3001/api/auth/google/callback`
     - Production: `https://exam.mcu-phokhun.ac.th/api/auth/google/callback`
   - กด **Create** $\rightarrow$ คัดลอก **Client ID** และ **Client Secret**
5. เปิดใช้งาน APIs ที่จำเป็น:
   - ไปที่ **Enabled APIs & Services** $\rightarrow$ กด **Enable APIs and Services**
   - ค้นหาและเปิดใช้งาน:
     - **Google Drive API**
     - **Google Sheets API**
6. สร้าง **Service Account** สำหรับให้เซิร์ฟเวอร์เข้าถึง Google Drive:
   - ไปที่ **Credentials** $\rightarrow$ **Create Credentials** $\rightarrow$ **Service Account**
   - ตั้งชื่อ เช่น `mcu-exam-storage-sa`
   - กดสร้าง และไปที่แท็บ **Keys** $\rightarrow$ **Add Key** $\rightarrow$ **Create new key (JSON)**
   - ดาวน์โหลดไฟล์ JSON เก็บไว้เป็นความลับ (ห้ามอัปโหลดขึ้น Git)

---

## 4. ขั้นตอนการตั้งค่า Google Sheets และ Google Drive

### 4.1 การสร้างชีตฐานข้อมูล 6 แผ่นงาน (Database Sheets)
1. เปิด Google Drive ของบัญชีมหาวิทยาลัย $\rightarrow$ สร้าง Google Sheets ใหม่ ตั้งชื่อว่า `MCU_Exam_Database_Official`
2. ไปที่เมนู **ส่วนขยาย (Extensions)** $\rightarrow$ **Apps Script**
3. ลบโค้ดเริ่มต้นออก แล้วนำโค้ดจากไฟล์ `scripts/setupUniversitySpreadsheet.gs` ไปวาง
4. ที่แถบฟังก์ชันด้านบน เลือกฟังก์ชัน `setupUniversitySpreadsheet` $\rightarrow$ กด **▶️ เรียกใช้ (Run)**
5. สคริปต์จะสร้างและจัดรูปแบบชีตทั้ง 6 แผ่นงานให้อัตโนมัติ:
   - `Accounts`: ข้อมูลบัญชีผู้ใช้, บทบาท (teacher/staff/admin), สถานะ, canReadExamContent
   - `Courses`: ข้อมูล 91 รายวิชา, วัน-เวลาสอบ, สถานะการส่งข้อสอบ, เวอร์ชันล่าสุด
   - `CourseAssignments`: การจับคู่รหัสวิชากับอาจารย์ผู้สอน
   - `ExamSubmissions`: สถานะตรวจรับการส่งข้อสอบของแต่ละรายวิชา
   - `ExamVersions`: รายละเอียดและแฮชของไฟล์ข้อสอบทุกเวอร์ชัน (v1, v2, ...)
   - `AuditLogs`: บันทึกกิจกรรมและความปลอดภัยของระบบ

### 4.2 การสร้างโครงสร้างโฟลเดอร์ใน Google Drive
1. ในหน้า Apps Script เดิม เลือกฟังก์ชัน `setupDriveFolderStructure` $\rightarrow$ กด **▶️ เรียกใช้ (Run)**
2. สคริปต์จะสร้างโฟลเดอร์หลักชื่อ `MCU_Exam_Repository_Private` พร้อมโฟลเดอร์ย่อย 9 โฟลเดอร์:
   - `ชั้นปีที่ 1 (บรรพชิต)` / `ชั้นปีที่ 1 (คฤหัสถ์)`
   - `ชั้นปีที่ 2 (บรรพชิต)` / `ชั้นปีที่ 2 (คฤหัสถ์)`
   - `ชั้นปีที่ 3 (บรรพชิต)` / `ชั้นปีที่ 3 (คฤหัสถ์)`
   - `ชั้นปีที่ 4 (บรรพชิต)` / `ชั้นปีที่ 4 (คฤหัสถ์)`
   - `Quarantine` (สำหรับแยกไฟล์ที่มีข้อสงสัย)
3. **การกำหนดสิทธิ์โฟลเดอร์:**
   - แชร์โฟลเดอร์หลักให้เฉพาะอีเมล Service Account (หรือบัญชีกลาง) โดยให้สิทธิ์เป็น **ผู้แก้ไข (Editor)**
   - ตรวจสอบว่าไม่ได้เปิดสิทธิ์แบบ "ทุกคนที่มีลิงก์ (Anyone with link)" อย่างเด็ดขาด

---

## 5. การตั้งค่า Environment Variables (`.env`)

คัดลอกไฟล์ตัวอย่าง `.env.example` ไปเป็น `.env` ในโฟลเดอร์หลัก `C:\McuExam`:

```env
# พอร์ตการทำงานของเซิร์ฟเวอร์
PORT=3001
NODE_ENV=production

# การยืนยันตัวตน Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# ความปลอดภัย Session & CSRF (ต้องตั้งเป็นสุ่มข้อความยาวอย่างน้อย 32 ตัวอักษร)
SESSION_SECRET=mcu-exam-super-secret-session-key-change-this-in-production-2026
CSRF_SECRET=mcu-exam-super-secret-csrf-token-key-change-this-2026

# โหมดจัดเก็บไฟล์ข้อสอบ (drive หรือ local)
STORAGE_MODE=drive
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-google-drive-private-folder-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=mcu-exam-storage-sa@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# การอนุญาตโหมดพัฒนา (ปิดเป็น false ในระบบใช้งานจริง)
ALLOW_DEV_LOGIN=false
```

---

## 6. คำแนะนำการติดตั้งและเริ่มทำงานของระบบ (Installation & Launch)

### ขั้นตอนที่ 1: ติดตั้ง Dependencies
เปิดเทอร์มินัล (PowerShell) ในโฟลเดอร์ `C:\McuExam`:
```powershell
npm install
```

### ขั้นตอนที่ 2: รันทดสอบความปลอดภัยอัตโนมัติ (Automated Security Tests)
ตรวจสอบว่าระบบผ่านการทดสอบความปลอดภัยครบทั้ง 11 ข้อ:
```powershell
npm test
```
*ผลลัพธ์ต้องแสดง:*
```
✔ Test 1: ผู้ไม่เข้าสู่ระบบอ่านข้อมูลภายในหรือเปิดข้อสอบไม่ได้ (401 Unauthorized)
✔ Test 2: บัญชี Google ที่ไม่ได้รับอนุมัติเข้าใช้งานไม่ได้ (403 Forbidden)
✔ Test 3: อาจารย์ A อ่านหรืออัปโหลดรายวิชาของอาจารย์ B ไม่ได้ แม้แก้ courseId ในคำขอ (Default Deny)
✔ Test 4: การแก้ role หรือส่งค่า role ปลอมจากฝั่งผู้เรียก ไม่เพิ่มสิทธิ์ (Server RBAC Enforcement)
✔ Test 5: ผู้เรียกเปลี่ยน folderId หรือ fileId เพื่อเข้าถึงไฟล์นอกขอบเขตไม่ได้ (Path Traversal & ID Tampering Defense)
✔ Test 6: ไฟล์ผิดประเภทหรือเกินขนาดถูกปฏิเสธ (Strict Magic Bytes & Size Validation)
✔ Test 7: อัปโหลดล้มเหลวแล้วไม่ถูกบันทึกว่าส่งสำเร็จ (Integrity Guard)
✔ Test 8: ส่งคำขอซ้ำหรือส่งพร้อมกัน (Concurrency / Idempotency) ไม่ทำให้ข้อมูลชนกัน
✔ Test 9: เจ้าหน้าที่ที่มีสิทธิ์เปิดและสั่งพิมพ์ข้อสอบได้ พร้อมบันทึกประวัติ (Staff Workflow & Audit Logs)
✔ Test 10: การส่งเวอร์ชันใหม่ยังรักษาไฟล์เดิมและประวัติ (Version History & Immutability)
✔ Test 11: การทำงานร่วมกันของสถาปัตยกรรมผ่านสมบูรณ์ 100%
ℹ tests 11, pass 11, fail 0
```

### ขั้นตอนที่ 3: คอมไพล์ Frontend (Production Build)
```powershell
npm run build
```

### ขั้นตอนที่ 4: เริ่มรันระบบสำหรับใช้งานจริง (Production Server)
```powershell
npm run server
```
เซิร์ฟเวอร์จะเริ่มทำงานบนพอร์ต `3001` โดยให้บริการทั้ง Secure REST API, RBAC Protection และบริการไฟล์ Static Frontend จาก `dist/` โดยตรง

---

## 7. คู่มือการใช้งานสำหรับผู้ดูแลระบบและเจ้าหน้าที่

### 7.1 ผู้ดูแลระบบ (Admin)
- **การอนุมัติบัญชีผู้ใช้:**
  - เข้าสู่ระบบด้วยอีเมล Admin $\rightarrow$ ไปที่แท็บ **"จัดการบัญชีและสิทธิ์ (Accounts & RBAC)"**
  - เมื่อมีอาจารย์หรือเจ้าหน้าที่ล็อกอินเข้ามาครั้งแรก สถานะจะเริ่มต้นที่ `pending`
  - ผู้ดูแลระบบตรวจสอบตัวตน แล้วกดเลือกบทบาท (`teacher` หรือ `staff`) และเปลี่ยนสถานะเป็น `active`
- **การมอบหมายวิชาให้อาจารย์ (Course Assignments):**
  - ในแท็บ **"จัดการบัญชีและสิทธิ์"** $\rightarrow$ เลือกแท็บย่อย **"มอบหมายรายวิชา"**
  - เลือกรายวิชา และระบุบัญชีอาจารย์ผู้รับผิดชอบ
  - อาจารย์จะเห็นและอัปโหลดข้อสอบได้เฉพาะวิชาที่ได้รับมอบหมายเท่านั้น
- **นโยบายสิทธิ์ `canReadExamContent`:**
  - โดยค่าเริ่มต้น ผู้ดูแลระบบ (Admin) **ไม่มีสิทธิ์เปิดอ่านเนื้อหาข้อสอบ** (มีสิทธิ์เพียงจัดการผู้ใช้และระบบ)
  - หาก Admin มีความจำเป็นต้องเปิดอ่านเนื้อหาข้อสอบ ต้องได้รับการเปิดสิทธิ์ `canReadExamContent = true` อย่างชัดเจนในแผ่นงาน `Accounts`

### 7.2 เจ้าหน้าที่ตรวจรับและพิมพ์ข้อสอบ (Staff)
- **การตรวจรับข้อสอบ:**
  - เข้าสู่ระบบ $\rightarrow$ แท็บ **"ตรวจรับและพิมพ์ข้อสอบ"**
  - เลือกรายวิชาที่มีการส่งข้อสอบ $\rightarrow$ ตรวจสอบชื่อไฟล์ ขนาด วันเวลา และเวอร์ชัน
  - กด **"รับข้อสอบ (Accept)"** เพื่อยืนยันความถูกต้อง
  - หรือกด **"ตีกลับ (Reject)"** และระบุเหตุผล (เช่น หน้าข้อสอบไม่ครบ, รูปภาพไม่ชัดเจน) ระบบจะส่งข้อความแจ้งเตือนให้อาจารย์อัปโหลดเวอร์ชันใหม่
- **การพิมพ์ข้อสอบ (Print Workflow):**
  - สำหรับไฟล์ PDF: กด **"🖨️ เปิดพิมพ์ข้อสอบ (PDF)"** ระบบจะเปิดตัวแสดงผลเพื่อสั่งพิมพ์
  - ระบุจำนวนชุดที่ต้องการพิมพ์ และกดยืนยัน ระบบจะบันทึกประวัติการพิมพ์ลงใน Audit Log
  - **คำแนะนำสำหรับไฟล์ Word (.docx):** ระบบจะแสดงคำเตือนสีส้มแจ้งให้แปลงเป็น PDF ก่อนพิมพ์เสมอ เพื่อป้องกันปัญหาฟอนต์เพี้ยนหรือหน้าเลื่อน (Layout Shift)

### 7.3 อาจารย์ผู้สอน (Teacher)
- เข้าสู่ระบบด้วย Google Workspace ของมหาวิทยาลัย
- ในหน้าหลัก จะแสดงเฉพาะ **"รายวิชาที่ได้รับมอบหมาย"**
- สามารถอัปโหลดข้อสอบทีละรายวิชา หรือใช้ฟังก์ชัน **"อัปโหลดข้อสอบโฟลเดอร์ (Batch Folder Upload)"** เพื่อให้ระบบอ่านชั้นปี สถานะนิสิต และจับคู่ให้อัตโนมัติ
- หากการอัปโหลดไฟล์จริงไม่สำเร็จ ระบบจะแจ้งเตือนข้อผิดพลาดทันที และจะไม่เปลี่ยนสถานะเป็น "พร้อมสอบ" อย่างเด็ดขาด

---

## 8. แผนการย้ายระบบ (Migration Plan)

1. **ระยะที่ 1: ติดตั้งและเชื่อมต่อโครงสร้างพื้นฐาน**
   - รันสคริปต์สร้างแผ่นงาน 6 ตารางใน Google Sheets
   - สร้างโฟลเดอร์ Google Drive แบบ Private และเชื่อมต่อ Service Account
2. **ระยะที่ 2: นำเข้าบัญชีอาจารย์และจับคู่รายวิชา**
   - บันทึกอีเมลอาจารย์ผู้สอน 91 รายวิชาลงในแท็บ `Accounts` และ `CourseAssignments`
3. **ระยะที่ 3: สลับการใช้งานเข้าสู่ระบบใหม่**
   - ปิดระบบเก่า (ตัด Quick Login และ Local Storage Sync เดิม)
   - เปิดให้ใช้งานผ่านระบบใหม่ที่ผ่านการทดสอบความปลอดภัยครบ 100%
