import { ExamItem, TeacherUser } from '../types/exam';

export interface TeacherProfile {
  id: string;
  name: string;
  code: string;
  role: 'admin' | 'teacher';
  keys: string[];
}

export const TEACHER_PROFILES: TeacherProfile[] = [
  { id: 'admin', name: 'ผู้ดูแลระบบการสอบ (Admin / นายทะเบียน)', code: 'MCU2569', role: 'admin', keys: ['admin', 'ผู้ดูแลระบบ'] },
  { id: 'tch-1', name: 'ผศ.ปัญญา กันภัย', code: 'PANYA99', role: 'teacher', keys: ['ปัญญา', 'กันภัย'] },
  { id: 'tch-2', name: 'พระมหาภาคภูมิ ภทฺทเมธี', code: 'BHAK88', role: 'teacher', keys: ['ภาคภูมิ', 'ภทฺทเมธี'] },
  { id: 'tch-3', name: 'ผศ.ดร.สุพล ศิริ', code: 'SUPOL77', role: 'teacher', keys: ['สุพล ศิริ', 'สุพลศิริ'] },
  { id: 'tch-4', name: 'พ.ต.ท.ดร.ศักดา แยกผิวผ่อง', code: 'SAKDA66', role: 'teacher', keys: ['ศักดา', 'แยกผิวผ่อง'] },
  { id: 'tch-5', name: 'ดร.เครือวัลย์ มโนรัตน์', code: 'KRUA55', role: 'teacher', keys: ['เครือวัลย์', 'มโนรัตน์'] },
  { id: 'tch-6', name: 'พระปลัดพีระพงศ์ ฐิตธมฺโม, ดร.', code: 'PEERA44', role: 'teacher', keys: ['พีระพงศ์', 'ฐิตธมฺโม'] },
  { id: 'tch-7', name: 'ดร.แสนสุริยา รักเสมอ', code: 'SAEN33', role: 'teacher', keys: ['แสนสุริยา', 'รักเสมอ'] },
  { id: 'tch-8', name: 'อาจารย์สมเจตน์ มีตาบุญ', code: 'SOMJET22', role: 'teacher', keys: ['สมเจตน์', 'มีตาบุญ'] },
  { id: 'tch-9', name: 'พระมหาธวัชชัย ธมฺมรํสี, ดร.', code: 'THAWAT11', role: 'teacher', keys: ['ธวัชชัย', 'ธมฺมรํสี'] },
  { id: 'tch-10', name: 'พระสมุห์วุฒิพงษ์ กิตฺติวณฺโณ, ดร.', code: 'WUTTI10', role: 'teacher', keys: ['วุฒิพงษ์', 'กิตฺติวณฺโณ'] },
  { id: 'tch-11', name: 'พระครูสุตพัชราภรณ์, ดร.', code: 'SUTPAT09', role: 'teacher', keys: ['สุตพัชราภรณ์'] },
  { id: 'tch-12', name: 'ดร.ปิยวัช ละคร', code: 'PIYAWAT08', role: 'teacher', keys: ['ปิยวัช', 'ปิชวัช', 'ละคร'] },
  { id: 'tch-13', name: 'ดร.นรุณ กุลผาย', code: 'NARUN07', role: 'teacher', keys: ['นรุณ', 'กุลผาย'] },
  { id: 'tch-14', name: 'อาจารย์ชัยวัฒน์ ปัญจิต', code: 'CHAIWAT06', role: 'teacher', keys: ['ชัยวัฒน์', 'ปัญจิต'] },
  { id: 'tch-15', name: 'พระมหาธนเดช สมจิตฺโต, ดร.', code: 'THANADECH05', role: 'teacher', keys: ['ธนเดช', 'สมจิตฺโต', 'สมจิตโต'] },
  { id: 'tch-16', name: 'พระครูสิริพัชรโสภิต, ดร.', code: 'SIRIPAT04', role: 'teacher', keys: ['สิริพัชรโสภิต'] },
  { id: 'tch-17', name: 'พระมนูศักดิ์ อุตฺตโร', code: 'MANUSAK03', role: 'teacher', keys: ['มนูศักดิ์', 'อุตฺตโร'] },
  { id: 'tch-18', name: 'ดร.สุรกาญจน์ บุญกาวิน', code: 'SURAKARN02', role: 'teacher', keys: ['สุรกาญจน์', 'บุญกาวิน'] },
  { id: 'tch-19', name: 'ผศ.ดร.รังสรรค์ เพ็งพัด', code: 'RANGSAN01', role: 'teacher', keys: ['รังสรรค์', 'เพ็งพัด'] },
  { id: 'tch-20', name: 'ผศ.จ.ส.อ.ดร.จุฬา เจริญวงค์', code: 'CHULA90', role: 'teacher', keys: ['จุฬา', 'เจริญวงค์'] },
  { id: 'tch-21', name: 'ว่าที่พันตรี ดร.สุชิน ชาญสูงเนิน', code: 'SUCHIN91', role: 'teacher', keys: ['สุชิน', 'ชาญสูงเนิน'] },
  { id: 'tch-22', name: 'อาจารย์ธนพัฒน์ สุนประโคน', code: 'THANAPAT92', role: 'teacher', keys: ['ธนพัฒน์', 'สุนประโคน'] },
  { id: 'tch-23', name: 'พระสุธีวชิราภรณ์, ผศ.ดร.', code: 'SUTHEE93', role: 'teacher', keys: ['สุธีวชิราภรณ์'] },
  { id: 'tch-24', name: 'พระครูประโชติพัชรพงศ์, ดร.', code: 'PRACHOT94', role: 'teacher', keys: ['ประโชติพัชรพงศ์'] },
  { id: 'tch-25', name: 'พระครูอรุณธรรมภาณ', code: 'ARUN95', role: 'teacher', keys: ['อรุณธรรมภาณ'] },
  { id: 'tch-26', name: 'พระสมุห์บุญทัน นรินฺโท', code: 'BOON96', role: 'teacher', keys: ['บุญทัน', 'นรินฺโท'] }
];

/**
 * Clean Thai text for comparison by removing spaces, punctuation, tone marks, phinthu, and numbers.
 */
export const cleanThai = (s: string): string => {
  if (!s) return '';
  return s
    .replace(/[\s,\.\/\-_()\[\]0-9\u0E3A\u0E48-\u0E4E]/g, '')
    .toLowerCase();
};

/**
 * Checks whether an exam's lecturer field matches a given teacher.
 * Handles Thai academic titles, honorary monk ranks, co-teaching slashes, spacing, and punctuation variations.
 */
export const isLecturerMatch = (
  lecturerField: string, 
  teacherNameOrUser: string | TeacherProfile | TeacherUser | null | undefined
): boolean => {
  if (!lecturerField || !teacherNameOrUser) return false;
  
  const teacherName = typeof teacherNameOrUser === 'string' ? teacherNameOrUser : teacherNameOrUser.name;
  if (!teacherName) return false;

  // Master Admin has access to all courses, not matching on individual name
  if (teacherName.includes('Admin') || teacherName.includes('ผู้ดูแลระบบ')) {
    return false;
  }

  // 1. Find profile by id if object passed
  let profile: TeacherProfile | undefined;
  if (typeof teacherNameOrUser !== 'string' && teacherNameOrUser.id) {
    profile = TEACHER_PROFILES.find(p => p.id === teacherNameOrUser.id);
  }

  // 2. Find profile by name match
  if (!profile) {
    profile = TEACHER_PROFILES.find(p => 
      p.name === teacherName || 
      p.name.includes(teacherName) || 
      teacherName.includes(p.name) ||
      cleanThai(p.name) === cleanThai(teacherName)
    );
  }

  const cleanLec = cleanThai(lecturerField);

  // 3. Match against profile defined keys (keywords like names and aliases)
  if (profile && profile.keys.length > 0) {
    const matched = profile.keys.some(k => {
      const cleanKey = cleanThai(k);
      return cleanKey.length >= 2 && cleanLec.includes(cleanKey);
    });
    if (matched) return true;
  }

  // 4. Fallback: normalize teacher name by removing academic titles and monk ranks
  const titleRegex = /(ศาสตราจารย์|รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์|ดร|ผศ|รศ|ศ|พ\.?ต\.?ท|ว่าที่พันตรี|อาจารย์|อาจาย์|พระมหา|พระครู|พระปลัด|พระสมุห์|พระ)/g;
  const strippedTeacherName = teacherName.replace(titleRegex, '');
  const cleanTName = cleanThai(strippedTeacherName);

  if (cleanTName.length >= 3 && cleanLec.includes(cleanTName)) {
    return true;
  }

  // 5. Fallback: split co-teachers by / or ,
  const coTeachers = lecturerField.split(/[\/,]/);
  for (const co of coTeachers) {
    const cleanCo = cleanThai(co);
    if (cleanTName.length >= 3 && cleanCo.includes(cleanTName)) {
      return true;
    }
  }

  return false;
};

/**
 * Get total number of teaching courses for a teacher profile
 */
export const getTeacherCourseCount = (exams: ExamItem[], teacher: TeacherProfile | TeacherUser): number => {
  if (teacher.role === 'admin') return exams.length;
  return exams.filter(e => isLecturerMatch(e.lecturer, teacher)).length;
};
