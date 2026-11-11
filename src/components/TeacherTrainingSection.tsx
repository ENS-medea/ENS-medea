import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  FileCheck2, 
  Users, 
  HelpCircle, 
  Download, 
  Sparkles,
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { PedagogicalResource } from '../types';

interface TeacherTrainingSectionProps {
  onSelectResource: (resource: PedagogicalResource) => void;
  pedagogicalResources: PedagogicalResource[];
}

export const TeacherTrainingSection: React.FC<TeacherTrainingSectionProps> = ({
  onSelectResource,
  pedagogicalResources,
}) => {
  const trainingModules = [
    {
      title: 'الديداكتيك العام والخاص',
      description: 'النقل الديداكتيكي، المثلث البيداغوجي، تحليل الممارسات الصفية وهندسة التعلمات.',
      lessonsCount: '8 مجزوءات',
      icon: 'BookOpen',
    },
    {
      title: 'التخطيط والتدبير البيداغوجي',
      description: 'تصميم الجذاذة النمطية، التوزيعات السنوية والمرحلية، وتدبير جماعة القسم والفوارق الفردية.',
      lessonsCount: '12 ورشة عملية',
      icon: 'FileCheck2',
    },
    {
      title: 'تقويم التعلمات والدعم الفارقي',
      description: 'بناء شبكات التقويم المعيارية، الأطر المرجعية، وصنافة بلوم للمستويات المعرفية.',
      lessonsCount: '6 نماذج تطبيقية',
      icon: 'GraduationCap',
    },
    {
      title: 'التشريع المدرسي والحياة المدرسية',
      description: 'حقوق وواجبات أستاذ التعليم الابتدائي والثانوي، مجالس المؤسسة، ومشروع المؤسسة المندمج.',
      lessonsCount: '5 محاور قانونية',
      icon: 'Users',
    },
  ];

  const pedagogyDocs = pedagogicalResources.filter(r => r.subjectId === 'pedagogy' || r.type === 'fiche');

  return (
    <section className="space-y-8">
      
      {/* Featured Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-3">
            <GraduationCap className="w-4 h-4" />
            <span>فضاء التأهيل المهني والمراكز الجهوية لمهن التربية والتكوين (CRMEF)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 font-['Readex_Pro']">
            ركن أطر التدريس: الكفايات المهنية والديداكتيك
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            منظومة متكاملة من الجذاذات التخطيطية المعتمدة، ملخصات علوم التربية، ودلائل إجراء الامتحانات المهنية ومباريات التعليم للابتدائي والثانوي الإعدادي والتأهيلي.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>مطابق لدفتر الضوابط البيداغوجية 2026</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>جذاذات قابلة للتعديل والطباعة (Word/PDF)</span>
            </div>
          </div>
        </div>

        {/* Decorative ambient visual */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
          <img
            src="/src/assets/images/pedagogy_guide_1794309536979.jpg"
            alt="Pedagogy Desk"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trainingModules.map((mod, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              {mod.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {mod.description}
            </p>
            <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {mod.lessonsCount}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Training Resources List */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Readex_Pro']">
              نماذج الجذاذات والدلائل البيداغوجية الأكثر طلباً
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              جاهزة للاستئناس الفوري في إعداد الحصص والتحضير لمباريات التفتيش والمراكز
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {pedagogyDocs.map(doc => (
            <div
              key={doc.id}
              onClick={() => onSelectResource(doc)}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/50 -mx-3 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-1 sm:mt-0">
                  {doc.fileFormat}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>{doc.targetLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{doc.author.institution}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{doc.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>فتح الوثيقة</span>
                  <ChevronLeft className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
