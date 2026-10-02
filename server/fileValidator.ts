import crypto from 'crypto';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedMime: string;
  fileSizeBytes: number;
  sha256: string;
  safeFileName: string;
  quarantineStatus: 'safe_structural' | 'quarantined';
  scanNotice: string;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Validates exam files strictly on server:
 * 1. File size limit
 * 2. Extension check
 * 3. MIME type check
 * 4. Magic Bytes header inspection
 * 5. Safe sanitized filename generation
 */
export function validateExamFile(
  originalFileName: string,
  buffer: Buffer,
  declaredMime: string,
  courseCode: string,
  version: number
): FileValidationResult {
  const size = buffer.length;

  // 1. File Size check
  if (size === 0) {
    return {
      isValid: false,
      error: 'ไฟล์มีขนาดเป็น 0 ไบต์ (ไฟล์ว่างเปล่า)',
      detectedMime: 'unknown',
      fileSizeBytes: 0,
      sha256: '',
      safeFileName: '',
      quarantineStatus: 'quarantined',
      scanNotice: 'การตรวจล้มเหลว: ไฟล์ว่างเปล่า'
    };
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `ขนาดไฟล์ (${(size / (1024 * 1024)).toFixed(2)} MB) เกินขีดจำกัดสูงสุดที่อนุญาต (25 MB)`,
      detectedMime: 'unknown',
      fileSizeBytes: size,
      sha256: '',
      safeFileName: '',
      quarantineStatus: 'quarantined',
      scanNotice: 'การตรวจล้มเหลว: ไฟล์เกินขนาด'
    };
  }

  // 2. Extension check
  const ext = originalFileName.includes('.')
    ? originalFileName.slice(originalFileName.lastIndexOf('.')).toLowerCase().trim()
    : '';

  if (ext !== '.pdf' && ext !== '.docx') {
    return {
      isValid: false,
      error: `ประเภทไฟล์ '${ext || 'ไม่ทราบนามสกุล'}' ไม่ได้รับอนุญาต ระบบรับเฉพาะไฟล์ข้อสอบนามสกุล .pdf หรือ .docx เท่านั้น`,
      detectedMime: 'unknown',
      fileSizeBytes: size,
      sha256: '',
      safeFileName: '',
      quarantineStatus: 'quarantined',
      scanNotice: 'การตรวจล้มเหลว: นามสกุลไม่ได้รับอนุญาต'
    };
  }

  // 3. Magic Bytes Inspection
  // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  const isPdfMagic = buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2D;

  // DOCX magic bytes: PK\x03\x04 (ZIP container header: 0x50 0x4B 0x03 0x04)
  const isDocxMagic = buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4B &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  let verifiedMime = '';
  if (ext === '.pdf') {
    if (!isPdfMagic) {
      return {
        isValid: false,
        error: 'โครงสร้างเนื้อหาไฟล์ไม่ตรงกับรูปแบบ PDF ที่แท้จริง (Magic Header ตรวจพบข้อผิดพลาด)',
        detectedMime: 'application/octet-stream',
        fileSizeBytes: size,
        sha256: '',
        safeFileName: '',
        quarantineStatus: 'quarantined',
        scanNotice: 'การตรวจล้มเหลว: ปลอมแปลงประเภทไฟล์ PDF'
      };
    }
    verifiedMime = 'application/pdf';
  } else if (ext === '.docx') {
    if (!isDocxMagic) {
      return {
        isValid: false,
        error: 'โครงสร้างเนื้อหาไฟล์ไม่ตรงกับรูปแบบ Microsoft Word (.docx) ที่แท้จริง (ZIP Container ผิดพลาด)',
        detectedMime: 'application/octet-stream',
        fileSizeBytes: size,
        sha256: '',
        safeFileName: '',
        quarantineStatus: 'quarantined',
        scanNotice: 'การตรวจล้มเหลว: ปลอมแปลงประเภทไฟล์ DOCX'
      };
    }
    verifiedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  // Check declared MIME vs verified
  if (declaredMime && declaredMime !== 'application/octet-stream' && declaredMime !== verifiedMime) {
    // If browser declared mismatched MIME (e.g. text/html with .pdf)
    if (ext === '.pdf' && !declaredMime.includes('pdf')) {
      return {
        isValid: false,
        error: `MIME Type ที่ส่งมา ('${declaredMime}') ไม่สอดคล้องกับนามสกุล .pdf`,
        detectedMime: declaredMime,
        fileSizeBytes: size,
        sha256: '',
        safeFileName: '',
        quarantineStatus: 'quarantined',
        scanNotice: 'การตรวจล้มเหลว: MIME Mismatch'
      };
    }
  }

  // 4. SHA-256 Checksum
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // 5. Safe Filename Generation (collision-resistant & sanitized)
  const cleanCode = courseCode.replace(/[^a-zA-Z0-9]/g, '_');
  const shortHash = sha256.substring(0, 10);
  const safeFileName = `EXAM_${cleanCode}_v${version}_${shortHash}${ext}`;

  return {
    isValid: true,
    detectedMime: verifiedMime,
    fileSizeBytes: size,
    sha256,
    safeFileName,
    quarantineStatus: 'safe_structural',
    scanNotice: 'ผ่านการตรวจสอบความถูกต้องเชิงโครงสร้าง (Structural Validation) และ Magic Bytes แล้ว (หมายเหตุ: ระบบไม่ได้เปิดบริการ Antivirus Engine ภายนอก)'
  };
}
