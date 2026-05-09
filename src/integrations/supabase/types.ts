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
      availability_cache: {
        Row: {
          fetched_at: string
          listing_id: string
          slots: Json
        }
        Insert: {
          fetched_at?: string
          listing_id: string
          slots: Json
        }
        Update: {
          fetched_at?: string
          listing_id?: string
          slots?: Json
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          hero_image_url: string | null
          icon: string | null
          id: string
          is_published: boolean
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          description: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean
          latitude: number | null
          longitude: number | null
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          state: string
          state_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          state: string
          state_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          state?: string
          state_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities_hero_backfill_log: {
        Row: {
          city_slug: string
          error: string | null
          id: string
          image_url: string | null
          ran_at: string
          source_url: string | null
          status: string
        }
        Insert: {
          city_slug: string
          error?: string | null
          id?: string
          image_url?: string | null
          ran_at?: string
          source_url?: string | null
          status: string
        }
        Update: {
          city_slug?: string
          error?: string | null
          id?: string
          image_url?: string | null
          ran_at?: string
          source_url?: string | null
          status?: string
        }
        Relationships: []
      }
      city_link_clicks: {
        Row: {
          clicked_at: string
          country: string | null
          from_city_slug: string | null
          id: string
          referrer_path: string | null
          region: string | null
          to_city_slug: string
          user_agent: string | null
          visitor_hash: string | null
        }
        Insert: {
          clicked_at?: string
          country?: string | null
          from_city_slug?: string | null
          id?: string
          referrer_path?: string | null
          region?: string | null
          to_city_slug: string
          user_agent?: string | null
          visitor_hash?: string | null
        }
        Update: {
          clicked_at?: string
          country?: string | null
          from_city_slug?: string | null
          id?: string
          referrer_path?: string | null
          region?: string | null
          to_city_slug?: string
          user_agent?: string | null
          visitor_hash?: string | null
        }
        Relationships: []
      }
      competitor_host_matches: {
        Row: {
          admin_notes: string | null
          candidate_business_name: string | null
          candidate_email: string | null
          candidate_evidence: string | null
          candidate_name: string | null
          candidate_phone: string | null
          candidate_social_url: string | null
          candidate_source: string | null
          candidate_website: string | null
          competitor_url: string
          competitor_url_id: string
          created_at: string
          domain: string | null
          enriched_at: string | null
          enriched_emails: Json | null
          enriched_phones: Json | null
          enriched_socials: Json | null
          enriched_tier: string | null
          enrichment_cost_usd: number | null
          host_city: string | null
          host_first_name: string | null
          host_state: string | null
          id: string
          match_confidence: number
          property_address: string | null
          revenue_signal_notes: string | null
          revenue_signal_score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          candidate_business_name?: string | null
          candidate_email?: string | null
          candidate_evidence?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          candidate_social_url?: string | null
          candidate_source?: string | null
          candidate_website?: string | null
          competitor_url: string
          competitor_url_id: string
          created_at?: string
          domain?: string | null
          enriched_at?: string | null
          enriched_emails?: Json | null
          enriched_phones?: Json | null
          enriched_socials?: Json | null
          enriched_tier?: string | null
          enrichment_cost_usd?: number | null
          host_city?: string | null
          host_first_name?: string | null
          host_state?: string | null
          id?: string
          match_confidence?: number
          property_address?: string | null
          revenue_signal_notes?: string | null
          revenue_signal_score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          candidate_business_name?: string | null
          candidate_email?: string | null
          candidate_evidence?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          candidate_social_url?: string | null
          candidate_source?: string | null
          candidate_website?: string | null
          competitor_url?: string
          competitor_url_id?: string
          created_at?: string
          domain?: string | null
          enriched_at?: string | null
          enriched_emails?: Json | null
          enriched_phones?: Json | null
          enriched_socials?: Json | null
          enriched_tier?: string | null
          enrichment_cost_usd?: number | null
          host_city?: string | null
          host_first_name?: string | null
          host_state?: string | null
          id?: string
          match_confidence?: number
          property_address?: string | null
          revenue_signal_notes?: string | null
          revenue_signal_score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_host_matches_competitor_url_id_fkey"
            columns: ["competitor_url_id"]
            isOneToOne: false
            referencedRelation: "competitor_urls"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_pages: {
        Row: {
          created_at: string
          domain: string | null
          h1: string | null
          headings: Json | null
          id: string
          last_scraped_at: string | null
          markdown: string | null
          meta_description: string | null
          notes: string | null
          title: string | null
          updated_at: string
          url: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          h1?: string | null
          headings?: Json | null
          id?: string
          last_scraped_at?: string | null
          markdown?: string | null
          meta_description?: string | null
          notes?: string | null
          title?: string | null
          updated_at?: string
          url: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          h1?: string | null
          headings?: Json | null
          id?: string
          last_scraped_at?: string | null
          markdown?: string | null
          meta_description?: string | null
          notes?: string | null
          title?: string | null
          updated_at?: string
          url?: string
          word_count?: number | null
        }
        Relationships: []
      }
      competitor_sites: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_active: boolean
          label: string | null
          last_checked_at: string | null
          last_url_count: number
          sitemap_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          label?: string | null
          last_checked_at?: string | null
          last_url_count?: number
          sitemap_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          label?: string | null
          last_checked_at?: string | null
          last_url_count?: number
          sitemap_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      competitor_urls: {
        Row: {
          acknowledged: boolean
          first_seen_at: string
          id: string
          last_seen_at: string
          scraped_at: string | null
          site_id: string
          title: string | null
          url: string
          word_count: number | null
        }
        Insert: {
          acknowledged?: boolean
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          scraped_at?: string | null
          site_id: string
          title?: string | null
          url: string
          word_count?: number | null
        }
        Update: {
          acknowledged?: boolean
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          scraped_at?: string | null
          site_id?: string
          title?: string | null
          url?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_urls_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "competitor_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      content_404_log: {
        Row: {
          first_seen_at: string
          hit_count: number
          id: string
          last_seen_at: string
          referrer: string | null
          resolution_notes: string | null
          resolved_at: string | null
          slug: string | null
          url_path: string
          user_agent: string | null
        }
        Insert: {
          first_seen_at?: string
          hit_count?: number
          id?: string
          last_seen_at?: string
          referrer?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          slug?: string | null
          url_path: string
          user_agent?: string | null
        }
        Update: {
          first_seen_at?: string
          hit_count?: number
          id?: string
          last_seen_at?: string
          referrer?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          slug?: string | null
          url_path?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          body_markdown: string | null
          category: string
          content: string | null
          created_at: string
          description: string | null
          gsc_clicks: number | null
          gsc_impressions: number | null
          gsc_position: number | null
          gsc_updated_at: string | null
          hero_image_url: string | null
          hreflang_group: string | null
          id: string
          in_sitemap: boolean
          legacy_slugs: string[] | null
          locale: string
          migrated_at: string | null
          priority: number
          raw_html: string | null
          redirect_to: string | null
          scraped_at: string | null
          seo_description: string | null
          seo_title: string | null
          sitemap_source: string | null
          slug: string | null
          source_url: string | null
          status: string
          template_type: string | null
          title: string | null
          updated_at: string
          url_path: string | null
        }
        Insert: {
          body_markdown?: string | null
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          gsc_clicks?: number | null
          gsc_impressions?: number | null
          gsc_position?: number | null
          gsc_updated_at?: string | null
          hero_image_url?: string | null
          hreflang_group?: string | null
          id?: string
          in_sitemap?: boolean
          legacy_slugs?: string[] | null
          locale?: string
          migrated_at?: string | null
          priority?: number
          raw_html?: string | null
          redirect_to?: string | null
          scraped_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sitemap_source?: string | null
          slug?: string | null
          source_url?: string | null
          status?: string
          template_type?: string | null
          title?: string | null
          updated_at?: string
          url_path?: string | null
        }
        Update: {
          body_markdown?: string | null
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          gsc_clicks?: number | null
          gsc_impressions?: number | null
          gsc_position?: number | null
          gsc_updated_at?: string | null
          hero_image_url?: string | null
          hreflang_group?: string | null
          id?: string
          in_sitemap?: boolean
          legacy_slugs?: string[] | null
          locale?: string
          migrated_at?: string | null
          priority?: number
          raw_html?: string | null
          redirect_to?: string | null
          scraped_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sitemap_source?: string | null
          slug?: string | null
          source_url?: string | null
          status?: string
          template_type?: string | null
          title?: string | null
          updated_at?: string
          url_path?: string | null
        }
        Relationships: []
      }
      content_plan: {
        Row: {
          attempt_count: number
          city: string | null
          created_at: string
          generated_at: string | null
          generated_page_slug: string | null
          h1: string | null
          id: string
          internal_links: string | null
          last_attempt_at: string | null
          last_error: string | null
          meta_description: string | null
          meta_title: string | null
          notes: string | null
          paused_at: string | null
          population_2024: number | null
          primary_keyword: string | null
          priority_score: number | null
          priority_tier: string | null
          schema_suggestions: string | null
          search_intent: string | null
          slug: string
          source_type: string
          source_url: string | null
          state: string | null
          state_code: string | null
          status: string
          supporting_keywords: string | null
          uniqueness_angle: string | null
          updated_at: string
          validator_version: string | null
          warm_climate: boolean | null
        }
        Insert: {
          attempt_count?: number
          city?: string | null
          created_at?: string
          generated_at?: string | null
          generated_page_slug?: string | null
          h1?: string | null
          id?: string
          internal_links?: string | null
          last_attempt_at?: string | null
          last_error?: string | null
          meta_description?: string | null
          meta_title?: string | null
          notes?: string | null
          paused_at?: string | null
          population_2024?: number | null
          primary_keyword?: string | null
          priority_score?: number | null
          priority_tier?: string | null
          schema_suggestions?: string | null
          search_intent?: string | null
          slug: string
          source_type?: string
          source_url?: string | null
          state?: string | null
          state_code?: string | null
          status?: string
          supporting_keywords?: string | null
          uniqueness_angle?: string | null
          updated_at?: string
          validator_version?: string | null
          warm_climate?: boolean | null
        }
        Update: {
          attempt_count?: number
          city?: string | null
          created_at?: string
          generated_at?: string | null
          generated_page_slug?: string | null
          h1?: string | null
          id?: string
          internal_links?: string | null
          last_attempt_at?: string | null
          last_error?: string | null
          meta_description?: string | null
          meta_title?: string | null
          notes?: string | null
          paused_at?: string | null
          population_2024?: number | null
          primary_keyword?: string | null
          priority_score?: number | null
          priority_tier?: string | null
          schema_suggestions?: string | null
          search_intent?: string | null
          slug?: string
          source_type?: string
          source_url?: string | null
          state?: string | null
          state_code?: string | null
          status?: string
          supporting_keywords?: string | null
          uniqueness_angle?: string | null
          updated_at?: string
          validator_version?: string | null
          warm_climate?: boolean | null
        }
        Relationships: []
      }
      course_completions: {
        Row: {
          certificate_uid: string
          completed_at: string
          course_slug: string
          course_title: string
          id: string
          learner_name: string
          revoke_reason: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          certificate_uid?: string
          completed_at?: string
          course_slug: string
          course_title: string
          id?: string
          learner_name: string
          revoke_reason?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          certificate_uid?: string
          completed_at?: string
          course_slug?: string
          course_title?: string
          id?: string
          learner_name?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          course_slug: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_slug: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_slug?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          completed_at: string | null
          course_slug: string
          created_at: string
          id: string
          last_activity_at: string
          progress_pct: number
          started_at: string
          total_seconds_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_slug: string
          created_at?: string
          id?: string
          last_activity_at?: string
          progress_pct?: number
          started_at?: string
          total_seconds_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_slug?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          progress_pct?: number
          started_at?: string
          total_seconds_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_progress_events: {
        Row: {
          course_slug: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          embed_url: string | null
          excerpt: string | null
          external_detail_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          language: string
          level: string | null
          long_form_content: Json | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          subtitle: string | null
          tier: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          embed_url?: string | null
          excerpt?: string | null
          external_detail_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          language?: string
          level?: string | null
          long_form_content?: Json | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          subtitle?: string | null
          tier?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          embed_url?: string | null
          excerpt?: string | null
          external_detail_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          language?: string
          level?: string | null
          long_form_content?: Json | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          subtitle?: string | null
          tier?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_branding: {
        Row: {
          created_at: string
          footer_text: string | null
          id: number
          logo_url: string | null
          primary_color: string
          primary_text_color: string
          sender_name: string
          site_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          footer_text?: string | null
          id?: number
          logo_url?: string | null
          primary_color?: string
          primary_text_color?: string
          sender_name?: string
          site_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          footer_text?: string | null
          id?: number
          logo_url?: string | null
          primary_color?: string
          primary_text_color?: string
          sender_name?: string
          site_name?: string
          updated_at?: string
        }
        Relationships: []
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
      enriched_contacts: {
        Row: {
          cache_key: string
          cost_usd: number
          emails: Json
          expires_at: string
          fetched_at: string
          full_name: string | null
          id: string
          phones: Json
          property_address: string | null
          property_city: string | null
          property_state: string | null
          property_zip: string | null
          raw_response: Json | null
          social_profiles: Json
          source_tier: string
        }
        Insert: {
          cache_key: string
          cost_usd?: number
          emails?: Json
          expires_at?: string
          fetched_at?: string
          full_name?: string | null
          id?: string
          phones?: Json
          property_address?: string | null
          property_city?: string | null
          property_state?: string | null
          property_zip?: string | null
          raw_response?: Json | null
          social_profiles?: Json
          source_tier: string
        }
        Update: {
          cache_key?: string
          cost_usd?: number
          emails?: Json
          expires_at?: string
          fetched_at?: string
          full_name?: string | null
          id?: string
          phones?: Json
          property_address?: string | null
          property_city?: string | null
          property_state?: string | null
          property_zip?: string | null
          raw_response?: Json | null
          social_profiles?: Json
          source_tier?: string
        }
        Relationships: []
      }
      enrichment_spend_log: {
        Row: {
          cost_usd: number
          created_at: string
          id: string
          match_id: string | null
          outcome: string
          provider: string
          spend_date: string
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          id?: string
          match_id?: string | null
          outcome: string
          provider: string
          spend_date?: string
        }
        Update: {
          cost_usd?: number
          created_at?: string
          id?: string
          match_id?: string | null
          outcome?: string
          provider?: string
          spend_date?: string
        }
        Relationships: []
      }
      feature_requests: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          referrer_path: string | null
          region: string | null
          request_text: string
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          referrer_path?: string | null
          region?: string | null
          request_text: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          referrer_path?: string | null
          region?: string | null
          request_text?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      gsc_query_data: {
        Row: {
          captured_at: string
          clicks: number
          created_at: string
          ctr: number | null
          id: string
          impressions: number
          position: number | null
          query: string
          url_path: string
        }
        Insert: {
          captured_at?: string
          clicks?: number
          created_at?: string
          ctr?: number | null
          id?: string
          impressions?: number
          position?: number | null
          query: string
          url_path: string
        }
        Update: {
          captured_at?: string
          clicks?: number
          created_at?: string
          ctr?: number | null
          id?: string
          impressions?: number
          position?: number | null
          query?: string
          url_path?: string
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          category_slug: string
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_popular: boolean
          is_published: boolean
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category_slug: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_popular?: boolean
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category_slug?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_popular?: boolean
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          description: string | null
          hero_image_url: string | null
          icon: string | null
          id: string
          is_published: boolean
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      host_match_false_positives: {
        Row: {
          candidate_business_name: string | null
          candidate_email: string | null
          candidate_name: string | null
          candidate_phone: string | null
          candidate_source: string | null
          candidate_website: string | null
          competitor_url: string | null
          created_at: string
          domain: string | null
          host_city: string | null
          host_first_name: string | null
          host_state: string | null
          id: string
          match_confidence: number | null
          match_id: string | null
          reason: string | null
          reported_by: string | null
        }
        Insert: {
          candidate_business_name?: string | null
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          candidate_source?: string | null
          candidate_website?: string | null
          competitor_url?: string | null
          created_at?: string
          domain?: string | null
          host_city?: string | null
          host_first_name?: string | null
          host_state?: string | null
          id?: string
          match_confidence?: number | null
          match_id?: string | null
          reason?: string | null
          reported_by?: string | null
        }
        Update: {
          candidate_business_name?: string | null
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          candidate_source?: string | null
          candidate_website?: string | null
          competitor_url?: string | null
          created_at?: string
          domain?: string | null
          host_city?: string | null
          host_first_name?: string | null
          host_state?: string | null
          id?: string
          match_confidence?: number | null
          match_id?: string | null
          reason?: string | null
          reported_by?: string | null
        }
        Relationships: []
      }
      host_tools: {
        Row: {
          category: string
          created_at: string
          icon: string | null
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_link_suggestions: {
        Row: {
          anchor_text: string | null
          created_at: string
          from_url: string
          id: string
          reason: string | null
          score: number
          status: string
          to_url: string
          updated_at: string
        }
        Insert: {
          anchor_text?: string | null
          created_at?: string
          from_url: string
          id?: string
          reason?: string | null
          score?: number
          status?: string
          to_url: string
          updated_at?: string
        }
        Update: {
          anchor_text?: string | null
          created_at?: string
          from_url?: string
          id?: string
          reason?: string | null
          score?: number
          status?: string
          to_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      link_health_runs: {
        Row: {
          broken: Json
          broken_count: number
          checked: number
          duration_ms: number | null
          id: string
          ok: boolean
          origin: string | null
          ran_at: string
          source: string
        }
        Insert: {
          broken?: Json
          broken_count?: number
          checked?: number
          duration_ms?: number | null
          id?: string
          ok?: boolean
          origin?: string | null
          ran_at?: string
          source?: string
        }
        Update: {
          broken?: Json
          broken_count?: number
          checked?: number
          duration_ms?: number | null
          id?: string
          ok?: boolean
          origin?: string | null
          ran_at?: string
          source?: string
        }
        Relationships: []
      }
      listing_sync_log: {
        Row: {
          created_at: string
          error_message: string | null
          failed_count: number
          finished_at: string | null
          id: string
          inserted_count: number
          started_at: string
          status: string
          total_processed: number
          updated_count: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          inserted_count?: number
          started_at?: string
          status?: string
          total_processed?: number
          updated_count?: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          inserted_count?: number
          started_at?: string
          status?: string
          total_processed?: number
          updated_count?: number
        }
        Relationships: []
      }
      mb_likes: {
        Row: {
          created_at: string
          id: string
          reply_id: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reply_id?: string | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reply_id?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mb_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "mb_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mb_likes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "mb_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mb_replies: {
        Row: {
          author_name: string | null
          body: string
          created_at: string
          id: string
          like_count: number
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          like_count?: number
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          like_count?: number
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mb_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "mb_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mb_threads: {
        Row: {
          author_name: string | null
          body: string
          category: string | null
          created_at: string
          id: string
          is_pinned: boolean
          last_activity_at: string
          like_count: number
          reply_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          body: string
          category?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          last_activity_at?: string
          like_count?: number
          reply_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          last_activity_at?: string
          like_count?: number
          reply_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_audits: {
        Row: {
          audited_at: string
          id: string
          recommendations: Json
          score: number | null
          strengths: Json
          summary: string | null
          url_path: string
          weaknesses: Json
        }
        Insert: {
          audited_at?: string
          id?: string
          recommendations?: Json
          score?: number | null
          strengths?: Json
          summary?: string | null
          url_path: string
          weaknesses?: Json
        }
        Update: {
          audited_at?: string
          id?: string
          recommendations?: Json
          score?: number | null
          strengths?: Json
          summary?: string | null
          url_path?: string
          weaknesses?: Json
        }
        Relationships: []
      }
      pool_waitlist: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          latitude: number | null
          longitude: number | null
          nearest_miles: number | null
          region: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nearest_miles?: number | null
          region?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nearest_miles?: number | null
          region?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      privacy_requests: {
        Row: {
          created_at: string
          details: string | null
          email: string
          full_name: string | null
          gpc_signal: boolean | null
          id: string
          request_type: string
          source_url: string | null
          state_code: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          email: string
          full_name?: string | null
          gpc_signal?: boolean | null
          id?: string
          request_type: string
          source_url?: string | null
          state_code?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          email?: string
          full_name?: string | null
          gpc_signal?: boolean | null
          id?: string
          request_type?: string
          source_url?: string | null
          state_code?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_claims: {
        Row: {
          admin_notes: string | null
          business_email: string | null
          business_phone: string | null
          business_website: string | null
          claimer_email: string
          claimer_name: string
          claimer_phone: string | null
          claimer_role: string | null
          created_at: string
          id: string
          proposed_updates: Json
          provider_id: string
          provider_slug: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_path: string | null
          status: string
          updated_at: string
          user_agent: string | null
          verification_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_email?: string | null
          business_phone?: string | null
          business_website?: string | null
          claimer_email: string
          claimer_name: string
          claimer_phone?: string | null
          claimer_role?: string | null
          created_at?: string
          id?: string
          proposed_updates?: Json
          provider_id: string
          provider_slug: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_path?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          verification_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_email?: string | null
          business_phone?: string | null
          business_website?: string | null
          claimer_email?: string
          claimer_name?: string
          claimer_phone?: string | null
          claimer_role?: string | null
          created_at?: string
          id?: string
          proposed_updates?: Json
          provider_id?: string
          provider_slug?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_path?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_claims_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_leads: {
        Row: {
          city: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          source_path: string | null
          source_provider_slug: string | null
          state_code: string | null
          status: string
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source_path?: string | null
          source_provider_slug?: string | null
          state_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source_path?: string | null
          source_provider_slug?: string | null
          state_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      provider_plan_requests: {
        Row: {
          admin_notes: string | null
          amount_usd: number | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          provider_id: string
          provider_slug: string
          requested_plan: string
          requester_email: string
          requester_name: string
          requester_phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_path: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount_usd?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          provider_id: string
          provider_slug: string
          requested_plan: string
          requester_email: string
          requester_name: string
          requester_phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_path?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount_usd?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          provider_id?: string
          provider_slug?: string
          requested_plan?: string
          requester_email?: string
          requester_name?: string
          requester_phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_path?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_scrape_jobs: {
        Row: {
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          provider_id: string | null
          raw: Json | null
          source_type: string | null
          source_url: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          provider_id?: string | null
          raw?: Json | null
          source_type?: string | null
          source_url: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          provider_id?: string | null
          raw?: Json | null
          source_type?: string | null
          source_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_scrape_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          ai_content_generated_at: string | null
          ai_enriched_at: string | null
          business_type: string | null
          city: string | null
          city_slug: string | null
          claim_status: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          description: string | null
          email: string | null
          faq: Json
          featured_until: string | null
          gallery_urls: string[]
          google_category: string | null
          google_cid: string | null
          gsc_clicks: number
          gsc_impressions: number
          gsc_position: number | null
          gsc_updated_at: string | null
          hero_image_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          latitude: number | null
          listing_paid_until: string | null
          logo_url: string | null
          long_description: string | null
          longitude: number | null
          name: string
          phone: string | null
          plan: string
          primary_category: string | null
          rating: number | null
          rating_count: number | null
          scraped_at: string | null
          secondary_categories: string[]
          seo_description: string | null
          seo_title: string | null
          services: string[] | null
          slug: string
          source_type: string | null
          source_url: string | null
          state_code: string | null
          submission_notes: string | null
          submission_status: string
          submitter_email: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          ai_content_generated_at?: string | null
          ai_enriched_at?: string | null
          business_type?: string | null
          city?: string | null
          city_slug?: string | null
          claim_status?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          faq?: Json
          featured_until?: string | null
          gallery_urls?: string[]
          google_category?: string | null
          google_cid?: string | null
          gsc_clicks?: number
          gsc_impressions?: number
          gsc_position?: number | null
          gsc_updated_at?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          latitude?: number | null
          listing_paid_until?: string | null
          logo_url?: string | null
          long_description?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          plan?: string
          primary_category?: string | null
          rating?: number | null
          rating_count?: number | null
          scraped_at?: string | null
          secondary_categories?: string[]
          seo_description?: string | null
          seo_title?: string | null
          services?: string[] | null
          slug: string
          source_type?: string | null
          source_url?: string | null
          state_code?: string | null
          submission_notes?: string | null
          submission_status?: string
          submitter_email?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          ai_content_generated_at?: string | null
          ai_enriched_at?: string | null
          business_type?: string | null
          city?: string | null
          city_slug?: string | null
          claim_status?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          faq?: Json
          featured_until?: string | null
          gallery_urls?: string[]
          google_category?: string | null
          google_cid?: string | null
          gsc_clicks?: number
          gsc_impressions?: number
          gsc_position?: number | null
          gsc_updated_at?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          latitude?: number | null
          listing_paid_until?: string | null
          logo_url?: string | null
          long_description?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          plan?: string
          primary_category?: string | null
          rating?: number | null
          rating_count?: number | null
          scraped_at?: string | null
          secondary_categories?: string[]
          seo_description?: string | null
          seo_title?: string | null
          services?: string[] | null
          slug?: string
          source_type?: string | null
          source_url?: string | null
          state_code?: string | null
          submission_notes?: string | null
          submission_status?: string
          submitter_email?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_primary_category_fkey"
            columns: ["primary_category"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      redirect_log: {
        Row: {
          from_slug: string
          id: string
          redirected_at: string
          referrer: string | null
          to_slug: string
          user_agent: string | null
        }
        Insert: {
          from_slug: string
          id?: string
          redirected_at?: string
          referrer?: string | null
          to_slug: string
          user_agent?: string | null
        }
        Update: {
          from_slug?: string
          id?: string
          redirected_at?: string
          referrer?: string | null
          to_slug?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      seo_fix_jobs: {
        Row: {
          attempts: number
          batch_id: string | null
          created_at: string
          enqueued_by: string | null
          error: string | null
          finished_at: string | null
          id: string
          max_attempts: number
          mode: string
          page_id: string
          result: Json | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          batch_id?: string | null
          created_at?: string
          enqueued_by?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          max_attempts?: number
          mode: string
          page_id: string
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          batch_id?: string | null
          created_at?: string
          enqueued_by?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          max_attempts?: number
          mode?: string
          page_id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_overrides: {
        Row: {
          canonical_url: string | null
          created_at: string
          description: string | null
          id: string
          noindex: boolean
          notes: string | null
          og_image_url: string | null
          title: string | null
          updated_at: string
          url_path: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          noindex?: boolean
          notes?: string | null
          og_image_url?: string | null
          title?: string | null
          updated_at?: string
          url_path: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          noindex?: boolean
          notes?: string | null
          og_image_url?: string | null
          title?: string | null
          updated_at?: string
          url_path?: string
        }
        Relationships: []
      }
      serp_rankings: {
        Row: {
          checked_at: string
          id: string
          keyword_id: string
          position: number | null
          url_found: string | null
        }
        Insert: {
          checked_at?: string
          id?: string
          keyword_id: string
          position?: number | null
          url_found?: string | null
        }
        Update: {
          checked_at?: string
          id?: string
          keyword_id?: string
          position?: number | null
          url_found?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serp_rankings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "tracked_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          hero_image_url: string | null
          icon: string | null
          id: string
          intro_markdown: string | null
          is_published: boolean
          name: string
          plural_name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          intro_markdown?: string | null
          is_published?: boolean
          name: string
          plural_name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          intro_markdown?: string | null
          is_published?: boolean
          name?: string
          plural_name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_footer_settings: {
        Row: {
          bottom_text: string | null
          company_links: Json
          contact_email: string | null
          contact_phone: string | null
          contact_phone_hours: string | null
          contact_phone_label: string | null
          explore_links: Json
          host_links: Json
          id: number
          popular_markets: Json
          socials: Json
          updated_at: string
        }
        Insert: {
          bottom_text?: string | null
          company_links?: Json
          contact_email?: string | null
          contact_phone?: string | null
          contact_phone_hours?: string | null
          contact_phone_label?: string | null
          explore_links?: Json
          host_links?: Json
          id?: number
          popular_markets?: Json
          socials?: Json
          updated_at?: string
        }
        Update: {
          bottom_text?: string | null
          company_links?: Json
          contact_email?: string | null
          contact_phone?: string | null
          contact_phone_hours?: string | null
          contact_phone_label?: string | null
          explore_links?: Json
          host_links?: Json
          id?: number
          popular_markets?: Json
          socials?: Json
          updated_at?: string
        }
        Relationships: []
      }
      state_pool_regulations: {
        Row: {
          authority_name: string | null
          authority_url: string | null
          compliance_steps: Json
          created_at: string
          enforcement_notes: string | null
          faqs: Json
          id: string
          last_verified_at: string | null
          legality_status: string
          permit_fee_max_usd: number | null
          permit_fee_min_usd: number | null
          permit_name: string | null
          source_urls: string[]
          state_code: string
          state_name: string
          summary: string | null
          updated_at: string
          zoning_summary: string | null
        }
        Insert: {
          authority_name?: string | null
          authority_url?: string | null
          compliance_steps?: Json
          created_at?: string
          enforcement_notes?: string | null
          faqs?: Json
          id?: string
          last_verified_at?: string | null
          legality_status?: string
          permit_fee_max_usd?: number | null
          permit_fee_min_usd?: number | null
          permit_name?: string | null
          source_urls?: string[]
          state_code: string
          state_name: string
          summary?: string | null
          updated_at?: string
          zoning_summary?: string | null
        }
        Update: {
          authority_name?: string | null
          authority_url?: string | null
          compliance_steps?: Json
          created_at?: string
          enforcement_notes?: string | null
          faqs?: Json
          id?: string
          last_verified_at?: string | null
          legality_status?: string
          permit_fee_max_usd?: number | null
          permit_fee_min_usd?: number | null
          permit_name?: string | null
          source_urls?: string[]
          state_code?: string
          state_name?: string
          summary?: string | null
          updated_at?: string
          zoning_summary?: string | null
        }
        Relationships: []
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
      synced_listings: {
        Row: {
          address: string | null
          amenities: string[]
          author_id: string | null
          capacity: number | null
          category: string | null
          city: string | null
          city_slug: string | null
          created_at: string
          description: string | null
          id: string
          image_urls: string[]
          is_deleted: boolean
          last_synced_at: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          price_amount: number | null
          price_currency: string | null
          primary_image_url: string | null
          public_data: Json
          sharetribe_id: string
          slug: string
          st_created_at: string | null
          state: string
          state_code: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          author_id?: string | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          city_slug?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_deleted?: boolean
          last_synced_at?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          price_amount?: number | null
          price_currency?: string | null
          primary_image_url?: string | null
          public_data?: Json
          sharetribe_id: string
          slug: string
          st_created_at?: string | null
          state?: string
          state_code?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[]
          author_id?: string | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          city_slug?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_deleted?: boolean
          last_synced_at?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          price_amount?: number | null
          price_currency?: string | null
          primary_image_url?: string | null
          public_data?: Json
          sharetribe_id?: string
          slug?: string
          st_created_at?: string | null
          state?: string
          state_code?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracked_keywords: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          keyword: string
          last_checked_at: string | null
          last_position: number | null
          market: string
          previous_position: number | null
          target_url_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          keyword: string
          last_checked_at?: string | null
          last_position?: number | null
          market?: string
          previous_position?: number | null
          target_url_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string
          last_checked_at?: string | null
          last_position?: number | null
          market?: string
          previous_position?: number | null
          target_url_path?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      page_quality: {
        Row: {
          body_markdown: string | null
          created_at: string | null
          id: string | null
          missing_meta: boolean | null
          missing_schema: boolean | null
          no_internal_links: boolean | null
          quality: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          status: string | null
          template_type: string | null
          title: string | null
          title_is_slug: boolean | null
          updated_at: string | null
          url_path: string | null
          word_count: number | null
        }
        Insert: {
          body_markdown?: string | null
          created_at?: string | null
          id?: string | null
          missing_meta?: never
          missing_schema?: never
          no_internal_links?: never
          quality?: never
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          template_type?: string | null
          title?: string | null
          title_is_slug?: never
          updated_at?: string | null
          url_path?: string | null
          word_count?: never
        }
        Update: {
          body_markdown?: string | null
          created_at?: string | null
          id?: string | null
          missing_meta?: never
          missing_schema?: never
          no_internal_links?: never
          quality?: never
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          template_type?: string | null
          title?: string | null
          title_is_slug?: never
          updated_at?: string | null
          url_path?: string | null
          word_count?: never
        }
        Relationships: []
      }
      site_issues: {
        Row: {
          empty_published_total: number | null
          missing_meta_published: number | null
          missing_schema_published: number | null
          no_links_published: number | null
          thin_published_total: number | null
          title_is_slug_published: number | null
        }
        Relationships: []
      }
      template_quality_breakdown: {
        Row: {
          avg_words_published: number | null
          oldest_pending: string | null
          pending: number | null
          published: number | null
          published_empty: number | null
          published_healthy: number | null
          published_last_7d: number | null
          published_medium: number | null
          published_missing_body: number | null
          published_thin: number | null
          template_type: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_providers_by_category: {
        Args: never
        Returns: {
          n: number
          primary_category: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_certificate_uid: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
      nearby_cities_by_distance: {
        Args: { _limit?: number; _slug: string }
        Returns: {
          out_distance_km: number
          out_name: string
          out_slug: string
          out_state: string
          out_state_code: string
        }[]
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      verify_certificate: {
        Args: { _uid: string }
        Returns: {
          certificate_uid: string
          completed_at: string
          course_slug: string
          course_title: string
          learner_name: string
          revoke_reason: string
          revoked_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
