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
  Camera
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { examService } from './services/examService';
import * as XLSX from 'xlsx';

// --- Types ---
type View = 'dashboard' | 'questions' | 'exams' | 'students' | 'settings' | 'exam-take' | 'users' | 'schools' | 'classes' | 'majors' | 'subjects';
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

const ExamTakeView = ({ onFinish }: { onFinish: (score: number) => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds

  const questions = [
    { id: 'q1', text: 'Siapa penemu lampu pijar?', options: ['Thomas Edison', 'Nikola Tesla', 'Albert Einstein', 'Isaac Newton'], correct: 'Thomas Edison' },
    { id: 'q2', text: 'Ibukota Jepang adalah...', options: ['Kyoto', 'Osaka', 'Tokyo', 'Hiroshima'], correct: 'Tokyo' },
    { id: 'q3', text: 'Berapa 5 x 5?', options: ['20', '25', '30', '35'], correct: '25' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct) score += (100 / questions.length);
    });
    
    const finalScore = Math.round(score);

    // Persist to Supabase
    try {
      await examService.submitExam({
        exam_id: 'sample-exam-id', // In reality, this comes from props
        student_id: 'sample-student-id', // In reality, this comes from auth
        answers: answers,
        score: finalScore,
        status: 'submitted',
        finished_at: new Date().toISOString()
      });
      onFinish(finalScore);
    } catch (error) {
      console.error("Gagal menyimpan hasil ujian:", error);
      onFinish(finalScore); // Still show score to user even if DB fails for demo
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm sticky top-4 z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 text-accent rounded-md flex items-center justify-center font-black">
            {currentQuestion + 1}/{questions.length}
          </div>
          <div>
            <h3 className="font-bold text-sm text-brand">Ujian SIM-v.2.4</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Siswa: Ahmad Fauzi • XII-IPA-1</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-md font-mono text-lg font-bold border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative min-h-[450px] flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>Sesi Ujian Serta Inventaris Jawab</span>
          <span className="text-emerald-500">Koneksi Server: Stabil</span>
        </div>
        <div className="p-8 flex-1">
          <div className="text-[11px] font-black text-accent uppercase tracking-widest mb-3">Pertanyaan Objektif {currentQuestion + 1}</div>
          <h2 className="text-lg font-bold text-slate-900 mb-8 leading-tight max-w-2xl">
            {questions[currentQuestion].text}
          </h2>

          <div className="grid grid-cols-1 gap-2.5 max-w-2xl">
            {questions[currentQuestion].options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: opt }))}
                className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center gap-4 ${
                  answers[questions[currentQuestion].id] === opt 
                    ? 'border-accent bg-blue-50/30 ring-1 ring-accent/20' 
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-black tracking-tighter shadow-sm transition-colors ${
                  answers[questions[currentQuestion].id] === opt ? 'bg-brand text-accent' : 'bg-slate-100 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className={`text-[13px] font-medium ${answers[questions[currentQuestion].id] === opt ? 'text-brand' : 'text-slate-600'}`}>{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button 
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            className="px-5 py-2 rounded font-bold text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-30 border border-transparent hover:border-slate-200 transition-all"
          >
            Kembali
          </button>
          
          <div className="flex gap-4">
             {currentQuestion === questions.length - 1 ? (
              <button 
                onClick={handleFinish}
                className="bg-emerald-600 text-accent px-8 py-2 rounded font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
              >
                Kumpulkan Berkas
              </button>
            ) : (
              <button 
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="bg-brand text-accent px-8 py-2 rounded font-black text-[11px] uppercase tracking-widest hover:bg-brand-dark transition-all shadow-sm"
              >
                Lanjut
              </button>
            )}
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
    nisn: ''
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
            if (user.class_name) {
              const cls = classes.find(c => c.name === user.class_name);
              if (cls) res.class_id = cls.id;
            }
            if (user.major_code) {
              const maj = majors.find(m => m.code === user.major_code);
              if (maj) res.major_id = maj.id;
            }
          }
          return res;
        });

        const response = await fetch('/api/admin/bulk-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: processedUsers })
        });

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
      alert('Untuk pendaftaran user baru secara penuh, silakan gunakan menu Authentication di Supabase Dashboard.');
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (confirm(`PERINGATAN: Anda akan menghapus user (${email}) secara permanen dari sistem Authentication dan Database.\n\nApakah Anda yakin ingin melanjutkan?`)) {
      try {
        const response = await fetch(`/api/admin/delete-user/${id}`, {
          method: 'DELETE',
        });
        
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
              setFormData({ email: '', full_name: '', role: 'siswa', class_id: '', major_id: '', nisn: '' });
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
                          nisn: u.nisn || ''
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
              <div>
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
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none"
                      value={formData.major_id}
                      onChange={e => setFormData({...formData, major_id: e.target.value})}
                    >
                      <option value="">Pilih Jurusan...</option>
                      {majors.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Kelas</label>
                    <select 
                      className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none ${!formData.major_id ? 'opacity-50' : ''}`}
                      value={formData.class_id}
                      onChange={e => setFormData({...formData, class_id: e.target.value})}
                      disabled={!formData.major_id}
                    >
                      <option value="">Pilih Kelas...</option>
                      {classes.filter(c => c.major_id === formData.major_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

const DashboardView = ({ setView, setRole, role }: { setView: (v: View) => void, setRole: (r: Role) => void, role: Role }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {MOCK_STATS.map((stat) => (
        <div key={stat.label} className="glass-card p-6 rounded-3xl group cursor-pointer hover:translate-y-[-4px] transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-brand-light group-hover:text-white transition-all duration-300">
              <stat.icon className="w-5 h-5" />
            </div>
            <div className={`text-[10px] font-black px-2 py-1 rounded-lg bg-indigo-50 text-brand-medium uppercase tracking-widest`}>
              ↑ 12.5%
            </div>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
          <div className="text-3xl font-black font-mono text-slate-900 tracking-tighter">{stat.value}</div>
          
          <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${stat.color} w-3/4 animate-pulse`} />
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-2 glass-card rounded-[32px] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 bg-white/30 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Jadwal Ujian Aktif & Mendatang</h3>
          <button className="text-brand-light text-[10px] font-black uppercase tracking-widest hover:underline">Lihat Semua Terminal</button>
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
              {MOCK_EXAMS.map((exam) => (
                <tr key={exam.id} className="hover:bg-white/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-black text-sm text-slate-800 leading-tight group-hover:text-brand-light transition-colors">{exam.title}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{exam.subject}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(exam.status === 'Upcoming' || role === 'siswa') && (
                      <button 
                        onClick={() => { setView('exam-take'); setRole('siswa'); }}
                        className="px-4 py-1.5 bg-brand-medium text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-light hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 transition-all"
                      >
                        Execute
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-700">{exam.date}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold">{exam.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      exam.status === 'Upcoming' ? 'bg-blue-50 text-brand-medium' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {exam.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card rounded-[32px] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10 bg-white/30">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Analytics & Metrics</h3>
        </div>
        <div className="p-8 space-y-8">
           {[
            { label: 'Pilihan Ganda', count: 842, progress: 75, color: '#2563EB' },
            { label: 'Essay Terstruktur', count: 320, progress: 35, color: '#38BDF8' },
            { label: 'Praktikum Lab', count: 266, progress: 25, color: '#020617' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
                <span>{item.label}</span>
                <span className="font-mono text-slate-800">{item.count} UNIT</span>
              </div>
              <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000 bg-gradient-to-r from-blue-400 to-indigo-600" 
                  style={{ width: `${item.progress}%`, backgroundColor: item.color }} 
                />
              </div>
            </div>
          ))}

          <div className="pt-8 border-t border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Registry Logs</div>
            <div className="space-y-4">
              {[
                { actor: 'System Core', action: 'Optimized 3.2k entries', time: '2m ago' },
                { actor: 'Admin Node', action: 'New Faculty record created', time: '15m ago' },
                { actor: 'Exam Engine', action: 'Protocol handshake verified', time: '1h ago' },
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-light mt-1.5" />
                  <div>
                    <div className="text-xs font-black text-slate-800 leading-tight">{act.actor}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{act.action} • {act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <footer className="mt-auto p-6 border-t border-slate-100/50 flex justify-between items-center bg-slate-50/10">
          <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
            Status: <span className="text-brand-light">ACTIVE_SYNC</span>
          </div>
          <div className="text-[9px] text-slate-300 font-bold">128-bit SSL Proto</div>
        </footer>
      </div>
    </div>
  </div>
);

const QuestionBankView = () => {
  const [questions, setQuestions] = useState([
    { id: '1', content: 'Siapa presiden pertama Indonesia?', subject: 'PKN', options: ['Soeharto', 'Soekarno', 'BJ Habibie', 'Gus Dur'], correct: 'Soekarno' },
    { id: '2', content: 'Berapakah hasil dari 25 x 4?', subject: 'Matematika', options: ['80', '90', '100', '110'], correct: '100' },
  ]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-slate-800">Bank Soal Terintegrasi</h3>
        <button className="bg-brand text-white px-4 py-2 rounded-md flex items-center gap-2 text-xs font-bold hover:bg-brand-dark transition-all shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          Tambah Soal
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daftar Inventaris Soal</div>
          <div className="flex gap-2">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">Total: {questions.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pertanyaan</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Format</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-bold text-slate-900 group-hover:text-brand transition-colors line-clamp-1">{q.content}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-tight">{q.subject}</span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 font-medium">
                    {q.options.length} Opsi (MCQ)
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-[10px] font-bold text-slate-400 hover:text-brand uppercase tracking-wider">Sunting</button>
                      <button className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ExamScheduleView = () => (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-lg font-bold text-slate-800">Jadwal Ujian Sistem</h3>
      <button className="bg-brand text-white px-4 py-2 rounded-md flex items-center gap-2 text-xs font-bold hover:bg-brand-dark transition-all shadow-sm">
        <Plus className="w-3.5 h-3.5" />
        Jadwalkan Baru
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {MOCK_EXAMS.map((exam) => (
        <div key={exam.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group">
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                exam.status === 'Upcoming' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {exam.status}
              </span>
              <button className="text-slate-400 hover:text-brand">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="font-bold text-[15px] text-slate-900 mb-1 group-hover:text-accent transition-colors leading-tight">{exam.title}</h4>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{exam.subject}</p>
            
            <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-md border border-slate-100">
              <div className="flex items-center gap-2.5 text-[11px] text-slate-600 font-medium">
                <Calendar className="w-3 h-3 text-slate-400" />
                {exam.date}
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-600 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {exam.time}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto">
            <button className="w-full py-1.5 rounded bg-white border border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-brand hover:text-brand transition-all shadow-sm">
              Lihat Detail & Token
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
        // Ambil data profil dari tabel profiles untuk mendapatkan role asli
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          // Normalisasi role agar sesuai dengan tipe yang diharapkan frontend
          const userRole = profile.role === 'administrator' ? 'administrator' : 
                           profile.role === 'guru' ? 'guru' : 'siswa';
          setRole(userRole as Role);
        } else if (targetEmail === 'admin.simujian@gmail.com') {
          // Fallback untuk admin utama jika profil belum sinkron
          setRole('administrator');
        } else {
          setRole('siswa');
        }
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
          <ExamTakeView onFinish={(score) => setLastScore(score)} />
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
              {view === 'dashboard' && <DashboardView setView={setView} setRole={setRole} role={role} />}
              {view === 'users' && <UserManagementView />}
              {view === 'schools' && <SchoolManagementView />}
              {view === 'majors' && <MajorManagementView />}
              {view === 'classes' && <ClassManagementView />}
              {view === 'subjects' && <SubjectManagementView />}
              {view === 'questions' && <QuestionBankView />}
              {view === 'exams' && <ExamScheduleView />}
              {view === 'students' && <div className="p-8 bg-white rounded-2xl border border-slate-100 text-center text-slate-400">Fitur Manajemen Siswa dalam pengembangan.</div>}
              {view === 'settings' && <SettingsView settings={appSettings} onUpdate={(s) => setAppSettings(s)} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
