-- Chat maintenance: consolidate teamchat_users.id to users.id per company and fix read_at
BEGIN;

-- Build mappings of old teamchat_users.id to new users.id, per company via company_users (persist for session)
CREATE TEMP TABLE tmp_teamchat_mappings AS
SELECT
  t.id AS old_id,
  u.id AS new_id,
  t.company_id,
  t.email AS old_email,
  u.email AS user_email,
  t.first_name,
  t.last_name,
  t.display_name,
  t.avatar_url,
  t.status
FROM teamchat_users t
INNER JOIN users u ON lower(u.email) = lower(t.email)
INNER JOIN company_users cu ON cu.user_id = u.id
WHERE t.company_id = cu.company_id
  AND t.id <> u.id;
-- 1) Temporarily change email on old rows to free unique constraint
UPDATE teamchat_users t
SET email = CONCAT(t.email, '.old-', SUBSTRING(t.id::text, 1, 8))
WHERE EXISTS (
  SELECT 1 FROM tmp_teamchat_mappings m WHERE m.old_id = t.id
);

-- 2) Insert new teamchat_users rows with users.id and original email
INSERT INTO teamchat_users (id, first_name, last_name, display_name, email, avatar_url, company_id, status)
SELECT m.new_id, m.first_name, m.last_name, m.display_name, m.user_email, m.avatar_url, m.company_id, m.status
FROM tmp_teamchat_mappings m
ON CONFLICT (id) DO NOTHING;

-- 3) Update child tables to reference new ids
UPDATE chat_messages cm
SET sender_id = m.new_id
FROM tmp_teamchat_mappings m
WHERE cm.sender_id = m.old_id;

UPDATE chat_conversations cc
SET user_id_1 = m.new_id
FROM tmp_teamchat_mappings m
WHERE cc.user_id_1 = m.old_id;

UPDATE chat_conversations cc
SET user_id_2 = m.new_id
FROM tmp_teamchat_mappings m
WHERE cc.user_id_2 = m.old_id;

-- 4) Delete old teamchat_users rows
DELETE FROM teamchat_users t
USING tmp_teamchat_mappings m
WHERE t.id = m.old_id;

-- Defensive fix: set read_at for messages marked as read but missing timestamp
UPDATE chat_messages
SET read_at = COALESCE(read_at, NOW())
WHERE status = 'read' AND read_at IS NULL;

COMMIT;