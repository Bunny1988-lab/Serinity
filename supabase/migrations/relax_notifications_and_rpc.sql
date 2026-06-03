-- Migration: Relax notifications constraints and create RPC search functions

-- 1. Alter notifications table to make post_id nullable
ALTER TABLE public.notifications ALTER COLUMN post_id DROP NOT NULL;

-- 2. Drop the existing check constraint on type and replace it
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('reaction', 'comment', 'connection_accepted'));

-- 3. Add INSERT policy for notifications
DROP POLICY IF EXISTS "Users can insert notifications for others." ON public.notifications;
CREATE POLICY "Users can insert notifications for others." ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = source_user_id);

-- 4. Create search functions
CREATE OR REPLACE FUNCTION public.get_user_id_by_email_hash(p_email_hash text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.user_privacy_lookups WHERE email_hash = p_email_hash;
  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_friends_by_email(p_user_id uuid, p_email_hash text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.display_name, u.avatar_url
  FROM public.users u
  JOIN public.user_privacy_lookups l ON l.user_id = u.id
  WHERE l.email_hash = p_email_hash
    AND (
      EXISTS (
        SELECT 1 FROM public.friend_requests fr
        WHERE fr.status = 'accepted'
          AND (
            (fr.sender_id = p_user_id AND fr.receiver_id = u.id)
            OR (fr.sender_id = u.id AND fr.receiver_id = p_user_id)
          )
      )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.search_users_by_email(p_email_hash text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.display_name, u.avatar_url
  FROM public.users u
  JOIN public.user_privacy_lookups l ON l.user_id = u.id
  WHERE l.email_hash = p_email_hash;
END;
$$;
