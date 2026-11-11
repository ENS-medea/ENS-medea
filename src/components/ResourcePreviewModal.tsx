import React, { useState } from 'react';
import { PedagogicalResource } from '../types';
import { 
  X, 
  Download, 
  FileText, 
  Bookmark, 
  BookmarkCheck, 
  Check, 
  Printer, 
  Eye, 
  Building2, 
  Calendar,
  Sparkles
} from 'lucide-react';

interface ResourcePreviewModalProps {
  resource: PedagogicalResource | null;
  onClose: () => void;
  onToggleBookmark: (id: string) => void;
  isBookmarked: boolean;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({
  resource,
  onClose,
  onToggleBookmark,
  isBookmarked,
}) => {
  if (!resource) return null;

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
              {resource.fileFormat}
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                معاينة الوثيقة البيداغوجية
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                {resource.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(resource.id)}
              className={`p-2 rounded-lg border transition-colors ${
                isBookmarked 
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-300 dark:border-emerald-700' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-900'
              }`}
              title={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ في المفضلة'}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">الصيغة والحجم</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {resource.fileFormat} ({resource.fileSize})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">عدد التحميلات</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {resource.downloadCount.toLocaleString('ar-MA')} تنزيل
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">تاريخ النشر</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {resource.publishedDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">المستوى المستهدف</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {resource.targetLevel}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              الوصف البيداغوجي:
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Document Sample Preview (Paper Sheet Aesthetic) */}
          <div className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <span className="font-mono">معاينة نصية أولية للصفحة الأولى</span>
              <span>المملكة المغربية · وزارة التربية الوطنية والتكوين المهني</span>
            </div>

            <div className="prose dark:prose-invert text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-serif">
              <div className="text-center font-bold text-slate-900 dark:text-white text-base mb-4 font-sans">
                {resource.title}
              </div>
              <p>
                {resource.previewContent || 'تتضمن هذه الوثيقة تخطيطاً دقيقاً للمقاطع الديداكتيكية، وضعية الانطلاق، والوسائل التعليمية المساعدة، مع شبكة التقويم التكويني والدعم الفوري.'}
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold block mb-1">توجيهات منهجية موجهة للمدرسين والطلبة:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>استثمار الوضعية المشكلة لتشخيص التمثلات وتفعيل النقل الديداكتيكي.</li>
                  <li>تنويع وسائط التنشيط والاشتغال في مجموعات بيداغوجية صغيرة.</li>
                  <li>اعتماد سلم التنقيط المرجعي الصادر عن الوزارة الوصية لتقويم الأعمال.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Author Attribution */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {resource.author.name}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {resource.author.role} · {resource.author.institution}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          {downloadSuccess ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              <span>تم تنزيل الوثيقة ({resource.fileFormat}) بنجاح إلى جهازك!</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              وثيقة معتمدة ومطابقة للمنهاج الدراسي الرسمي
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الوثيقة الآن</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
