import React from 'react';
import { AcademicYear } from '../types';
import { 
  Sparkles, 
  ArrowLeft, 
  BookOpenCheck, 
  Video, 
  FileCheck2, 
  GraduationCap 
} from 'lucide-react';

interface HeroBannerProps {
  selectedYear: AcademicYear;
  onExploreLessons: () => void;
  onExploreResources: () => void;
  completedLessonsCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  selectedYear,
  onExploreLessons,
  onExploreResources,
  completedLessonsCount,
}) => {
  const completionPercentage = Math.round((completedLessonsCount / (selectedYear.totalLessons || 1)) * 100);

  return (
    <section className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        
        {/* Left / Main Editorial Text (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Unboxed Metadata Kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
              <span>أكاديمية التميز والدعم المدرسي</span>
              <span aria-hidden="true">·</span>
              <span>{selectedYear.title}</span>
              <span aria-hidden="true">·</span>
              <span>مسار 2026/2027</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight font-['Readex_Pro']">
              مواكبة أكاديمية وبيداغوجية ترتقي بتحصيلك الدراسي
            </h1>

            {/* Description */}
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {selectedYear.description}
            </p>
          </div>

          {/* Progress & Quick Stats Card */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">
              <span>نسبة إنجازك في مقررات {selectedYear.title}:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {completionPercentage}% ({completedLessonsCount} من {selectedYear.totalLessons} حصص)
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, completionPercentage))}%` }}
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onExploreLessons}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
              >
                <Video className="w-4 h-4" />
                <span>استكشاف دروس الدعم المتاحة</span>
                <ArrowLeft className="w-4 h-4 mr-1" />
              </button>

              <button
                onClick={onExploreResources}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>تحميل الجذاذات والمذكرات</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right / Visual Asset Cover (5 cols on lg) */}
        <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full overflow-hidden bg-slate-950">
          <img
            src="/src/assets/images/hero_ana_ostad_1794309535196.jpg"
            alt="مساحة دراسة أنا أستاذ"
            className="w-full h-full object-cover lg:absolute inset-0"
          />
          {/* Subtle contrast gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-white/10 dark:lg:from-slate-900/40 lg:to-transparent" />

          {/* Floating badge info on photo */}
          <div className="absolute bottom-4 right-4 left-4 p-3.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-white text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>أطر وكفاءات وطنية معتمدة</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">2026/2027</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              دروس دعم تفاعلية مصورة ومحررة بمرافقة نخبة من أساتذة التعليم الثانوي ومكوني المراكز الجهوية.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
