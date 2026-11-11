import React from 'react';
import { GraduationCap, ShieldCheck, Heart, BookOpen } from 'lucide-react';

interface FooterProps {
  onSelectSection: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectSection }) => {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white font-['Readex_Pro']">
                أنا أستاذ · ana ostad
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              المنصة البيداغوجية المتكاملة لدروس الدعم، التوجيه الأكاديمي، وتأهيل أطر التدريس بالمراكز الجهوية لمهن التربية والتكوين.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-xs">
              المسارات الدراسية
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={() => onSelectSection('lessons')} className="hover:text-emerald-600">
                  السنة الأولى (الجذوع المشتركة والأولى باك)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectSection('lessons')} className="hover:text-emerald-600">
                  السنة الثانية (البكالوريا والتأهيل الإشهادي)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectSection('training')} className="hover:text-emerald-600">
                  مباريات وأطر التدريس (CRMEF)
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-xs">
              المستودع البيداغوجي
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={() => onSelectSection('resources')} className="hover:text-emerald-600">
                  جذاذات الدروس النموذجية
                </button>
              </li>
              <li>
                <button onClick={() => onSelectSection('resources')} className="hover:text-emerald-600">
                  ملخصات القوانين والخطاطات الذهنية
                </button>
              </li>
              <li>
                <button onClick={() => onSelectSection('resources')} className="hover:text-emerald-600">
                  نماذج الامتحانات الوطنية الموحدة
                </button>
              </li>
            </ul>
          </div>

          {/* Institutional note */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-xs">
              المعايير والجودة
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
              جميع المحتويات والوثائق تخضع لتدقيق هيئات التفتيش التربوي ومطابقة للأطر المرجعية المعتمدة رسمياً.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>محتوى تربوي مؤطر ومحين 2026/2027</span>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()} منصة أنا أستاذ (ana ostad). جميع الحقوق محفوظة لخدمة التربية والتعليم.
          </div>
          <div className="flex items-center gap-4">
            <span>النسخة الأكاديمية 2.4</span>
            <span aria-hidden="true">·</span>
            <span>بنية تحتية سحابية موثوقة</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
