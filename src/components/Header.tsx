import React from 'react';
import { 
  BookOpen, 
  Search, 
  Moon, 
  Sun, 
  Cloud, 
  CloudRain, 
  CheckCircle2, 
  RefreshCw,
  BookmarkCheck,
  GraduationCap
} from 'lucide-react';
import { CloudSyncState } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  syncState: CloudSyncState;
  onOpenSyncModal: () => void;
  onOpenSearch: () => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
  bookmarkedCount: number;
  onOpenBookmarks: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  syncState,
  onOpenSyncModal,
  onOpenSearch,
  activeSection,
  onSelectSection,
  bookmarkedCount,
  onOpenBookmarks,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark, Zone 2: Navigation Links, Zone 3: Actions */}
        <div className="flex items-center justify-between gap-6 h-18">
          
          {/* Zone 1: Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onSelectSection('lessons')}
              className="group flex items-center gap-3 text-right focus:outline-none"
              title="العودة للصفحة الرئيسية"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-['Readex_Pro']">
                  أنا أستاذ
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider font-['Plus_Jakarta_Sans'] uppercase">
                  ana ostad
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => onSelectSection('lessons')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeSection === 'lessons'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              دروس الدعم المنظمة
            </button>

            <button
              onClick={() => onSelectSection('resources')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeSection === 'resources'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              مستودع الموارد والجذاذات
            </button>

            <button
              onClick={() => onSelectSection('live')}
              className={`whitespace-nowrap transition-colors py-1 flex items-center gap-2 ${
                activeSection === 'live'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>الجلسات التفاعلية المباشرة</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </button>

            <button
              onClick={() => onSelectSection('training')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeSection === 'training'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              أطر التدريس والتكوين (CRMEF)
            </button>
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Search */}
            <button
              onClick={onOpenSearch}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
              title="بحث في الدروس والموارد"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">بحث سريع...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Bookmarks Counter */}
            <button
              onClick={onOpenBookmarks}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="الموارد المحفوظة"
            >
              <BookmarkCheck className="w-5 h-5" />
              {bookmarkedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-emerald-600 rounded-full flex items-center justify-center">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            {/* Cloud Sync Status Indicator */}
            <button
              onClick={onOpenSyncModal}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              title={`حالة المزامنة السحابية (${syncState.provider})`}
            >
              {syncState.syncStatus === 'syncing' ? (
                <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
              ) : syncState.isOnline ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <CloudRain className="w-5 h-5 text-rose-500" />
              )}
              <span className="hidden xl:inline text-xs font-mono text-slate-500 dark:text-slate-400">
                {syncState.syncStatus === 'syncing' ? 'مزامنة...' : 'متصل'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={darkMode ? 'التحويل إلى الوضع الفاتح' : 'التحويل إلى الوضع الليلي'}
              aria-label="تبديل المظهر"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
