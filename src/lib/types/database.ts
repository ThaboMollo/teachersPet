export type Role = 'teacher' | 'dh' | 'dp' | 'principal'
export type AttendanceStatus = 'present' | 'absent' | 'late'
export type AnnouncementType = 'general' | 'meeting' | 'word_of_day' | 'urgent'
export type AssessmentType = 'informal_task' | 'test' | 'exam' | 'assignment'
export type DocumentCategory = 'lesson_plan' | 'assessment' | 'memo' | 'admin' | 'other'
export type LessonPlanStatus = 'draft' | 'submitted' | 'approved'

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          address: string | null
          emis_number: string | null
          logo_url: string | null
          join_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          emis_number?: string | null
          logo_url?: string | null
          join_code: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['schools']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          school_id: string | null
          role: Role
          name: string
          surname: string
          id_number: string | null
          phone: string | null
          address: string | null
          onboarding_complete: boolean
          created_at: string
        }
        Insert: {
          id: string
          school_id?: string | null
          role?: Role
          name?: string
          surname?: string
          id_number?: string | null
          phone?: string | null
          address?: string | null
          onboarding_complete?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'profiles_school_id_fkey'
            columns: ['school_id']
            isOneToOne: false
            referencedRelation: 'schools'
            referencedColumns: ['id']
          }
        ]
      }
      classes: {
        Row: {
          id: string
          school_id: string
          grade: number
          name: string
          year: number
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          grade: number
          name: string
          year?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'classes_school_id_fkey'
            columns: ['school_id']
            isOneToOne: false
            referencedRelation: 'schools'
            referencedColumns: ['id']
          }
        ]
      }
      subjects: {
        Row: {
          id: string
          school_id: string
          name: string
          code: string | null
          grade: number | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          code?: string | null
          grade?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>
        Relationships: []
      }
      class_teachers: {
        Row: {
          id: string
          class_id: string
          teacher_id: string
          subject_id: string | null
        }
        Insert: {
          id?: string
          class_id: string
          teacher_id: string
          subject_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['class_teachers']['Insert']>
        Relationships: []
      }
      learners: {
        Row: {
          id: string
          school_id: string
          class_id: string
          name: string
          surname: string
          id_number: string | null
          date_of_birth: string | null
          parent_contact: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          class_id: string
          name: string
          surname: string
          id_number?: string | null
          date_of_birth?: string | null
          parent_contact?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['learners']['Insert']>
        Relationships: []
      }
      timetable_slots: {
        Row: {
          id: string
          school_id: string
          class_id: string
          subject_id: string | null
          teacher_id: string | null
          day_of_week: number
          period: number
          start_time: string
          end_time: string
        }
        Insert: {
          id?: string
          school_id: string
          class_id: string
          subject_id?: string | null
          teacher_id?: string | null
          day_of_week: number
          period: number
          start_time: string
          end_time: string
        }
        Update: Partial<Database['public']['Tables']['timetable_slots']['Insert']>
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          school_id: string
          class_id: string
          learner_id: string
          date: string
          status: AttendanceStatus
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          class_id: string
          learner_id: string
          date?: string
          status: AttendanceStatus
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          school_id: string
          created_by: string
          title: string
          body: string
          type: AnnouncementType
          target_roles: Role[]
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          created_by: string
          title: string
          body: string
          type?: AnnouncementType
          target_roles?: Role[]
          is_published?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>
        Relationships: []
      }
      lesson_plans: {
        Row: {
          id: string
          school_id: string
          teacher_id: string
          class_id: string
          subject_id: string | null
          date: string
          topic: string
          objectives: string | null
          activities: string | null
          resources: string | null
          memo_url: string | null
          status: LessonPlanStatus
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          teacher_id: string
          class_id: string
          subject_id?: string | null
          date: string
          topic: string
          objectives?: string | null
          activities?: string | null
          resources?: string | null
          memo_url?: string | null
          status?: LessonPlanStatus
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['lesson_plans']['Insert']>
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          school_id: string
          uploader_id: string
          class_id: string | null
          subject_id: string | null
          category: DocumentCategory
          title: string
          file_url: string
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          uploader_id: string
          class_id?: string | null
          subject_id?: string | null
          category: DocumentCategory
          title: string
          file_url: string
          file_size?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
        Relationships: []
      }
      assessments: {
        Row: {
          id: string
          school_id: string
          class_id: string
          teacher_id: string
          subject_id: string | null
          type: AssessmentType
          title: string
          date: string
          total_marks: number
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          class_id: string
          teacher_id: string
          subject_id?: string | null
          type: AssessmentType
          title: string
          date: string
          total_marks: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['assessments']['Insert']>
        Relationships: []
      }
      assessment_results: {
        Row: {
          id: string
          assessment_id: string
          learner_id: string
          marks_obtained: number
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          learner_id: string
          marks_obtained: number
          recorded_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['assessment_results']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type School = Database['public']['Tables']['schools']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Subject = Database['public']['Tables']['subjects']['Row']
export type ClassTeacher = Database['public']['Tables']['class_teachers']['Row']
export type Learner = Database['public']['Tables']['learners']['Row']
export type TimetableSlot = Database['public']['Tables']['timetable_slots']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type LessonPlan = Database['public']['Tables']['lesson_plans']['Row']
export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type Assessment = Database['public']['Tables']['assessments']['Row']
export type AssessmentResult = Database['public']['Tables']['assessment_results']['Row']
