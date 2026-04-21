import { supabase } from '../lib/supabase';
import { Role, Question, Exam, QuestionBank } from '../types';

export const examService = {
  // --- Dashboard Stats ---
  async getDashboardStats() {
    // In a real app, these would be queries
    // const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    // For now, returning mock or placeholder logic
    return [
      { label: 'Total Siswa', value: '1.240' },
      { label: 'Bank Soal', value: '342' },
      { label: 'Ujian Aktif', value: '12' },
      { label: 'Rerata Nilai', value: '82.4' },
    ];
  },

  // --- Question Bank ---
  async getQuestionBanks() {
    const { data, error } = await supabase
      .from('question_banks')
      .select('*, subjects(name)');
    
    if (error) throw error;
    return data;
  },

  async createQuestion(question: Omit<Question, 'id'>) {
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select();
    
    if (error) throw error;
    return data;
  },

  // --- Exams ---
  async getExams() {
    const { data, error } = await supabase
      .from('exams')
      .select('*, subjects(name)')
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async submitExam(submission: {
    exam_id: string;
    student_id: string;
    answers: Record<string, string>;
    score: number;
    status: 'submitted';
    finished_at: string;
  }) {
    const { data, error } = await supabase
      .from('exam_submissions')
      .insert([submission])
      .select();
    
    if (error) throw error;
    return data;
  },

  // --- Authentication / Profiles ---
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles') 
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) return null;
    return data;
  }
};
