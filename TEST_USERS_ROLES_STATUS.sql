-- =============================================================================
-- CHECK CURRENT STATUS OF USERS AGAINST ROLES
-- =============================================================================
-- Simple query to verify user-role assignments and current status

SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
  p.is_active as active,
  p.status,
  c.name as company,
  p.last_login,
  DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
  DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_active = 1
ORDER BY p.role, p.email;
