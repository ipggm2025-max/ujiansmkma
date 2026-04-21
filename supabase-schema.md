# SIM-UJIAN Database Schema (Supabase)

## Tables

### schools
- id: uuid (pk)
- name: text
- address: text
- created_at: timestamp

### teachers
- id: uuid (pk, auth.users)
- school_id: uuid (fk)
- full_name: text
- employee_id: text
- created_at: timestamp

### classes
- id: uuid (pk)
- school_id: uuid (fk)
- name: text (e.g., "10-A")
- level: int
- created_at: timestamp

### students
- id: uuid (pk, auth.users)
- school_id: uuid (fk)
- class_id: uuid (fk)
- full_name: text
- nisn: text
- created_at: timestamp

### subjects
- id: uuid (pk)
- school_id: uuid (fk)
- name: text
- created_at: timestamp

### question_banks
- id: uuid (pk)
- subject_id: uuid (fk)
- teacher_id: uuid (fk)
- title: text
- description: text
- created_at: timestamp

### questions
- id: uuid (pk)
- question_bank_id: uuid (fk)
- content: text (markdown supported)
- type: text (default: 'multiple_choice')
- options: jsonb (e.g., { "a": "...", "b": "..." })
- correct_answer: text (e.g., "a")
- points: int
- created_at: timestamp

### exams
- id: uuid (pk)
- subject_id: uuid (fk)
- question_bank_id: uuid (fk)
- teacher_id: uuid (fk)
- title: text
- start_time: timestamp
- end_time: timestamp
- duration_minutes: int
- passcode: text
- created_at: timestamp

### exam_participants
- id: uuid (pk)
- exam_id: uuid (fk)
- class_id: uuid (fk)
- created_at: timestamp

### exam_submissions
- id: uuid (pk)
- exam_id: uuid (fk)
- student_id: uuid (fk)
- started_at: timestamp
- finished_at: timestamp
- answers: jsonb (e.g., { "q1_id": "a", "q2_id": "c" })
- score: float
- status: text ('in_progress', 'submitted')
- created_at: timestamp

### settings
- id: uuid (pk)
- app_name: text
- app_version: text
- app_description: text
- logo_text: text
- institution_name: text
- copyright_text: text
- footer_info: text
- updated_at: timestamp
- created_at: timestamp
