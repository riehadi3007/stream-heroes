export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          price: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      donators: {
        Row: {
          id: string
          name: string
          category_id: string
          total_game: number
          total_donation: number
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          category_id: string
          total_game: number
          total_donation?: number
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          category_id?: string
          total_game?: number
          total_donation?: number
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donators_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      current_game: {
        Row: {
          id: string
          donator_id: string
          position: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          donator_id: string
          position: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          donator_id?: string
          position?: number
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "current_game_donator_id_fkey"
            columns: ["donator_id"]
            referencedRelation: "donators"
            referencedColumns: ["id"]
          }
        ]
      }
      game_sessions: {
        Row: {
          id: string
          session_id: string
          donator_id: string
          played_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          session_id: string
          donator_id: string
          played_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          donator_id?: string
          played_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_donator_id_fkey"
            columns: ["donator_id"]
            referencedRelation: "donators"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Row']

export type Category = Tables<'categories'>
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Donator = Tables<'donators'>
export type DonatorInsert = Database['public']['Tables']['donators']['Insert']
export type DonatorUpdate = Database['public']['Tables']['donators']['Update']

export type CurrentGame = Tables<'current_game'>
export type CurrentGameInsert = Database['public']['Tables']['current_game']['Insert']
export type CurrentGameUpdate = Database['public']['Tables']['current_game']['Update']

export type GameSession = Tables<'game_sessions'>
export type GameSessionInsert = Database['public']['Tables']['game_sessions']['Insert']
export type GameSessionUpdate = Database['public']['Tables']['game_sessions']['Update'] 