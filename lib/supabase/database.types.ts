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
          role: "admin" | "operator";
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: "admin" | "operator";
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "operator";
          full_name?: string | null;
          created_at?: string;
        };
      };
      merchants: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          contact_phone: string | null;
          google_place_id: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          google_place_id?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          google_place_id?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          merchant_id: string;
          slug: string;
          label: string | null;
          target_url: string;
          status: "active" | "paused" | "archived";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          slug: string;
          label?: string | null;
          target_url: string;
          status?: "active" | "paused" | "archived";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          slug?: string;
          label?: string | null;
          target_url?: string;
          status?: "active" | "paused" | "archived";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      link_target_history: {
        Row: {
          id: number;
          link_id: string;
          old_target_url: string | null;
          new_target_url: string;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: number;
          link_id: string;
          old_target_url?: string | null;
          new_target_url: string;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: number;
          link_id?: string;
          old_target_url?: string | null;
          new_target_url?: string;
          changed_by?: string | null;
          changed_at?: string;
        };
      };
      scan_events: {
        Row: {
          id: number;
          link_id: string;
          scanned_at: string;
          source: "qr" | "nfc" | "unknown";
          device_type: string | null;
          os: string | null;
          country: string | null;
          is_bot: boolean;
        };
        Insert: {
          id?: number;
          link_id: string;
          scanned_at?: string;
          source?: "qr" | "nfc" | "unknown";
          device_type?: string | null;
          os?: string | null;
          country?: string | null;
          is_bot?: boolean;
        };
        Update: {
          id?: number;
          link_id?: string;
          scanned_at?: string;
          source?: "qr" | "nfc" | "unknown";
          device_type?: string | null;
          os?: string | null;
          country?: string | null;
          is_bot?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_link_stats: {
        Args: { p_from: string; p_to: string };
        Returns: {
          link_id: string;
          slug: string;
          label: string | null;
          merchant_name: string;
          total_scans: number;
          qr_scans: number;
          nfc_scans: number;
        }[];
      };
    };
    Enums: {
      link_status: "active" | "paused" | "archived";
      scan_source: "qr" | "nfc" | "unknown";
      user_role: "admin" | "operator";
    };
  };
};
