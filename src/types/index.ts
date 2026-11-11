// --- New Modular Types for ENS Medea ---
export interface AttachedImage {
  id: string;
  url: string;
  name: string;
}

export interface AttachedPdf {
  id: string;
  name: string;
  size: string;
  url?: string;
  coverImageUrl?: string;
}

export interface CommentItem {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  isAdmin?: boolean;
  avatarUrl?: string;
  isApproved?: boolean;
}

export interface LessonItem {
  id: string;
  moduleId?: string;
  title: string;
  type: string;
  description: string;
  images: AttachedImage[];
  pdfs: AttachedPdf[];
  likesCount: number;
  baseLikes?: number;
  userLikes?: number;
  lastLikesSyncedAt?: number;
  isLiked?: boolean;
  isPinned?: boolean;
  timestamp?: number;
  comments: CommentItem[];
  createdAt: string;
}

export interface SpecializationItem {
  id: string;
  name: string;
  createdAt?: string;
}

export interface ModuleItem {
  id: string;
  name: string;
  createdAt: string;
  thumbnailUrl?: string;
  specializationId?: string;
  lessons: LessonItem[];
}

// --- Legacy Domain Types for Supporting Services & Components ---
export type AcademicYearId = 'first-year' | 'second-year';

export type EducationalBranch = 
  | 'all'
  | 'sciences'
  | 'humanities'
  | 'teacher-training';

export interface AcademicYear {
  id: AcademicYearId;
  title: string;
  subtitle: string;
  levelBadge: string;
  description: string;
  totalLessons: number;
  totalResources: number;
  activeLiveCount: number;
}

export type ResourceType = 'pdf' | 'fiche' | 'exam' | 'summary' | 'slides';

export interface PedagogicalResource {
  id: string;
  title: string;
  description: string;
  academicYearId: AcademicYearId;
  subjectId: string;
  type: ResourceType;
  fileFormat: 'PDF' | 'DOCX' | 'PPTX' | 'ZIP';
  fileSize: string;
  downloadCount: number;
  publishedDate: string;
  author: {
    name: string;
    role: string;
    institution: string;
  };
  tags: string[];
  targetLevel: string;
  previewContent?: string;
  isBookmarked?: boolean;
}

export interface SupportLesson {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  academicYearId: AcademicYearId;
  subjectId: string;
  branch: EducationalBranch;
  chapterNumber: number;
  durationMinutes: number;
  instructor: {
    name: string;
    avatar: string;
    title: string;
    experience: string;
  };
  thumbnailUrl: string;
  videoUrl?: string;
  videoDuration: string;
  hasLiveSession: boolean;
  liveSessionDate?: string;
  liveSessionStatus?: 'scheduled' | 'live' | 'completed';
  livePlatform?: 'Zoom' | 'Google Meet' | 'منصة مباشرة';
  resourcesCount: number;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  objectives: string[];
  keyConcepts: string[];
  downloadableMaterials?: {
    name: string;
    type: string;
    size: string;
  }[];
}

export interface Subject {
  id: string;
  name: string;
  iconName: string;
  colorTheme: string;
  lessonCount: number;
  resourceCount: number;
  years: AcademicYearId[];
  branches: EducationalBranch[];
}

export interface FilterState {
  academicYearId: AcademicYearId;
  selectedBranch: EducationalBranch;
  selectedSubjectId: string | 'all';
  contentType: 'all' | 'lessons' | 'resources' | 'live';
  searchQuery: string;
  onlyBookmarked: boolean;
}

export interface CloudSyncState {
  isOnline: boolean;
  lastSyncedAt: string;
  pendingSyncCount: number;
  provider: 'Firestore (Firebase)' | 'Supabase (PostgreSQL)' | 'Local Cache';
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}
