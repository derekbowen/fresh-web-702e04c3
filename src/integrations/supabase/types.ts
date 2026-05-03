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
          city: string | null
          created_at: string
          generated_at: string | null
          generated_page_slug: string | null
          h1: string | null
          id: string
          internal_links: string | null
          last_error: string | null
          meta_description: string | null
          meta_title: string | null
          notes: string | null
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
          warm_climate: boolean | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          generated_at?: string | null
          generated_page_slug?: string | null
          h1?: string | null
          id?: string
          internal_links?: string | null
          last_error?: string | null
          meta_description?: string | null
          meta_title?: string | null
          notes?: string | null
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
          warm_climate?: boolean | null
        }
        Update: {
          city?: string | null
          created_at?: string
          generated_at?: string | null
          generated_page_slug?: string | null
          h1?: string | null
          id?: string
          internal_links?: string | null
          last_error?: string | null
          meta_description?: string | null
          meta_title?: string | null
          notes?: string | null
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
      providers: {
        Row: {
          address: string | null
          ai_enriched_at: string | null
          business_type: string | null
          city: string | null
          city_slug: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          description: string | null
          email: string | null
          google_category: string | null
          google_cid: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          rating: number | null
          rating_count: number | null
          seo_description: string | null
          seo_title: string | null
          services: string[] | null
          slug: string
          state_code: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          ai_enriched_at?: string | null
          business_type?: string | null
          city?: string | null
          city_slug?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          google_category?: string | null
          google_cid?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          rating_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          services?: string[] | null
          slug: string
          state_code?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          ai_enriched_at?: string | null
          business_type?: string | null
          city?: string | null
          city_slug?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          google_category?: string | null
          google_cid?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          rating_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          services?: string[] | null
          slug?: string
          state_code?: string | null
          updated_at?: string
          website_url?: string | null
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
      [_ in never]: never
    }
    Functions: {
      generate_certificate_uid: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
