import React from 'react';
import { Subject } from '../types';
import { 
  Calculator, 
  Atom, 
  Dna, 
  GraduationCap, 
  BookOpen, 
  Compass, 
  LayoutGrid 
} from 'lucide-react';

interface SubjectFilterProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  totalLessonsCount: number;
}

export const SubjectFilter: React.FC<SubjectFilterProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  totalLessonsCount,
}) => {
  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-4 h-4 shrink-0" />;
      case 'Atom':
        return <Atom className="w-4 h-4 shrink-0" />;
      case 'Dna':
        return <Dna className="w-4 h-4 shrink-0" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 shrink-0" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 shrink-0" />;
      case 'Compass':
        return <Compass className="w-4 h-4 shrink-0" />;
      default:
        return <BookOpen className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
      {/* "All Subjects" Option */}
      <button
        onClick={() => onSelectSubject('all')}
        className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
          selectedSubjectId === 'all'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>جميع المواد الدراسية</span>
        <span className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${
          selectedSubjectId === 'all'
            ? 'bg-emerald-700/50 text-white'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
        }`}>
          {totalLessonsCount}
        </span>
      </button>

      {/* Individual Subjects */}
      {subjects.map(subject => {
        const isSelected = selectedSubjectId === subject.id;
        return (
          <button
            key={subject.id}
            onClick={() => onSelectSubject(subject.id)}
            className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {getSubjectIcon(subject.iconName)}
            <span>{subject.name}</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${
              isSelected
                ? 'bg-emerald-700/50 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {subject.lessonCount}
            </span>
          </button>
        );
      })}
    </div>
  );
};
