import React from 'react';
import { SupportLesson } from '../types';
import { 
  Play, 
  Radio, 
  Clock, 
  FileText, 
  CheckCircle, 
  Calendar,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

interface LessonCardProps {
  lesson: SupportLesson;
  isCompleted: boolean;
  onSelectLesson: (lesson: SupportLesson) => void;
  onJoinLiveSession: (lesson: SupportLesson) => void;
  onToggleComplete: (lessonId: string) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  isCompleted,
  onSelectLesson,
  onJoinLiveSession,
  onToggleComplete,
}) => {
  return (
    <article className="group bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between shadow-xs">
      
      {/* Media Thumbnail & Action Overlay */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <img
          src={lesson.thumbnailUrl}
          alt={lesson.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          onError={(e) => {
            // Resilient fallback to styled gradient
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Live session active indicator or status */}
        {lesson.hasLiveSession && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600/90 text-white text-xs font-semibold backdrop-blur-xs">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {lesson.liveSessionStatus === 'live' ? 'جلسة تفاعلية جارية الآن' : 'بث مباشر مرتقب'}
            </span>
          </div>
        )}

        {/* Duration stamp */}
        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/75 text-white text-xs font-mono tabular-nums backdrop-blur-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{lesson.videoDuration}</span>
        </div>

        {/* Quick Play Trigger Overlay */}
        <button
          onClick={() => onSelectLesson(lesson)}
          className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 flex items-center justify-center transition-colors focus:outline-none"
          title="تشغيل الدرس التفاعلي"
          aria-label={`تشغيل درس: ${lesson.title}`}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600/95 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </button>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed Metadata Line (Zero-Pill Compliance) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>الفصل {lesson.chapterNumber}</span>
            <span aria-hidden="true">·</span>
            <span>المستوى: {lesson.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>{lesson.resourcesCount} وثائق مرافقة</span>
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelectLesson(lesson)}
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
          >
            {lesson.title}
          </h3>

          {/* Subtitle / Description */}
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {lesson.description}
          </p>
        </div>

        {/* Instructor & Actions Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <img
                src={lesson.instructor.avatar}
                alt={lesson.instructor.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {lesson.instructor.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                  {lesson.instructor.title}
                </p>
              </div>
            </div>

            <button
              onClick={() => onToggleComplete(lesson.id)}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                isCompleted
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={isCompleted ? 'تم إنجاز الدرس' : 'تحديد كمنجز'}
            >
              <CheckCircle className={`w-4 h-4 ${isCompleted ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline text-[11px]">
                {isCompleted ? 'مكتمل' : 'متابعة'}
              </span>
            </button>
          </div>

          {/* Action Buttons: Live Link or Recorded Video */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectLesson(lesson)}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>مشاهدة الدرس</span>
            </button>

            {lesson.hasLiveSession ? (
              <button
                onClick={() => onJoinLiveSession(lesson)}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>دخول الجلسة الحية</span>
              </button>
            ) : (
              <button
                onClick={() => onSelectLesson(lesson)}
                className="w-full py-2 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>الموارد والتمارين</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </article>
  );
};
