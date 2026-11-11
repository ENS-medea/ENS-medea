import React, { useState, useMemo } from 'react';
import { PedagogicalResource, ResourceType } from '../types';
import { 
  Search, 
  Download, 
  Eye, 
  Bookmark, 
  BookmarkCheck, 
  FileText, 
  Filter, 
  Check, 
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface ResourceRepositoryProps {
  resources: PedagogicalResource[];
  onPreviewResource: (resource: PedagogicalResource) => void;
  onToggleBookmark: (resourceId: string) => void;
}

export const ResourceRepository: React.FC<ResourceRepositoryProps> = ({
  resources,
  onPreviewResource,
  onToggleBookmark,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'latest'>('popular');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const filterTabs = [
    { id: 'all', label: 'جميع الموارد' },
    { id: 'fiche', label: 'جذاذات بيداغوجية نموذجية' },
    { id: 'summary', label: 'ملخصات الدروس والخرائط الذهنية' },
    { id: 'exam', label: 'امتحانات وفروض مع التصحيح' },
    { id: 'pdf', label: 'دلائل التكوين وحقائب التدريس' },
  ];

  const filteredResources = useMemo(() => {
    return resources
      .filter(item => {
        if (selectedType !== 'all' && item.type !== selectedType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchAuthor = item.author.name.toLowerCase().includes(q);
          const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchAuthor && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return b.downloadCount - a.downloadCount;
        return b.id.localeCompare(a.id);
      });
  }, [resources, selectedType, searchQuery, sortBy]);

  const handleDownloadQuick = (e: React.MouseEvent, res: PedagogicalResource) => {
    e.stopPropagation();
    setDownloadFeedback(res.title);
    setTimeout(() => setDownloadFeedback(null), 3000);
  };

  return (
    <section className="space-y-6">
      
      {/* Search & Top Controls */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Readex_Pro']">
              مستودع الوثائق والموارد البيداغوجية
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              أرشيف رقمي منظم لجذاذات التعليم الابتدائي والثانوي وأطر التكوين بالمراكز الجهوية.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالعنوان، المفهوم، أو اسم الأستاذ..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>
        </div>

        {/* Category Tabs & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {filterTabs.map(tab => {
              const active = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedType(tab.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="text-slate-400">الترتيب:</span>
            <button
              onClick={() => setSortBy(sortBy === 'popular' ? 'latest' : 'popular')}
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-200"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortBy === 'popular' ? 'الأكثر تنزيلاً' : 'الأحدث نشرًا'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Download Alert Banner */}
      {downloadFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center justify-between border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>بدأ تنزيل الوثيقة: <strong>{downloadFeedback}</strong></span>
          </div>
          <span className="text-[11px] font-mono">جاهز للاستخدام الفوري</span>
        </div>
      )}

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            لم يتم العثور على وثائق مطابقة
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            جرب تعديل كلمات البحث أو اختيار تبويب "جميع الموارد".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((resource) => {
            return (
              <div
                key={resource.id}
                onClick={() => onPreviewResource(resource)}
                className="group bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between cursor-pointer shadow-xs"
              >
                <div>
                  {/* Top line metadata (Zero-Pill Discipline) */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {resource.fileFormat}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{resource.fileSize}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{resource.downloadCount} تنزيل</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(resource.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        resource.isBookmarked
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={resource.isBookmarked ? 'إزالة من المحفوظات' : 'حفظ'}
                    >
                      {resource.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 fill-current" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {resource.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {resource.description}
                  </p>
                </div>

                {/* Footer Metadata & Action Buttons */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mb-3">
                    إشراف: {resource.author.name}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewResource(resource);
                      }}
                      className="py-1.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة</span>
                    </button>

                    <button
                      onClick={(e) => handleDownloadQuick(e, resource)}
                      className="py-1.5 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
