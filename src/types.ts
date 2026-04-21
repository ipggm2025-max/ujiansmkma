export type Role = 'administrator' | 'guru' | 'siswa';

export interface UserProfile {
  id: string;
  full_name: string;
  role: Role;
  school_id: string;
  class_id?: string; // For students
}

export interface Subject {
  id: string;
  name: string;
}

export interface Question {
  id: string;
  content: string;
  options: Record<string, string>;
  correct_answer: string;
  points: number;
}

export interface QuestionBank {
  id: string;
  title: string;
  subject_id: string;
  questions?: Question[];
}

export interface Exam {
  id: string;
  title: string;
  subject_id: string;
  question_bank_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  passcode?: string;
}

export interface Submission {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  status: 'in_progress' | 'submitted';
}
