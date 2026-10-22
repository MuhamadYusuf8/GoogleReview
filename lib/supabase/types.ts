import type { Database } from "./database.types";

// ─── Shorthand row types ───────────────────────────────────────────────────────

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
export type MerchantInsert = Database["public"]["Tables"]["merchants"]["Insert"];
export type MerchantUpdate = Database["public"]["Tables"]["merchants"]["Update"];

export type LinkRow = Database["public"]["Tables"]["links"]["Row"];
export type LinkInsert = Database["public"]["Tables"]["links"]["Insert"];
export type LinkUpdate = Database["public"]["Tables"]["links"]["Update"];
export type LinkStatus = Database["public"]["Enums"]["link_status"];

export type LinkTargetHistoryRow = Database["public"]["Tables"]["link_target_history"]["Row"];
export type LinkTargetHistoryInsert = Database["public"]["Tables"]["link_target_history"]["Insert"];

export type ScanEventRow = Database["public"]["Tables"]["scan_events"]["Row"];
export type ScanEventInsert = Database["public"]["Tables"]["scan_events"]["Insert"];
export type ScanSource = Database["public"]["Enums"]["scan_source"];
export type UserRole = Database["public"]["Enums"]["user_role"];
