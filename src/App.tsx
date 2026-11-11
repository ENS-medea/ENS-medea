import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  X, 
  FileText, 
  Trash2, 
  Download, 
  Heart, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  ImageIcon, 
  FileUp, 
  Send, 
  Lock, 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  CheckCircle2, 
  Pin,
  Pencil,
  Search,
  Check,
  ImagePlus
} from 'lucide-react';
import { AttachedImage, AttachedPdf, CommentItem, LessonItem, ModuleItem, SpecializationItem } from './types';
import logoAsset from './assets/logo.png';
import avatarAsset from './assets/avatar.jpg';
import { 
  subscribeModules, 
  addModuleToFirestore, 
  deleteModuleFromFirestore, 
  updateModuleLessonsInFirestore, 
  checkAdminAccountExists, 
  createSingleAdminAccount, 
  verifyAdminLogin, 
  isCurrentAdminLoggedIn, 
  logoutAdmin, 
  uploadImageToImgBB,
  DEFAULT_SPECIALIZATIONS,
  subscribeSpecializations,
  saveSpecializationsToFirestore
} from './services/firebase';
import { 
  calculateAutomatedLikes, 
  applyAutomatedLikesToLessons 
} from './services/likesAlgorithm';

const NEW_LOGO_URL = 'https://i.ibb.co/zTZcJ8zq/Screenshot-20261110-131301-Chrome.png';
const ADMIN_AVATAR_URL = 'https://i.ibb.co/d4NCmpYL/1785099526878.jpg';

// Anonymous session ID generator for non-admin public visitors (e.g. مجهول الهوية #4821)
const getSessionAnonId = (): string => {
  try {
    let id = sessionStorage.getItem('ens_anon_session_id');
    if (!id) {
      id = String(Math.floor(1000 + Math.random() * 9000));
      sessionStorage.setItem('ens_anon_session_id', id);
    }
    return id;
  } catch {
    return '1234';
  }
};

export default function App() {
  const [selectedYear, setSelectedYear] = useState<'first' | 'second'>('second');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Admin Authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isCurrentAdminLoggedIn());
  const [logoTapCount, setLogoTapCount] = useState<number>(0);
  const logoTapTimeoutRef = useRef<any>(null);

  // Admin Modals
  const [isAdminSetupModalOpen, setIsAdminSetupModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminSuccessNotification, setAdminSuccessNotification] = useState<string | null>(null);

  // Modules stored per year
  const [year1Modules, setYear1Modules] = useState<ModuleItem[]>(() => {
    try {
      const saved = localStorage.getItem('ens_medea_v6_year1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [year2Modules, setYear2Modules] = useState<ModuleItem[]>(() => {
    try {
      const saved = localStorage.getItem('ens_medea_v6_year2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Specializations (Default 'PEP arabe' + dynamically added by Admin)
  const [specializations, setSpecializations] = useState<SpecializationItem[]>(() => {
    try {
      const saved = localStorage.getItem('ens_medea_specializations_v1');
      return saved ? JSON.parse(saved) : DEFAULT_SPECIALIZATIONS;
    } catch {
      return DEFAULT_SPECIALIZATIONS;
    }
  });
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<string>('pep-arabe');
  const [isAddSpecializationModalOpen, setIsAddSpecializationModalOpen] = useState(false);
  const [newSpecializationName, setNewSpecializationName] = useState('');

  // Real-time Firebase Firestore Subscription for Specializations
  useEffect(() => {
    const unsubSpecs = subscribeSpecializations((specs) => {
      if (specs && specs.length > 0) {
        setSpecializations(specs);
      }
    });
    return () => unsubSpecs();
  }, []);

  // Save specializations to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('ens_medea_specializations_v1', JSON.stringify(specializations));
    } catch (e) {
      console.error(e);
    }
  }, [specializations]);

  // Real-time Firebase Firestore Subscription with safe merging
  useEffect(() => {
    const mergeIncomingModules = (current: ModuleItem[], incoming: ModuleItem[]): ModuleItem[] => {
      if (!incoming || incoming.length === 0) return current;
      
      const incomingMap = new Map<string, ModuleItem>();
      incoming.forEach(m => incomingMap.set(String(m.id), m));

      // 1. Process incoming items, merging local lessons if Firestore returned empty lessons
      const mergedIncoming = incoming.map(inc => {
        const local = current.find(c => String(c.id) === String(inc.id));
        const localLessons = (local && Array.isArray(local.lessons)) ? local.lessons : [];
        const incLessons = (inc && Array.isArray(inc.lessons)) ? inc.lessons : [];

        // Check dedicated local module cache
        let cachedLessons: LessonItem[] = [];
        try {
          const cached = localStorage.getItem(`ens_module_lessons_${inc.id}`);
          if (cached) cachedLessons = JSON.parse(cached);
        } catch {
          cachedLessons = [];
        }

        // Deduplicate lessons by string ID and apply automated like growth algorithm
        const lessonMap = new Map<string, LessonItem>();
        incLessons.forEach(l => lessonMap.set(String(l.id), l));
        localLessons.forEach(l => {
          if (!lessonMap.has(String(l.id))) lessonMap.set(String(l.id), l);
        });
        cachedLessons.forEach(l => {
          if (!lessonMap.has(String(l.id))) lessonMap.set(String(l.id), l);
        });

        const now = Date.now();
        const processedLessons = Array.from(lessonMap.values()).map(l => {
          const automatedLikes = calculateAutomatedLikes(l, now);
          return {
            ...l,
            likesCount: Math.max(l.likesCount || 0, automatedLikes),
          };
        });

        return {
          ...inc,
          lessons: processedLessons,
        };
      });

      // 2. Keep any locally created modules that haven't synced to Firestore yet
      const missingLocals = current.filter(c => !incomingMap.has(String(c.id)));

      return [...missingLocals, ...mergedIncoming];
    };

    const unsubYear1 = subscribeModules('first', (modules) => {
      if (modules && modules.length > 0) {
        setYear1Modules(prev => mergeIncomingModules(prev, modules));
      }
    });

    const unsubYear2 = subscribeModules('second', (modules) => {
      if (modules && modules.length > 0) {
        setYear2Modules(prev => mergeIncomingModules(prev, modules));
      }
    });

    return () => {
      unsubYear1();
      unsubYear2();
    };
  }, []);

  // Save to LocalStorage as optimistic backup
  useEffect(() => {
    try {
      localStorage.setItem('ens_medea_v6_year1', JSON.stringify(year1Modules));
    } catch (e) {
      console.error(e);
    }
  }, [year1Modules]);

  useEffect(() => {
    try {
      localStorage.setItem('ens_medea_v6_year2', JSON.stringify(year2Modules));
    } catch (e) {
      console.error(e);
    }
  }, [year2Modules]);

  // Periodic Automated Like Growth Sync (updates every 60 seconds)
  useEffect(() => {
    const syncAutomatedLikes = () => {
      const now = Date.now();

      // Check year1 modules
      setYear1Modules(prevModules => {
        let changed = false;
        const nextModules = prevModules.map(mod => {
          const { updatedLessons, hasChanges } = applyAutomatedLikesToLessons(mod.lessons || [], now);
          if (hasChanges) {
            changed = true;
            // Background sync to Firestore
            updateModuleLessonsInFirestore('first', mod.id, updatedLessons).catch(() => {});
            return { ...mod, lessons: updatedLessons };
          }
          return mod;
        });
        return changed ? nextModules : prevModules;
      });

      // Check year2 modules
      setYear2Modules(prevModules => {
        let changed = false;
        const nextModules = prevModules.map(mod => {
          const { updatedLessons, hasChanges } = applyAutomatedLikesToLessons(mod.lessons || [], now);
          if (hasChanges) {
            changed = true;
            // Background sync to Firestore
            updateModuleLessonsInFirestore('second', mod.id, updatedLessons).catch(() => {});
            return { ...mod, lessons: updatedLessons };
          }
          return mod;
        });
        return changed ? nextModules : prevModules;
      });
    };

    // Run once after initial mount and then periodically every minute
    const timeoutId = setTimeout(syncAutomatedLikes, 5000);
    const intervalId = setInterval(syncAutomatedLikes, 60000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Modals state for content creation
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleThumbnailUrl, setNewModuleThumbnailUrl] = useState('');
  const [isUploadingModuleThumbnail, setIsUploadingModuleThumbnail] = useState(false);
  const moduleInputRef = useRef<HTMLInputElement>(null);

  // Edit Module state (Admin only)
  const [editingModule, setEditingModule] = useState<ModuleItem | null>(null);
  const [editModuleName, setEditModuleName] = useState('');
  const [editModuleThumbnailUrl, setEditModuleThumbnailUrl] = useState('');
  const [isUploadingEditModuleThumbnail, setIsUploadingEditModuleThumbnail] = useState(false);

  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState('محاضرة');
  const [newLessonDescription, setNewLessonDescription] = useState('');
  
  const [newLessonDate, setNewLessonDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Staged attachments & upload state for adding lessons
  const [stagedImages, setStagedImages] = useState<AttachedImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);
  const [stagedPdfs, setStagedPdfs] = useState<AttachedPdf[]>([]);
  const [customPdfCoverUrl, setCustomPdfCoverUrl] = useState('');
  const lessonTitleInputRef = useRef<HTMLInputElement>(null);

  // Edit Lesson state (Admin only)
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonType, setEditLessonType] = useState('محاضرة');
  const [editLessonDescription, setEditLessonDescription] = useState('');
  const [editLessonDate, setEditLessonDate] = useState('');
  const [editStagedImages, setEditStagedImages] = useState<AttachedImage[]>([]);
  const [editStagedPdfs, setEditStagedPdfs] = useState<AttachedPdf[]>([]);
  const [isUploadingEditImages, setIsUploadingEditImages] = useState(false);

  // Search in module lessons
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');

  // Lightbox / Carousel viewer state
  const [lightboxImages, setLightboxImages] = useState<AttachedImage[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Instagram-style Slide-up / Pop-up Comments Modal
  const [commentsModalLesson, setCommentsModalLesson] = useState<LessonItem | null>(null);
  const [modalCommentInput, setModalCommentInput] = useState<string>('');
  const [commentPendingNotice, setCommentPendingNotice] = useState<string | null>(null);

  // Focus modal inputs
  useEffect(() => {
    if (isAddModuleModalOpen) {
      setTimeout(() => moduleInputRef.current?.focus(), 60);
    }
  }, [isAddModuleModalOpen]);

  useEffect(() => {
    if (isAddLessonModalOpen) {
      setTimeout(() => lessonTitleInputRef.current?.focus(), 60);
    }
  }, [isAddLessonModalOpen]);

  // Handle keyboard events (ESC, Arrow keys for Lightbox)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImages) {
          setLightboxImages(null);
        } else if (commentsModalLesson) {
          setCommentsModalLesson(null);
        } else if (editingLesson) {
          setEditingLesson(null);
        } else if (editingModule) {
          setEditingModule(null);
        } else {
          setIsAddModuleModalOpen(false);
          setIsAddLessonModalOpen(false);
          setIsAdminLoginModalOpen(false);
          setIsAdminSetupModalOpen(false);
        }
      } else if (lightboxImages) {
        if (e.key === 'ArrowRight') {
          handleNextLightboxImage();
        } else if (e.key === 'ArrowLeft') {
          handlePrevLightboxImage();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImages, lightboxIndex, commentsModalLesson, editingLesson, editingModule]);

  // Secret Admin Trigger Fix (7-Tap Gesture): COMPLETELY SILENT AND INVISIBLE
  const handleLogoTap = async () => {
    if (logoTapTimeoutRef.current) {
      clearTimeout(logoTapTimeoutRef.current);
    }

    const nextCount = logoTapCount + 1;

    if (nextCount >= 7) {
      setLogoTapCount(0);
      setAdminAuthError(null);
      setAdminUsernameInput('');
      setAdminPasswordInput('');

      if (isAdmin) {
        setAdminSuccessNotification('أنت مسجل حالياً كمسؤول المنصة');
        setTimeout(() => setAdminSuccessNotification(null), 3000);
        return;
      }

      const exists = await checkAdminAccountExists();
      if (!exists) {
        setIsAdminSetupModalOpen(true);
      } else {
        setIsAdminLoginModalOpen(true);
      }
    } else {
      setLogoTapCount(nextCount);
      logoTapTimeoutRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, 2500);
    }
  };

  // Submit Admin Account Creation
  const handleCreateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsernameInput.trim() || !adminPasswordInput.trim()) {
      setAdminAuthError('يرجى ملء اسم المستخدم وكلمة المرور');
      return;
    }

    setAdminAuthLoading(true);
    setAdminAuthError(null);

    try {
      await createSingleAdminAccount(adminUsernameInput, adminPasswordInput);
      setIsAdmin(true);
      setIsAdminSetupModalOpen(false);
      setAdminSuccessNotification('تم إنشاء وتفعيل حساب المسؤول الرئيسي بنجاح');
      setTimeout(() => setAdminSuccessNotification(null), 3500);
    } catch (err: any) {
      setAdminAuthError(err.message || 'حدث خطأ أثناء إنشاء حساب المسؤول');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  // Submit Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsernameInput.trim() || !adminPasswordInput.trim()) {
      setAdminAuthError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setAdminAuthLoading(true);
    setAdminAuthError(null);

    try {
      const isValid = await verifyAdminLogin(adminUsernameInput, adminPasswordInput);
      if (isValid) {
        setIsAdmin(true);
        setIsAdminLoginModalOpen(false);
        setAdminSuccessNotification('تم تسجيل دخول المسؤول بنجاح');
        setTimeout(() => setAdminSuccessNotification(null), 3500);
      } else {
        setAdminAuthError('بيانات الدخول غير صحيحة. يرجى التحقق وإعادة المحاولة.');
      }
    } catch (err) {
      setAdminAuthError('فشل التحقق من حساب المسؤول');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
    setAdminSuccessNotification('تم قفل وضع المسؤول والعودة للوضع العادي');
    setTimeout(() => setAdminSuccessNotification(null), 3000);
  };

  const currentModules = (selectedYear === 'first' ? year1Modules : year2Modules).filter(m => {
    const modSpec = m.specializationId || 'pep-arabe';
    return modSpec === selectedSpecializationId;
  });
  const allModules = [...year1Modules, ...year2Modules];
  const activeModule = allModules.find(m => String(m.id) === String(activeModuleId)) || null;
  const activeSpecialization = specializations.find(s => s.id === selectedSpecializationId) || specializations[0] || { id: 'pep-arabe', name: 'PEP arabe' };

  // Lessons strictly associated with active module by String ID matching and local dedicated cache
  const activeModuleLessons: LessonItem[] = (() => {
    if (!activeModule) return [];
    const directLessons = Array.isArray(activeModule.lessons) ? activeModule.lessons : [];

    let cachedLessons: LessonItem[] = [];
    try {
      const cached = localStorage.getItem(`ens_module_lessons_${activeModule.id}`);
      if (cached) {
        cachedLessons = JSON.parse(cached);
      }
    } catch {
      cachedLessons = [];
    }

    const lessonMap = new Map<string, LessonItem>();
    directLessons.forEach(l => lessonMap.set(String(l.id), { ...l, moduleId: String(activeModule.id) }));
    cachedLessons.forEach(l => {
      if (!lessonMap.has(String(l.id))) {
        lessonMap.set(String(l.id), { ...l, moduleId: String(activeModule.id) });
      }
    });

    const list = Array.from(lessonMap.values());
    return list.filter(l => !l.moduleId || String(l.moduleId) === String(activeModule.id));
  })();

  // Year Switch Handler
  const handleSelectYear = (year: 'first' | 'second') => {
    setSelectedYear(year);
    setActiveModuleId(null);
    setLessonSearchQuery('');
  };

  // Specialization Handlers (Admin Only)
  const handleAddSpecialization = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;
    const trimmed = newSpecializationName.trim();
    if (!trimmed) return;

    const newSpec: SpecializationItem = {
      id: `spec-${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
    };

    const updated = [...specializations, newSpec];
    setSpecializations(updated);
    setSelectedSpecializationId(newSpec.id);
    setActiveModuleId(null);
    setNewSpecializationName('');
    setIsAddSpecializationModalOpen(false);
    setAdminSuccessNotification(`تمت إضافة تخصص (${trimmed}) بنجاح`);
    setTimeout(() => setAdminSuccessNotification(null), 3000);

    try {
      await saveSpecializationsToFirestore(updated);
    } catch (err) {
      console.warn('Firebase save specializations error:', err);
    }
  };

  const handleDeleteSpecialization = async (specId: string, specName: string) => {
    if (!isAdmin || specId === 'pep-arabe') return;
    const updated = specializations.filter(s => s.id !== specId);
    setSpecializations(updated);
    if (selectedSpecializationId === specId) {
      setSelectedSpecializationId('pep-arabe');
      setActiveModuleId(null);
    }
    setAdminSuccessNotification(`تم حذف تخصص (${specName}) بنجاح`);
    setTimeout(() => setAdminSuccessNotification(null), 3000);

    try {
      await saveSpecializationsToFirestore(updated);
    } catch (err) {
      console.warn('Firebase delete specialization error:', err);
    }
  };

  // Upload thumbnail for module creation
  const handleModuleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingModuleThumbnail(true);
    try {
      const url = await uploadImageToImgBB(file);
      if (url) {
        setNewModuleThumbnailUrl(url);
      }
    } catch (err) {
      console.warn('Module thumbnail upload error:', err);
    } finally {
      setIsUploadingModuleThumbnail(false);
      e.target.value = '';
    }
  };

  // Upload thumbnail for module editing
  const handleEditModuleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingEditModuleThumbnail(true);
    try {
      const url = await uploadImageToImgBB(file);
      if (url) {
        setEditModuleThumbnailUrl(url);
      }
    } catch (err) {
      console.warn('Edit module thumbnail upload error:', err);
    } finally {
      setIsUploadingEditModuleThumbnail(false);
      e.target.value = '';
    }
  };

  // 5. Add Module with Optional Thumbnail (Admin only)
  const handleAddModule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;
    const trimmed = newModuleName.trim();
    if (!trimmed) return;

    const newModule: ModuleItem = {
      id: `${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toLocaleDateString('ar-DZ'),
      thumbnailUrl: newModuleThumbnailUrl.trim() || undefined,
      specializationId: selectedSpecializationId,
      lessons: [],
    };

    if (selectedYear === 'first') {
      setYear1Modules(prev => [newModule, ...prev]);
    } else {
      setYear2Modules(prev => [newModule, ...prev]);
    }

    setNewModuleName('');
    setNewModuleThumbnailUrl('');
    setIsAddModuleModalOpen(false);

    try {
      await addModuleToFirestore(selectedYear, newModule);
    } catch (err) {
      console.warn('Firebase add module error, kept in local cache:', err);
    }
  };

  // Open Edit Module Modal
  const handleOpenEditModule = (e: React.MouseEvent, mod: ModuleItem) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingModule(mod);
    setEditModuleName(mod.name);
    setEditModuleThumbnailUrl(mod.thumbnailUrl || '');
  };

  // Save Edited Module (Admin only)
  const handleSaveEditedModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !isAdmin) return;
    const trimmed = editModuleName.trim();
    if (!trimmed) return;

    const updatedMod: ModuleItem = {
      ...editingModule,
      name: trimmed,
      thumbnailUrl: editModuleThumbnailUrl.trim() || undefined,
    };

    if (selectedYear === 'first') {
      setYear1Modules(prev => prev.map(m => m.id === updatedMod.id ? updatedMod : m));
    } else {
      setYear2Modules(prev => prev.map(m => m.id === updatedMod.id ? updatedMod : m));
    }

    setEditingModule(null);
    setAdminSuccessNotification('تم تعديل بيانات المقياس والغلاف بنجاح');
    setTimeout(() => setAdminSuccessNotification(null), 3000);

    try {
      await addModuleToFirestore(selectedYear, updatedMod);
    } catch (err) {
      console.warn('Firebase update module error:', err);
    }
  };

  // Delete Module (Admin only)
  const handleDeleteModule = async (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    if (!isAdmin) return;

    if (selectedYear === 'first') {
      setYear1Modules(prev => prev.filter(m => m.id !== moduleId));
    } else {
      setYear2Modules(prev => prev.filter(m => m.id !== moduleId));
    }
    if (activeModuleId === moduleId) {
      setActiveModuleId(null);
      setLessonSearchQuery('');
    }

    try {
      await deleteModuleFromFirestore(selectedYear, moduleId);
    } catch (err) {
      console.warn('Firebase delete module error:', err);
    }
  };

  // Helper to persist updated lessons for a module into Firestore and state
  // Helper to persist updated lessons for a module into Firestore and state
  const syncModuleLessons = async (newLessons: LessonItem[]) => {
    if (!activeModuleId) return;

    const targetIdStr = String(activeModuleId);

    // 1. Tag all lessons strictly with current module ID
    const taggedLessons = newLessons.map(l => ({
      ...l,
      moduleId: targetIdStr,
    }));

    const updateModuleList = (modules: ModuleItem[]) =>
      modules.map(mod => {
        if (String(mod.id) === targetIdStr) {
          return {
            ...mod,
            lessons: taggedLessons,
          };
        }
        return mod;
      });

    // 2. Immediately update local React state for both years
    setYear1Modules(prev => updateModuleList(prev));
    setYear2Modules(prev => updateModuleList(prev));

    // 3. Persist optimistic backup to dedicated module LocalStorage and year caches
    try {
      localStorage.setItem(`ens_module_lessons_${targetIdStr}`, JSON.stringify(taggedLessons));
      localStorage.setItem('ens_medea_v6_year1', JSON.stringify(updateModuleList(year1Modules)));
      localStorage.setItem('ens_medea_v6_year2', JSON.stringify(updateModuleList(year2Modules)));
    } catch (e) {
      console.warn('LocalStorage backup sync notice:', e);
    }

    // 4. Accurately identify which year collection the module belongs to
    const targetYear = year1Modules.some(m => String(m.id) === targetIdStr) ? 'first' : 'second';

    // 5. Sync to Firestore in the background
    try {
      await updateModuleLessonsInFirestore(targetYear, targetIdStr, taggedLessons);
    } catch (err) {
      console.warn('Firebase lessons update notice:', err);
    }
  };

  // ImgBB Cloud Upload Handler for Multiple Images (Add Modal)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingImages(true);

    try {
      for (const file of files) {
        try {
          const imgUrl = await uploadImageToImgBB(file);
          if (imgUrl) {
            setStagedImages(prev => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                url: imgUrl,
                name: file.name || 'image.jpg',
              },
            ]);
          }
        } catch (err) {
          console.warn('ImgBB upload error:', err);
        }
      }
    } finally {
      setIsUploadingImages(false);
      e.target.value = '';
    }
  };

  // Staged PDF File Input Handler (Add Modal)
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = (event) => {
        setStagedPdfs(prev => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name || 'document.pdf',
            size: sizeStr,
            url: (event.target?.result as string) || '#',
            coverImageUrl: customPdfCoverUrl.trim() || undefined,
          },
        ]);
        setCustomPdfCoverUrl('');
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Add Lesson (Admin only)
  const handleAddLesson = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isAdmin || !activeModuleId) return;
    const trimmedTitle = newLessonTitle.trim();
    if (!trimmedTitle) return;

    setIsSubmittingLesson(true);

    try {
      const targetIdStr = String(activeModuleId);
      // Find the target module safely across all sources
      const targetModule = 
        year1Modules.find(m => String(m.id) === targetIdStr) || 
        year2Modules.find(m => String(m.id) === targetIdStr) || 
        activeModule;

      const existingLessons = (targetModule && Array.isArray(targetModule.lessons)) 
        ? targetModule.lessons 
        : activeModuleLessons;

      // Use custom publication date if provided by Admin
      let chosenTimestamp = Date.now();
      let chosenDateText = new Date().toLocaleDateString('ar-DZ');
      if (newLessonDate) {
        const parsed = new Date(newLessonDate);
        if (!isNaN(parsed.getTime())) {
          chosenTimestamp = parsed.getTime();
          chosenDateText = parsed.toLocaleDateString('ar-DZ');
        }
      }

      const tempLessonId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      // Strict Rule 1: Every newly created lesson MUST initialize with exactly 0 likes
      const initialLikes = 0;

      const newLesson: LessonItem = {
        id: tempLessonId,
        moduleId: targetIdStr,
        title: trimmedTitle,
        type: newLessonType || 'محاضرة',
        description: newLessonDescription.trim(),
        images: Array.isArray(stagedImages) ? [...stagedImages] : [],
        pdfs: Array.isArray(stagedPdfs) ? [...stagedPdfs] : [],
        likesCount: initialLikes,
        userLikes: 0,
        isLiked: false,
        isPinned: false,
        timestamp: chosenTimestamp,
        comments: [],
        createdAt: chosenDateText,
      };

      const updatedLessons = [newLesson, ...existingLessons];

      // Update state immediately so lesson is visible right away in module feed
      await syncModuleLessons(updatedLessons);

      // Clean up form state and close modal
      setNewLessonTitle('');
      setNewLessonDescription('');
      setNewLessonDate(new Date().toISOString().split('T')[0]);
      setStagedImages([]);
      setStagedPdfs([]);
      setCustomPdfCoverUrl('');
      setIsAddLessonModalOpen(false);

      setAdminSuccessNotification('تم نشر الدرس بنجاح في المقياس');
      setTimeout(() => setAdminSuccessNotification(null), 3000);
    } catch (err) {
      console.error('Error publishing lesson:', err);
      setAdminSuccessNotification('حدث خطأ أثناء نشر الدرس، يرجى إعادة المحاولة');
      setTimeout(() => setAdminSuccessNotification(null), 3500);
    } finally {
      setIsSubmittingLesson(false);
    }
  };

  // Delete Lesson (Admin only)
  const handleDeleteLesson = async (lessonId: string) => {
    if (!isAdmin || !activeModuleId) return;
    const targetIdStr = String(lessonId);
    const updatedLessons = activeModuleLessons.filter(l => String(l.id) !== targetIdStr);
    await syncModuleLessons(updatedLessons);
    if (commentsModalLesson && String(commentsModalLesson.id) === targetIdStr) {
      setCommentsModalLesson(null);
    }
  };

  // Pin / Unpin Post (Admin only)
  const handleTogglePinLesson = async (lessonId: string) => {
    if (!isAdmin || !activeModuleId) return;
    const targetIdStr = String(lessonId);
    const updatedLessons = activeModuleLessons.map(l => {
      if (String(l.id) === targetIdStr) {
        return {
          ...l,
          isPinned: !l.isPinned,
        };
      }
      return l;
    });
    await syncModuleLessons(updatedLessons);
  };

  // OPEN EDIT LESSON MODAL (Admin only)
  const handleOpenEditLesson = (lesson: LessonItem) => {
    if (!isAdmin) return;
    setEditingLesson(lesson);
    setEditLessonTitle(lesson.title);
    setEditLessonType(lesson.type || 'محاضرة');
    setEditLessonDescription(lesson.description || '');
    setEditStagedImages([...(lesson.images || [])]);
    setEditStagedPdfs([...(lesson.pdfs || [])]);

    // Pre-fill date picker with post publication date
    if (lesson.timestamp && !isNaN(lesson.timestamp)) {
      try {
        setEditLessonDate(new Date(lesson.timestamp).toISOString().split('T')[0]);
      } catch {
        setEditLessonDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      setEditLessonDate(new Date().toISOString().split('T')[0]);
    }
  };

  // Upload Images inside Edit Modal
  const handleEditImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingEditImages(true);

    for (const file of files) {
      try {
        const imgUrl = await uploadImageToImgBB(file);
        if (imgUrl) {
          setEditStagedImages(prev => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              url: imgUrl,
              name: file.name,
            },
          ]);
        }
      } catch (err) {
        console.warn('ImgBB edit upload error:', err);
      }
    }

    setIsUploadingEditImages(false);
    e.target.value = '';
  };

  // Staged PDF File Input Handler (Edit Modal)
  const handleEditPdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = (event) => {
        setEditStagedPdfs(prev => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            size: sizeStr,
            url: (event.target?.result as string) || '#',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // SAVE EDITED LESSON (Admin only)
  const handleSaveEditedLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !activeModuleId || !activeModule) return;
    const trimmedTitle = editLessonTitle.trim();
    if (!trimmedTitle) return;

    let chosenTimestamp = editingLesson.timestamp || Date.now();
    let chosenDateText = editingLesson.createdAt;
    if (editLessonDate) {
      const parsed = new Date(editLessonDate);
      if (!isNaN(parsed.getTime())) {
        chosenTimestamp = parsed.getTime();
        chosenDateText = parsed.toLocaleDateString('ar-DZ');
      }
    }

    const editIdStr = String(editingLesson.id);
    const updatedLessons = activeModuleLessons.map(l => {
      if (String(l.id) === editIdStr) {
        return {
          ...l,
          title: trimmedTitle,
          type: editLessonType,
          description: editLessonDescription.trim(),
          images: editStagedImages,
          pdfs: editStagedPdfs,
          createdAt: chosenDateText,
          timestamp: chosenTimestamp,
        };
      }
      return l;
    });

    await syncModuleLessons(updatedLessons);
    setEditingLesson(null);
    setAdminSuccessNotification('تم تعديل وحفظ بيانات المنشور وتاريخ النشر بنجاح');
    setTimeout(() => setAdminSuccessNotification(null), 3000);
  };

  // Toggle Like on Lesson (Open to all users)
  const handleToggleLike = async (lessonId: string) => {
    if (!activeModuleId) return;

    const targetIdStr = String(lessonId);
    const updatedLessons = activeModuleLessons.map(l => {
      if (String(l.id) === targetIdStr) {
        const nextLiked = !l.isLiked;
        const currentUserLikes = typeof l.userLikes === 'number' ? l.userLikes : (l.isLiked ? 1 : 0);
        const nextUserLikes = nextLiked ? currentUserLikes + 1 : Math.max(0, currentUserLikes - 1);
        
        // Calculate new likes total with user delta
        const automatedLikes = calculateAutomatedLikes({ ...l, userLikes: nextUserLikes }, Date.now());
        const previousLikes = typeof l.likesCount === 'number' ? l.likesCount : 0;
        const newLikesCount = nextLiked
          ? Math.max(previousLikes + 1, automatedLikes)
          : Math.max(0, previousLikes - 1);

        return {
          ...l,
          isLiked: nextLiked,
          userLikes: nextUserLikes,
          likesCount: newLikesCount,
        };
      }
      return l;
    });

    await syncModuleLessons(updatedLessons);

    // If modal is open for this lesson, sync it
    if (commentsModalLesson && String(commentsModalLesson.id) === targetIdStr) {
      const updated = updatedLessons.find(l => String(l.id) === targetIdStr);
      if (updated) setCommentsModalLesson(updated);
    }
  };

  // COMMENTS SYSTEM: Admin ("KAOUANE fares") vs Visitor ("مجهول الهوية #XXXX" + Moderation Queue)
  const handleAddComment = async (lessonId: string, textToAdd: string) => {
    const commentText = textToAdd.trim();
    if (!commentText || !activeModuleId) return;

    const targetIdStr = String(lessonId);
    const newComment: CommentItem = {
      id: `${Date.now()}-${Math.random()}`,
      author: isAdmin ? 'KAOUANE fares' : `مجهول الهوية #${getSessionAnonId()}`,
      text: commentText,
      createdAt: 'الآن',
      isAdmin: isAdmin,
      isApproved: isAdmin, // Admin comments are immediately approved; visitor comments require moderation
      avatarUrl: isAdmin ? ADMIN_AVATAR_URL : undefined,
    };

    const updatedLessons = activeModuleLessons.map(l => {
      if (String(l.id) === targetIdStr) {
        return {
          ...l,
          comments: [...(l.comments || []), newComment],
        };
      }
      return l;
    });

    await syncModuleLessons(updatedLessons);

    // Sync active comments modal
    if (commentsModalLesson && String(commentsModalLesson.id) === targetIdStr) {
      const updated = updatedLessons.find(l => String(l.id) === targetIdStr);
      if (updated) setCommentsModalLesson(updated);
    }

    if (!isAdmin) {
      setCommentPendingNotice('تم إرسال تعليقك بنجاح وهو بانتظار موافقة وقبول الأستاذ');
      setTimeout(() => setCommentPendingNotice(null), 4000);
    }
  };

  // Admin approves a pending comment
  const handleApproveComment = async (lessonId: string, commentId: string) => {
    if (!isAdmin || !activeModuleId) return;

    const targetIdStr = String(lessonId);
    const targetCommIdStr = String(commentId);
    const updatedLessons = activeModuleLessons.map(l => {
      if (String(l.id) === targetIdStr) {
        return {
          ...l,
          comments: (l.comments || []).map(c => {
            if (String(c.id) === targetCommIdStr) {
              return { ...c, isApproved: true };
            }
            return c;
          }),
        };
      }
      return l;
    });

    await syncModuleLessons(updatedLessons);
    if (commentsModalLesson && String(commentsModalLesson.id) === targetIdStr) {
      const updated = updatedLessons.find(l => String(l.id) === targetIdStr);
      if (updated) setCommentsModalLesson(updated);
    }
  };

  // Admin deletes a comment
  const handleDeleteComment = async (lessonId: string, commentId: string) => {
    if (!isAdmin || !activeModuleId) return;

    const targetIdStr = String(lessonId);
    const targetCommIdStr = String(commentId);
    const updatedLessons = activeModuleLessons.map(l => {
      if (String(l.id) === targetIdStr) {
        return {
          ...l,
          comments: (l.comments || []).filter(c => String(c.id) !== targetCommIdStr),
        };
      }
      return l;
    });

    await syncModuleLessons(updatedLessons);
    if (commentsModalLesson && String(commentsModalLesson.id) === targetIdStr) {
      const updated = updatedLessons.find(l => String(l.id) === targetIdStr);
      if (updated) setCommentsModalLesson(updated);
    }
  };

  // Download Trigger Utility
  const triggerDownload = (url?: string, filename = 'document.pdf') => {
    if (!url || url === '#') {
      const blob = new Blob([`ENS Medea Document: ${filename}`], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Multi-Image Sequential Download
  const handleDownloadAllPostImages = async (images: AttachedImage[], postTitle: string) => {
    if (!images || images.length === 0) return;

    setAdminSuccessNotification(`جاري تحميل كافة الصور (${images.length} صور)...`);
    setTimeout(() => setAdminSuccessNotification(null), 3000);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const safeTitle = (postTitle || 'image').slice(0, 20).replace(/\s+/g, '_');
      const filename = img.name || `${safeTitle}_${i + 1}.jpg`;
      triggerDownload(img.url, filename);
      if (i < images.length - 1) {
        await new Promise(res => setTimeout(res, 350));
      }
    }
  };

  // Lightbox Handlers
  const handleOpenLightbox = (images: AttachedImage[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const handleNextLightboxImage = () => {
    if (!lightboxImages) return;
    setLightboxIndex(prev => (prev + 1) % lightboxImages.length);
  };

  const handlePrevLightboxImage = () => {
    if (!lightboxImages) return;
    setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  // Sort lessons dynamically: Pinned posts always on top, followed by newest to oldest
  const sortedLessons = activeModule
    ? [...activeModuleLessons].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.timestamp || Number(a.id) || 0;
        const timeB = b.timestamp || Number(b.id) || 0;
        return timeB - timeA;
      })
    : [];

  // Filter lessons in module by search query
  const filteredLessons = sortedLessons.filter(lesson => {
    if (!lessonSearchQuery.trim()) return true;
    const q = lessonSearchQuery.toLowerCase().trim();
    const titleMatch = (lesson.title || '').toLowerCase().includes(q);
    const descMatch = (lesson.description || '').toLowerCase().includes(q);
    const typeMatch = (lesson.type || '').toLowerCase().includes(q);
    const imgMatch = (lesson.images || []).some(img => (img.name || '').toLowerCase().includes(q));
    const pdfMatch = (lesson.pdfs || []).some(pdf => (pdf.name || '').toLowerCase().includes(q));
    return titleMatch || descMatch || typeMatch || imgMatch || pdfMatch;
  });

  return (
    <div className="min-h-screen bg-white text-black font-['Cairo',sans-serif] selection:bg-black selection:text-white">
      
      {/* 1. Top Header Bar: Slim, compact height (54px-60px) with prominent, larger logo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 h-14 sm:h-[60px] max-h-14 sm:max-h-[60px] px-3 sm:px-6 md:px-8 shadow-2xs w-full flex items-center">
        <div className="w-full flex items-center justify-between gap-3 h-full">
          
          {/* Far Left Side: App Logo */}
          <div className="flex items-center h-full shrink-0" dir="ltr">
            {/* Logo Image (7-Tap Hidden Trigger: COMPLETELY SILENT AND INVISIBLE) */}
            <div 
              onClick={handleLogoTap}
              className="flex items-center justify-center cursor-pointer select-none group relative h-full py-0.5"
              title="ENS Medea"
            >
              <img 
                src={logoAsset} 
                alt="ENS Medea Logo" 
                className="h-12 sm:h-[52px] w-auto max-h-[55px] object-contain transition-transform duration-200 active:scale-95 hover:opacity-95 rounded-sm scale-110 sm:scale-120 origin-left"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = NEW_LOGO_URL;
                }}
              />
            </div>
          </div>

          {/* Right side: Back button at extreme opposite side of the app logo + Admin Actions */}
          <div className="flex items-center gap-2 sm:gap-3" dir="rtl">
            {/* Return Button: Moved to the extreme opposite direction of the app logo (Far-Right in RTL) */}
            {activeModule && (
              <button
                type="button"
                onClick={() => {
                  setActiveModuleId(null);
                  setLessonSearchQuery('');
                }}
                className="p-1.5 sm:p-2 rounded-xl text-black hover:bg-neutral-100 transition-all duration-150 cursor-pointer group flex items-center justify-center shrink-0 border border-neutral-200 shadow-2xs"
                title="العودة لقائمة المقاييس"
                aria-label="العودة"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform"
                >
                  <path d="M15 14l5-5-5-5" />
                  <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
                </svg>
              </button>
            )}
            
            {/* Admin Status & Logout */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-neutral-200">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 text-black text-xs font-semibold border border-neutral-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-black" />
                  <span>وضع الإدارة نشط</span>
                </span>

                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors"
                  title="تسجيل خروج المشرف (قفل الإدارة)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ADMIN-ONLY BUTTONS (Completely hidden from normal viewers) */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddModuleModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all duration-150 shadow-xs cursor-pointer"
                  title="إنشاء مقياس جديد"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>إنشاء مقياس</span>
                </button>

                {activeModule && (
                  <button
                    type="button"
                    onClick={() => setIsAddLessonModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all duration-150 shadow-xs cursor-pointer animate-in fade-in"
                    title="نشر درس جديد"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>نشر درس</span>
                  </button>
                )}
              </>
            )}

          </div>

        </div>
      </header>

      {/* Admin Notification Banner */}
      {adminSuccessNotification && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="p-3.5 bg-black text-white border border-neutral-800 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>{adminSuccessNotification}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Container */}
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-6 sm:py-8" dir="rtl">
        
        {/* VIEW 1: MODULES GRID (when no module is opened) */}
        {!activeModule && (
          <div className="space-y-8 animate-in fade-in duration-150">
            
            {/* Year Selection Tabs (Clean Monochrome - Swapped Order) */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleSelectYear('second')}
                  className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    selectedYear === 'second'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                  }`}
                >
                  السنة الثانية
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectYear('first')}
                  className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    selectedYear === 'first'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                  }`}
                >
                  السنة الأولى
                </button>
              </div>
            </div>

            {/* Section Header: PEP arabe & Telegram Group Link */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h2 className="text-base sm:text-lg font-bold text-black font-sans">
                PEP arabe
              </h2>

              <a
                href="https://t.me/profArabe15"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all duration-150 shadow-2xs group"
                title="مجموعتنا على تلغرام"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                <span>مجموعتنا على تلغرام</span>
              </a>
            </div>

            {/* Empty State vs Modules Grid */}
            {currentModules.length === 0 ? (
              <div className="space-y-6">
                <div 
                  onClick={() => {
                    if (isAdmin) setIsAddModuleModalOpen(true);
                  }}
                  className={`w-full h-56 bg-neutral-50 rounded-3xl border border-dashed border-neutral-300 flex flex-col items-center justify-center p-6 text-center ${
                    isAdmin ? 'cursor-pointer hover:bg-neutral-100' : ''
                  }`}
                >
                  <p className="text-sm font-bold text-neutral-800">لا توجد مقاييس مضافة في هذه السنة بعد</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    {isAdmin ? 'انقر هنا أو على زر "إنشاء مقياس" لإضافة أول مقياس' : 'سيتم نشر المقاييس والدروس من طرف المشرف قريباً'}
                  </p>
                </div>

                <div className="w-full h-56 bg-neutral-50/50 rounded-3xl border border-neutral-200" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentModules.map((mod, index) => {
                  const hasCover = Boolean(mod.thumbnailUrl);

                  if (hasCover) {
                    {/* 5. Module Card WITH Full-Bleed Background Image Filling Entire Card Area */}
                    return (
                      <div
                        key={mod.id}
                        onClick={() => setActiveModuleId(mod.id)}
                        className="group relative rounded-3xl overflow-hidden min-h-[220px] sm:min-h-[240px] flex flex-col justify-between p-6 shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer border border-neutral-200"
                      >
                        {/* Background image filling the entire card */}
                        <img 
                          src={mod.thumbnailUrl} 
                          alt={mod.name} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* High-contrast gradient overlay ensuring crystal-clear text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30 group-hover:from-black/95 transition-colors" />

                        {/* Top Row: Index Badge + Admin Edit/Delete Actions */}
                        <div className="relative z-10 flex items-start justify-between gap-4">
                          <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md text-white font-mono text-xs font-bold flex items-center justify-center border border-white/30">
                            {index + 1}
                          </span>

                          {isAdmin && (
                            <div 
                              className="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/20" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditModule(e, mod)}
                                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                title="تعديل المقياس والغلاف"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteModule(e, mod.id)}
                                className="text-white/80 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                title="حذف المقياس"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bottom Row: Title + Lesson Count + Arrow */}
                        <div className="relative z-10 mt-auto pt-8">
                          <h3 className="text-lg sm:text-xl font-bold text-white leading-snug drop-shadow-xs">
                            {mod.name}
                          </h3>
                          <p className="text-xs text-neutral-300 mt-1 font-mono">
                            {mod.lessons.length} دروس وموارد منشورة
                          </p>

                          <div className="pt-3 mt-3 border-t border-white/20 flex items-center justify-between text-xs text-neutral-200">
                            <span>فتح صفحة المقياس</span>
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  {/* Clean Monochrome Module Card (No cover image attached) */}
                  return (
                    <div
                      key={mod.id}
                      onClick={() => setActiveModuleId(mod.id)}
                      className="group bg-white hover:bg-neutral-50 rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer min-h-[200px]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="w-8 h-8 rounded-xl bg-neutral-100 text-black font-mono text-xs font-bold flex items-center justify-center border border-neutral-200">
                          {index + 1}
                        </span>

                        {isAdmin && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModule(e, mod)}
                              className="text-neutral-400 hover:text-black p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                              title="تعديل المقياس والغلاف"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteModule(e, mod.id)}
                              className="text-neutral-300 hover:text-black p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                              title="حذف المقياس"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="my-4">
                        <h3 className="text-base sm:text-lg font-bold text-black leading-snug">
                          {mod.name}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          {mod.lessons.length} دروس وموارد منشورة
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                        <span>فتح صفحة المقياس</span>
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* 4. VIEW 2: DEDICATED MODULE PAGE (EXPANDED FULL-WIDTH MODERN POST FEED) */}
        {activeModule && (
          <div className="w-full max-w-5xl mx-auto space-y-6 px-1 sm:px-2 animate-in fade-in duration-150">
            
            {/* Module Title Header at the top */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight font-['Readex_Pro',sans-serif]">
                  {activeModule.name}
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  {selectedYear === 'first' ? 'السنة الأولى' : 'السنة الثانية'} · {sortedLessons.length} دروس ومحاضرات
                </p>
              </div>
            </div>

            {/* Sleek Search Bar for Module Lessons */}
            <div className="relative mb-6">
              <div className="relative flex items-center">
                <div className="absolute right-3.5 pointer-events-none text-neutral-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={lessonSearchQuery}
                  onChange={(e) => setLessonSearchQuery(e.target.value)}
                  placeholder="ابحث في دروس ومحاضرات وموارد هذا المقياس..."
                  className="w-full pr-10 pl-10 py-3 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-2xs transition-all"
                />
                {lessonSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLessonSearchQuery('')}
                    className="absolute left-3 p-1 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                    title="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {lessonSearchQuery.trim() && (
                <div className="mt-2 px-1 flex items-center justify-between text-xs text-neutral-500">
                  <span>نتائج البحث عن &quot;{lessonSearchQuery}&quot;: {filteredLessons.length} درس</span>
                  <button
                    type="button"
                    onClick={() => setLessonSearchQuery('')}
                    className="text-black underline hover:no-underline font-medium"
                  >
                    إلغاء البحث
                  </button>
                </div>
              )}
            </div>

            {/* 4. EXPANDED FULL-WIDTH INSTAGRAM-STYLE POSTS FEED */}
            <div className="space-y-7">
              
              {sortedLessons.length === 0 ? (
                /* Empty feed container */
                <div 
                  onClick={() => {
                    if (isAdmin) setIsAddLessonModalOpen(true);
                  }}
                  className={`w-full h-72 bg-neutral-50 rounded-3xl border border-dashed border-neutral-300 flex flex-col items-center justify-center p-8 text-center ${
                    isAdmin ? 'cursor-pointer hover:bg-neutral-100' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black shadow-xs mb-3 border border-neutral-200">
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <p className="text-base font-bold text-neutral-800">لم يتم نشر أي درس بعد في هذا المقياس</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    {isAdmin ? 'استخدم زر "نشر درس" في الأعلى لإرفاق المطبوعات البيداغوجية، الصور، وملفات PDF' : 'سيتم نشر المحتوى قريباً من طرف أستاذ المقياس'}
                  </p>
                </div>
              ) : filteredLessons.length === 0 ? (
                /* No search results */
                <div className="w-full py-16 bg-neutral-50 rounded-3xl border border-neutral-200 text-center p-6">
                  <Search className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-black">لا توجد دروس مطابقة لبحثك</p>
                  <p className="text-xs text-neutral-500 mt-1">جرب البحث بكلمات أخرى أو امسح شريط البحث</p>
                  <button
                    type="button"
                    onClick={() => setLessonSearchQuery('')}
                    className="mt-3 px-4 py-1.5 bg-black text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    إلغاء البحث
                  </button>
                </div>
              ) : (
                filteredLessons.map((lesson) => {
                  const visibleCommentsCount = (lesson.comments || []).filter(c => isAdmin || c.isApproved || c.isAdmin).length;
                  const pendingCount = (lesson.comments || []).filter(c => !c.isApproved && !c.isAdmin).length;
                  const images = lesson.images || [];
                  const pdfs = lesson.pdfs || [];

                  return (
                    <article
                      key={lesson.id}
                      className="w-full bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-2xs hover:shadow-sm transition-all"
                    >
                      {/* Post Header: 
                          - 3. Clean Name KAOUANE fares (Checkmark badge completely REMOVED)
                          - 2. Pin icon completely REMOVED (post stays silently pinned to top)
                          - 2. Date Behavior: When pinned, publication date is HIDDEN completely. When unpinned, date is shown.
                      */}
                      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={ADMIN_AVATAR_URL}
                            alt="KAOUANE fares"
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200 shadow-2xs shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== avatarAsset) {
                                target.src = avatarAsset;
                              } else {
                                target.src = 'https://i.ibb.co/whnGcQmw/1785099526878.jpg';
                              }
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              {/* 3. Name KAOUANE fares ONLY (Verification badge removed) */}
                              <span className="text-sm font-bold text-black font-sans leading-tight">
                                KAOUANE fares
                              </span>
                            </div>

                            {/* 2. Date Behavior for Pinned Posts:
                                When pinned: HIDE publication date completely (show only lesson type).
                                When unpinned: restore and show publication date normally.
                            */}
                            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                              <span>{lesson.type}</span>
                              {!lesson.isPinned && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{lesson.createdAt}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Menu: Pin Post, Edit Post & Delete */}
                        {isAdmin && (
                          <div className="flex items-center gap-1.5">
                            {/* Edit Post Button (Admin only) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditLesson(lesson)}
                              className="p-2 rounded-xl text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                              title="تعديل المنشور"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Pin / Unpin Post Button (Admin control) */}
                            <button
                              type="button"
                              onClick={() => handleTogglePinLesson(lesson.id)}
                              className={`p-2 rounded-xl text-xs transition-colors flex items-center gap-1 ${
                                lesson.isPinned
                                  ? 'text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-300'
                                  : 'text-neutral-400 hover:text-black hover:bg-neutral-100'
                              }`}
                              title={lesson.isPinned ? 'إلغاء تثبيت المنشور (استعادة التاريخ)' : 'تثبيت المنشور في أعلى الخلاصة (إخفاء التاريخ)'}
                            >
                              <Pin className={`w-4 h-4 ${lesson.isPinned ? 'fill-black text-black' : ''}`} />
                            </button>

                            {/* Delete Post Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="text-neutral-300 hover:text-black p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                              title="حذف الدرس"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Post Title */}
                      <div className="px-4 sm:px-6 pt-4 pb-2">
                        <h2 className="text-base sm:text-lg font-bold text-black leading-snug">
                          {lesson.title}
                        </h2>
                      </div>

                      {/* Text Description / Caption Content */}
                      {lesson.description && (
                        <div className="px-4 sm:px-6 pb-3 text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                          {lesson.description}
                        </div>
                      )}

                      {/* Spacious Media Section */}
                      {images.length > 0 && (
                        <div className="px-4 sm:px-6 pb-3">
                          {/* 1 Image: Full Wide Media */}
                          {images.length === 1 && (
                            <div 
                              onClick={() => handleOpenLightbox(images, 0)}
                              className="relative rounded-2xl overflow-hidden cursor-pointer max-h-[580px] bg-neutral-100 border border-neutral-200 group"
                            >
                              <img
                                src={images[0].url}
                                alt={images[0].name}
                                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-200"
                              />
                            </div>
                          )}

                          {/* 2 Images: Side-by-Side */}
                          {images.length === 2 && (
                            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                              {images.map((img, idx) => (
                                <div
                                  key={img.id}
                                  onClick={() => handleOpenLightbox(images, idx)}
                                  className="relative aspect-4/3 overflow-hidden cursor-pointer bg-neutral-100 border border-neutral-200 group"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 3 Images: 1 Top Banner + 2 Columns */}
                          {images.length === 3 && (
                            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                              <div
                                onClick={() => handleOpenLightbox(images, 0)}
                                className="col-span-2 relative aspect-16/9 overflow-hidden cursor-pointer bg-neutral-100 border border-neutral-200 group"
                              >
                                <img
                                  src={images[0].url}
                                  alt={images[0].name}
                                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-200"
                                />
                              </div>
                              {images.slice(1).map((img, idx) => (
                                <div
                                  key={img.id}
                                  onClick={() => handleOpenLightbox(images, idx + 1)}
                                  className="relative aspect-4/3 overflow-hidden cursor-pointer bg-neutral-100 border border-neutral-200 group"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 4 or more Images: 2x2 Grid with +N Overlay on the 4th */}
                          {images.length >= 4 && (
                            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                              {images.slice(0, 3).map((img, idx) => (
                                <div
                                  key={img.id}
                                  onClick={() => handleOpenLightbox(images, idx)}
                                  className="relative aspect-square overflow-hidden cursor-pointer bg-neutral-100 border border-neutral-200 group"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                                  />
                                </div>
                              ))}

                              {/* 4th slot with "+N" remaining count */}
                              <div
                                onClick={() => handleOpenLightbox(images, 3)}
                                className="relative aspect-square overflow-hidden cursor-pointer bg-black border border-neutral-200 group"
                              >
                                <img
                                  src={images[3].url}
                                  alt={images[3].name}
                                  className="w-full h-full object-cover opacity-80 group-hover:scale-[1.02] transition-transform duration-200"
                                />
                                {images.length > 4 && (
                                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-white text-3xl font-bold font-mono">
                                    +{images.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* PDF Documents Preview Card */}
                      {pdfs.length > 0 && (
                        <div className="px-4 sm:px-6 pb-3 space-y-2.5">
                          {pdfs.map((pdf) => (
                            <div
                              key={pdf.id}
                              className="flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200 transition-colors gap-3"
                            >
                              <div className="flex items-center gap-3 truncate">
                                {pdf.coverImageUrl ? (
                                  <img
                                    src={pdf.coverImageUrl}
                                    alt={pdf.name}
                                    className="w-12 h-14 object-cover rounded-xl border border-neutral-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-neutral-200 text-black flex flex-col items-center justify-center shrink-0 border border-neutral-300">
                                    <FileText className="w-5 h-5 stroke-[2]" />
                                  </div>
                                )}

                                <div className="truncate text-right">
                                  <p className="text-xs sm:text-sm font-bold text-black truncate font-mono">
                                    {pdf.name}
                                  </p>
                                  <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                    {pdf.size} · وثيقة PDF
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => triggerDownload(pdf.url, pdf.name)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-semibold rounded-xl border border-neutral-300 transition-colors shrink-0 shadow-2xs"
                                title="تحميل الملف"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>تحميل</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Instagram-Style Interactive Bottom Actions Bar */}
                      <div className="px-4 sm:px-6 py-3 border-t border-neutral-100 flex items-center justify-between text-neutral-700">
                        
                        {/* Left: Like, Comment, Multi-Download */}
                        <div className="flex items-center gap-4">
                          {/* Like Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleLike(lesson.id)}
                            className={`flex items-center gap-1.5 transition-transform active:scale-110 ${
                              lesson.isLiked ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
                            }`}
                            title="إعجاب"
                          >
                            <Heart className={`w-5 h-5 ${lesson.isLiked ? 'fill-black text-black' : ''}`} />
                            <span className="text-xs font-mono tabular-nums">{lesson.likesCount || 0}</span>
                          </button>

                          {/* Comment Button (Triggers Slide-up/Pop-up Comments Modal) */}
                          <button
                            type="button"
                            onClick={() => setCommentsModalLesson(lesson)}
                            className="flex items-center gap-1.5 text-neutral-500 hover:text-black transition-colors"
                            title="عرض وإضافة تعليق"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-xs font-mono tabular-nums">{visibleCommentsCount}</span>
                            {isAdmin && pendingCount > 0 && (
                              <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-full font-mono">
                                +{pendingCount}
                              </span>
                            )}
                          </button>

                          {/* Multi-Download */}
                          {(images.length > 0 || pdfs.length > 0) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (images.length > 0) {
                                  handleDownloadAllPostImages(images, lesson.title);
                                }
                                if (pdfs.length > 0) {
                                  pdfs.forEach(p => triggerDownload(p.url, p.name));
                                }
                              }}
                              className="flex items-center gap-1.5 text-neutral-500 hover:text-black transition-colors text-xs font-medium"
                              title={`تحميل كافة المرفقات (${images.length} صور, ${pdfs.length} ملفات)`}
                            >
                              <Download className="w-5 h-5" />
                              <span className="hidden sm:inline text-xs">
                                تحميل المرفقات ({images.length + pdfs.length})
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Quick Comments Link */}
                        <button
                          type="button"
                          onClick={() => setCommentsModalLesson(lesson)}
                          className="text-xs text-neutral-400 hover:text-black transition-colors"
                        >
                          {visibleCommentsCount > 0 
                            ? `عرض كل التعليقات (${visibleCommentsCount})` 
                            : 'أضف تعليقاً...'}
                        </button>
                      </div>

                    </article>
                  );
                })
              )}

            </div>

          </div>
        )}

      </main>

      {/* INSTAGRAM-STYLE COMMENTS POP-UP MODAL WITH ADMIN PINNING & MODERATION QUEUE */}
      {commentsModalLesson && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setCommentsModalLesson(null)}
        >
          <div 
            className="bg-white rounded-t-3xl sm:rounded-3xl border border-neutral-200 w-full max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-black">
                  التعليقات والمناقشات
                </h3>
                <p className="text-xs text-neutral-500 truncate max-w-xs">
                  {commentsModalLesson.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCommentsModalLesson(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Moderation Pending Notice for Visitor */}
            {commentPendingNotice && (
              <div className="px-4 py-2.5 bg-neutral-100 border-b border-neutral-200 text-xs text-black flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                <span>{commentPendingNotice}</span>
              </div>
            )}

            {/* Comments Scrollable Body: Pinned Admin Comments Always First */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {(() => {
                const allComments = commentsModalLesson.comments || [];
                const filtered = allComments.filter(c => isAdmin || c.isApproved || c.isAdmin);

                const sorted = [...filtered].sort((a, b) => {
                  const aIsAdmin = a.isAdmin || a.author === 'KAOUANE fares';
                  const bIsAdmin = b.isAdmin || b.author === 'KAOUANE fares';
                  if (aIsAdmin && !bIsAdmin) return -1;
                  if (!aIsAdmin && bIsAdmin) return 1;
                  if (isAdmin) {
                    const aPending = !a.isApproved && !a.isAdmin;
                    const bPending = !b.isApproved && !b.isAdmin;
                    if (aPending && !bPending) return -1;
                    if (!aPending && bPending) return 1;
                  }
                  return 0;
                });

                if (sorted.length === 0) {
                  return (
                    <div className="py-12 text-center text-neutral-400 text-xs">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-black" />
                      <p className="font-semibold text-neutral-800">لا توجد تعليقات معتمدة بعد</p>
                      <p className="text-[11px] mt-0.5 text-neutral-500">
                        {isAdmin ? 'لا توجد تعليقات في هذا المنشور' : 'كن أول من يطرح استفساره وسيقوم الأستاذ بالرد والموافقة'}
                      </p>
                    </div>
                  );
                }

                return sorted.map((comment) => {
                  const isCommentAdmin = comment.isAdmin || comment.author === 'KAOUANE fares';
                  const isPending = !comment.isApproved && !comment.isAdmin;

                  return (
                    <div 
                      key={comment.id} 
                      className={`flex items-start gap-3 text-xs p-3 rounded-2xl border transition-colors ${
                        isCommentAdmin 
                          ? 'bg-neutral-50 border-neutral-300' 
                          : isPending 
                            ? 'bg-neutral-100/70 border-dashed border-neutral-300' 
                            : 'bg-white border-neutral-200'
                      }`}
                    >
                      {/* Avatar */}
                      {isCommentAdmin ? (
                        <img
                          src={comment.avatarUrl || ADMIN_AVATAR_URL}
                          alt="KAOUANE fares"
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200 shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== avatarAsset) {
                              target.src = avatarAsset;
                            } else {
                              target.src = 'https://i.ibb.co/whnGcQmw/1785099526878.jpg';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-black flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                          {comment.author.includes('#') ? comment.author.split('#')[1]?.slice(0, 2) : 'زائر'}
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 3. Clean Name KAOUANE fares (Verification badge removed) */}
                            <span className="font-bold text-black font-sans">
                              {comment.author}
                            </span>

                            {/* Pinned admin comment indicator */}
                            {isCommentAdmin && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-black bg-neutral-200 px-1.5 py-0.2 rounded">
                                <Pin className="w-2.5 h-2.5 fill-black text-black" />
                                <span>مثبت</span>
                              </span>
                            )}

                            {/* Pending Review Badge (Admin view) */}
                            {isAdmin && isPending && (
                              <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-200 px-1.5 py-0.2 rounded border border-neutral-300">
                                قيد المراجعة
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 font-mono text-[10px]">{comment.createdAt}</span>
                            {/* Admin Comment Deletion Capability (Full deletion permissions for any comment) */}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(commentsModalLesson.id, comment.id)}
                                className="p-1 rounded-md text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                                title="حذف التعليق نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-neutral-800 leading-relaxed text-xs">
                          {comment.text}
                        </p>

                        {/* Admin Moderation Actions for Visitor Comments */}
                        {isAdmin && !isCommentAdmin && (
                          <div className="pt-2 flex items-center gap-2 border-t border-neutral-200/60 mt-1.5">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleApproveComment(commentsModalLesson.id, comment.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-semibold hover:bg-neutral-800 transition-colors"
                                title="قبول ونشر التعليق"
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>قبول ونشر</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteComment(commentsModalLesson.id, comment.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-200 transition-colors text-[11px]"
                              title="حذف التعليق"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Bottom Fixed Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddComment(commentsModalLesson.id, modalCommentInput);
                setModalCommentInput('');
              }}
              className="p-3 border-t border-neutral-200 bg-white space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                <span>
                  النشر بصفتك: <strong className="text-black">{isAdmin ? 'KAOUANE fares (أستاذ)' : `مجهول الهوية #${getSessionAnonId()}`}</strong>
                </span>
                {!isAdmin && (
                  <span className="text-neutral-400 text-[10px]">تخضع التعليقات للمراجعة</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={modalCommentInput}
                  onChange={(e) => setModalCommentInput(e.target.value)}
                  placeholder={isAdmin ? "الرد بصفتك الأستاذ KAOUANE fares..." : "اكتب سؤالك أو استفسارك هنا..."}
                  className="flex-1 px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!modalCommentInput.trim()}
                  className="p-2.5 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-2xl transition-colors shrink-0 cursor-pointer"
                  title="إرسال"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX / CAROUSEL VIEWER (Monochrome) */}
      {lightboxImages && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between pt-8 sm:pt-10 pb-5 px-4 sm:px-8"
          onClick={() => setLightboxImages(null)}
        >
          {/* Lightbox Top Bar with proper margins and safe-area padding */}
          <div 
            className="w-full flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0 select-none z-20"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="text-xs sm:text-sm font-mono text-neutral-300 truncate max-w-[50%]">
              {lightboxIndex + 1} / {lightboxImages.length} · {lightboxImages[lightboxIndex]?.name}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0" dir="ltr">
              {/* Individual Image Download */}
              <button
                type="button"
                onClick={() =>
                  triggerDownload(
                    lightboxImages[lightboxIndex]?.url,
                    lightboxImages[lightboxIndex]?.name || `image_${lightboxIndex + 1}.jpg`
                  )
                }
                className="p-2 sm:p-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                title="تحميل هذه الصورة"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">تحميل</span>
              </button>

              {/* Multi-Image Bulk Download */}
              {lightboxImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDownloadAllPostImages(lightboxImages, 'post_media')}
                  className="p-2 sm:p-2.5 px-3 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="تحميل كافة الصور"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">تحميل الكل ({lightboxImages.length})</span>
                </button>
              )}

              {/* Prominent, Fully Visible Close Button */}
              <button
                type="button"
                onClick={() => setLightboxImages(null)}
                className="p-2 sm:p-2.5 rounded-xl bg-white/20 hover:bg-white/35 active:scale-95 text-white transition-all cursor-pointer border border-white/30 shadow-md flex items-center justify-center shrink-0 ml-1"
                title="إغلاق (Esc)"
                aria-label="إغلاق عارض الصور"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image & Arrows */}
          <div 
            className="flex-1 relative flex items-center justify-center p-2 sm:p-6 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrevLightboxImage}
                className="absolute right-4 sm:right-8 z-10 p-3.5 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
                title="الصورة السابقة"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <img
              src={lightboxImages[lightboxIndex]?.url}
              alt={lightboxImages[lightboxIndex]?.name}
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-150"
            />

            {lightboxImages.length > 1 && (
              <button
                type="button"
                onClick={handleNextLightboxImage}
                className="absolute left-4 sm:left-8 z-10 p-3.5 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
                title="الصورة التالية"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Thumbnails Strip */}
          {lightboxImages.length > 1 && (
            <div 
              className="flex items-center justify-center gap-2 overflow-x-auto py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxImages.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    i === lightboxIndex
                      ? 'border-white scale-105 shadow-md'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD MODULE WITH COVER IMAGE (Admin Only) */}
      {isAddModuleModalOpen && isAdmin && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAddModuleModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-neutral-200 w-full max-w-md p-6 sm:p-7 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-black">
                إنشاء مقياس جديد ({selectedYear === 'first' ? 'السنة الأولى' : 'السنة الثانية'})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModuleModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label htmlFor="module-name-input" className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  اسم المقياس:
                </label>
                <input
                  id="module-name-input"
                  ref={moduleInputRef}
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="اكتب اسم المقياس..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
                />
              </div>

              {/* 5. Optional Cover Image Upload for Module (Fills the entire card) */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-black" />
                    <span>صورة غلاف المقياس (تغطي البطاقة بالكامل)</span>
                  </div>
                  {newModuleThumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setNewModuleThumbnailUrl('')}
                      className="text-neutral-400 hover:text-black text-[11px]"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </div>

                {newModuleThumbnailUrl ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-neutral-300">
                    <img 
                      src={newModuleThumbnailUrl} 
                      alt="غلاف المقياس" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-semibold text-black cursor-pointer transition-colors shadow-2xs">
                      {isUploadingModuleThumbnail ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-black" />
                      )}
                      <span>{isUploadingModuleThumbnail ? 'جاري رفع الغلاف...' : 'رفع صورة من الجهاز'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleModuleThumbnailFileChange}
                        disabled={isUploadingModuleThumbnail}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newModuleName.trim() || isUploadingModuleThumbnail}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-neutral-800 disabled:opacity-40 transition-colors shadow-xs"
                >
                  إنشاء المقياس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL 1.5: EDIT MODULE (Admin Only) */}
      {editingModule && isAdmin && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingModule(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-neutral-200 w-full max-w-md p-6 sm:p-7 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-black">
                تعديل بيانات المقياس والغلاف
              </h3>
              <button
                type="button"
                onClick={() => setEditingModule(null)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedModule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  اسم المقياس:
                </label>
                <input
                  type="text"
                  value={editModuleName}
                  onChange={(e) => setEditModuleName(e.target.value)}
                  required
                  placeholder="اسم المقياس..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
                />
              </div>

              {/* Cover Image */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-black" />
                    <span>صورة غلاف المقياس (تغطي البطاقة بالكامل)</span>
                  </div>
                  {editModuleThumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setEditModuleThumbnailUrl('')}
                      className="text-neutral-400 hover:text-black text-[11px]"
                    >
                      إزالة الغلاف
                    </button>
                  )}
                </div>

                {editModuleThumbnailUrl ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-neutral-300">
                    <img 
                      src={editModuleThumbnailUrl} 
                      alt="غلاف المقياس" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-semibold text-black cursor-pointer transition-colors shadow-2xs">
                      {isUploadingEditModuleThumbnail ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-black" />
                      )}
                      <span>{isUploadingEditModuleThumbnail ? 'جاري رفع الغلاف...' : 'رفع صورة غلاف جديدة'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditModuleThumbnailFileChange}
                        disabled={isUploadingEditModuleThumbnail}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!editModuleName.trim() || isUploadingEditModuleThumbnail}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-neutral-800 disabled:opacity-40 transition-colors shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD LESSON WITH MULTIPLE IMAGES & PDF UPLOADS (Admin Only) */}
      {isAddLessonModalOpen && activeModule && isAdmin && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setIsAddLessonModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-neutral-200 w-full max-w-xl p-6 sm:p-7 shadow-xl my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
              <div>
                <h3 className="text-base font-bold text-black">
                  نشر درس وموارد جديدة
                </h3>
                <span className="text-xs text-neutral-500">
                  مقياس: {activeModule.name} ({selectedYear === 'first' ? 'السنة الأولى' : 'السنة الثانية'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLessonModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLesson} className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="lesson-title-input" className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  عنوان الدرس أو المطبوعة:
                </label>
                <input
                  id="lesson-title-input"
                  ref={lessonTitleInputRef}
                  type="text"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  placeholder="مثال: مدخل إلى النقل الديداكتيكي، المحاضرة 1..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  نوع الحصة / المورد:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['محاضرة', 'أعمال موجهة (TD)', 'أعمال تطبيقية (TP)', 'ملف بيداغوجي', 'ملخص مركز'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewLessonType(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        newLessonType === type
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Publication Date (Admin only) */}
              <div>
                <label htmlFor="lesson-date-input" className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  تاريخ النشر (تخصيص التاريخ):
                </label>
                <input
                  id="lesson-date-input"
                  type="date"
                  value={newLessonDate}
                  onChange={(e) => setNewLessonDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="lesson-desc-input" className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  توصيف المحتوى والشرح (اختياري):
                </label>
                <textarea
                  id="lesson-desc-input"
                  value={newLessonDescription}
                  onChange={(e) => setNewLessonDescription(e.target.value)}
                  placeholder="اكتب توضيحات للطلبة أو محاور المحاضرة..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white resize-none"
                />
              </div>

              {/* Multiple Images Upload via ImgBB */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-black">
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>إرفاق صور توضيحية متعددة (سحابة ImgBB)</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {stagedImages.length} صور محددة
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-semibold text-black cursor-pointer transition-colors shadow-2xs">
                    {isUploadingImages ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-black" />
                    )}
                    <span>{isUploadingImages ? 'جاري رفع الصور إلى ImgBB...' : 'اختيار صور من الجهاز'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={isUploadingImages}
                      className="hidden"
                    />
                  </label>
                </div>

                {stagedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {stagedImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-300 group"
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setStagedImages(prev => prev.filter(item => item.id !== img.id))}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PDF Upload */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-black">
                    <FileUp className="w-4 h-4 text-black" />
                    <span>إرفاق ملفات ومستندات PDF</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {stagedPdfs.length} ملفات PDF
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-600 mb-1">
                    رابط غلاف مخصص للمستند (اختياري):
                  </label>
                  <input
                    type="text"
                    value={customPdfCoverUrl}
                    onChange={(e) => setCustomPdfCoverUrl(e.target.value)}
                    placeholder="رابط صورة الغلاف (https://...)"
                    className="w-full px-3.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-xl placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-semibold text-black cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-black" />
                    <span>اختيار ملف PDF من الجهاز</span>
                    <input
                      type="file"
                      multiple
                      accept="application/pdf"
                      onChange={handlePdfFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {stagedPdfs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {stagedPdfs.map(pdf => (
                      <div
                        key={pdf.id}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-black shrink-0" />
                          <span className="font-mono text-black truncate">{pdf.name}</span>
                          <span className="text-neutral-400 text-[10px]">({pdf.size})</span>
                          {pdf.coverImageUrl && (
                            <span className="text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-300">
                              غلاف مخصص
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setStagedPdfs(prev => prev.filter(item => item.id !== pdf.id))}
                          className="text-neutral-400 hover:text-black p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newLessonTitle.trim() || isUploadingImages || isSubmittingLesson}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-neutral-800 disabled:opacity-40 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingLesson ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>جاري النشر...</span>
                    </>
                  ) : (
                    <span>نشر الدرس الآن</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2.5: EDIT LESSON MODAL (Admin Only) */}
      {editingLesson && isAdmin && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setEditingLesson(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-neutral-200 w-full max-w-xl p-6 sm:p-7 shadow-xl my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200">
              <div>
                <h3 className="text-base font-bold text-black">
                  تعديل المنشور والموارد
                </h3>
                <span className="text-xs text-neutral-500">
                  تحديث بيانات الدرس والوسائط المرفقة
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="text-neutral-400 hover:text-black p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedLesson} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  عنوان الدرس:
                </label>
                <input
                  type="text"
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  required
                  placeholder="عنوان الدرس..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  نوع الحصة / المورد:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['محاضرة', 'أعمال موجهة (TD)', 'أعمال تطبيقية (TP)', 'ملف بيداغوجي', 'ملخص مركز'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditLessonType(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        editLessonType === type
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Publication Date (Admin only) */}
              <div>
                <label htmlFor="edit-lesson-date-input" className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  تاريخ النشر (تعديل تاريخ النشر):
                </label>
                <input
                  id="edit-lesson-date-input"
                  type="date"
                  value={editLessonDate}
                  onChange={(e) => setEditLessonDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  توصيف المحتوى والشرح:
                </label>
                <textarea
                  value={editLessonDescription}
                  onChange={(e) => setEditLessonDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white resize-none"
                />
              </div>

              {/* Manage Attached Images */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-black">
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>الصور المرفقة ({editStagedImages.length})</span>
                  </div>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-semibold text-black cursor-pointer transition-colors shadow-2xs">
                    {isUploadingEditImages ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-black" />
                    )}
                    <span>إضافة صور</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleEditImageFileChange}
                      disabled={isUploadingEditImages}
                      className="hidden"
                    />
                  </label>
                </div>

                {editStagedImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {editStagedImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-300 group"
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditStagedImages(prev => prev.filter(item => item.id !== img.id))}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          title="حذف الصورة"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 text-center py-2">لا توجد صور مرفقة في هذا المنشور</p>
                )}
              </div>

              {/* Manage Attached PDFs */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-black">
                    <FileUp className="w-4 h-4 text-black" />
                    <span>ملفات PDF المرفقة ({editStagedPdfs.length})</span>
                  </div>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-semibold text-black cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-black" />
                    <span>إضافة PDF</span>
                    <input
                      type="file"
                      multiple
                      accept="application/pdf"
                      onChange={handleEditPdfFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {editStagedPdfs.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    {editStagedPdfs.map(pdf => (
                      <div
                        key={pdf.id}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-black shrink-0" />
                          <span className="font-mono text-black truncate">{pdf.name}</span>
                          <span className="text-neutral-400 text-[10px]">({pdf.size})</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditStagedPdfs(prev => prev.filter(item => item.id !== pdf.id))}
                          className="text-neutral-400 hover:text-black p-1"
                          title="حذف الملف"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 text-center py-2">لا توجد ملفات PDF مرفقة</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!editLessonTitle.trim() || isUploadingEditImages}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-neutral-800 disabled:opacity-40 transition-colors shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FIRST-TIME ADMIN SETUP (7-Tap Trigger) */}
      {isAdminSetupModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsAdminSetupModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-neutral-200 w-full max-w-md p-6 sm:p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black">
                  إعداد حساب المسؤول الرئيسي (Admin)
                </h3>
                <p className="text-xs text-neutral-500">
                  يُسمح بإنشاء حساب مسؤول واحد فقط للمنصة.
                </p>
              </div>
            </div>

            {adminAuthError && (
              <div className="mb-4 p-3 bg-neutral-100 border border-neutral-300 text-black text-xs rounded-xl">
                {adminAuthError}
              </div>
            )}

            <form onSubmit={handleCreateAdminAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  اسم المستخدم أو البريد الإلكتروني:
                </label>
                <input
                  type="text"
                  value={adminUsernameInput}
                  onChange={(e) => setAdminUsernameInput(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  كلمة المرور السرية:
                </label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdminSetupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={adminAuthLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {adminAuthLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>تثبيت حساب المسؤول الوحيد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADMIN LOGIN DIALOG (7-Tap Trigger) */}
      {isAdminLoginModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsAdminLoginModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-neutral-200 w-full max-w-md p-6 sm:p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">
                    تسجيل دخول المسؤول (Admin)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    أدخل بيانات المسؤول لفك قفل الصلاحيات
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAdminLoginModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminAuthError && (
              <div className="mb-4 p-3 bg-neutral-100 border border-neutral-300 text-black text-xs rounded-xl">
                {adminAuthError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  اسم المستخدم أو البريد:
                </label>
                <input
                  type="text"
                  value={adminUsernameInput}
                  onChange={(e) => setAdminUsernameInput(e.target.value)}
                  placeholder="اسم المستخدم..."
                  required
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1">
                  كلمة المرور:
                </label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={adminAuthLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {adminAuthLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>تسجيل الدخول وفك القفل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
