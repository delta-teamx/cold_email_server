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
// app type-checks before you run the CLI generator for the first time.
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DomainStatus = "pending" | "configured" | "active";
export type InboxState = "warming" | "ramping" | "active" | "paused";
export type CallStatus =
  | "voicemail"
  | "no_answer"
  | "busy"
  | "voicemail_full"
  | "answered"
  | "failed";
export type EmailTrack = "voicemail_angle" | "strong_desk_angle" | "excluded";
export type LeadStatus =
  | "new"
  | "called"
  | "personalized"
  | "queued"
  | "sent"
  | "replied"
  | "bounced"
  | "unsubscribed";
export type EmailStatus = "scheduled" | "sent" | "opened" | "replied" | "bounced";
export type ReplyClassification =
  | "interested"
  | "not_interested"
  | "question"
  | "unsubscribe"
  | "oob";
export type DealStage =
  | "new_reply"
  | "qualifying"
  | "demo_booked"
  | "closed_won"
  | "closed_lost";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface Database {
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
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      domains: {
        Row: {
          id: string;
          root_domain: string;
          registered_at: string | null;
          dkim_configured: boolean;
          spf_configured: boolean;
          dmarc_configured: boolean;
          status: DomainStatus;
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
          status?: DomainStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["domains"]["Insert"]>;
      };
      inboxes: {
        Row: {
          id: string;
          domain_id: string;
          email_address: string;
          display_name: string;
          profile_photo_url: string | null;
          instantly_account_id: string | null;
          state: InboxState;
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
          state?: InboxState;
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
        Update: Partial<Database["public"]["Tables"]["inboxes"]["Insert"]>;
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          niche: string;
          city: string;
          status: CampaignStatus;
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
          status?: CampaignStatus;
          voicemail_email_template?: string | null;
          strong_desk_email_template?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
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
          call_status: CallStatus | null;
          call_attempted_at: string | null;
          email_track: EmailTrack | null;
          status: LeadStatus;
          assigned_inbox_id: string | null;
          scraped_at: string;
          called_at: string | null;
          sent_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["leads"]["Row"],
          "id" | "scraped_at"
        > & {
          id?: string;
          scraped_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
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
          status: EmailStatus;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["emails"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["emails"]["Insert"]>;
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
          classification: ReplyClassification | null;
          ai_draft_response: string | null;
          user_response: string | null;
          sent_at: string | null;
          received_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["replies"]["Row"],
          "id" | "received_at"
        > & { id?: string; received_at?: string };
        Update: Partial<Database["public"]["Tables"]["replies"]["Insert"]>;
      };
      deals: {
        Row: {
          id: string;
          lead_id: string;
          stage: DealStage;
          demo_at: string | null;
          notes: string | null;
          value_dollars: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["deals"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };
      do_not_contact: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["do_not_contact"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["do_not_contact"]["Insert"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["inbox_health_log"]["Row"],
          "id" | "logged_at"
        > & { id?: string; logged_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["inbox_health_log"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      domain_status: DomainStatus;
      inbox_state: InboxState;
      call_status: CallStatus;
      email_track: EmailTrack;
      lead_status: LeadStatus;
      email_status: EmailStatus;
      reply_classification: ReplyClassification;
      deal_stage: DealStage;
      campaign_status: CampaignStatus;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
