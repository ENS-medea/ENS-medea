import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, FileText, ArrowRight, Video } from 'lucide-react';
import { SupportLesson, PedagogicalResource } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: SupportLesson[];
  resources: PedagogicalResource[];
  onSelectLesson: (lesson: SupportLesson) => void;
  onSelectResource: (resource: PedagogicalResource) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  lessons,
  resources,
  onSelectLesson,
  onSelectResource,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredLessons = lessons.filter(l => 
    l.title.toLowerCase().includes(query.toLowerCase()) ||
    l.description.toLowerCase().includes(query.toLowerCase()) ||
    l.instructor.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.description.toLowerCase().includes(query.toLowerCase()) ||
    r.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 sm:pt-20 animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن درس دعم، جذاذة تربوية، تمرين، أو ملخص..."
            className="w-full text-sm sm:text-base bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {query.trim().length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              اكتب كلمة مفتاحية مثل: "دوال", "ميكانيك", "ديداكتيك", "جذاذة"...
            </div>
          ) : (
            <>
              {/* Lessons matches */}
              {filteredLessons.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    دروس الدعم المنظمة ({filteredLessons.length}):
                  </h4>
                  <div className="space-y-1.5">
                    {filteredLessons.map(lesson => (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          onSelectLesson(lesson);
                          onClose();
                        }}
                        className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between gap-3 text-right"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Video className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {lesson.title}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {lesson.instructor.name} · المدة: {lesson.videoDuration}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 shrink-0 font-medium">فتح الدرس</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources matches */}
              {filteredResources.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">
                    الموارد والوثائق ({filteredResources.length}):
                  </h4>
                  <div className="space-y-1.5">
                    {filteredResources.map(resource => (
                      <div
                        key={resource.id}
                        onClick={() => {
                          onSelectResource(resource);
                          onClose();
                        }}
                        className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between gap-3 text-right"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {resource.title}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {resource.fileFormat} ({resource.fileSize})
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 shrink-0 font-medium">معاينة</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredLessons.length === 0 && filteredResources.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  لم يتم العثور على نتائج مطابقة لـ "{query}"
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>انقر على النتيجة لفتحها مباشرة</span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px]">
            ESC للإغلاق
          </kbd>
        </div>
      </div>
    </div>
  );
};
