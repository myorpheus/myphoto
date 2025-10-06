export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null
          description: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          club_id: string | null
          commission_percentage: number
          created_at: string | null
          creator_id: string | null
          id: string
          setting_type: string
          updated_at: string | null
        }
        Insert: {
          club_id?: string | null
          commission_percentage?: number
          created_at?: string | null
          creator_id?: string | null
          id?: string
          setting_type: string
          updated_at?: string | null
        }
        Update: {
          club_id?: string | null
          commission_percentage?: number
          created_at?: string | null
          creator_id?: string | null
          id?: string
          setting_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      creator_balances: {
        Row: {
          available_balance: number
          created_at: string | null
          creator_user_id: string
          id: string
          pending_balance: number
          total_earned: number
          updated_at: string | null
        }
        Insert: {
          available_balance?: number
          created_at?: string | null
          creator_user_id: string
          id?: string
          pending_balance?: number
          total_earned?: number
          updated_at?: string | null
        }
        Update: {
          available_balance?: number
          created_at?: string | null
          creator_user_id?: string
          id?: string
          pending_balance?: number
          total_earned?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      creator_payouts: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          creator_user_id: string
          currency: string
          failure_reason: string | null
          id: string
          processed_date: string | null
          requested_date: string
          status: string
          stripe_transfer_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          creator_user_id: string
          currency?: string
          failure_reason?: string | null
          id?: string
          processed_date?: string | null
          requested_date?: string
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          creator_user_id?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          processed_date?: string | null
          requested_date?: string
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credits: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_keyword_relations: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          keyword_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          keyword_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          keyword_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_keyword_relations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_keyword_relations_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "event_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      event_keywords: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          category: string
          created_at: string | null
          description: string | null
          duration_hours: number | null
          event_date: string
          event_type: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_recurring: boolean | null
          location: string
          max_attendees: number | null
          max_tickets: number | null
          organizer_id: string
          recurrence_count: number | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          status: string | null
          tags: string[] | null
          ticket_price: number | null
          title: string
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          event_date: string
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          location: string
          max_attendees?: number | null
          max_tickets?: number | null
          organizer_id: string
          recurrence_count?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          status?: string | null
          tags?: string[] | null
          ticket_price?: number | null
          title: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          event_date?: string
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_recurring?: boolean | null
          location?: string
          max_attendees?: number | null
          max_tickets?: number | null
          organizer_id?: string
          recurrence_count?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          status?: string | null
          tags?: string[] | null
          ticket_price?: number | null
          title?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          astria_image_id: number | null
          created_at: string | null
          id: number
          model_id: number
          prompt: string | null
          status: string
          url: string
          user_id: string
        }
        Insert: {
          astria_image_id?: number | null
          created_at?: string | null
          id?: number
          model_id: number
          prompt?: string | null
          status?: string
          url: string
          user_id: string
        }
        Update: {
          astria_image_id?: number | null
          created_at?: string | null
          id?: number
          model_id?: number
          prompt?: string | null
          status?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "images_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          astria_model_id: number
          created_at: string | null
          id: number
          name: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          astria_model_id: number
          created_at?: string | null
          id?: number
          name: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          astria_model_id?: number
          created_at?: string | null
          id?: number
          name?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          channels: Json
          created_at: string
          enabled: boolean
          id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_name: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string | null
          id: string
          original_post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          original_post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          appsource: string
          bio: string | null
          created_at: string | null
          display_name: string | null
          email_preferences: Json | null
          id: string
          level: number | null
          location: string | null
          points: number | null
          profile_image_url: string | null
          role: string | null
          social_links: Json | null
          subscription_end_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tier: string | null
          updated_at: string | null
          video_upload_limit_override: number | null
        }
        Insert: {
          appsource?: string
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email_preferences?: Json | null
          id: string
          level?: number | null
          location?: string | null
          points?: number | null
          profile_image_url?: string | null
          role?: string | null
          social_links?: Json | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tier?: string | null
          updated_at?: string | null
          video_upload_limit_override?: number | null
        }
        Update: {
          appsource?: string
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email_preferences?: Json | null
          id?: string
          level?: number | null
          location?: string | null
          points?: number | null
          profile_image_url?: string | null
          role?: string | null
          social_links?: Json | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tier?: string | null
          updated_at?: string | null
          video_upload_limit_override?: number | null
        }
        Relationships: []
      }
      samples: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          model_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          model_id?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          model_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          content: string
          created_at: string
          expires_at: string
          id: string
          media_type: string | null
          media_url: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          created_at: string | null
          creator_amount: number | null
          currency: string
          event_id: string
          id: string
          platform_fee: number | null
          price_paid: number
          purchase_date: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          creator_amount?: number | null
          currency?: string
          event_id: string
          id?: string
          platform_fee?: number | null
          price_paid?: number
          purchase_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          creator_amount?: number | null
          currency?: string
          event_id?: string
          id?: string
          platform_fee?: number | null
          price_paid?: number
          purchase_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          points: number
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_followers: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          bio: string | null
          blocked_users: string[] | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          interests: string[] | null
          language: string | null
          location: string | null
          password_hash: string
          profile_image_url: string | null
          roles: string[] | null
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_start: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          blocked_users?: string[] | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          interests?: string[] | null
          language?: string | null
          location?: string | null
          password_hash: string
          profile_image_url?: string | null
          roles?: string[] | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          blocked_users?: string[] | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          interests?: string[] | null
          language?: string | null
          location?: string | null
          password_hash?: string
          profile_image_url?: string | null
          roles?: string[] | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_keyword: {
        Args: { keyword_name: string }
        Returns: string
      }
      award_activity_points: {
        Args: { p_activity_type: string; p_metadata?: Json; p_user_id: string }
        Returns: string
      }
      check_user_ticket: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      delete_expired_stories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_keyword: {
        Args: { keyword_id: string }
        Returns: boolean
      }
      get_all_keywords: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
        }[]
      }
      get_all_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          display_name: string
          email: string
          id: string
          profile_image_url: string
        }[]
      }
      get_conversation_messages: {
        Args: { p_user_id_1: string; p_user_id_2: string }
        Returns: {
          content: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
          sender_image: string
          sender_name: string
        }[]
      }
      get_creator_dashboard_data: {
        Args: { p_creator_id: string }
        Returns: {
          available_balance: number
          pending_balance: number
          recent_payouts: Json
          recent_sales: Json
          total_earned: number
        }[]
      }
      get_event_attendees_count: {
        Args: { event_id: string }
        Returns: {
          count: number
          status: string
        }[]
      }
      get_event_comments: {
        Args: { p_event_id: string }
        Returns: {
          commenter_image: string
          commenter_name: string
          content: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_pending_payouts: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_notes: string
          amount: number
          creator_email: string
          creator_name: string
          creator_user_id: string
          currency: string
          id: string
          requested_date: string
        }[]
      }
      get_unread_message_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_conversations: {
        Args: { p_user_id: string }
        Returns: {
          display_name: string
          last_message: string
          last_message_time: string
          profile_image_url: string
          unread_count: number
          user_id: string
        }[]
      }
      get_user_feed: {
        Args: { p_user_id: string }
        Returns: {
          author_image: string
          author_name: string
          content: string
          created_at: string
          id: string
          image_url: string
          updated_at: string
          user_id: string
          video_url: string
        }[]
      }
      get_user_messages_for_admin: {
        Args: { p_user_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          recipient_name: string
          sender_id: string
          sender_name: string
        }[]
      }
      get_user_points_and_level: {
        Args: { p_user_id: string }
        Returns: {
          level: number
          points: number
        }[]
      }
      get_user_posts: {
        Args: { p_user_id: string }
        Returns: {
          author_image: string
          author_name: string
          content: string
          created_at: string
          id: string
          image_url: string
          updated_at: string
          user_id: string
          video_url: string
        }[]
      }
      get_user_recent_activities: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json
          points: number
        }[]
      }
      get_user_tickets: {
        Args: { p_user_id: string }
        Returns: {
          currency: string
          event_date: string
          event_id: string
          event_location: string
          event_title: string
          id: string
          price_paid: number
          purchase_date: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_creator: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      mark_messages_as_read: {
        Args: { p_recipient_id: string; p_sender_id: string }
        Returns: undefined
      }
      process_balance_clearing: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_payout: {
        Args: {
          p_action: string
          p_admin_notes?: string
          p_failure_reason?: string
          p_payout_id: string
          p_stripe_transfer_id?: string
        }
        Returns: boolean
      }
      request_creator_payout: {
        Args: { p_amount: number; p_creator_id: string }
        Returns: string
      }
      set_event_featured: {
        Args: { p_event_id: string; p_is_featured: boolean }
        Returns: undefined
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_keyword: {
        Args: { keyword_id: string; new_name: string }
        Returns: boolean
      }
      update_user_tier: {
        Args: { p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "creator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "creator", "user"],
    },
  },
} as const
