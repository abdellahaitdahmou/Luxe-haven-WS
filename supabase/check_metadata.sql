
SELECT 
    p.id, 
    p.email, 
    p.full_name as profile_full_name, 
    u.raw_user_meta_data 
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email LIKE 'abdellah505ait%';
