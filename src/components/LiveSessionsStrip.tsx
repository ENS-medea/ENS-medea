import React from 'react';
import { SupportLesson } from '../types';
import { Radio, Clock, ArrowLeft, Video, Calendar, User } from 'lucide-react';

interface LiveSessionsStripProps {
  liveLessons: SupportLesson[];
  onJoinLive: (lesson: SupportLesson) => void;
}

export const LiveSessionsStrip: React.FC<LiveSessionsStripProps> = ({
  liveLessons,
  onJoinLive,
}) => {
  if (liveLessons.length === 0) return null;

  return (
    <section className="bg-gradient-to-l from-rose-950/20 via-slate-900/10 to-transparent dark:from-rose-950/40 p-5 rounded-3xl border border-rose-200/50 dark:border-rose-900/40">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-['Readex_Pro']">
              جلسات الدعم التفاعلي المباشر (البث الحي)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تواصل صوت وصورة مع الأساتذة لحل المسائل المعقدة والإجابة عن الأسئلة الصعبة
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 hidden sm:inline font-mono">
          {liveLessons.length} جلسات مبرمجة
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveLessons.map(lesson => (
          <div
            key={lesson.id}
            className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                  <span>{lesson.liveSessionDate || 'اليوم'}</span>
                </span>
                <span className="font-mono">{lesson.livePlatform || 'منصة مباشرة'}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {lesson.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                المؤطر: {lesson.instructor.name} · {lesson.instructor.title}
              </p>
            </div>

            <button
              onClick={() => onJoinLive(lesson)}
              className="w-full py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>دخول قاعة البث المباشر</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
