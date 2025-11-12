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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_integrations: {
        Row: {
          account_id: string
          created_at: string
          credentials: Json | null
          encrypted_credentials: string | null
          encryption_key_id: string | null
          external_account_id: string
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credentials?: Json | null
          encrypted_credentials?: string | null
          encryption_key_id?: string | null
          external_account_id: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          provider: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credentials?: Json | null
          encrypted_credentials?: string | null
          encryption_key_id?: string | null
          external_account_id?: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          account_id: string
          actionable: boolean | null
          created_at: string
          description: string
          expires_at: string | null
          generated_at: string
          id: string
          impact_level: string
          insight_type: string
          recommendation: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          actionable?: boolean | null
          created_at?: string
          description: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          impact_level: string
          insight_type: string
          recommendation?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          actionable?: boolean | null
          created_at?: string
          description?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          impact_level?: string
          insight_type?: string
          recommendation?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_risk_recommendations: {
        Row: {
          account_id: string
          confidence_score: number | null
          created_at: string
          expires_at: string | null
          generated_at: string
          id: string
          recommendations: Json
          recommended_lot_size: number | null
          recommended_risk_percent: number | null
          risk_level: string | null
          symbol: string
          warnings: Json
        }
        Insert: {
          account_id: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          recommendations?: Json
          recommended_lot_size?: number | null
          recommended_risk_percent?: number | null
          risk_level?: string | null
          symbol: string
          warnings?: Json
        }
        Update: {
          account_id?: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          recommendations?: Json
          recommended_lot_size?: number | null
          recommended_risk_percent?: number | null
          risk_level?: string | null
          symbol?: string
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_risk_recommendations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_trading_analysis: {
        Row: {
          account_id: string | null
          ai_response: Json
          analysis_type: string
          confidence_score: number | null
          created_at: string
          expires_at: string | null
          id: string
          request_data: Json
          symbol: string | null
          tags: string[] | null
          timeframe: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          ai_response?: Json
          analysis_type: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          request_data?: Json
          symbol?: string | null
          tags?: string[] | null
          timeframe?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          ai_response?: Json
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          request_data?: Json
          symbol?: string | null
          tags?: string[] | null
          timeframe?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_trading_analysis_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          ip_address: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          ip_address: string | null
          last_name: string
          message: string
          phone: string | null
          subject: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          ip_address?: string | null
          last_name: string
          message: string
          phone?: string | null
          subject: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          ip_address?: string | null
          last_name?: string
          message?: string
          phone?: string | null
          subject?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      credential_access_log: {
        Row: {
          account_id: string
          action: string
          created_at: string
          id: string
          ip_address: string | null
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_access_log_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_summaries: {
        Row: {
          account_id: string
          avg_loss: number | null
          avg_risk_reward: number | null
          avg_win: number | null
          created_at: string
          gross_loss: number | null
          gross_profit: number | null
          id: string
          largest_loss: number | null
          largest_win: number | null
          losing_trades: number | null
          max_consecutive_losses: number | null
          max_consecutive_wins: number | null
          net_pnl: number | null
          period_end: string
          period_start: string
          profit_factor: number | null
          total_trades: number | null
          updated_at: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          account_id: string
          avg_loss?: number | null
          avg_risk_reward?: number | null
          avg_win?: number | null
          created_at?: string
          gross_loss?: number | null
          gross_profit?: number | null
          id?: string
          largest_loss?: number | null
          largest_win?: number | null
          losing_trades?: number | null
          max_consecutive_losses?: number | null
          max_consecutive_wins?: number | null
          net_pnl?: number | null
          period_end: string
          period_start: string
          profit_factor?: number | null
          total_trades?: number | null
          updated_at?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          account_id?: string
          avg_loss?: number | null
          avg_risk_reward?: number | null
          avg_win?: number | null
          created_at?: string
          gross_loss?: number | null
          gross_profit?: number | null
          id?: string
          largest_loss?: number | null
          largest_win?: number | null
          losing_trades?: number | null
          max_consecutive_losses?: number | null
          max_consecutive_wins?: number | null
          net_pnl?: number | null
          period_end?: string
          period_start?: string
          profit_factor?: number | null
          total_trades?: number | null
          updated_at?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_summaries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      market_context: {
        Row: {
          calculated_at: string
          created_at: string
          id: string
          key_levels: Json | null
          market_sentiment: string | null
          news_sentiment: string | null
          resistance_level: number | null
          support_level: number | null
          symbol: string
          trading_session: string | null
          trend_direction: string | null
          trend_strength: number | null
          volatility_level: string | null
          volume_profile: string | null
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          id?: string
          key_levels?: Json | null
          market_sentiment?: string | null
          news_sentiment?: string | null
          resistance_level?: number | null
          support_level?: number | null
          symbol: string
          trading_session?: string | null
          trend_direction?: string | null
          trend_strength?: number | null
          volatility_level?: string | null
          volume_profile?: string | null
        }
        Update: {
          calculated_at?: string
          created_at?: string
          id?: string
          key_levels?: Json | null
          market_sentiment?: string | null
          news_sentiment?: string | null
          resistance_level?: number | null
          support_level?: number | null
          symbol?: string
          trading_session?: string | null
          trend_direction?: string | null
          trend_strength?: number | null
          volatility_level?: string | null
          volume_profile?: string | null
        }
        Relationships: []
      }
      market_data: {
        Row: {
          ask: number | null
          bid: number | null
          change: number | null
          change_percent: number | null
          created_at: string
          high_24h: number | null
          id: string
          low_24h: number | null
          price: number
          source: string
          spread: number | null
          symbol: string
          updated_at: string
          volume: number | null
        }
        Insert: {
          ask?: number | null
          bid?: number | null
          change?: number | null
          change_percent?: number | null
          created_at?: string
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          price: number
          source: string
          spread?: number | null
          symbol: string
          updated_at?: string
          volume?: number | null
        }
        Update: {
          ask?: number | null
          bid?: number | null
          change?: number | null
          change_percent?: number | null
          created_at?: string
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          price?: number
          source?: string
          spread?: number | null
          symbol?: string
          updated_at?: string
          volume?: number | null
        }
        Relationships: []
      }
      market_insights: {
        Row: {
          confidence: number
          created_at: string
          description: string
          generated_at: string
          id: string
          impact: string
          symbol: string
          timeframe: string
          title: string
          type: string
        }
        Insert: {
          confidence: number
          created_at?: string
          description: string
          generated_at: string
          id?: string
          impact: string
          symbol: string
          timeframe: string
          title: string
          type: string
        }
        Update: {
          confidence?: number
          created_at?: string
          description?: string
          generated_at?: string
          id?: string
          impact?: string
          symbol?: string
          timeframe?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          company: string | null
          country: string | null
          created_at: string
          email: string
          experience: string | null
          first_name: string
          goals: string | null
          id: string
          ip_address: string | null
          last_name: string
          partner_type: string
          phone: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          experience?: string | null
          first_name: string
          goals?: string | null
          id?: string
          ip_address?: string | null
          last_name: string
          partner_type: string
          phone?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          experience?: string | null
          first_name?: string
          goals?: string | null
          id?: string
          ip_address?: string | null
          last_name?: string
          partner_type?: string
          phone?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          country_code: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          mobile_number: string | null
          phone_verified: boolean | null
          preferred_language: string | null
          terms_accepted_at: string | null
          timezone: string | null
          trading_experience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          mobile_number?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          terms_accepted_at?: string | null
          timezone?: string | null
          trading_experience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          mobile_number?: string | null
          phone_verified?: boolean | null
          preferred_language?: string | null
          terms_accepted_at?: string | null
          timezone?: string | null
          trading_experience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_alerts: {
        Row: {
          account_id: string
          action_required: boolean | null
          alert_type: string
          created_at: string
          current_value: number | null
          id: string
          message: string
          resolved_at: string | null
          severity: string
          threshold_value: number | null
          title: string
          triggered_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          action_required?: boolean | null
          alert_type: string
          created_at?: string
          current_value?: number | null
          id?: string
          message: string
          resolved_at?: string | null
          severity: string
          threshold_value?: number | null
          title: string
          triggered_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          action_required?: boolean | null
          alert_type?: string
          created_at?: string
          current_value?: number | null
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: string
          threshold_value?: number | null
          title?: string
          triggered_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_alerts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      technical_indicators: {
        Row: {
          atr: number | null
          bb_lower: number | null
          bb_middle: number | null
          bb_upper: number | null
          calculated_at: string
          created_at: string
          ema_20: number | null
          ema_200: number | null
          ema_50: number | null
          id: string
          macd: number | null
          macd_histogram: number | null
          macd_signal: number | null
          rsi: number | null
          sma_20: number | null
          sma_200: number | null
          sma_50: number | null
          symbol: string
          timeframe: string
          volume_sma: number | null
        }
        Insert: {
          atr?: number | null
          bb_lower?: number | null
          bb_middle?: number | null
          bb_upper?: number | null
          calculated_at?: string
          created_at?: string
          ema_20?: number | null
          ema_200?: number | null
          ema_50?: number | null
          id?: string
          macd?: number | null
          macd_histogram?: number | null
          macd_signal?: number | null
          rsi?: number | null
          sma_20?: number | null
          sma_200?: number | null
          sma_50?: number | null
          symbol: string
          timeframe?: string
          volume_sma?: number | null
        }
        Update: {
          atr?: number | null
          bb_lower?: number | null
          bb_middle?: number | null
          bb_upper?: number | null
          calculated_at?: string
          created_at?: string
          ema_20?: number | null
          ema_200?: number | null
          ema_50?: number | null
          id?: string
          macd?: number | null
          macd_histogram?: number | null
          macd_signal?: number | null
          rsi?: number | null
          sma_20?: number | null
          sma_200?: number | null
          sma_50?: number | null
          symbol?: string
          timeframe?: string
          volume_sma?: number | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          account_id: string
          closed_at: string | null
          commission: number | null
          created_at: string
          direction: string
          entry_price: number
          exit_price: number | null
          external_trade_id: string | null
          id: string
          notes: string | null
          opened_at: string
          pnl: number | null
          risk_reward_ratio: number | null
          screenshot_url: string | null
          session: string | null
          stop_loss: number | null
          strategy: string | null
          swap: number | null
          symbol: string
          tags: string[] | null
          take_profit: number | null
          trade_status: string | null
          updated_at: string
          volume: number
        }
        Insert: {
          account_id: string
          closed_at?: string | null
          commission?: number | null
          created_at?: string
          direction: string
          entry_price: number
          exit_price?: number | null
          external_trade_id?: string | null
          id?: string
          notes?: string | null
          opened_at: string
          pnl?: number | null
          risk_reward_ratio?: number | null
          screenshot_url?: string | null
          session?: string | null
          stop_loss?: number | null
          strategy?: string | null
          swap?: number | null
          symbol: string
          tags?: string[] | null
          take_profit?: number | null
          trade_status?: string | null
          updated_at?: string
          volume: number
        }
        Update: {
          account_id?: string
          closed_at?: string | null
          commission?: number | null
          created_at?: string
          direction?: string
          entry_price?: number
          exit_price?: number | null
          external_trade_id?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          pnl?: number | null
          risk_reward_ratio?: number | null
          screenshot_url?: string | null
          session?: string | null
          stop_loss?: number | null
          strategy?: string | null
          swap?: number | null
          symbol?: string
          tags?: string[] | null
          take_profit?: number | null
          trade_status?: string | null
          updated_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          account_name: string | null
          ai_analysis_enabled: boolean | null
          balance: number | null
          broker_name: string
          connection_status: string | null
          created_at: string
          currency: string | null
          equity: number | null
          free_margin: number | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          leverage: number | null
          login_number: string
          margin: number | null
          margin_level: number | null
          platform: string
          server: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          ai_analysis_enabled?: boolean | null
          balance?: number | null
          broker_name: string
          connection_status?: string | null
          created_at?: string
          currency?: string | null
          equity?: number | null
          free_margin?: number | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          leverage?: number | null
          login_number: string
          margin?: number | null
          margin_level?: number | null
          platform: string
          server: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          ai_analysis_enabled?: boolean | null
          balance?: number | null
          broker_name?: string
          connection_status?: string | null
          created_at?: string
          currency?: string | null
          equity?: number | null
          free_margin?: number | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          leverage?: number | null
          login_number?: string
          margin?: number | null
          margin_level?: number | null
          platform?: string
          server?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trading_strategies: {
        Row: {
          avg_risk_reward: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          profit_factor: number | null
          rules: Json | null
          total_trades: number | null
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          avg_risk_reward?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          profit_factor?: number | null
          rules?: Json | null
          total_trades?: number | null
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          avg_risk_reward?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          profit_factor?: number | null
          rules?: Json | null
          total_trades?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      cleanup_old_ai_analyses: { Args: never; Returns: undefined }
      cleanup_old_contact_submissions: { Args: never; Returns: undefined }
      cleanup_old_market_data: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_risk_recommendations: { Args: never; Returns: undefined }
      cleanup_old_security_data: { Args: never; Returns: undefined }
      cleanup_old_technical_indicators: { Args: never; Returns: undefined }
      get_latest_price: {
        Args: { _symbol: string }
        Returns: {
          age_minutes: number
          ask: number
          bid: number
          change: number
          change_percent: number
          price: number
          source: string
          spread: number
          symbol: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      log_admin_access: {
        Args: { _action: string; _resource: string; _user_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          _details?: Json
          _event_type: string
          _ip?: string
          _user_agent?: string
        }
        Returns: undefined
      }
      upsert_market_data: {
        Args: {
          _ask?: number
          _bid?: number
          _change?: number
          _change_percent?: number
          _high_24h?: number
          _low_24h?: number
          _price: number
          _source?: string
          _spread?: number
          _symbol: string
          _volume?: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
