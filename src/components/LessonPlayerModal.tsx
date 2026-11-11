import React, { useState, useEffect } from 'react';
import { SupportLesson } from '../types';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download, 
  CheckSquare, 
  Square, 
  FileText, 
  Radio, 
  Check, 
  Save, 
  Clock, 
  Share2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { dbService } from '../services/mockDatabase';

interface LessonPlayerModalProps {
  lesson: SupportLesson | null;
  onClose: () => void;
  onJoinLiveSession: (lesson: SupportLesson) => void;
}

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({
  lesson,
  onClose,
  onJoinLiveSession,
}) => {
  if (!lesson) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.25x' | '1.5x'>('1x');
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'resources'>('overview');
  const [userNotes, setUserNotes] = useState('');
  const [savedNoteNotification, setSavedNoteNotification] = useState(false);
  const [completedObjectives, setCompletedObjectives] = useState<number[]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (lesson) {
      setUserNotes(dbService.getNotesForLesson(lesson.id));
    }
  }, [lesson]);

  const handleSaveNotes = () => {
    if (!lesson) return;
    dbService.saveNotesForLesson(lesson.id, userNotes);
    setSavedNoteNotification(true);
    setTimeout(() => setSavedNoteNotification(false), 2500);
  };

  const toggleObjective = (index: number) => {
    setCompletedObjectives(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleDownload = (fileName: string) => {
    setDownloadSuccess(fileName);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              الفصل {lesson.chapterNumber}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl font-['Readex_Pro']">
              {lesson.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {lesson.hasLiveSession && (
              <button
                onClick={() => onJoinLiveSession(lesson)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>دخول الجلسة الحية</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          
          {/* Video Player Box */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center shadow-lg group">
            {lesson.videoUrl ? (
              <video
                src={lesson.videoUrl}
                poster={lesson.thumbnailUrl}
                className="w-full h-full object-contain"
                controls
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900">
                <img
                  src={lesson.thumbnailUrl}
                  alt={lesson.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg mb-3">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                  <p className="text-white font-semibold text-sm sm:text-base">
                    تسجيل الحصة التفاعلية كاملة بجودة عالية
                  </p>
                  <span className="text-xs text-slate-400 mt-1">المدة: {lesson.videoDuration}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 transition-colors ${
                activeTab === 'overview'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              نظرة عامة والأهداف
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 transition-colors flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>مذكرتي الشخصية</span>
              {userNotes.trim().length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`pb-3 transition-colors flex items-center gap-1.5 ${
                activeTab === 'resources'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>المرفقات والتمارين</span>
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {lesson.downloadableMaterials?.length || lesson.resourcesCount}
              </span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  توصيف المحتوى البيداغوجي:
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lesson.description}
                </p>
              </div>

              {/* Objectives Checklist */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>الأهداف التعليمية والكفايات المستهدفة:</span>
                </h4>
                <div className="space-y-2.5">
                  {lesson.objectives.map((obj, i) => {
                    const done = completedObjectives.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleObjective(i)}
                        className="w-full flex items-start gap-3 text-right group p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      >
                        {done ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-600 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-xs sm:text-sm ${done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {obj}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Concepts */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
                  المفاهيم المحورية في هذا الدرس:
                </h4>
                <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-300">
                  {lesson.keyConcepts.map((concept, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructor Bio */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <img
                  src={lesson.instructor.avatar}
                  alt={lesson.instructor.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    {lesson.instructor.name}
                  </h5>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {lesson.instructor.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    الخبرة: {lesson.instructor.experience}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    ملاحظات الدعم والتلخيص الشخصي
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تدوين القوانين، الإشكاليات، والأسئلة لتوجيهها للأستاذ. تحفظ تلقائياً في حسابك.
                  </p>
                </div>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ الملاحظات</span>
                </button>
              </div>

              {savedNoteNotification && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تم حفظ وتأمين الملاحظات في قاعدة البيانات المحلية والسحابية بنجاح!</span>
                </div>
              )}

              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="اكتب هنا النقاط التي تحتاج إلى توضيح إضافي، أو تلخيص استنتاجات الحصة..."
                rows={8}
                className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed text-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Tab 3: Downloadable Resources */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  الملفات الملحقة بحصة الدعم
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  سلاسل التمارين مع عناصر الإجابة، بطاقات المفاهيم، والجذاذات النموذجية للتحميل الفوري.
                </p>
              </div>

              {downloadSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>بدأ تحميل: {downloadSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                {lesson.downloadableMaterials?.map((mat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          {mat.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          الصيغة: {mat.type} · الحجم: {mat.size}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(mat.name)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </button>
                  </div>
                )) || (
                  <p className="text-xs text-slate-500 py-6 text-center">لا توجد مرفقات إضافية لهذا الدرس.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>منصة أنا أستاذ للدعم التربوي والتأهيل الأكاديمي</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>

    </div>
  );
};
