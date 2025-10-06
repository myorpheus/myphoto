// Script to promote all current users to super_admin role
// Run with: node promote-users.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://imzlzufdujhcbebibgpj.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function promoteAllUsersToSuperAdmin() {
  try {
    console.log('🚀 Starting promotion of all users to super_admin role...')
    
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`📊 Found ${users.users.length} users to promote`)
    
    let promotedCount = 0
    
    for (const user of users.users) {
      try {
        // Remove existing role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
        
        // Add super_admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'super_admin'
          })
        
        if (roleError) {
          console.error(`❌ Error promoting user ${user.email}:`, roleError)
        } else {
          console.log(`✅ Promoted ${user.email} to super_admin`)
          promotedCount++
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error)
      }
    }
    
    console.log(`🎉 Successfully promoted ${promotedCount}/${users.users.length} users to super_admin`)
    
    // Verify the changes
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role,
        user_id,
        created_at
      `)
      .eq('role', 'super_admin')
    
    if (rolesError) {
      console.error('❌ Error verifying roles:', rolesError)
    } else {
      console.log(`✅ Verified: ${roles.length} users now have super_admin role`)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the promotion
promoteAllUsersToSuperAdmin()