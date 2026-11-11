import React, { useState } from 'react';
import { SupportLesson } from '../types';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Hand, 
  Send, 
  Users, 
  MessageSquare, 
  Radio, 
  Maximize2,
  Share2
} from 'lucide-react';

interface LiveSessionModalProps {
  lesson: SupportLesson | null;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: 'student' | 'teacher' | 'moderator';
  text: string;
  timestamp: string;
}

export const LiveSessionModal: React.FC<LiveSessionModalProps> = ({
  lesson,
  onClose,
}) => {
  if (!lesson) return null;

  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'participants'>('chat');
  const [newMessage, setNewMessage] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: lesson.instructor.name,
      role: 'teacher',
      text: 'مرحباً بالجميع في جلسة الدعم التفاعلية المباشرة! سنبدأ بحل التمرين التوليفي الأول.',
      timestamp: '18:31',
    },
    {
      id: '2',
      sender: 'ياسين المودن (تلميذ)',
      role: 'student',
      text: 'أستاذ، هل يمكن إعادة توضيح شرط الرتابة في المجال المفتوح؟',
      timestamp: '18:33',
    },
    {
      id: '3',
      sender: 'مريم الصقلي (تلميذة)',
      role: 'student',
      text: 'نعم، نفس الإشكال واجهني في السؤال الثاني من الفرض.',
      timestamp: '18:34',
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'أنت (تلميذ مستفيد)',
      role: 'student',
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setNewMessage('');

    // Simulated instructor quick acknowledgement
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: lesson.instructor.name,
          role: 'teacher',
          text: 'سؤال ممتاز وفي محله، دعنا نناقش هذه النقطة على اللوح التفاعلي حالاً.',
          timestamp: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      <div 
        className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Live Classroom Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>مباشر الآن</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                {lesson.title}
              </h3>
              <p className="text-xs text-slate-400">
                المؤطر: {lesson.instructor.name} · {lesson.livePlatform || 'منصة أنا أستاذ المباشرة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-300 font-mono">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>48 حاضراً</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="مغادرة الجلسة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Stage & Interactive Side Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
          
          {/* Main Stage (2 cols on lg) */}
          <div className="lg:col-span-2 p-4 flex flex-col justify-between bg-slate-950/90 relative">
            
            {/* Screen / Video Broadcast Area */}
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center">
              <img
                src={lesson.thumbnailUrl}
                alt={lesson.title}
                className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs"
              />

              <div className="relative z-10 text-center p-6 max-w-md">
                <div className="w-20 h-20 rounded-full border-2 border-emerald-500/80 mx-auto mb-4 overflow-hidden shadow-xl">
                  <img
                    src={lesson.instructor.avatar}
                    alt={lesson.instructor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {lesson.instructor.name} يتحدث الآن
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  مشاركة الشاشة: حل المسألة رقم 3 من الإطار المرجعي
                </p>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-emerald-400 font-mono">
                  <span>الصوت: عالي الدقة (HD)</span>
                  <span aria-hidden="true">·</span>
                  <span>اللوح التفاعلي متصل</span>
                </div>
              </div>

              {/* Hand raised floating banner */}
              {isHandRaised && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-amber-500/90 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
                  <Hand className="w-4 h-4" />
                  <span>يدك مرفوعة لطلب الكلمة</span>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="mt-4 p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 rounded-xl transition-colors ${
                    isMicOn 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isMicOn ? 'كتم الميكروفون' : 'تشغيل الميكروفون'}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-3 rounded-xl transition-colors ${
                    isVideoOn 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={isVideoOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsHandRaised(!isHandRaised)}
                  className={`p-3 rounded-xl transition-colors ${
                    isHandRaised 
                      ? 'bg-amber-500 text-slate-950 font-bold' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="رفع اليد لطرح سؤال مباشر"
                >
                  <Hand className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-400 hidden sm:block">
                مساحة تعليمية تفاعلية آمنة
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                مغادرة الحصة
              </button>
            </div>

          </div>

          {/* Right Side: Interactive Chat & Discussion Stream */}
          <div className="border-t lg:border-t-0 lg:border-r border-slate-800 bg-slate-900 flex flex-col h-full">
            
            {/* Tabs */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSideTab('chat')}
                  className={`text-xs font-bold pb-1 transition-colors ${
                    activeSideTab === 'chat' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'
                  }`}
                >
                  الدردشة والأسئلة ({messages.length})
                </button>
                <button
                  onClick={() => setActiveSideTab('participants')}
                  className={`text-xs font-bold pb-1 transition-colors ${
                    activeSideTab === 'participants' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'
                  }`}
                >
                  المشاركون (48)
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {activeSideTab === 'chat' ? (
              <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pl-2 pr-1">
                  {messages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs ${
                        msg.role === 'teacher'
                          ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-200'
                          : 'bg-slate-800/70 text-slate-200 border border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px] text-white">
                          {msg.sender}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* Send Input */}
                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اطرح استفسارك البيداغوجي هنا..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
                    title="إرسال"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
                <div className="p-2 bg-emerald-950/40 rounded-lg flex items-center justify-between text-emerald-300">
                  <span className="font-bold">{lesson.instructor.name} (الأستاذ المؤطر)</span>
                  <span className="text-[10px]">مقدم الجلسة</span>
                </div>
                <div className="p-2 bg-slate-800/50 rounded-lg flex items-center justify-between text-slate-300">
                  <span>أنت (تلميذ مستفيد)</span>
                  <span className="text-[10px] text-slate-400">مشارك</span>
                </div>
                {['أحمد الوهابي', 'سلمى الإدريسي', 'حمزة البوعناني', 'هند الفيلالي', 'عمر الشرايبي'].map((name, i) => (
                  <div key={i} className="p-2 hover:bg-slate-800 rounded-lg flex items-center justify-between text-slate-400">
                    <span>{name}</span>
                    <span className="text-[10px]">مستمع</span>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
