import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCorsHeaders, sanitizeError } from '../_shared/cors.ts';

interface MetaAPITrade {
  id: string;
  type: 'DEAL_TYPE_BUY' | 'DEAL_TYPE_SELL';
  symbol: string;
  volume: number;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: string;
  closeTime?: string;
  profit?: number;
  commission: number;
  swap: number;
  comment?: string;
}

interface MetaAPIAccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('⚠️ MetaAPI Integration Disabled: sync-trading-data function called but integration is disabled');

    // Return success with info message - this prevents frontend errors
    return new Response(JSON.stringify({
      success: true,
      message: 'Trading data sync is temporarily unavailable. New integration coming soon.',
      syncResults: [],
      totalAccounts: 0,
      integration_disabled: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-trading-data (disabled):', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Trading data sync is temporarily unavailable',
      integration_disabled: true
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to group deals into trades
function groupDealsIntoTrades(deals: MetaAPITrade[]): MetaAPITrade[] {
  // For simplicity, treating each deal as a separate trade
  // In a more sophisticated implementation, you would group
  // related deals (entry/exit) into single trade records
  return deals.map(deal => ({
    ...deal,
    openPrice: deal.openPrice,
    closePrice: deal.closePrice,
    openTime: deal.openTime,
    closeTime: deal.closeTime
  }));
}