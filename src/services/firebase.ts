import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ModuleItem, LessonItem, CommentItem, SpecializationItem } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyAkwuXN4ikVt2xDV4N_FRg1sRt1P9QkXrw",
  authDomain: "clastyzoom-4badf.firebaseapp.com",
  projectId: "clastyzoom-4badf",
  storageBucket: "clastyzoom-4badf.firebasestorage.app",
  messagingSenderId: "332945573289",
  appId: "1:332945573289:web:35d7a3335e5cc33095f0b8",
  measurementId: "G-3MTXB3NRS7"
};

// Initialize Firebase App singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(firebaseApp);

// Initialize Analytics conditionally
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  }).catch(() => {
    // Ignore analytics unsupported in iframe or sandboxed environments
  });
}

// Collections helpers
const getModulesCollection = (yearId: 'first' | 'second') => 
  collection(db, 'academic_years', yearId, 'modules');

/**
 * Subscribe to modules for a given year in real-time
 */
export function subscribeModules(
  yearId: 'first' | 'second',
  onUpdate: (modules: ModuleItem[]) => void,
  onError?: (error: any) => void
) {
  try {
    const q = query(getModulesCollection(yearId));
    return onSnapshot(q, (snapshot) => {
      const items: ModuleItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          createdAt: data.createdAtText || new Date().toLocaleDateString('ar-DZ'),
          thumbnailUrl: data.thumbnailUrl || undefined,
          specializationId: data.specializationId || 'pep-arabe',
          lessons: data.lessons || [],
        });
      });
      // Sort newest first
      items.sort((a, b) => b.id.localeCompare(a.id));
      onUpdate(items);
    }, (err) => {
      console.warn('Firestore modules snapshot error:', err);
      if (onError) onError(err);
    });
  } catch (e) {
    console.warn('Firestore subscription failed, falling back:', e);
    if (onError) onError(e);
    return () => {};
  }
}

/**
 * Add a new module to Firestore
 */
export async function addModuleToFirestore(
  yearId: 'first' | 'second',
  moduleItem: ModuleItem
) {
  try {
    const moduleRef = doc(db, 'academic_years', yearId, 'modules', moduleItem.id);
    await setDoc(moduleRef, {
      name: moduleItem.name,
      createdAtText: moduleItem.createdAt,
      thumbnailUrl: moduleItem.thumbnailUrl || null,
      specializationId: moduleItem.specializationId || 'pep-arabe',
      lessons: moduleItem.lessons,
      timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving module to Firestore:', err);
    throw err;
  }
}

/**
 * Specializations Management (Default 'PEP arabe' + dynamically added)
 */
export const DEFAULT_SPECIALIZATIONS: SpecializationItem[] = [
  { id: 'pep-arabe', name: 'PEP arabe', createdAt: new Date().toISOString() }
];

export function subscribeSpecializations(
  onUpdate: (specs: SpecializationItem[]) => void,
  onError?: (error: any) => void
) {
  try {
    const specsDocRef = doc(db, 'system_config', 'specializations');
    return onSnapshot(specsDocRef, (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.list) && snap.data().list.length > 0) {
        onUpdate(snap.data().list);
      } else {
        onUpdate(DEFAULT_SPECIALIZATIONS);
      }
    }, (err) => {
      console.warn('Firestore specializations snapshot error:', err);
      if (onError) onError(err);
    });
  } catch (e) {
    console.warn('Firestore specializations subscription failed:', e);
    if (onError) onError(e);
    return () => {};
  }
}

export async function saveSpecializationsToFirestore(specs: SpecializationItem[]) {
  try {
    const specsDocRef = doc(db, 'system_config', 'specializations');
    await setDoc(specsDocRef, {
      list: specs,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving specializations to Firestore:', err);
    throw err;
  }
}

/**
 * Delete a module from Firestore
 */
export async function deleteModuleFromFirestore(
  yearId: 'first' | 'second',
  moduleId: string
) {
  try {
    const moduleRef = doc(db, 'academic_years', yearId, 'modules', moduleId);
    await deleteDoc(moduleRef);
  } catch (err) {
    console.warn('Error deleting module from Firestore:', err);
    throw err;
  }
}

/**
 * Update module lessons (with attachments, likes, comments)
 * Deeply sanitizes all data to guarantee Firestore never rejects undefined values
 */
export async function updateModuleLessonsInFirestore(
  yearId: 'first' | 'second',
  moduleId: string,
  lessons: LessonItem[]
) {
  try {
    const moduleRef = doc(db, 'academic_years', yearId, 'modules', moduleId);
    
    // Deeply sanitize lessons so no `undefined` properties are ever passed to Firestore
    const sanitizedLessons = (lessons || []).map(lesson => ({
      id: String(lesson.id || Date.now()),
      moduleId: String(lesson.moduleId || moduleId),
      title: String(lesson.title || ''),
      type: String(lesson.type || 'محاضرة'),
      description: String(lesson.description || ''),
      likesCount: Number(lesson.likesCount) || 0,
      baseLikes: typeof lesson.baseLikes === 'number' ? lesson.baseLikes : null,
      userLikes: typeof lesson.userLikes === 'number' ? lesson.userLikes : (lesson.isLiked ? 1 : 0),
      lastLikesSyncedAt: typeof lesson.lastLikesSyncedAt === 'number' ? lesson.lastLikesSyncedAt : null,
      isLiked: Boolean(lesson.isLiked),
      isPinned: Boolean(lesson.isPinned),
      timestamp: Number(lesson.timestamp) || Date.now(),
      createdAt: String(lesson.createdAt || new Date().toLocaleDateString('ar-DZ')),
      images: (lesson.images || []).map(img => ({
        id: String(img.id || Date.now()),
        url: String(img.url || ''),
        name: String(img.name || ''),
      })),
      pdfs: (lesson.pdfs || []).map(pdf => ({
        id: String(pdf.id || Date.now()),
        name: String(pdf.name || 'document.pdf'),
        size: String(pdf.size || ''),
        url: String(pdf.url || pdf.downloadUrl || '#'),
        downloadUrl: pdf.downloadUrl ? String(pdf.downloadUrl) : (pdf.url ? String(pdf.url) : null),
        viewUrl: pdf.viewUrl ? String(pdf.viewUrl) : (pdf.url ? String(pdf.url) : null),
        coverImageUrl: pdf.coverImageUrl ? String(pdf.coverImageUrl) : null,
      })),
      comments: (lesson.comments || []).map(c => ({
        id: String(c.id || Date.now()),
        author: String(c.author || ''),
        text: String(c.text || ''),
        createdAt: String(c.createdAt || ''),
        isAdmin: Boolean(c.isAdmin),
        avatarUrl: c.avatarUrl ? String(c.avatarUrl) : null,
        isApproved: Boolean(c.isApproved),
      })),
    }));

    await setDoc(moduleRef, {
      lessons: sanitizedLessons,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Error updating lessons in Firestore, fallback to local:', err);
  }
}

// ==========================================
// ADMIN AUTHENTICATION (Single Authorized Account)
// ==========================================

const ADMIN_STORAGE_KEY = 'ens_medea_admin_account_v1';
const ADMIN_SESSION_KEY = 'ens_medea_admin_active_session_v1';

export async function checkAdminAccountExists(): Promise<boolean> {
  // Check LocalStorage fallback first
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (local) return true;
  }

  try {
    const adminDocRef = doc(db, 'system_config', 'admin_account');
    const snap = await getDoc(adminDocRef);
    if (snap.exists() && snap.data()?.username) {
      // Sync to local
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({
        username: snap.data().username,
        passwordHash: snap.data().passwordHash,
      }));
      return true;
    }
  } catch (e) {
    console.warn('Firestore admin check error, relying on local:', e);
  }

  return false;
}

export async function createSingleAdminAccount(username: string, password: string): Promise<boolean> {
  const exists = await checkAdminAccountExists();
  if (exists) {
    throw new Error('تم إنشاء حساب المسؤول الرئيسي مسبقاً. يُسمح بحساب مسؤول وحيد فقط.');
  }

  // Simple clean hash for storage
  const credentials = {
    username: username.trim(),
    passwordHash: btoa(password.trim()),
    createdAt: new Date().toISOString(),
  };

  // 1. Save to LocalStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(credentials));
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  }

  // 2. Save to Firestore
  try {
    const adminDocRef = doc(db, 'system_config', 'admin_account');
    await setDoc(adminDocRef, credentials);
  } catch (e) {
    console.warn('Firestore admin account save notice:', e);
  }

  return true;
}

export async function verifyAdminLogin(username: string, password: string): Promise<boolean> {
  const enteredUser = username.trim();
  const enteredPassHash = btoa(password.trim());

  // Check local first
  if (typeof window !== 'undefined') {
    const localRaw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (localRaw) {
      const local = JSON.parse(localRaw);
      if (local.username === enteredUser && local.passwordHash === enteredPassHash) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        return true;
      }
    }
  }

  // Check Firestore
  try {
    const adminDocRef = doc(db, 'system_config', 'admin_account');
    const snap = await getDoc(adminDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.username === enteredUser && data.passwordHash === enteredPassHash) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({
          username: data.username,
          passwordHash: data.passwordHash,
        }));
        return true;
      }
    }
  } catch (e) {
    console.warn('Firestore admin verify error:', e);
  }

  return false;
}

export function isCurrentAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

// ==========================================
// ImgBB CLOUD STORAGE INTEGRATION
// ==========================================

export async function uploadImageToImgBB(file: File, apiKey = 'd89ee562e31505c87fc6037eb0a12e3e'): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success && data.data?.url) {
      return data.data.url;
    }
  } catch (err) {
    console.warn('ImgBB upload error, falling back to base64 DataURL:', err);
  }

  // Fallback: Read as DataURL so image is never lost
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  });
}

// ==========================================
// CATBOX.MOE PDF CLOUD STORAGE INTEGRATION
// ==========================================

export const CATBOX_USER_TOKEN = '20ce74dc0da261425dc134162';

export interface CatboxUploadResult {
  viewUrl: string;
  downloadUrl: string;
}

export async function uploadPdfToCatbox(
  file: File,
  userhash: string = CATBOX_USER_TOKEN
): Promise<CatboxUploadResult> {
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('userhash', userhash);
  formData.append('fileToUpload', file);

  try {
    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const text = (await response.text()).trim();
      if (text.startsWith('http://') || text.startsWith('https://')) {
        return {
          viewUrl: text,
          downloadUrl: text,
        };
      }
    }
  } catch (err) {
    console.warn('Catbox upload notice (network/cors):', err);
  }

  // Robust fallback: Generate Data URL for local & offline viewing/downloading
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || '#';
      resolve({
        viewUrl: dataUrl,
        downloadUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  });
}
