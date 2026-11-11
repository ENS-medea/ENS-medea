import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  Server, 
  Code2, 
  Copy, 
  Check, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { CloudSyncState } from '../types';
import { dbService } from '../services/mockDatabase';

interface BackendSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: CloudSyncState;
}

export const BackendSyncModal: React.FC<BackendSyncModalProps> = ({
  isOpen,
  onClose,
  syncState,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'status' | 'firebase' | 'supabase'>('status');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const manifest = dbService.getBackendSchemaManifest();

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    await dbService.triggerSync();
    setIsSyncing(false);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ana ostad (أنا أستاذ) - Role-Based Security Rules
    match /academic_years/{yearId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role in ['admin', 'inspector'];
    }
    match /support_lessons/{lessonId} {
      allow read: if true;
      allow create, update: if request.auth != null && request.auth.token.role in ['teacher', 'admin'];
    }
    match /pedagogical_resources/{resourceId} {
      allow read: if true;
      allow create, update: if request.auth != null && request.auth.token.role in ['teacher', 'inspector'];
    }
    match /users/{userId}/bookmarks/{resourceId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/lesson_progress/{lessonId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const supabaseDdlSnippet = `-- ana ostad (أنا أستاذ) - Supabase / PostgreSQL Schema Readiness
create table public.academic_years (
  id text primary key,
  title text not null,
  level_badge text not null,
  total_lessons int default 0,
  created_at timestamptz default now()
);

create table public.support_lessons (
  id text primary key,
  academic_year_id text references public.academic_years(id),
  title text not null,
  subject_id text not null,
  video_url text,
  is_live boolean default false,
  live_status text default 'scheduled',
  instructor jsonb not null,
  created_at timestamptz default now()
);

create table public.pedagogical_resources (
  id text primary key,
  academic_year_id text references public.academic_years(id),
  title text not null,
  type text not null,
  file_format text not null,
  file_url text not null,
  downloads int default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.support_lessons enable row level security;
create policy "Allow public read" on public.support_lessons for select using (true);
`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Readex_Pro']">
                هندسة التزامن السحابي وقواعد البيانات (Backend Readiness)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                جاهزية الربط مع Firebase Firestore و Supabase لمزامنة متعددة الأجهزة (Multi-Instance Sync)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 pt-3 border-b border-slate-200 dark:border-slate-800 gap-6 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 transition-colors ${
              activeTab === 'status'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            حالة المزامنة والبيانات
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`pb-3 transition-colors flex items-center gap-1.5 ${
              activeTab === 'firebase'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Firebase Firestore</span>
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 transition-colors flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-500" />
            <span>Supabase (PostgreSQL)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Sync Health Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      قاعدة البيانات متصلة ومحدثة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    آخر مزامنة ناجحة: {syncState.lastSyncedAt} · المزود النشط: {syncState.provider}
                  </p>
                </div>

                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة يدوية فورية'}</span>
                </button>
              </div>

              {/* Provider Selection */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  تحديد الواجهة الخلفية السحابية (Cloud Backend Switch):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => dbService.setBackendProvider('Firestore (Firebase)')}
                    className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 ${
                      syncState.provider === 'Firestore (Firebase)'
                        ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Firebase Firestore
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        مزامنة آنية للوثائق والدروس والجلسات المباشرة مع وضع Offline متقدم.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => dbService.setBackendProvider('Supabase (PostgreSQL)')}
                    className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 ${
                      syncState.provider === 'Supabase (PostgreSQL)'
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Server className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Supabase (PostgreSQL)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        قاعدة بيانات علائقية كاملة مع سياسات أمان RLS ومطابقة لمعايير الوزارة.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Offline-First Readiness */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  ميزة العمل بدون اتصال (Offline Persistence First):
                </span>
                <p>
                  يتم حفظ الملاحظات، الموارد المفضلة، ونسب إنجاز الدروس في التخزين المحلي `LocalStorage` و `IndexedDB`، وتتم المزامنة التلقائية فور عودة الاتصال دون فقدان أية بيانات.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  قواعد الأمان الرسمية (firestore.rules) لمنصة أنا أستاذ:
                </h4>
                <button
                  onClick={() => handleCopy(firestoreRulesSnippet, 'rules')}
                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md flex items-center gap-1.5"
                >
                  {copiedCode === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'rules' ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>
              </div>

              <pre dir="ltr" className="p-4 bg-slate-950 text-emerald-400 text-xs rounded-xl overflow-x-auto font-mono max-h-72 border border-slate-800">
                {firestoreRulesSnippet}
              </pre>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                المجموعات (Collections):
                <ul className="list-disc list-inside mt-1 font-mono text-[11px] space-y-0.5">
                  {manifest.databaseReadiness.firebaseFirestore.collections.map((col, i) => (
                    <li key={i}>{col}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  مخطط الجداول وسياسات RLS (SQL DDL):
                </h4>
                <button
                  onClick={() => handleCopy(supabaseDdlSnippet, 'ddl')}
                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md flex items-center gap-1.5"
                >
                  {copiedCode === 'ddl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'ddl' ? 'تم النسخ!' : 'نسخ SQL'}</span>
                </button>
              </div>

              <pre dir="ltr" className="p-4 bg-slate-950 text-blue-300 text-xs rounded-xl overflow-x-auto font-mono max-h-72 border border-slate-800">
                {supabaseDdlSnippet}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            جاهزية كاملة للربط المباشر مع SDKs الرسمية
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            إغلاق
          </button>
        </div>

      </div>

    </div>
  );
};
