-- Promote all current users to super_admin role
-- Migration: $(date +%Y%m%d%H%M%S)_promote_all_users_to_super_admin.sql

-- Update all existing users to super_admin role
DO $$
DECLARE
    user_record RECORD;
    user_count INTEGER;
    promoted_count INTEGER := 0;
BEGIN
    -- Get count of users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Log the operation
    RAISE NOTICE 'Starting promotion of % users to super_admin role', user_count;
    
    -- Update all existing users to super_admin role
    FOR user_record IN 
        SELECT id, email FROM auth.users
        WHERE id NOT IN (
            SELECT user_id FROM user_roles WHERE role = 'super_admin'
        )
    LOOP
        -- Insert super_admin role for this user
        INSERT INTO user_roles (user_id, role)
        VALUES (user_record.id, 'super_admin')
        ON CONFLICT (user_id, role) 
        DO NOTHING;
        
        -- Remove any existing non-admin roles for these users
        DELETE FROM user_roles 
        WHERE user_id = user_record.id 
        AND role IN ('user', 'creator', 'admin');
        
        promoted_count := promoted_count + 1;
        RAISE NOTICE 'Promoted user % (%) to super_admin', user_record.email, user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Successfully promoted % users to super_admin role', promoted_count;
END $$;