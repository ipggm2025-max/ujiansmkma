import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  UserPlus,
  School,
  GraduationCap,
  LibraryBig,
  BookText,
  DoorOpen,
  Upload,
  FileSpreadsheet,
  Download,
  Camera,
  Image as ImageIcon,
  Eye,
  Activity,
  Monitor,
  RefreshCw
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { examService } from './services/examService';
import * as XLSX from 'xlsx';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// --- Utilities ---
const MathText = ({ text }: { text: string }) => {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <BlockMath key={i} math={part.slice(2, -2)} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={i} math={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// --- Types ---
type View = 'dashboard' | 'questions' | 'exams' | 'students' | 'settings' | 'exam-take' | 'users' | 'schools' | 'classes' | 'majors' | 'subjects' | 'preview-exam' | 'monitoring';
type Role = 'administrator' | 'guru' | 'siswa';

type AppSettings = {
  id?: string;
  app_name: string;
  app_version: string;
  app_description: string;
  logo_text: string;
  logo_url?: string;
  institution_name: string;
  copyright_text: string;
  footer_info: string;
};

// --- Mock Data ---
const MOCK_STATS = [
  { label: 'Total Siswa', value: '1.240', icon: Users, color: 'from-blue-600 to-indigo-700' },
  { label: 'Bank Soal', value: '342', icon: BookOpen, color: 'from-sky-500 to-blue-600' },
  { label: 'Ujian Aktif', value: '12', icon: Calendar, color: 'from-blue-700 to-slate-900' },
  { label: 'Rerata Nilai', value: '82.4', icon: CheckCircle2, color: 'from-indigo-500 to-blue-800' },
];

const MOCK_EXAMS = [
  { id: '1', title: 'Ujian Matematika Semester 1', subject: 'Matematika', time: '10:00 - 12:00', date: '20 Apr 2026', status: 'Upcoming' },
  { id: '2', title: 'Harian Bahasa Indonesia', subject: 'Bahasa Indonesia', time: '08:00 - 09:30', date: '21 Apr 2026', status: 'Draft' },
  { id: '3', title: 'Ujian Fisika Dasar', subject: 'Fisika', time: '13:00 - 15:00', date: '22 Apr 2026', status: 'Upcoming' },
];

// --- Components ---

const ExamTakeView = ({ exam, profile, onFinish, settings }: { exam: any, profile: any, onFinish: (score: number) => void, settings: AppSettings }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam?.duration_minutes * 60 || 3600);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!exam) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('question_bank_id', exam.question_bank_id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setQuestions(data || []);
      } catch (err: any) {
        alert("Gagal memuat instrumen soal: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [exam]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    if (timeLeft === 0) handleFinish();
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    if (questions.length === 0) return;
    
    let totalPoints = questions.reduce((acc, q) => acc + q.points, 0);
    let earnedPoints = 0;
    
    questions.forEach(q => {
      const studentAnswer = answers[q.id];
      if (studentAnswer === q.correct_answer) {
        earnedPoints += q.points;
      }
    });
    
    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    try {
      if (!profile) {
        throw new Error('Identitas siswa tidak ditemukan (Profile is Null). Silakan relogin.');
      }

      const { data: record, error } = await supabase.from('exam_submissions').insert([{
        exam_id: exam.id,
        student_id: profile.id,
        answers: answers,
        score: finalScore,
        status: 'submitted',
        finished_at: new Date().toISOString()
      }]).select();

      if (error) {
        console.error('Database Core Rejection:', error);
        throw error;
      }
      
      console.log('Handshake Success: Data Inventaris Tersimpan', record);
      onFinish(finalScore);
    } catch (error: any) {
      console.error('Critical Failure during Submission:', error);
      alert("FATAL ERROR: Gagal mengirim berkas ke registry. Detail: " + (error.message || error.details || 'Unknown Error'));
      // Kita tetap panggil onFinish agar siswa tidak stuck, tapi infokan datanya gagal
      if (confirm('Gagal menyimpan ke server. Ingin tetap melihat skor sementara? (Data mungkin tidak terselamatkan di database)')) {
        onFinish(finalScore);
      }
    }
  };

  if (loading || !exam) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Handshake ke Registry Ujian...</p>
    </div>
  );

  const currentQ = questions[currentIdx];

  return (
    <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in zoom-in-95 duration-300">
      {/* Header Sticky - Full Width */}
      <div className="lg:col-span-4 flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-accent rounded-xl flex flex-col items-center justify-center font-black leading-none">
            <span className="text-sm">{currentIdx + 1}</span>
            <span className="text-[8px] opacity-60 uppercase">of {questions.length}</span>
          </div>
          <div>
            <h3 className="font-black text-xs text-brand uppercase tracking-tight">{exam.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siswa: {profile?.full_name} • {profile?.classes?.name}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl font-mono text-lg font-black border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse text-xl' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm relative min-h-[500px] flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Koneksi Secure SSL-256
            </div>
            <span>Butir Soal {currentIdx + 1}</span>
          </div>

          <div className="p-8 flex-1">
            {currentQ?.image_url && (
              <div className="mb-8 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-[300px]">
                <img src={currentQ.image_url} alt="Reference" className="w-full h-full object-contain mx-auto" referrerPolicy="no-referrer" />
              </div>
            )}

            <div className="text-[10px] font-black text-accent uppercase tracking-widest mb-4">Navigasi Terminal {currentIdx + 1}</div>
            <div className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-10">
              <MathText text={currentQ?.content} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
              {currentQ?.options?.map((opt: string, i: number) => {
                 const letter = String.fromCharCode(65 + i);
                 if (!opt) return null;
                 const isSelected = answers[currentQ.id] === letter;
                 return (
                  <button
                    key={i}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: letter }))}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                      isSelected
                        ? 'border-brand bg-blue-50/50 shadow-md translate-x-1' 
                        : 'border-slate-100 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black shadow-sm transition-colors ${
                      isSelected ? 'bg-brand text-accent' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}>
                      {letter}
                    </div>
                    <span className={`text-sm font-bold ${isSelected ? 'text-brand' : 'text-slate-600'}`}>
                      <MathText text={opt} />
                    </span>
                  </button>
                 );
              })}
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button 
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-30 border border-transparent hover:border-slate-200 transition-all flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Sebelumnya
            </button>
            
            <div className="flex gap-4">
              {currentIdx === questions.length - 1 ? (
                <button 
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin mengumpulkan berkas ujian ini?')) {
                      handleFinish();
                    }
                  }}
                  className="bg-emerald-600 text-accent px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                >
                  Selesai
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="bg-brand text-accent px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg flex items-center gap-2"
                >
                  Lanjut <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Question Tracker Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Status Inventaris Soal</h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-3">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-[11px] font-black transition-all border-2 ${
                    isCurrent 
                      ? 'bg-brand text-accent border-brand shadow-lg scale-110 z-10' 
                      : isAnswered 
                        ? 'bg-slate-900 text-accent border-slate-900' 
                        : 'bg-white text-slate-300 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-slate-900 border border-slate-900" />
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sudah Terisi</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-white border border-slate-200" />
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Belum Terisi</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded bg-brand border border-brand" />
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Berjalan</div>
            </div>
          </div>
          
          <div className="mt-8 p-5 bg-blue-50 rounded-2xl">
            <div className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 text-center">Progres Total</div>
            <div className="text-2xl font-black text-slate-700 font-mono text-center mb-3">
              {Object.keys(answers).length}/{questions.length}
            </div>
            <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
               <div className="h-full bg-brand transition-all duration-500" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ activeView, setView, role, onLogout }: { activeView: View, setView: (v: View) => void, role: Role, onLogout: () => void }) => {
  const menuGroups = [
    {
      title: 'Navigasi Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrator', 'guru', 'siswa'] },
      ]
    },
    {
      title: 'Kontrol Pengguna',
      items: [
        { id: 'users', label: 'Manajemen User', icon: Users, roles: ['administrator'] },
      ]
    },
    {
      title: 'Data Master',
      items: [
        { id: 'schools', label: 'Sekolah', icon: School, roles: ['administrator'] },
        { id: 'majors', label: 'Jurusan', icon: LibraryBig, roles: ['administrator'] },
        { id: 'classes', label: 'Kelas', icon: DoorOpen, roles: ['administrator'] },
        { id: 'subjects', label: 'Mata Pelajaran', icon: BookText, roles: ['administrator'] },
      ]
    },
    {
      title: 'Manajemen Ujian',
      items: [
        { id: 'questions', label: 'Bank Soal', icon: BookOpen, roles: ['administrator', 'guru'] },
        { id: 'exams', label: 'Jadwal Ujian', icon: Calendar, roles: ['administrator', 'guru', 'siswa'] },
        { id: 'monitoring', label: 'Monitor Real-time', icon: Activity, roles: ['administrator', 'guru'] },
      ]
    },
    {
      title: 'Konfigurasi',
      items: [
        { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['administrator'] },
      ]
    }
  ];

  const roleLabels = {
    administrator: { name: 'Super Admin', label: 'Operator Utama' },
    guru: { name: 'Tenaga Pendidik', label: 'Guru Mata Pelajaran' },
    siswa: { name: 'Peserta Ujian', label: 'Siswa Aktif' }
  };

  return (
    <aside className="w-64 sidebar-gradient text-slate-300 h-screen sticky top-0 flex flex-col shrink-0 border-r border-white/5 shadow-2xl">
      <div className="flex items-center gap-3 p-8 mb-4 border-b border-white/5">
        <div className="w-11 h-11 bg-gradient-to-br from-accent to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-accent/20">
          {role.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-[13px] font-black text-white leading-tight uppercase tracking-tight">{roleLabels[role].name}</div>
          <div className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-black mt-0.5">{roleLabels[role].label}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-4">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="mb-8">
              <div className="px-4 mb-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {group.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id as View)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 group ${
                        isActive 
                          ? 'bg-blue-600/20 text-accent border border-accent/20 shadow-lg shadow-blue-900/20' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {item.label}
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Log Out System
        </button>
      </div>
    </aside>
  );
};

const SchoolManagementView = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', address: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validasi Duplikat
      const isDuplicate = items.find(it => 
        it.name.toLowerCase() === formData.name.toLowerCase() &&
        it.id !== editingItem?.id
      );

      if (isDuplicate) {
        alert('Sekolah dengan Nama tersebut sudah terdaftar!');
        return;
      }

      if (editingItem) {
        const { error } = await supabase.from('schools').update(formData).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('schools').insert([formData]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus sekolah ini?')) {
      await supabase.from('schools').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-brand uppercase tracking-tight">Data Sekolah</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola identitas sekolah dalam sistem</p>
        </div>
        <button onClick={() => { setEditingItem(null); setFormData({ name: '', address: '' }); setShowModal(true); }} className="bg-brand text-accent px-5 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-all">
          <Plus className="w-4 h-4" /> Tambah Sekolah
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Sekolah</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold uppercase text-[10px]">Memuat...</td></tr> : 
            items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50/30 group">
                <td className="px-6 py-4 font-bold text-sm text-slate-900">{it.name}</td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">{it.address}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingItem(it); setFormData({ name: it.name, address: it.address }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-brand transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(it.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-black text-brand uppercase tracking-tight mb-6">{editingItem ? 'Edit Sekolah' : 'Tambah Sekolah'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Sekolah</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Alamat</label>
                <textarea className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm h-24" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-[11px] font-black uppercase text-slate-600">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-brand text-accent text-[11px] font-black uppercase tracking-widest">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MajorManagementView = () => {
  const [items, setItems] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', code: '', school_id: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data: m } = await supabase.from('majors').select('*, schools(name)').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('schools').select('id, name');
    if (m) setItems(m);
    if (s) setSchools(s);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validasi Duplikat
      const isDuplicate = items.find(it => 
        (it.name.toLowerCase() === formData.name.toLowerCase() || it.code.toLowerCase() === formData.code.toLowerCase()) &&
        it.school_id === formData.school_id &&
        it.id !== editingItem?.id
      );

      if (isDuplicate) {
        alert('Jurusan dengan Nama atau Kode tersebut sudah terdaftar di sekolah ini!');
        return;
      }

      if (editingItem) {
        const { error } = await supabase.from('majors').update(formData).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('majors').insert([formData]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus jurusan ini?')) {
      await supabase.from('majors').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-brand uppercase tracking-tight">Data Jurusan</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola kompetensi keahlian</p>
        </div>
        <button onClick={() => { setEditingItem(null); setFormData({ name: '', code: '', school_id: schools[0]?.id || '' }); setShowModal(true); }} className="bg-brand text-accent px-5 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-all">
          <Plus className="w-4 h-4" /> Tambah Jurusan
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode & Nama Jurusan</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sekolah</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold uppercase text-[10px]">Memuat...</td></tr> : 
            items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50/30 group">
                <td className="px-6 py-4 font-bold text-sm text-slate-900 uppercase font-mono tracking-tight">
                  <span className="text-accent mr-2 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">{it.code}</span>
                  {it.name}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">{it.schools?.name}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingItem(it); setFormData({ name: it.name, code: it.code, school_id: it.school_id }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-brand transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(it.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-black text-brand uppercase tracking-tight mb-6">{editingItem ? 'Edit Jurusan' : 'Tambah Jurusan'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Sekolah</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.school_id} onChange={e => setFormData({...formData, school_id: e.target.value})} required>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Kode</label>
                  <input type="text" placeholder="RPL" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono uppercase" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Jurusan</label>
                  <input type="text" placeholder="Rekayasa Perangkat Lunak" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-[11px] font-black uppercase text-slate-600">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-brand text-accent text-[11px] font-black uppercase tracking-widest">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ClassManagementView = () => {
  const [items, setItems] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', level: '10', school_id: '', major_id: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data: cl } = await supabase.from('classes').select('*, schools(name), majors(name, code)').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('schools').select('id, name');
    const { data: m } = await supabase.from('majors').select('id, name, code, school_id');
    if (cl) setItems(cl);
    if (s) setSchools(s);
    if (m) setMajors(m);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {...formData, level: parseInt(formData.level)};

      // 1. Validasi Duplikat di Sisi Client
      const isDuplicate = items.find(it => 
        it.name.toLowerCase() === payload.name.toLowerCase() && 
        it.level === payload.level && 
        it.school_id === payload.school_id && 
        it.major_id === payload.major_id &&
        it.id !== editingItem?.id
      );

      if (isDuplicate) {
        alert('Data Kelas tersebut sudah terdaftar! Harap gunakan nama atau tingkat yang berbeda.');
        return;
      }

      if (editingItem) {
        const { error } = await supabase.from('classes').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('classes').insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kelas ini?')) {
      await supabase.from('classes').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-brand uppercase tracking-tight">Data Kelas</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola rombongan belajar</p>
        </div>
        <button onClick={() => { setEditingItem(null); setFormData({ name: '', level: '10', school_id: schools[0]?.id || '', major_id: majors[0]?.id || '' }); setShowModal(true); }} className="bg-brand text-accent px-5 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-all">
          <Plus className="w-4 h-4" /> Tambah Kelas
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tingkat & Nama Kelas</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jurusan</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sekolah</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold uppercase text-[10px]">Memuat...</td></tr> : 
            items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50/30 group">
                <td className="px-6 py-4">
                  <span className="font-black text-brand bg-slate-100 px-2.5 py-1 rounded-md mr-3 text-xs">{it.level}</span>
                  <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">{it.name}</span>
                </td>
                <td className="px-6 py-4 text-xs text-brand font-bold uppercase tracking-widest">{it.majors?.code} - {it.majors?.name}</td>
                <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">{it.schools?.name}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingItem(it); setFormData({ name: it.name, level: it.level.toString(), school_id: it.school_id, major_id: it.major_id }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-brand transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(it.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-black text-brand uppercase tracking-tight mb-6">{editingItem ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Sekolah</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.school_id} onChange={e => setFormData({...formData, school_id: e.target.value})} required>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Jurusan</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.major_id} onChange={e => setFormData({...formData, major_id: e.target.value})} required>
                  <option value="">Pilih Jurusan...</option>
                  {majors.filter(m => m.school_id === formData.school_id).map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Tingkat</label>
                  <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} required>
                    <option value="10">10</option><option value="11">11</option><option value="12">12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Kelas</label>
                  <input type="text" placeholder="RPL-1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-[11px] font-black uppercase text-slate-600">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-brand text-accent text-[11px] font-black uppercase tracking-widest">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SubjectManagementView = () => {
  const [items, setItems] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', code: '', school_id: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data: sub } = await supabase.from('subjects').select('*, schools(name)').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('schools').select('id, name');
    if (sub) setItems(sub);
    if (s) setSchools(s);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validasi Duplikat
      const isDuplicate = items.find(it => 
        (it.name.toLowerCase() === formData.name.toLowerCase() || it.code.toLowerCase() === formData.code.toLowerCase()) &&
        it.school_id === formData.school_id &&
        it.id !== editingItem?.id
      );

      if (isDuplicate) {
        alert('Mata Pelajaran dengan Nama atau Kode tersebut sudah terdaftar di sekolah ini!');
        return;
      }

      if (editingItem) {
        const { error } = await supabase.from('subjects').update(formData).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subjects').insert([formData]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus mata pelajaran ini?')) {
      await supabase.from('subjects').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-brand uppercase tracking-tight">Mata Pelajaran</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola kurikulum mata pelajaran</p>
        </div>
        <button onClick={() => { setEditingItem(null); setFormData({ name: '', code: '', school_id: schools[0]?.id || '' }); setShowModal(true); }} className="bg-brand text-accent px-5 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-all">
          <Plus className="w-4 h-4" /> Tambah Mapel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode & Nama Mapel</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sekolah</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 font-bold uppercase text-[10px]">Memuat...</td></tr> : 
            items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50/30 group">
                <td className="px-6 py-4">
                  <div className="text-[10px] font-mono font-bold text-accent uppercase bg-blue-50 px-1.5 py-0.5 rounded w-fit mb-1.5 tracking-widest">{it.code}</div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors uppercase tracking-tight">{it.name}</div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">{it.schools?.name}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingItem(it); setFormData({ name: it.name, code: it.code, school_id: it.school_id }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-brand transition-all"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(it.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-black text-brand uppercase tracking-tight mb-6">{editingItem ? 'Edit Mapel' : 'Tambah Mapel'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Sekolah</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.school_id} onChange={e => setFormData({...formData, school_id: e.target.value})} required>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Kode</label>
                  <input type="text" placeholder="MTK" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono uppercase" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Mata Pelajaran</label>
                  <input type="text" placeholder="Matematika" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-[11px] font-black uppercase text-slate-600">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-brand text-accent text-[11px] font-black uppercase tracking-widest">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const UserManagementView = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'siswa',
    class_id: '',
    major_id: '',
    nisn: '',
    password: ''
  });

  const [classes, setClasses] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: userData } = await supabase
      .from('profiles')
      .select('*, classes(name), majors(name, code)')
      .order('created_at', { ascending: false });
    
    const { data: classData } = await supabase.from('classes').select('*');
    const { data: majorData } = await supabase.from('majors').select('*');

    if (userData) setUsers(userData);
    if (classData) setClasses(classData);
    if (majorData) setMajors(majorData);
    setLoading(false);
  };

  const downloadTemplate = () => {
    const template = [
      { 
        "EMAIL": "siswa.contoh@sekolah.id", 
        "NISN": "12345678", 
        "TINGKAT AKSES": "siswa", 
        "NAMA LENGKAP": "Ahmad Fauzi", 
        "JURUSAN": "IPA", 
        "KELAS": "XII-IPA-1" 
      },
      { 
        "EMAIL": "guru.contoh@sekolah.id", 
        "NISN": "", 
        "TINGKAT AKSES": "guru", 
        "NAMA LENGKAP": "Budi Santoso", 
        "JURUSAN": "", 
        "KELAS": "" 
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template User');
    XLSX.writeFile(wb, 'Template_Impor_User.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawExcelData = XLSX.utils.sheet_to_json(ws) as any[];

        // Map Indonesian labels to code keys
        const mappedData = rawExcelData.map(row => ({
          email: row["EMAIL"],
          nisn: row["NISN"],
          role: row["TINGKAT AKSES"]?.toLowerCase(),
          full_name: row["NAMA LENGKAP"],
          major_code: row["JURUSAN"],
          class_name: row["KELAS"]
        }));

        const validData = mappedData.filter(item => item.email && item.full_name && item.role);
        
        if (validData.length === 0) {
          alert('Data Excel tidak valid atau kolom (EMAIL, NAMA LENGKAP, TINGKAT AKSES) tidak ditemukan.');
          setUploading(false);
          return;
        }

        // Pre-resolve class and major IDs
        const processedUsers = validData.map(user => {
          const res: any = { ...user };
          if (user.role === 'siswa') {
            let foundMajorId = '';
            
            // Resolve major first if provided
            if (user.major_code) {
              const maj = majors.find(m => m.code === user.major_code);
              if (maj) foundMajorId = maj.id;
            }

            // Resolve class
            if (user.class_name) {
              const cls = classes.find(c => c.name === user.class_name);
              if (cls) {
                res.class_id = cls.id;
                // If major not found yet, use class's major
                if (!foundMajorId && cls.major_id) {
                  foundMajorId = cls.major_id;
                }
              }
            }
            
            res.major_id = foundMajorId;
          }
          return res;
        });

        const response = await fetch('/api/admin/bulk-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: processedUsers })
        });

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Sistem sedang tidak tersedia (${response.status}). Respon: ${text.substring(0, 50)}... Silakan coba lagi dalam 10 detik.`);
        }

        const result = await response.json();

        if (response.ok) {
          const msg = `Bulk Register Selesai!\n` +
                      `- Berhasil: ${result.success.length}\n` +
                      `- Gagal: ${result.failed.length}`;
          
          if (result.failed.length > 0) {
            console.error('Failed items:', result.failed);
            alert(msg + '\n\nPeriksa konsol browser untuk detail error.');
          } else {
            alert(msg);
          }
        } else {
          throw new Error(result.error || 'Server error saat bulk register');
        }

        fetchData();
      } catch (error: any) {
        console.error('Upload Error:', error);
        alert('Gagal memproses upload: ' + error.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updateData: any = {
        full_name: formData.full_name,
        role: formData.role
      };

      if (formData.role === 'siswa') {
        updateData.class_id = formData.class_id || null;
        updateData.major_id = formData.major_id || null;
        updateData.nisn = formData.nisn || null;
      } else {
        updateData.class_id = null;
        updateData.major_id = null;
        updateData.nisn = null;
      }

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingUser.id);
      
      setShowModal(false);
      fetchData();
    } else {
      // Registration via API
      try {
        const response = await fetch('/api/admin/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        if (response.ok) {
          alert('User berhasil didaftarkan ke sistem.');
          setShowModal(false);
          fetchData();
        } else {
          throw new Error(result.error || 'Gagal mendaftarkan user');
        }
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (confirm(`PERINGATAN: Anda akan menghapus user (${email}) secara permanen dari sistem Authentication dan Database.\n\nApakah Anda yakin ingin melanjutkan?`)) {
      try {
        const response = await fetch(`/api/admin/delete-user/${id}`, {
          method: 'DELETE',
        });
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Server bermasalah (${response.status}). Respon: ${text.substring(0, 50)}... Pastikan Service Role Key sudah terpasang.`);
        }

        const result = await response.json();
        if (response.ok) {
          alert('User berhasil dihapus secara permanen.');
          fetchData();
        } else {
          throw new Error(result.error || 'Gagal menghapus user');
        }
      } catch (error: any) {
        alert('Error: ' + error.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-brand uppercase tracking-tight">Daftar Pengguna Sistem</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola hak akses guru, siswa, dan admin</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadTemplate}
            className="border border-brand text-brand px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-brand hover:text-accent transition-all"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <label className={`cursor-pointer bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Memproses...' : 'Upload Excel'}
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={uploading} />
          </label>
          <button 
            onClick={() => {
              setEditingUser(null);
              setFormData({ email: '', full_name: '', role: 'siswa', class_id: '', major_id: '', nisn: '', password: 'simujian2026' });
              setShowModal(true);
            }}
            className="bg-brand text-accent px-5 py-2.5 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Tambah User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap & Email</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NISN</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas & Jurusan</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Memuat database...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Tidak ada user ditemukan</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">{u.full_name || 'Tanpa Nama'}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    u.role === 'administrator' ? 'bg-indigo-50 text-indigo-600' :
                    u.role === 'guru' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-[11px] font-mono font-bold text-slate-500">
                  {u.nisn || '-'}
                </td>
                <td className="px-6 py-4">
                  {u.role === 'siswa' ? (
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-black text-brand uppercase tracking-tighter">{u.classes?.name || '-'}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{u.majors?.code || '-'} {u.majors?.name}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingUser(u);
                        setFormData({ 
                          email: u.email, 
                          full_name: u.full_name || '', 
                          role: u.role,
                          class_id: u.class_id || '',
                          major_id: u.major_id || '',
                          nisn: u.nisn || '',
                          password: ''
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-brand hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(u.id, u.email)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-brand uppercase tracking-tight">
                {editingUser ? 'Edit Data Pengguna' : 'Daftarkan Pengguna Baru'}
              </h3>
            </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className={!editingUser ? "grid grid-cols-2 gap-4" : ""}>
          <div className="col-span-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Email (Akun Auth)</label>
            <input 
              type="email" 
              disabled={!!editingUser}
              placeholder="user@school.id"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          {!editingUser && (
            <div className="col-span-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Password</label>
              <input 
                type="text" 
                placeholder="Password..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-brand"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required={!editingUser}
              />
            </div>
          )}
        </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">NISN (Siswa)</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 12345678" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                    value={formData.nisn} 
                    onChange={e => setFormData({...formData, nisn: e.target.value})} 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Tingkat Akses</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none outline-none focus:ring-1 focus:ring-brand"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="administrator">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  placeholder="Masukkan nama lengkap..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-brand"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>

              {formData.role === 'siswa' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Jurusan</label>
                    <select 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none outline-none focus:ring-1 focus:ring-brand"
                      value={formData.major_id}
                      onChange={e => {
                        const newMajorId = e.target.value;
                        const filtered = classes.filter(c => c.major_id === newMajorId);
                        setFormData({
                          ...formData, 
                          major_id: newMajorId,
                          class_id: filtered.length === 1 ? filtered[0].id : ''
                        });
                      }}
                    >
                      <option value="">Pilih Jurusan...</option>
                      {majors.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Kelas</label>
                    <select 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none outline-none focus:ring-1 focus:ring-brand"
                      value={formData.class_id}
                      onChange={e => {
                        const newClassId = e.target.value;
                        const cls = classes.find(c => c.id === newClassId);
                        if (cls && cls.major_id) {
                          setFormData({...formData, class_id: newClassId, major_id: cls.major_id});
                        } else {
                          setFormData({...formData, class_id: newClassId});
                        }
                      }}
                    >
                      <option value="">Pilih Kelas...</option>
                      {(formData.major_id 
                        ? classes.filter(c => c.major_id === formData.major_id)
                        : classes
                      ).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {!formData.major_id && majors.find(m => m.id === c.major_id) ? `(${majors.find(m => m.id === c.major_id).code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">Batalkan</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-brand text-accent text-[11px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-sm">
                  {editingUser ? 'Simpan Perubahan' : 'Lanjutkan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Header = ({ title, settings }: { title: string, settings: AppSettings }) => (
  <header className="h-20 flex items-center justify-between px-10 shrink-0 sticky top-0 z-40 bg-white/30 backdrop-blur-xl border-b border-white/20">
    <div className="title-area flex items-center gap-4">
      {settings.logo_url && (
        <img src={settings.logo_url} alt="App Logo" className="h-8 w-auto object-contain brightness-0" referrerPolicy="no-referrer" />
      )}
      <div>
        <h1 className="text-[18px] font-black text-brand-medium leading-tight tracking-tight uppercase flex items-center gap-2">
          {!settings.logo_url && <div className="w-2 h-6 bg-brand-light rounded-full" />}
          {settings.app_name} <span className="text-accent">{settings.app_version}</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">Sistem Manajemen Ujian Terpadu • {settings.institution_name}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-light transition-colors" />
        <input 
          type="text" 
          placeholder="Cari modul atau data..." 
          className="pl-10 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-xs w-64 focus:ring-2 focus:ring-brand-light/20 focus:border-brand-light outline-none transition-all placeholder:text-slate-400 font-medium"
        />
      </div>
      <button className="bg-gradient-to-r from-brand-medium to-brand-light text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 transition-all">
        + Buat Ujian Baru
      </button>
    </div>
  </header>
);

const DashboardView = ({ setView, setRole, role, profile, setPreviewExam }: { setView: (v: View) => void, setRole: (r: Role) => void, role: Role, profile: any, setPreviewExam: (exam: any) => void }) => {
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (role === 'siswa' && profile) {
          // 1. Ambil Jadwal Ujian untuk Kelas Siswa
          const { data: exams } = await supabase
            .from('exams')
            .select('*, subjects(name), exam_participants!inner(class_id)')
            .eq('exam_participants.class_id', profile.class_id)
            .order('start_time', { ascending: true });
          
          // 2. Ambil Riwayat Nilai Siswa untuk pengecekan status pengerjaan
          const { data: submissions } = await supabase
            .from('exam_submissions')
            .select('*, exams(title, subjects(name))')
            .eq('student_id', profile.id)
            .order('finished_at', { ascending: false });
          
          if (submissions) setStudentResults(submissions);

          // Tandai ujian yang sudah dikerjakan
          if (exams) {
            const mappedExams = exams.map(ex => ({
              ...ex,
              isCompleted: submissions?.some(s => s.exam_id === ex.id && s.status === 'submitted')
            }));
            setActiveExams(mappedExams);
          }
        } else {
          // Data untuk Admin/Guru
          const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'siswa');
          const { count: bankCount } = await supabase.from('questions').select('*', { count: 'exact', head: true });
          const { count: examCount } = await supabase.from('exams').select('*', { count: 'exact', head: true });
          
          setStats([
            { label: 'Total Siswa', value: studentCount?.toString() || '0', icon: Users, color: 'from-blue-600 to-indigo-700' },
            { label: 'Bank Soal', value: bankCount?.toString() || '0', icon: BookOpen, color: 'from-sky-500 to-blue-600' },
            { label: 'Ujian Aktif', value: examCount?.toString() || '0', icon: Calendar, color: 'from-blue-700 to-slate-900' },
            { label: 'Rerata Nilai', value: '78.5', icon: CheckCircle2, color: 'from-indigo-500 to-blue-800' },
          ]);

          const { data: ex } = await supabase
            .from('exams')
            .select('*, subjects(name)')
            .order('start_time', { ascending: true })
            .limit(5);
          if (ex) setActiveExams(ex);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [role, profile]);

  if (loading) return <div className="p-12 text-center font-black text-slate-300 uppercase tracking-widest text-xs animate-pulse">Sinkronisasi Basis Data...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Section - Hanya untuk Admin/Guru */}
      {role !== 'siswa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6 rounded-3xl group cursor-pointer hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-brand-light group-hover:text-white transition-all duration-300">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`text-[10px] font-black px-2 py-1 rounded-lg bg-indigo-50 text-brand-medium uppercase tracking-widest`}>
                  ↑ LIVE
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
              <div className="text-3xl font-black font-mono text-slate-900 tracking-tighter">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Hero Welcome for Students */}
      {role === 'siswa' && profile && (
        <div className="bg-gradient-to-r from-brand to-indigo-900 p-10 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Selamat Datang, {profile.full_name}!</h2>
            <p className="text-white/60 font-bold uppercase tracking-widest text-[11px]">
              Siswa {profile.majors?.name} • Kelas {profile.classes?.name} • NISN: {profile.nisn}
            </p>
            <div className="mt-8 flex gap-4">
               <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 uppercase font-black text-[10px] tracking-widest">
                 {activeExams.length} Ujian Terjadwal
               </div>
               <div className="px-6 py-3 bg-emerald-500/20 backdrop-blur-md rounded-2xl border border-emerald-500/20 uppercase font-black text-[10px] tracking-widest text-emerald-300">
                 {studentResults.length} Ujian Selesai
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exams Section */}
        <div className="lg:col-span-2 glass-card rounded-[32px] flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {role === 'siswa' ? 'Agenda Ujian Hari Ini' : 'Monitoring Jadwal Terkini'}
            </h3>
            <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-widest bg-white">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mata Pelajaran</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Protocol</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeExams.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      Tidak ada jadwal ujian untuk hari ini.
                    </td>
                  </tr>
                ) : activeExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-black text-sm text-slate-800 leading-tight group-hover:text-brand transition-colors">{exam.title}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{exam.subjects?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       {exam.isCompleted ? (
                         <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                           <CheckCircle2 className="w-3 h-3" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Selesai</span>
                         </div>
                       ) : (
                         <button 
                          onClick={() => { 
                            if (role === 'siswa') {
                              setPreviewExam(exam); // Reuse for now or new take view
                              setView('exam-take'); 
                            } else {
                              setView('exams');
                            }
                          }}
                          className="px-4 py-1.5 bg-brand text-accent rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-dark shadow-md active:scale-95 transition-all w-full"
                         >
                           {role === 'siswa' ? 'Masuk' : 'Kelola'}
                         </button>
                       )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-700">
                        {new Date(exam.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono font-bold">
                        {exam.duration_minutes} Menit
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></div> Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Section for Students */}
        <div className="lg:col-span-1 glass-card rounded-[32px] flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {role === 'siswa' ? 'Report Hasil Ujian' : 'Log Aktivitas'}
            </h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[500px]">
             {role === 'siswa' ? (
               <div className="space-y-4">
                 {studentResults.length === 0 ? (
                   <p className="text-center py-10 text-slate-400 font-bold uppercase text-[9px] tracking-widest">Belum ada nilai terbit.</p>
                 ) : studentResults.map((res) => (
                   <div key={res.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-brand transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-black text-xs text-slate-800 truncate pr-2 uppercase">{res.exams?.title}</div>
                        <div className={`text-sm font-mono font-black ${res.score >= 75 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {res.score}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>{res.exams?.subjects?.name}</span>
                        <span>{new Date(res.finished_at).toLocaleDateString('id-ID')}</span>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
                <div className="space-y-6">
                  {[
                    { actor: 'System Core', action: 'DB Optimize Completed', time: '2m ago' },
                    { actor: 'Supervisor', action: 'New Exam Scheduled', time: '15m ago' },
                    { actor: 'Gateway', action: 'Traffic Node Verified', time: '1h ago' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-brand-light mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <div>
                        <div className="text-xs font-black text-slate-800 leading-tight">{act.actor}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{act.action} <span className="opacity-40 ml-1">({act.time})</span></div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-4 mt-4 border-2 border-dashed border-slate-100 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] rounded-2xl hover:border-brand hover:text-brand transition-all">View Full Radar Logs</button>
                </div>
             )}
          </div>
           {role === 'siswa' && studentResults.length > 0 && (
            <div className="mt-auto p-6 bg-slate-50 border-t border-slate-100">
               <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                 <span>Rerata Index Akurasi</span>
                 <span className="text-brand">82%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                 <div className="h-full bg-brand w-[82%]"></div>
               </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

const QuestionBankView = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    content: '',
    image_url: '',
    subject_id: '',
    options: ['', '', '', '', ''],
    correct_answer: 'A',
    points: 10
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: q, error: qErr } = await supabase
        .from('questions')
        .select('*, question_banks(id, title, subjects(id, name))')
        .order('created_at', { ascending: false });
      
      const { data: s, error: sErr } = await supabase.from('subjects').select('*');

      if (qErr) throw qErr;
      if (sErr) throw sErr;

      if (q) setQuestions(q);
      if (s) setSubjects(s);
    } catch (err: any) {
      console.error('Fetch Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `q-${Math.random()}.${fileExt}`;
      const filePath = `questions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error: any) {
      alert('Gagal mengunggah gambar: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Ensure Question Bank exists for the subject
      let bankId = '';
      const { data: existingBank } = await supabase
        .from('question_banks')
        .select('id')
        .eq('subject_id', formData.subject_id)
        .limit(1)
        .maybeSingle();
      
      if (existingBank) {
        bankId = existingBank.id;
      } else {
        const { data: newBank, error: bankErr } = await supabase
          .from('question_banks')
          .insert([{ 
            title: `Bank Soal ${subjects.find(s => s.id === formData.subject_id)?.name || 'Umum'}`,
            subject_id: formData.subject_id || null
          }])
          .select()
          .single();
        if (bankErr) throw bankErr;
        bankId = newBank.id;
      }

      const payload = {
        question_bank_id: bankId,
        content: formData.content,
        image_url: formData.image_url,
        options: formData.options,
        correct_answer: formData.correct_answer,
        points: formData.points,
        type: 'multiple_choice'
      };

      if (editingItem) {
        const { error } = await supabase.from('questions').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert([payload]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus soal ini secara permanen?')) {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) alert('Gagal menghapus: ' + error.message);
      else fetchData();
    }
  };

  const downloadTemplate = () => {
    const template = [
      { 
        "PERTANYAAN": "Berapakah hasil dari $2^3$?", 
        "GAMBAR_URL": "", 
        "MATA_PELAJARAN": subjects[0]?.name || "Matematika",
        "OPSI_A": "4",
        "OPSI_B": "6",
        "OPSI_C": "8",
        "OPSI_D": "10",
        "OPSI_E": "12",
        "JAWABAN_BENAR": "C",
        "SKOR": 10
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
    XLSX.writeFile(wb, 'Template_Impor_Soal.xlsx');
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        if (rawData.length === 0) {
          throw new Error("File Excel kosong atau tidak terbaca.");
        }

        console.log("Mulai memproses", rawData.length, "soal...");
        let successCount = 0;
        let errorCount = 0;

        for (const row of rawData) {
          try {
            // Minimal validation
            if (!row["PERTANYAAN"]) {
              console.warn("Melewati baris karena kolom PERTANYAAN kosong.");
              errorCount++;
              continue;
            }

            // Resolve subject
            const subjectName = row["MATA_PELAJARAN"];
            let targetSubjectId = subjects.find(s => 
              s.name?.toLowerCase() === subjectName?.toString().toLowerCase() || 
              s.code?.toLowerCase() === subjectName?.toString().toLowerCase()
            )?.id;
            
            // Fallback to first subject if not found but requested
            if (!targetSubjectId && subjects.length > 0) {
              targetSubjectId = subjects[0].id;
            }

            if (!targetSubjectId) {
              throw new Error("Mata pelajaran tidak ditemukan. Pastikan data master Mata Pelajaran sudah terisi.");
            }

            // Resolve or Create Question Bank
            let bankId = '';
            const { data: bankData, error: bankFetchError } = await supabase
              .from('question_banks')
              .select('id')
              .eq('subject_id', targetSubjectId)
              .maybeSingle();
            
            if (bankFetchError) throw bankFetchError;

            if (bankData) {
              bankId = bankData.id;
            } else {
              const { data: newBank, error: bankCreateError } = await supabase
                .from('question_banks')
                .insert([{ 
                  title: `Bank Soal ${subjects.find(s => s.id === targetSubjectId)?.name || 'Import'}`,
                  subject_id: targetSubjectId 
                }])
                .select()
                .single();
              if (bankCreateError) throw bankCreateError;
              bankId = newBank.id;
            }

            // Insert Question
            const { error: insertError } = await supabase.from('questions').insert([{
              question_bank_id: bankId,
              content: row["PERTANYAAN"],
              image_url: row["GAMBAR_URL"] || '',
              options: [
                row["OPSI_A"] || '', 
                row["OPSI_B"] || '', 
                row["OPSI_C"] || '', 
                row["OPSI_D"] || '', 
                row["OPSI_E"] || ''
              ].map(o => o.toString()),
              correct_answer: (row["JAWABAN_BENAR"] || 'A').toString().toUpperCase(),
              points: parseInt(row["SKOR"]) || 10
            }]);

            if (insertError) throw insertError;
            successCount++;
          } catch (rowErr: any) {
            console.error("Gagal memproses baris:", row, rowErr);
            errorCount++;
          }
        }

        alert(`Impor selesai!\nBerhasil: ${successCount}\nGagal: ${errorCount}`);
        fetchData();
      } catch (err: any) {
        alert('Kesalahan kritis saat impor: ' + err.message);
      } finally {
        setUploading(false);
        // Reset input file
        if (e.target) e.target.value = '';
      }
    };

    reader.onerror = () => {
      alert("Gagal membaca file.");
      setUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-lg font-black text-brand uppercase tracking-tight">Bank Soal Terintegrasi</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola perbendaharaan instrumen ujian</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-3.5 h-3.5" /> Template
          </button>
          <label className={`cursor-pointer bg-slate-100 text-slate-700 px-4 py-2 rounded-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-3.5 h-3.5" /> {uploading ? 'Impor...' : 'Impor Excel'}
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} disabled={uploading} />
          </label>
          <button 
            onClick={() => {
              setEditingItem(null);
              setFormData({ content: '', image_url: '', subject_id: subjects[0]?.id || '', options: ['', '', '', '', ''], correct_answer: 'A', points: 10 });
              setShowModal(true);
            }} 
            className="bg-brand text-white px-4 py-2 rounded-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Soal
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daftar Inventaris Soal</div>
          <span className="text-[10px] bg-blue-50 text-brand px-2 py-0.5 rounded font-black uppercase tracking-widest border border-blue-100">Total: {questions.length}</span>
        </div>
        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Konten & Visual</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Sinkronisasi Database...</td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Belum ada soal terdaftar</td></tr>
              ) : questions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex gap-4 items-start">
                      {q.image_url && (
                        <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden group-hover:scale-110 transition-transform">
                          <img src={q.image_url} alt="Soal" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="text-[13px] font-bold text-slate-800 leading-relaxed max-w-lg">
                          <MathText text={q.content} />
                        </div>
                        <div className="flex gap-2">
                          {q.options?.map((opt: string, idx: number) => (
                             <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${String.fromCharCode(65 + idx) === q.correct_answer ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                               {String.fromCharCode(65 + idx)}
                             </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-brand text-[9px] font-black uppercase tracking-tighter border border-blue-100">
                      {q.question_banks?.subjects?.name || 'UMUM'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingItem(q);
                          setFormData({
                            content: q.content,
                            image_url: q.image_url || '',
                            subject_id: q.question_banks?.subjects?.id || '',
                            options: q.options || ['', '', '', '', ''],
                            correct_answer: q.correct_answer || 'A',
                            points: q.points || 10
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-brand hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(q.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-lg font-black text-brand uppercase tracking-tight">{editingItem ? 'Edit Instrumen Soal' : 'Tambah Soal Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 font-bold p-1">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Mata Pelajaran</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand/20 transition-all" value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} required>
                    <option value="">Pilih Mata Pelajaran...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Poin / Bobot</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Pertanyaan (Mendukung $Rumus$)</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-32 focus:ring-2 focus:ring-brand/20 outline-none transition-all font-medium" 
                  placeholder="Masukkan pertanyaan di sini. Gunakan $...$ untuk rumus matematika." 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  required 
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Lampiran Visual (Gambar)</label>
                <div className="flex items-center gap-6">
                  {formData.image_url ? (
                    <div className="relative group w-20 h-20 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex-shrink-0">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 flex-shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Camera className="w-3.5 h-3.5" />
                      {uploadingImage ? 'Mengunggah...' : 'Pilih Gambar Soal'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    <p className="text-[9px] text-slate-400 mt-2 italic font-bold">Format: JPG, PNG, WEBP (Maks 2MB)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Jawaban & Pilihan Ganda</label>
                <div className="grid grid-cols-1 gap-3">
                  {formData.options.map((opt, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, correct_answer: String.fromCharCode(65 + i)})}
                        className={`w-10 h-10 rounded-xl border-2 font-black transition-all flex items-center justify-center shrink-0 ${
                          formData.correct_answer === String.fromCharCode(65 + i) 
                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                          : 'border-slate-200 text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </button>
                      <input 
                        type="text" 
                        placeholder={`Opsi ${String.fromCharCode(65 + i)}...`}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...formData.options];
                          newOpts[i] = e.target.value;
                          setFormData({...formData, options: newOpts});
                        }}
                        required={i < 4}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-slate-100 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4.5 rounded-2xl border-2 border-slate-100 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 transition-all active:scale-95">Batalkan</button>
                <button type="submit" className="flex-1 py-4.5 rounded-2xl bg-brand text-accent text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-dark transition-all shadow-lg active:scale-95">
                  {editingItem ? 'Perbarui Soal' : 'Simpan ke Bank Soal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const PreviewExamView = ({ exam, onExit }: { exam: any, onExit: () => void }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('question_bank_id', exam.question_bank_id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setQuestions(data || []);
      } catch (err: any) {
        alert("Gagal memuat soal simulasi: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [exam]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mempersiapkan Lingkungan Simulasi...</p>
    </div>
  );

  if (questions.length === 0) return (
    <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
       <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-4">Bank soal terkait ujian ini masih kosong.</p>
       <button onClick={onExit} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Kembali</button>
    </div>
  );

  const currentQ = questions[currentIdx];
  const score = Object.keys(answers).reduce((acc, qId) => {
    const q = questions.find(item => item.id === qId);
    return q && answers[qId] === q.correct_answer ? acc + q.points : acc;
  }, 0);

  const totalPoints = questions.reduce((acc, q) => acc + q.points, 0);

  if (showResult) return (
    <div className="max-w-xl mx-auto py-10 animate-in zoom-in-95 duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-1 text-center bg-brand text-[9px] font-black text-accent uppercase tracking-[0.3em]">Mode Simulasi Administrator</div>
        <div className="p-10 text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Simulasi Selesai</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Hasil ini hanya bersifat pratinjau dan tidak disimpan ke database hasil ujian.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skor Simulasi</span>
              <span className="text-3xl font-black text-brand">{score}</span>
              <span className="text-xs font-bold text-slate-400 ml-1">/ {totalPoints}</span>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"> Akurasi</span>
              <span className="text-3xl font-black text-slate-800">{Math.round((score/totalPoints)*100) || 0}%</span>
            </div>
          </div>

          <button onClick={onExit} className="w-full py-4 bg-slate-900 text-accent rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-slate-800 transition-all">Tutup Pratinjau</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-accent rounded-xl flex flex-col items-center justify-center leading-none">
            <span className="text-sm font-black">{currentIdx + 1}</span>
            <span className="text-[8px] font-black uppercase opacity-60">of {questions.length}</span>
          </div>
          <div>
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{exam.title}</h3>
             <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-amber-200">Mode Simulasi 👁️</span>
             </div>
          </div>
        </div>
        <button onClick={onExit} className="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">Keluar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex-1 space-y-8">
              {currentQ.image_url && (
                <div className="w-full rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-slate-50 max-h-[300px]">
                  <img src={currentQ.image_url} alt="Question Visual" className="w-full h-full object-contain mx-auto" referrerPolicy="no-referrer" />
                </div>
              )}
              
              <div className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                <MathText text={currentQ.content} />
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                {currentQ.options?.map((opt: string, i: number) => {
                  const letter = String.fromCharCode(65 + i);
                  if (!opt) return null;
                  return (
                    <button 
                      key={i}
                      onClick={() => setAnswers({...answers, [currentQ.id]: letter})}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all group ${
                        answers[currentQ.id] === letter 
                        ? 'border-brand bg-blue-50/50 shadow-md translate-x-1' 
                        : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black transition-colors ${
                        answers[currentQ.id] === letter ? 'bg-brand text-accent' : 'bg-white border border-slate-200 text-slate-400 group-hover:border-brand/30 group-hover:text-brand'
                      }`}>
                        {letter}
                      </span>
                      <span className={`text-sm font-bold ${answers[currentQ.id] === letter ? 'text-brand' : 'text-slate-600'}`}>
                        <MathText text={opt} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-10 border-t border-slate-50 mt-10">
               <button 
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand disabled:opacity-30 disabled:pointer-events-none transition-all"
               >
                 <ChevronRight className="w-4 h-4 rotate-180" /> Sebelumnya
               </button>
               {currentIdx === questions.length - 1 ? (
                 <button 
                  onClick={() => setShowResult(true)}
                  className="px-8 py-3 bg-brand text-accent rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all outline-none"
                 >
                   Selesai Simulasi
                 </button>
               ) : (
                 <button 
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 hover:text-brand transition-all"
                 >
                   Selanjutnya <ChevronRight className="w-4 h-4" />
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-28">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Navigasi Instrumen</h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => (
                <button 
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`aspect-square rounded-xl text-[10px] font-black transition-all border-2 flex items-center justify-center ${
                    currentIdx === i ? 'border-brand bg-brand text-accent shadow-lg scale-110' : 
                    answers[q.id] ? 'border-brand/20 bg-blue-50 text-brand' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span>Teks Soal</span>
                <span className="text-slate-800">{Math.round((Object.keys(answers).length / questions.length) * 100)}% Terjawab</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-brand transition-all duration-500" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExamScheduleView = ({ onPreview, role, profile }: { onPreview: (exam: any) => void, role: Role, profile: any }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questionBanks, setQuestionBanks] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    question_bank_id: '',
    start_time: '',
    duration_minutes: 60,
    passcode: '',
    target_classes: [] as string[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('exams')
        .select('*, subjects(name), question_banks(title), exam_participants(class_id, classes(name))')
        .order('created_at', { ascending: false });
      
      if (role === 'siswa' && profile) {
        // Untuk siswa, kita gunakan filter pada tabel yang berelasi
        // Menggunakan filter .neq('exam_participants', null) secara implisit lewat filter kelas
        query = query.eq('exam_participants.class_id', profile.class_id);
      }

      const { data: ex, error: exErr } = await query;
      
      const { data: s } = await supabase.from('subjects').select('*');
      const { data: qb } = await supabase.from('question_banks').select('*');
      const { data: cl } = await supabase.from('classes').select('*, schools(name)');

      if (exErr) throw exErr;
      if (ex) setExams(ex);
      if (s) setSubjects(s);
      if (qb) setQuestionBanks(qb);
      if (cl) setClasses(cl);
    } catch (err: any) {
      console.error('Fetch Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, passcode: token }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const examPayload = {
        title: formData.title,
        subject_id: formData.subject_id,
        question_bank_id: formData.question_bank_id,
        start_time: new Date(formData.start_time).toISOString(),
        duration_minutes: formData.duration_minutes,
        passcode: formData.passcode
      };

      let examId = '';
      if (editingItem) {
        const { error } = await supabase.from('exams').update(examPayload).eq('id', editingItem.id);
        if (error) throw error;
        examId = editingItem.id;
      } else {
        const { data, error } = await supabase.from('exams').insert([examPayload]).select().single();
        if (error) throw error;
        examId = data.id;
      }

      // Handle Participants (Classes)
      // Delete existing participants for this exam first
      await supabase.from('exam_participants').delete().eq('exam_id', examId);
      
      if (formData.target_classes.length > 0) {
        const participants = formData.target_classes.map(cid => ({
          exam_id: examId,
          class_id: cid
        }));
        const { error: pErr } = await supabase.from('exam_participants').insert(participants);
        if (pErr) throw pErr;
      }

      setShowModal(false);
      fetchData();
      alert('Jadwal ujian berhasil disimpan.');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus jadwal ujian ini? Data hasil ujian siswa mungkin ikut terhapus.')) {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) alert('Gagal menghapus: ' + error.message);
      else fetchData();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-lg font-black text-brand uppercase tracking-tight">Jadwal Ujian Sistem</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Atur agenda tes dan aktivasi token ujian</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            const localIso = now.toISOString().slice(0, 16);
            setFormData({
              title: '',
              subject_id: subjects[0]?.id || '',
              question_bank_id: '',
              start_time: localIso,
              duration_minutes: 90,
              passcode: '',
              target_classes: []
            });
            setShowModal(true);
          }}
          className="bg-brand text-white px-4 py-2 rounded-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Jadwalkan Baru
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest bg-white rounded-xl border border-dashed border-slate-200">Menghubungkan ke server ujian...</div>
      ) : exams.length === 0 ? (
        <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest bg-white rounded-xl border border-dashed border-slate-200">Belum ada jadwal ujian tersedia</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
             const startTime = new Date(exam.start_time);
             const isPast = new Date() > new Date(startTime.getTime() + exam.duration_minutes * 60000);
             const isNow = new Date() >= startTime && !isPast;

             return (
              <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group overflow-hidden">
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                      isNow ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      isPast ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {isNow ? 'AKTIF' : isPast ? 'BERAKHIR' : 'MENDATANG'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingItem(exam);
                        setFormData({
                          title: exam.title,
                          subject_id: exam.subject_id,
                          question_bank_id: exam.question_bank_id || '',
                          start_time: new Date(exam.start_time).toISOString().slice(0, 16),
                          duration_minutes: exam.duration_minutes,
                          passcode: exam.passcode,
                          target_classes: exam.exam_participants?.map((p: any) => p.class_id) || []
                        });
                        setShowModal(true);
                      }} className="text-slate-400 hover:text-brand p-1 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(exam.id)} className="text-slate-400 hover:text-red-500 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-black text-[15px] text-slate-800 group-hover:text-brand transition-colors leading-tight mb-1">{exam.title}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.subjects?.name}</p>
                  </div>
                  
                  <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100 font-sans">
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {startTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({exam.duration_minutes}m)
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {exam.exam_participants?.map((p: any) => (
                      <span key={p.class_id} className="text-[9px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                        {p.classes?.name}
                      </span>
                    ))}
                    {(!exam.exam_participants || exam.exam_participants.length === 0) && <span className="text-[9px] text-slate-300 italic uppercase">Semua Kelas</span>}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Access Token</span>
                    <span className="text-sm font-mono font-black text-brand tracking-widest">{exam.passcode || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onPreview(exam)}
                      className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-white transition-all shadow-sm flex items-center gap-2"
                      title="Test Soal (Simulasi)"
                    >
                      <Eye className="w-3.5 h-3.5" /> Test
                    </button>
                    <button className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-brand hover:text-brand transition-all shadow-sm">
                      Detail
                    </button>
                  </div>
                </div>
              </div>
             );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-lg font-black text-brand uppercase tracking-tight">{editingItem ? 'Modifikasi Jadwal' : 'Agenda Ujian Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 font-bold p-1">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Judul Agenda Ujian</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-brand/20 transition-all" placeholder="Contoh: UAS Matematika Ganjil" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Mata Pelajaran</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand/20 transition-all" value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} required>
                    <option value="">Pilih Mata Pelajaran...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Bank Soal Target</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand/20 transition-all" value={formData.question_bank_id} onChange={e => setFormData({...formData, question_bank_id: e.target.value})} required>
                    <option value="">Pilih Bank Soal...</option>
                    {questionBanks
                      .filter(qb => !formData.subject_id || qb.subject_id === formData.subject_id)
                      .map(qb => <option key={qb.id} value={qb.id}>{qb.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Waktu Mulai</label>
                  <input type="datetime-local" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Durasi (Menit)</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} required />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Kelas Peserta</label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
                   {classes.map(c => (
                     <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                       <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" 
                        checked={formData.target_classes.includes(c.id)}
                        onChange={(e) => {
                          const newClasses = e.target.checked 
                            ? [...formData.target_classes, c.id]
                            : formData.target_classes.filter(id => id !== c.id);
                          setFormData({...formData, target_classes: newClasses});
                        }}
                       />
                       <span className="text-[11px] font-bold text-slate-600 group-hover:text-brand transition-colors">{c.name}</span>
                     </label>
                   ))}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase italic">* Siswa di kelas terpilih dapat mengakses ujian menggunakan token.</p>
              </div>

              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 px-1">Access Token (Passcode)</label>
                  <input type="text" className="bg-transparent border-none p-0 text-xl font-mono font-black text-brand tracking-widest outline-none uppercase w-32" value={formData.passcode} onChange={e => setFormData({...formData, passcode: e.target.value.toUpperCase()})} placeholder="TOKEN" required />
                </div>
                <button type="button" onClick={generateToken} className="px-4 py-2 bg-brand text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-md">Acak Token</button>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl border-2 border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Batal</button>
                <button type="submit" className="flex-1 py-4 rounded-xl bg-brand text-accent text-[11px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg">Simpan Agenda</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const ExamMonitorView = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitorLoading, setMonitorLoading] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (data) {
        setExams(data);
        if (data.length > 0) setSelectedExam(data[0].id);
      }
      setLoading(false);
    };
    fetchExams();
  }, []);

  const fetchStatus = async () => {
    if (!selectedExam) return;
    setMonitorLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          profiles (
            full_name,
            nisn,
            classes (name)
          )
        `)
        .eq('exam_id', selectedExam);
      
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setMonitorLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, [selectedExam]);

  if (loading) return <div className="p-12 text-center font-black text-slate-300 uppercase tracking-widest text-[10px]">Menyiapkan Radar Pemantauan...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight text-brand">Real-time Monitor</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status Kehadiran & Pengerjaan Siswa</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <select 
            value={selectedExam} 
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand/20 min-w-[250px]"
           >
             {exams.map(ex => (
               <option key={ex.id} value={ex.id}>{ex.title}</option>
             ))}
           </select>
           <button 
            onClick={fetchStatus}
            disabled={monitorLoading}
            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-brand hover:text-white transition-all disabled:opacity-50"
           >
             <RefreshCw className={`w-4 h-4 ${monitorLoading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sedang Mengerjakan</span>
            <span className="text-2xl font-black text-blue-600 font-mono">{submissions.filter(s => s.status === 'in_progress').length}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Activity className="w-5 h-5 animate-pulse" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sudah Kumpulkan</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">{submissions.filter(s => s.status === 'submitted').length}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Aktif</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{submissions.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><Users className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa & NISN</th>
               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas</th>
               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mulai</th>
               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
               <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {submissions.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Belum ada siswa yang masuk ke ujian ini</td></tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-800 text-sm">{sub.profiles?.full_name}</div>
                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">{sub.profiles?.nisn}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-tight">{sub.profiles?.classes?.name}</span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">
                    {new Date(sub.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    {sub.status === 'submitted' ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> Selesai
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] uppercase tracking-widest animate-pulse">
                        <Activity className="w-3 h-3" /> Mengerjakan
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-mono font-black ${sub.score >= 75 ? 'text-emerald-500' : 'text-slate-900'}`}>
                      {sub.status === 'submitted' ? sub.score : '—'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SettingsView = ({ settings, onUpdate }: { settings: AppSettings, onUpdate: (s: AppSettings) => void }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
    } catch (error: any) {
      alert('Gagal mengunggah logo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([formData]);
      
      if (error) throw error;
      onUpdate(formData);
      alert('Pengaturan sistem berhasil diperbarui.');
    } catch (error: any) {
      alert('Gagal menyimpan pengaturan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-50 text-brand-medium rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Konfigurasi Sistem</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Kustomisasi identitas dan informasi aplikasi</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Identitas Visual & Nama</h3>
            
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
              <div className="relative group mb-4">
                <div className="w-24 h-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-3xl font-black text-slate-300">{formData.logo_text}</span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                  <div className="p-2 bg-white rounded-full text-slate-900 shadow-lg">
                    <Camera className="w-4 h-4" />
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                </label>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{uploading ? 'Mengunggah...' : 'Klik untuk Ubah Logo Image'}</p>
              {formData.logo_url && (
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                  className="mt-2 text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                >
                  Hapus Image
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Aplikasi</label>
                <input 
                  type="text" 
                  value={formData.app_name}
                  onChange={e => setFormData({...formData, app_name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" 
                  placeholder="SIM-UJIAN"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Logo Text (Initial)</label>
                  <input 
                    type="text" 
                    value={formData.logo_text}
                    onChange={e => setFormData({...formData, logo_text: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" 
                    placeholder="S"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nama Institusi</label>
                  <input 
                    type="text" 
                    value={formData.institution_name}
                    onChange={e => setFormData({...formData, institution_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" 
                    placeholder="SMKN 1 KOTA"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Metadata & Copyright</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Versi Sistem</label>
                  <input 
                    type="text" 
                    value={formData.app_version}
                    onChange={e => setFormData({...formData, app_version: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" 
                    placeholder="v2.4"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Copyright Label</label>
                  <input 
                    type="text" 
                    value={formData.copyright_text}
                    onChange={e => setFormData({...formData, copyright_text: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" 
                    placeholder="SIM-UJIAN CORE"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Deskripsi Aplikasi</label>
                <textarea 
                  value={formData.app_description}
                  onChange={e => setFormData({...formData, app_description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 h-24 resize-none" 
                  placeholder="Advanced Infrastructure Protocol..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Footer Info</label>
                <input 
                  type="text" 
                  value={formData.footer_info}
                  onChange={e => setFormData({...formData, footer_info: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" 
                  placeholder="Secure Enterprise Node"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-6 border-t border-slate-50 mt-4">
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-brand-medium text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-light transition-all shadow-xl shadow-blue-900/10 active:scale-95 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Komit Perubahan Sistem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---

const DEFAULT_SETTINGS: AppSettings = {
  app_name: 'SIM-UJIAN',
  app_version: 'v2.4',
  app_description: 'Advanced Infrastructure Protocol for Examination Management',
  logo_text: 'S',
  institution_name: 'SMKN 1 KOTA',
  copyright_text: 'SIM-UJIAN CORE',
  footer_info: 'Secure Enterprise Node'
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [isLogged, setIsLogged] = useState(false);
  const [role, setRole] = useState<Role>('administrator');
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [adminReady, setAdminReady] = useState<boolean | null>(null);
  const [previewExam, setPreviewExam] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Periksa satus admin saat startup
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAdminReady(data.adminReady);
      })
      .catch(err => {
        setAdminReady(false);
        console.error('Server Health Check Failed:', err);
      });
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
        if (data && !error) {
          setAppSettings(data);
        }
      } catch (e) {
        console.warn('Settings table potentially missing or inaccessible');
      }
    };
    loadSettings();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      let targetEmail = userInput;

      // 1. Cek apakah userInput adalah NISN (hanya angka)
      const isNISN = /^\d+$/.test(userInput);
      
      if (isNISN) {
        // Cari email yang terhubung dengan NISN tersebut di tabel profiles
        const { data: profileByNISN, error: nisnError } = await supabase
          .from('profiles')
          .select('email')
          .eq('nisn', userInput)
          .single();
        
        if (nisnError || !profileByNISN) {
          throw new Error('NISN tidak terdaftar dalam sistem.');
        }
        targetEmail = profileByNISN.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // SELALU lakukan Upsert profil saat login untuk memastikan ID valid di database
        // Ini mencegah foreign key violation pada tabel exam_submissions
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || userInput,
            role: data.user.user_metadata?.role || 'siswa'
          }, { onConflict: 'id' })
          .select('*, classes(name), majors(name)')
          .single();

        if (profileErr) {
          console.error('CRITICAL: Profile Synchronization Failed', profileErr);
        }

        const finalProfile = profileData || { id: data.user.id, email: data.user.email, role: 'siswa' };
        setProfile(finalProfile);
        
        // Normalisasi role agar sesuai dengan tipe yang diharapkan frontend
        const userRole = finalProfile.role === 'administrator' ? 'administrator' : 
                         finalProfile.role === 'guru' ? 'guru' : 'siswa';
        setRole(userRole as Role);
        setIsLogged(true);
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal login. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen luxury-gradient flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorative Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        
        <div className="w-full max-w-[400px] bg-white p-10 rounded-[40px] shadow-2xl relative z-10 border border-slate-100">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-6 shadow-2xl shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
              {appSettings.logo_url ? (
                <img src={appSettings.logo_url} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
              ) : (
                appSettings.logo_text
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase mb-1">{appSettings.app_name} <span className="text-blue-600 underline decoration-2 underline-offset-4">{appSettings.app_version}</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{appSettings.app_description}</p>
          </div>
          
          <div className="space-y-5">
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-[11px] font-black text-red-600 flex items-center gap-2 animate-in fade-in zoom-in-95 leading-tight">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 px-1">Identity Gateway</label>
              <input 
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="NISN atau Email Anda" 
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-bold" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 px-1">Security Access</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-bold" 
              />
            </div>
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95 transition-all mt-4 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Enter System Realm'}
            </button>
          </div>
          
          <div className="mt-12 text-center pt-6 border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed">
              © 2026 {appSettings.copyright_text}<br />
              {appSettings.footer_info}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'exam-take') {
    return (
      <div className="min-h-screen bg-background p-8">
        {lastScore === null ? (
          <ExamTakeView exam={previewExam} profile={profile} settings={appSettings} onFinish={(score) => setLastScore(score)} />
        ) : (
          <div className="max-w-md mx-auto bg-white p-10 rounded-lg border border-slate-200 shadow-sm text-center space-y-6 mt-20">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-brand uppercase tracking-tight">Inventarisasi Berhasil</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Data jawaban telah terkirim ke registry</p>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-md">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kalkulasi Skor Akhir</p>
              <div className="text-5xl font-mono font-black text-brand">{lastScore}</div>
            </div>
            <button 
              onClick={() => { setView('dashboard'); setLastScore(null); }}
              className="w-full py-3 bg-brand text-accent rounded font-black text-[11px] uppercase tracking-widest hover:bg-brand-dark transition-all shadow-sm"
            >
              Kembali ke Terminal Utama
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeView={view} setView={setView} role={role} onLogout={() => setIsLogged(false)} />
      
      <main className="flex-1 flex flex-col">
        <Header settings={appSettings} title={
          view === 'dashboard' ? 'Overview' : 
          view === 'questions' ? 'Bank Soal' : 
          view === 'exams' ? 'Jadwal Ujian' : 
          view === 'monitoring' ? 'Monitor Real-time' :
          view === 'users' ? 'Manajemen User' : 
          view === 'schools' ? 'Data Sekolah' : 
          view === 'majors' ? 'Data Jurusan' : 
          view === 'classes' ? 'Data Kelas' : 
          view === 'subjects' ? 'Mata Pelajaran' : 
          view === 'students' ? 'Siswa' : 'Pengaturan'
        } />
        
        <div className="p-8 pb-16 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && <DashboardView setView={setView} setRole={setRole} role={role} profile={profile} setPreviewExam={setPreviewExam} />}
              {view === 'users' && <UserManagementView />}
              {view === 'schools' && <SchoolManagementView />}
              {view === 'majors' && <MajorManagementView />}
              {view === 'classes' && <ClassManagementView />}
              {view === 'subjects' && <SubjectManagementView />}
              {view === 'questions' && <QuestionBankView />}
              {view === 'exams' && <ExamScheduleView onPreview={(exam) => { setPreviewExam(exam); setView('preview-exam'); }} role={role} profile={profile} />}
              {view === 'monitoring' && <ExamMonitorView />}
              {view === 'preview-exam' && <PreviewExamView exam={previewExam} onExit={() => { setView('exams'); setPreviewExam(null); }} />}
              {view === 'students' && <div className="p-8 bg-white rounded-2xl border border-slate-100 text-center text-slate-400">Fitur Manajemen Siswa dalam pengembangan.</div>}
              {view === 'settings' && <SettingsView settings={appSettings} onUpdate={(s) => setAppSettings(s)} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
