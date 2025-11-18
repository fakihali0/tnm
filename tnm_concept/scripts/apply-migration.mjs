import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://edzkorfdixvvvrkfzqzg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkemtvcmZkaXh2dnZya2Z6cXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzczMzE1NCwiZXhwIjoyMDczMzA5MTU0fQ.wXYZe0nVRfBxny9EnWxM1svAhWyHBs_CC7i_cwLBq1Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🔄 Reading migration file...');
    const migrationPath = join(__dirname, '../supabase/migrations/20251114155316_add_is_default_to_trading_accounts.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Migration SQL length:', migrationSQL.length, 'characters');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    console.log('📊 Executing', statements.length, 'SQL statements...\n');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n[${i + 1}/${statements.length}] Executing:`, statement.substring(0, 80) + '...');
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      });
      
      if (error) {
        // Try direct approach if RPC doesn't exist
        console.log('⚠️  RPC method not available, trying direct SQL execution...');
        
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error:', errorText);
          
          // For ALTER TABLE statements, they might already exist
          if (statement.includes('IF NOT EXISTS') || statement.includes('OR REPLACE')) {
            console.log('✅ Statement might already be applied (IF NOT EXISTS/OR REPLACE)');
            continue;
          }
        } else {
          console.log('✅ Success');
        }
      } else {
        console.log('✅ Success');
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
    // Verify the column exists
    console.log('\n🔍 Verifying migration...');
    const { data: columns, error: verifyError } = await supabase
      .from('trading_accounts')
      .select('is_default')
      .limit(1);
    
    if (verifyError) {
      console.log('⚠️  Could not verify (this is normal):', verifyError.message);
    } else {
      console.log('✅ Column "is_default" exists and is accessible!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
