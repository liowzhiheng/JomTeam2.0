export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export interface Database {
  public: {
    Tables: {
      profiles: { Row: { id:string; first_name:string; last_name:string; gender:string|null; birth_date:string|null; status:'active'|'deactivated'; biography:string|null; location:string|null; interests:string[]; preferred_sports:string[]; skill_level:string; availability:string|null; profile_image_path:string|null; average_rating:number; rating_count:number; last_active_at:string; created_at:string; updated_at:string }; Insert: { id:string; first_name:string; last_name:string }; Update: Partial<Database['public']['Tables']['profiles']['Row']>; Relationships: [] };
      profile_private: { Row:{ user_id:string; phone:string|null }; Insert:{ user_id:string; phone?:string|null }; Update:{ phone?:string|null }; Relationships:[] };
      matches: { Row:{ id:string; host_id:string|null; title:string; sport:string; skill_level:string; max_players:number; participant_count:number; location:string; starts_at:string; duration_minutes:number; description:string|null; cover_image_path:string|null; status:string; created_at:string }; Insert:{ id?:string; host_id:string; title:string; sport:string; skill_level:string; max_players:number; location:string; starts_at:string; duration_minutes:number; description?:string|null; cover_image_path?:string|null; status?:string }; Update:Partial<Database['public']['Tables']['matches']['Row']>; Relationships:[] };
      match_join_requests: { Row:{ id:string; match_id:string; user_id:string; message:string|null; status:string; created_at:string }; Insert:{ match_id:string; user_id?:string; message?:string }; Update:{ status?:string }; Relationships:[] };
      match_participants: { Row:{ match_id:string; user_id:string; joined_at:string; removed_at:string|null }; Insert:{ match_id:string; user_id:string }; Update:{ removed_at?:string|null }; Relationships:[] };
      match_messages: { Row:{ id:string; match_id:string; sender_id:string; body:string; created_at:string }; Insert:{ match_id:string; sender_id?:string; body:string }; Update:{ body?:string }; Relationships:[] };
      friend_requests: { Row:{ id:string; sender_id:string; recipient_id:string; status:string; created_at:string }; Insert:{ sender_id?:string; recipient_id:string }; Update:{ status?:string }; Relationships:[] };
      friendships: { Row:{ user_id:string; friend_id:string; created_at:string }; Insert:{ user_id:string; friend_id:string }; Update:never; Relationships:[] };
      player_ratings: { Row:{ id:string; match_id:string; rater_id:string; rated_user_id:string; rating:number; comment:string|null; created_at:string; updated_at:string }; Insert:{ match_id:string; rater_id?:string; rated_user_id:string; rating:number; comment?:string }; Update:{ rating?:number; comment?:string }; Relationships:[] };
      feedback: { Row:{ id:string; user_id:string; title:string; description:string; rating:number; status:string; created_at:string }; Insert:{ user_id?:string; title:string; description:string; rating:number }; Update:{ status?:string }; Relationships:[] };
      notifications: { Row:{ id:string; recipient_id:string; actor_id:string|null; type:string; title:string; body:string|null; match_id:string|null; profile_id:string|null; read_at:string|null; created_at:string }; Insert:never; Update:{ read_at?:string|null }; Relationships:[] };
      user_roles: { Row:{ user_id:string; role:'user'|'admin' }; Insert:never; Update:never; Relationships:[] };
      activity_logs: { Row:{ id:number; actor_id:string|null; action:string; entity_type:string; entity_id:string|null; metadata:Json; created_at:string }; Insert:never; Update:never; Relationships:[] };
    };
    Views: { match_discovery: { Row: Record<string, unknown>; Relationships:[] } };
    Functions: { request_to_join_match:{ Args:{ p_match_id:string;p_message?:string|null }; Returns:undefined }; leave_match:{ Args:{ p_match_id:string }; Returns:undefined }; remove_match_participant:{ Args:{ p_match_id:string;p_user_id:string }; Returns:undefined }; accept_match_join_request:{ Args:{ p_request_id:string }; Returns:undefined }; reject_match_join_request:{ Args:{ p_request_id:string }; Returns:undefined }; cancel_match:{ Args:{ p_match_id:string }; Returns:undefined }; complete_match:{ Args:{ p_match_id:string }; Returns:undefined }; send_friend_request:{ Args:{ p_recipient_id:string }; Returns:undefined }; accept_friend_request:{ Args:{ p_request_id:string }; Returns:undefined }; prepare_user_deletion:{ Args:{ p_user_id:string }; Returns:string[] } };
    Enums: Record<string, string>;
    CompositeTypes: Record<never, never>;
  };
}
