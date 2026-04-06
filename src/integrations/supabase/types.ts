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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          slug: string
          sort_order: number
          tenant_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          slug: string
          sort_order?: number
          tenant_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          slug?: string
          sort_order?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_actions: {
        Row: {
          action_type: string
          channel: Database["public"]["Enums"]["distribution_channel"]
          event_id: string
          id: string
          metadata: Json | null
          performed_at: string
          performed_by: string | null
          tenant_id: string
        }
        Insert: {
          action_type?: string
          channel: Database["public"]["Enums"]["distribution_channel"]
          event_id: string
          id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
          tenant_id: string
        }
        Update: {
          action_type?: string
          channel?: Database["public"]["Enums"]["distribution_channel"]
          event_id?: string
          id?: string
          metadata?: Json | null
          performed_at?: string
          performed_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_actions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_gallery: {
        Row: {
          event_id: string
          id: string
          media_id: string
          sort_order: number
        }
        Insert: {
          event_id: string
          id?: string
          media_id: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          id?: string
          media_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_gallery_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_gallery_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsors: {
        Row: {
          event_id: string
          id: string
          logo_url: string | null
          name: string
          sort_order: number
          website_url: string | null
        }
        Insert: {
          event_id: string
          id?: string
          logo_url?: string | null
          name: string
          sort_order?: number
          website_url?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          logo_url?: string | null
          name?: string
          sort_order?: number
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_system: boolean
          name: string
          page_layout: Json
          prefill_data: Json
          sort_order: number
          tenant_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          page_layout?: Json
          prefill_data?: Json
          sort_order?: number
          tenant_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          page_layout?: Json
          prefill_data?: Json
          sort_order?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          auto_end_behavior: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          cta_button_text: string | null
          cta_link: string | null
          end_date: string | null
          end_time: string | null
          featured_image_id: string | null
          full_description: string | null
          id: string
          is_recurring: boolean
          organizer_name: string | null
          publish_at: string | null
          recurring_rule_id: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          social_share_text: string | null
          start_date: string
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          subtitle: string | null
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string
          venue_id: string | null
          whatsapp_share_text: string | null
        }
        Insert: {
          auto_end_behavior?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          cta_button_text?: string | null
          cta_link?: string | null
          end_date?: string | null
          end_time?: string | null
          featured_image_id?: string | null
          full_description?: string | null
          id?: string
          is_recurring?: boolean
          organizer_name?: string | null
          publish_at?: string | null
          recurring_rule_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          social_share_text?: string | null
          start_date: string
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          subtitle?: string | null
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string
          venue_id?: string | null
          whatsapp_share_text?: string | null
        }
        Update: {
          auto_end_behavior?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          cta_button_text?: string | null
          cta_link?: string | null
          end_date?: string | null
          end_time?: string | null
          featured_image_id?: string | null
          full_description?: string | null
          id?: string
          is_recurring?: boolean
          organizer_name?: string | null
          publish_at?: string | null
          recurring_rule_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          social_share_text?: string | null
          start_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          subtitle?: string | null
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string
          venue_id?: string | null
          whatsapp_share_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_featured_image_id_fkey"
            columns: ["featured_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_recurring_rule_id_fkey"
            columns: ["recurring_rule_id"]
            isOneToOne: false
            referencedRelation: "recurring_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          connected_by: string | null
          created_at: string
          credentials_encrypted: Json | null
          id: string
          last_sync_at: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          status: Database["public"]["Enums"]["integration_status"]
          subaccount_id: string | null
          sync_settings: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          connected_by?: string | null
          created_at?: string
          credentials_encrypted?: Json | null
          id?: string
          last_sync_at?: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          subaccount_id?: string | null
          sync_settings?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          connected_by?: string | null
          created_at?: string
          credentials_encrypted?: Json | null
          id?: string
          last_sync_at?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          subaccount_id?: string | null
          sync_settings?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          attempted_at: string
          connection_id: string
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          payload: Json | null
          response_status: number | null
          status: string
        }
        Insert: {
          attempted_at?: string
          connection_id: string
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_status?: number | null
          status?: string
        }
        Update: {
          attempted_at?: string
          connection_id?: string
          created_at?: string
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_status?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          category: string | null
          created_at: string
          file_size: number | null
          filename: string
          height: number | null
          id: string
          mime_type: string | null
          original_url: string | null
          source: Database["public"]["Enums"]["media_source"]
          storage_path: string | null
          tenant_id: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          file_size?: number | null
          filename: string
          height?: number | null
          id?: string
          mime_type?: string | null
          original_url?: string | null
          source?: Database["public"]["Enums"]["media_source"]
          storage_path?: string | null
          tenant_id: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          file_size?: number | null
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          original_url?: string | null
          source?: Database["public"]["Enums"]["media_source"]
          storage_path?: string | null
          tenant_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          quantity: number
          ticket_type_id: string
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          quantity?: number
          ticket_type_id: string
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          ticket_type_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          event_id: string
          id: string
          metadata: Json | null
          payment_provider: string | null
          payment_reference: string | null
          status: string
          tenant_id: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          event_id: string
          id?: string
          metadata?: Json | null
          payment_provider?: string | null
          payment_reference?: string | null
          status?: string
          tenant_id: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          event_id?: string
          id?: string
          metadata?: Json | null
          payment_provider?: string | null
          payment_reference?: string | null
          status?: string
          tenant_id?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_overrides: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          notification_sent_at: string | null
          original_plan_slug: string
          override_plan_slug: string
          performed_by: string | null
          reason: string | null
          reverted_at: string | null
          started_at: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          notification_sent_at?: string | null
          original_plan_slug: string
          override_plan_slug: string
          performed_by?: string | null
          reason?: string | null
          reverted_at?: string | null
          started_at?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          notification_sent_at?: string | null
          original_plan_slug?: string
          override_plan_slug?: string
          performed_by?: string | null
          reason?: string | null
          reverted_at?: string | null
          started_at?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_featured: boolean
          is_public: boolean
          limits: Json
          monthly_price_cents: number
          name: string
          notes: string | null
          slug: string
          sort_order: number
          stripe_monthly_price_id: string | null
          stripe_yearly_price_id: string | null
          updated_at: string
          yearly_price_cents: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_public?: boolean
          limits?: Json
          monthly_price_cents?: number
          name: string
          notes?: string | null
          slug: string
          sort_order?: number
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          updated_at?: string
          yearly_price_cents?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_public?: boolean
          limits?: Json
          monthly_price_cents?: number
          name?: string
          notes?: string | null
          slug?: string
          sort_order?: number
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          updated_at?: string
          yearly_price_cents?: number | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_rules: {
        Row: {
          created_at: string
          day_of_week: number[] | null
          end_after_count: number | null
          end_after_date: string | null
          frequency: string
          id: string
          interval_count: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number[] | null
          end_after_count?: number | null
          end_after_date?: string | null
          frequency?: string
          id?: string
          interval_count?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number[] | null
          end_after_count?: number | null
          end_after_date?: string | null
          frequency?: string
          id?: string
          interval_count?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          id: string
          metadata: Json | null
          order_item_id: string
          result: string
          scanned_at: string
          scanned_by: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          order_item_id: string
          result?: string
          scanned_at?: string
          scanned_by?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          order_item_id?: string
          result?: string
          scanned_at?: string
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: Database["public"]["Enums"]["subscription_plan"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          business_type: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan_id: Database["public"]["Enums"]["subscription_plan"]
          postal_code: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan_id?: Database["public"]["Enums"]["subscription_plan"]
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan_id?: Database["public"]["Enums"]["subscription_plan"]
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          capacity: number | null
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          name: string
          price_cents: number
          sale_end: string | null
          sale_start: string | null
          sold_count: number
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          sale_end?: string | null
          sale_start?: string | null
          sold_count?: number
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          sale_end?: string | null
          sale_start?: string | null
          sold_count?: number
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          current_value: number
          id: string
          limit_value: number
          metric: string
          period_end: string | null
          period_start: string | null
          tenant_id: string
        }
        Insert: {
          current_value?: number
          id?: string
          limit_value?: number
          metric: string
          period_end?: string | null
          period_start?: string | null
          tenant_id: string
        }
        Update: {
          current_value?: number
          id?: string
          limit_value?: number
          metric?: string
          period_end?: string | null
          period_start?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_primary: boolean
          latitude: number | null
          longitude: number | null
          name: string
          postal_code: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          postal_code?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          postal_code?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["widget_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["widget_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["widget_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "widgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_end_past_events: { Args: never; Returns: undefined }
      auto_publish_scheduled_events: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "marketer" | "viewer"
      distribution_channel: "whatsapp" | "embed" | "social" | "link" | "email"
      event_category:
        | "sport"
        | "proeverij"
        | "live-muziek"
        | "thema-avond"
        | "overig"
      event_status: "draft" | "published" | "scheduled" | "archived" | "ended"
      integration_provider: "clickwise"
      integration_status: "connected" | "disconnected" | "error"
      media_source: "upload" | "url" | "stock"
      subscription_plan: "free" | "basic" | "pro"
      widget_type: "agenda" | "single_event"
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
      app_role: ["owner", "admin", "editor", "marketer", "viewer"],
      distribution_channel: ["whatsapp", "embed", "social", "link", "email"],
      event_category: [
        "sport",
        "proeverij",
        "live-muziek",
        "thema-avond",
        "overig",
      ],
      event_status: ["draft", "published", "scheduled", "archived", "ended"],
      integration_provider: ["clickwise"],
      integration_status: ["connected", "disconnected", "error"],
      media_source: ["upload", "url", "stock"],
      subscription_plan: ["free", "basic", "pro"],
      widget_type: ["agenda", "single_event"],
    },
  },
} as const
