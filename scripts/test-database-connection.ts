import { createClient } from '@/utils/supabase/server'

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  
  try {
    const supabase = await createClient()
    
    // Test 1: Basic connection
    console.log('1. Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Basic connection failed:', testError)
      return
    }
    console.log('✅ Basic connection successful')
    
    // Test 2: Check if subscriptions table exists
    console.log('2. Testing subscriptions table...')
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1)
    
    if (subError) {
      console.error('❌ Subscriptions table error:', subError)
    } else {
      console.log('✅ Subscriptions table accessible')
    }
    
    // Test 3: Test has_active_access function
    console.log('3. Testing has_active_access function...')
    const { data: funcData, error: funcError } = await supabase
      .rpc('has_active_access', { user_id: '00000000-0000-0000-0000-000000000000' })
    
    if (funcError) {
      console.error('❌ has_active_access function error:', funcError)
    } else {
      console.log('✅ has_active_access function working')
    }
    
    // Test 4: Test training_programs table insert
    console.log('4. Testing training_programs table insert...')
    const { data: insertData, error: insertError } = await supabase
      .from('training_programs')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        generation_status: 'pending',
        program_details: {},
        onboarding_data_snapshot: {}
      })
      .select('id')
      .single()
    
    if (insertError) {
      console.error('❌ Training programs insert error:', insertError)
    } else {
      console.log('✅ Training programs insert successful')
      
      // Clean up test data
      await supabase
        .from('training_programs')
        .delete()
        .eq('id', insertData.id)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testDatabaseConnection() 