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
      calendar_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_waitlist: {
        Row: {
          email: string
          family_name: string | null
          given_name: string | null
          id: string
          submitted_at: string
          tag: string
        }
        Insert: {
          email: string
          family_name?: string | null
          given_name?: string | null
          id?: string
          submitted_at?: string
          tag?: string
        }
        Update: {
          email?: string
          family_name?: string | null
          given_name?: string | null
          id?: string
          submitted_at?: string
          tag?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string
          email: string
          id: string
          is_organizer: boolean | null
          meeting_id: string
          name: string | null
          response_timestamp: string | null
          rsvp_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_organizer?: boolean | null
          meeting_id: string
          name?: string | null
          response_timestamp?: string | null
          rsvp_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_organizer?: boolean | null
          meeting_id?: string
          name?: string | null
          response_timestamp?: string | null
          rsvp_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      key_insights: {
        Row: {
          action_items: Json | null
          created_at: string
          decisions: Json | null
          id: string
          insight_summary: string | null
          meeting_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          decisions?: Json | null
          id?: string
          insight_summary?: string | null
          meeting_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          decisions?: Json | null
          id?: string
          insight_summary?: string | null
          meeting_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          bot_id: string
          created_at: string
          id: string
          join_time: string | null
          leave_time: string | null
          meeting_id: string
          recording_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          id?: string
          join_time?: string | null
          leave_time?: string | null
          meeting_id: string
          recording_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          id?: string
          join_time?: string | null
          leave_time?: string | null
          meeting_id?: string
          recording_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          attendees_count: number | null
          auto_join: boolean | null
          auto_record: boolean | null
          calendar_color: string | null
          calendar_external_id: string | null
          calendar_id: string | null
          calendar_name: string | null
          created_at: string
          description: string | null
          end_time: string
          external_id: string
          google_event_id: string | null
          id: string
          location: string | null
          meeting_type: string | null
          meeting_url: string | null
          platform: string | null
          recurrence_rule: string | null
          start_time: string
          timezone: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees_count?: number | null
          auto_join?: boolean | null
          auto_record?: boolean | null
          calendar_color?: string | null
          calendar_external_id?: string | null
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          external_id: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          meeting_type?: string | null
          meeting_url?: string | null
          platform?: string | null
          recurrence_rule?: string | null
          start_time: string
          timezone?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees_count?: number | null
          auto_join?: boolean | null
          auto_record?: boolean | null
          calendar_color?: string | null
          calendar_external_id?: string | null
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          external_id?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          meeting_type?: string | null
          meeting_url?: string | null
          platform?: string | null
          recurrence_rule?: string | null
          start_time?: string
          timezone?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recall_calendars: {
        Row: {
          created_at: string
          id: string
          platform: string
          recall_calendar_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          recall_calendar_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          recall_calendar_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          calendar_external_id: string
          error_message: string | null
          events_created: number | null
          events_deleted: number | null
          events_processed: number | null
          events_updated: number | null
          id: string
          metadata: Json | null
          status: string
          sync_completed_at: string | null
          sync_started_at: string
          sync_type: string
          user_id: string
        }
        Insert: {
          calendar_external_id: string
          error_message?: string | null
          events_created?: number | null
          events_deleted?: number | null
          events_processed?: number | null
          events_updated?: number | null
          id?: string
          metadata?: Json | null
          status: string
          sync_completed_at?: string | null
          sync_started_at?: string
          sync_type: string
          user_id: string
        }
        Update: {
          calendar_external_id?: string
          error_message?: string | null
          events_created?: number | null
          events_deleted?: number | null
          events_processed?: number | null
          events_updated?: number | null
          id?: string
          metadata?: Json | null
          status?: string
          sync_completed_at?: string | null
          sync_started_at?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          actionit_summary: Json | null
          bot_id: string
          considerations_and_open_issues: string | null
          created_at: string
          id: string
          intent_identification: string | null
          key_items_and_action_items: string | null
          key_points_by_speaker: string | null
          meeting_id: string
          meeting_summary: string | null
          meeting_title: string | null
          next_steps_and_follow_ups: string | null
          notes_for_next_meeting: string | null
          open_ai_analysis: Json | null
          parsed_transcript: Json | null
          raw_transcript: Json | null
          recall_transcript_id: string | null
          speakers: Json | null
          timestamps: Json | null
          tone_and_sentiment_analysis: string | null
          transcript_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actionit_summary?: Json | null
          bot_id: string
          considerations_and_open_issues?: string | null
          created_at?: string
          id?: string
          intent_identification?: string | null
          key_items_and_action_items?: string | null
          key_points_by_speaker?: string | null
          meeting_id: string
          meeting_summary?: string | null
          meeting_title?: string | null
          next_steps_and_follow_ups?: string | null
          notes_for_next_meeting?: string | null
          open_ai_analysis?: Json | null
          parsed_transcript?: Json | null
          raw_transcript?: Json | null
          recall_transcript_id?: string | null
          speakers?: Json | null
          timestamps?: Json | null
          tone_and_sentiment_analysis?: string | null
          transcript_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actionit_summary?: Json | null
          bot_id?: string
          considerations_and_open_issues?: string | null
          created_at?: string
          id?: string
          intent_identification?: string | null
          key_items_and_action_items?: string | null
          key_points_by_speaker?: string | null
          meeting_id?: string
          meeting_summary?: string | null
          meeting_title?: string | null
          next_steps_and_follow_ups?: string | null
          notes_for_next_meeting?: string | null
          open_ai_analysis?: Json | null
          parsed_transcript?: Json | null
          raw_transcript?: Json | null
          recall_transcript_id?: string | null
          speakers?: Json | null
          timestamps?: Json | null
          tone_and_sentiment_analysis?: string | null
          transcript_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_meeting_recordings_bot"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "transcripts_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_calendars: {
        Row: {
          auto_join: boolean | null
          auto_record: boolean | null
          calendar_connection_id: string
          color: string
          created_at: string
          description: string | null
          external_id: string
          id: string
          is_primary: boolean
          is_selected: boolean
          name: string
          updated_at: string
          user_id: string
          webhook_channel_id: string | null
          webhook_expires_at: string | null
          webhook_resource_id: string | null
        }
        Insert: {
          auto_join?: boolean | null
          auto_record?: boolean | null
          calendar_connection_id: string
          color?: string
          created_at?: string
          description?: string | null
          external_id: string
          id?: string
          is_primary?: boolean
          is_selected?: boolean
          name: string
          updated_at?: string
          user_id: string
          webhook_channel_id?: string | null
          webhook_expires_at?: string | null
          webhook_resource_id?: string | null
        }
        Update: {
          auto_join?: boolean | null
          auto_record?: boolean | null
          calendar_connection_id?: string
          color?: string
          created_at?: string
          description?: string | null
          external_id?: string
          id?: string
          is_primary?: boolean
          is_selected?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          webhook_channel_id?: string | null
          webhook_expires_at?: string | null
          webhook_resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_calendars_calendar_connection_id_fkey"
            columns: ["calendar_connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_join_enabled: boolean | null
          auto_record_enabled: boolean | null
          bot_name: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_join_enabled?: boolean | null
          auto_record_enabled?: boolean | null
          bot_name?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_join_enabled?: boolean | null
          auto_record_enabled?: boolean | null
          bot_name?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_column_exists: {
        Args: { table_name: string; column_name: string }
        Returns: boolean
      }
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      exec_sql: {
        Args: { sql: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
