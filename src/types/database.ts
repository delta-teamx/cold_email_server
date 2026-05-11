// ============================================================================
// Generated database types.
//
// This file is committed as a starting point but should be regenerated from
// Supabase whenever the schema changes:
//
//   npm run db:types
//
// (Equivalent to `supabase gen types typescript --local > src/types/database.ts`.)
//
// The hand-written types below mirror supabase/migrations/0001_init.sql so the
// app type-checks before you run the CLI generator for the first time. The
// shape matches what `supabase gen types` produces (Tables / Views / Functions /
// Enums / CompositeTypes at every schema) so @supabase/ssr can infer Row /
// Insert / Update correctly.
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          admin_email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          admin_email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          admin_email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      domains: {
        Row: {
          id: string;
          root_domain: string;
          registered_at: string | null;
          dkim_configured: boolean;
          spf_configured: boolean;
          dmarc_configured: boolean;
          status: Database["public"]["Enums"]["domain_status"];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          root_domain: string;
          registered_at?: string | null;
          dkim_configured?: boolean;
          spf_configured?: boolean;
          dmarc_configured?: boolean;
          status?: Database["public"]["Enums"]["domain_status"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          root_domain?: string;
          registered_at?: string | null;
          dkim_configured?: boolean;
          spf_configured?: boolean;
          dmarc_configured?: boolean;
          status?: Database["public"]["Enums"]["domain_status"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inboxes: {
        Row: {
          id: string;
          domain_id: string;
          email_address: string;
          display_name: string;
          profile_photo_url: string | null;
          instantly_account_id: string | null;
          state: Database["public"]["Enums"]["inbox_state"];
          warmup_started_at: string | null;
          current_daily_limit: number;
          sends_today: number;
          reset_at: string | null;
          recent_bounce_rate: number | null;
          recent_complaint_rate: number | null;
          recent_open_rate: number | null;
          recent_reply_rate: number | null;
          pause_reason: string | null;
          paused_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          email_address: string;
          display_name: string;
          profile_photo_url?: string | null;
          instantly_account_id?: string | null;
          state?: Database["public"]["Enums"]["inbox_state"];
          warmup_started_at?: string | null;
          current_daily_limit?: number;
          sends_today?: number;
          reset_at?: string | null;
          recent_bounce_rate?: number | null;
          recent_complaint_rate?: number | null;
          recent_open_rate?: number | null;
          recent_reply_rate?: number | null;
          pause_reason?: string | null;
          paused_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string;
          email_address?: string;
          display_name?: string;
          profile_photo_url?: string | null;
          instantly_account_id?: string | null;
          state?: Database["public"]["Enums"]["inbox_state"];
          warmup_started_at?: string | null;
          current_daily_limit?: number;
          sends_today?: number;
          reset_at?: string | null;
          recent_bounce_rate?: number | null;
          recent_complaint_rate?: number | null;
          recent_open_rate?: number | null;
          recent_reply_rate?: number | null;
          pause_reason?: string | null;
          paused_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inboxes_domain_id_fkey";
            columns: ["domain_id"];
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          niche: string;
          city: string;
          status: Database["public"]["Enums"]["campaign_status"];
          voicemail_email_template: string | null;
          strong_desk_email_template: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          niche: string;
          city: string;
          status?: Database["public"]["Enums"]["campaign_status"];
          voicemail_email_template?: string | null;
          strong_desk_email_template?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          niche?: string;
          city?: string;
          status?: Database["public"]["Enums"]["campaign_status"];
          voicemail_email_template?: string | null;
          strong_desk_email_template?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          campaign_id: string;
          business_name: string;
          owner_name: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          google_maps_url: string | null;
          hours_json: Json | null;
          review_snippets: string[] | null;
          rating: number | null;
          review_count: number | null;
          call_status: Database["public"]["Enums"]["call_status"] | null;
          call_attempted_at: string | null;
          email_track: Database["public"]["Enums"]["email_track"] | null;
          status: Database["public"]["Enums"]["lead_status"];
          assigned_inbox_id: string | null;
          scraped_at: string;
          called_at: string | null;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          business_name: string;
          owner_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          google_maps_url?: string | null;
          hours_json?: Json | null;
          review_snippets?: string[] | null;
          rating?: number | null;
          review_count?: number | null;
          call_status?: Database["public"]["Enums"]["call_status"] | null;
          call_attempted_at?: string | null;
          email_track?: Database["public"]["Enums"]["email_track"] | null;
          status?: Database["public"]["Enums"]["lead_status"];
          assigned_inbox_id?: string | null;
          scraped_at?: string;
          called_at?: string | null;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          business_name?: string;
          owner_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          google_maps_url?: string | null;
          hours_json?: Json | null;
          review_snippets?: string[] | null;
          rating?: number | null;
          review_count?: number | null;
          call_status?: Database["public"]["Enums"]["call_status"] | null;
          call_attempted_at?: string | null;
          email_track?: Database["public"]["Enums"]["email_track"] | null;
          status?: Database["public"]["Enums"]["lead_status"];
          assigned_inbox_id?: string | null;
          scraped_at?: string;
          called_at?: string | null;
          sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_assigned_inbox_id_fkey";
            columns: ["assigned_inbox_id"];
            referencedRelation: "inboxes";
            referencedColumns: ["id"];
          },
        ];
      };
      emails: {
        Row: {
          id: string;
          lead_id: string;
          campaign_id: string;
          inbox_id: string;
          step: number;
          subject: string;
          body: string;
          personalization_data: Json | null;
          scheduled_at: string | null;
          sent_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          replied_at: string | null;
          bounced_at: string | null;
          instantly_message_id: string | null;
          status: Database["public"]["Enums"]["email_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          campaign_id: string;
          inbox_id: string;
          step: number;
          subject: string;
          body: string;
          personalization_data?: Json | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          replied_at?: string | null;
          bounced_at?: string | null;
          instantly_message_id?: string | null;
          status?: Database["public"]["Enums"]["email_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          campaign_id?: string;
          inbox_id?: string;
          step?: number;
          subject?: string;
          body?: string;
          personalization_data?: Json | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          replied_at?: string | null;
          bounced_at?: string | null;
          instantly_message_id?: string | null;
          status?: Database["public"]["Enums"]["email_status"];
          created_at?: string;
        };
        Relationships: [];
      };
      replies: {
        Row: {
          id: string;
          lead_id: string;
          email_id: string | null;
          inbox_id: string;
          from_email: string;
          subject: string | null;
          body_text: string | null;
          body_html: string | null;
          classification:
            | Database["public"]["Enums"]["reply_classification"]
            | null;
          ai_draft_response: string | null;
          user_response: string | null;
          sent_at: string | null;
          received_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          email_id?: string | null;
          inbox_id: string;
          from_email: string;
          subject?: string | null;
          body_text?: string | null;
          body_html?: string | null;
          classification?:
            | Database["public"]["Enums"]["reply_classification"]
            | null;
          ai_draft_response?: string | null;
          user_response?: string | null;
          sent_at?: string | null;
          received_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          email_id?: string | null;
          inbox_id?: string;
          from_email?: string;
          subject?: string | null;
          body_text?: string | null;
          body_html?: string | null;
          classification?:
            | Database["public"]["Enums"]["reply_classification"]
            | null;
          ai_draft_response?: string | null;
          user_response?: string | null;
          sent_at?: string | null;
          received_at?: string;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          lead_id: string;
          stage: Database["public"]["Enums"]["deal_stage"];
          demo_at: string | null;
          notes: string | null;
          value_dollars: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          stage?: Database["public"]["Enums"]["deal_stage"];
          demo_at?: string | null;
          notes?: string | null;
          value_dollars?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          stage?: Database["public"]["Enums"]["deal_stage"];
          demo_at?: string | null;
          notes?: string | null;
          value_dollars?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      do_not_contact: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      inbox_health_log: {
        Row: {
          id: string;
          inbox_id: string;
          metric: string;
          value: number | null;
          threshold_breached: boolean;
          action_taken: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          inbox_id: string;
          metric: string;
          value?: number | null;
          threshold_breached?: boolean;
          action_taken?: string | null;
          logged_at?: string;
        };
        Update: {
          id?: string;
          inbox_id?: string;
          metric?: string;
          value?: number | null;
          threshold_breached?: boolean;
          action_taken?: string | null;
          logged_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      domain_status: "pending" | "configured" | "active";
      inbox_state: "warming" | "ramping" | "active" | "paused";
      call_status:
        | "voicemail"
        | "no_answer"
        | "busy"
        | "voicemail_full"
        | "answered"
        | "failed";
      email_track: "voicemail_angle" | "strong_desk_angle" | "excluded";
      lead_status:
        | "new"
        | "called"
        | "personalized"
        | "queued"
        | "sent"
        | "replied"
        | "bounced"
        | "unsubscribed";
      email_status: "scheduled" | "sent" | "opened" | "replied" | "bounced";
      reply_classification:
        | "interested"
        | "not_interested"
        | "question"
        | "unsubscribe"
        | "oob";
      deal_stage:
        | "new_reply"
        | "qualifying"
        | "demo_booked"
        | "closed_won"
        | "closed_lost";
      campaign_status: "draft" | "active" | "paused" | "completed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Re-exported enum aliases so other modules can import them by name.
export type DomainStatus = Database["public"]["Enums"]["domain_status"];
export type InboxState = Database["public"]["Enums"]["inbox_state"];
export type CallStatus = Database["public"]["Enums"]["call_status"];
export type EmailTrack = Database["public"]["Enums"]["email_track"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type EmailStatus = Database["public"]["Enums"]["email_status"];
export type ReplyClassification =
  Database["public"]["Enums"]["reply_classification"];
export type DealStage = Database["public"]["Enums"]["deal_stage"];
export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
