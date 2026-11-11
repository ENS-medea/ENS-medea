import React from 'react';
import { AcademicYear, AcademicYearId, EducationalBranch } from '../types';
import { Sparkles, Layers, BookCheck, Radio, School } from 'lucide-react';

interface YearNavigationTabsProps {
  years: AcademicYear[];
  selectedYearId: AcademicYearId;
  onSelectYear: (yearId: AcademicYearId) => void;
  selectedBranch: EducationalBranch;
  onSelectBranch: (branch: EducationalBranch) => void;
}

export const YearNavigationTabs: React.FC<YearNavigationTabsProps> = ({
  years,
  selectedYearId,
  onSelectYear,
  selectedBranch,
  onSelectBranch,
}) => {
  const selectedYear = years.find(y => y.id === selectedYearId) || years[0];

  const branches: { id: EducationalBranch; label: string; icon: string }[] = [
    { id: 'all', label: 'جميع الشعب والتخصصات', icon: 'Layers' },
    { id: 'sciences', label: 'العلوم التجريبية والرياضية', icon: 'Atom' },
    { id: 'humanities', label: 'الآداب والعلوم الإنسانية', icon: 'BookOpen' },
    { id: 'teacher-training', label: 'تأهيل أطر التدريس والمراكز (CRMEF)', icon: 'GraduationCap' },
  ];

  return (
    <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Top Context & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              <span>بوابة الدعم التربوي والأكاديمي التفاعلي</span>
              <span aria-hidden="true">·</span>
              <span>الموسم الدراسي 2026-2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Readex_Pro']">
              المستوى والمسار الدراسي
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <BookCheck className="w-4 h-4 text-emerald-600" />
              <span>{selectedYear.totalLessons} درس دعم</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{selectedYear.totalResources} مورد وجذاذة</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-500" />
              <span>{selectedYear.activeLiveCount} جلسات حية</span>
            </span>
          </div>
        </div>

        {/* Prominent Primary Year Selection Tabs (Wireframe Core Requirement) */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-2 shadow-inner">
          {years.map((year) => {
            const isActive = year.id === selectedYearId;
            return (
              <button
                key={year.id}
                onClick={() => onSelectYear(year.id)}
                className={`flex-1 relative py-4 px-4 sm:px-6 rounded-xl text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50 font-medium'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
                  <span className="text-lg sm:text-xl font-extrabold font-['Readex_Pro'] whitespace-nowrap">
                    {year.title}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {year.levelBadge}
                  </span>
                </div>
                <p className="hidden md:block text-xs mt-1 text-slate-500 dark:text-slate-400 font-normal truncate max-w-md mx-auto">
                  {year.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Secondary Branch / Stream Filter Segment */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 ml-2">
            تصفية المسار:
          </span>
          {branches.map(branch => {
            const isSelected = selectedBranch === branch.id;
            return (
              <button
                key={branch.id}
                onClick={() => onSelectBranch(branch.id)}
                className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs rounded-lg transition-colors border ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent font-medium shadow-xs'
                    : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {branch.label}
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};
