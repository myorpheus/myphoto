-- Promote all current users to super_admin role
-- This will update all existing users to have super_admin privileges

DO $$
DECLARE
    user_record RECORD;
    user_count INTEGER;
BEGIN
    -- Get count of users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Log the operation
    RAISE NOTICE 'Promoting % users to super_admin role', user_count;
    
    -- Update all existing users to super_admin role
    FOR user_record IN 
        SELECT id FROM auth.users
    LOOP
        -- Insert or update user role to super_admin
        INSERT INTO user_roles (user_id, role)
        VALUES (user_record.id, 'super_admin')
        ON CONFLICT (user_id, role) 
        DO NOTHING;
        
        -- Remove any existing 'user' role for these users
        DELETE FROM user_roles 
        WHERE user_id = user_record.id 
        AND role = 'user';
        
        RAISE NOTICE 'Promoted user % to super_admin', user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Successfully promoted all % users to super_admin role', user_count;
END $$;

-- Verify the changes
SELECT 
    u.email,
    ur.role,
    ur.created_at as role_assigned_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at;