-- Schema for Privacy-focused Social Network

-- Enable UUID and pgcrypto extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. Users Profile (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  privacy_profile_visibility text default 'public' check (privacy_profile_visibility in ('public', 'friends', 'private')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Circles (Custom friend lists for privacy)
create table public.circles (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.users on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Circle Members
create table public.circle_members (
  circle_id uuid references public.circles on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (circle_id, user_id)
);

-- 4. Posts
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.users on delete cascade not null,
  content text,
  image_url text,
  mood text,
  visibility text default 'all_friends' check (visibility in ('all_friends', 'circle', 'only_me')),
  circle_id uuid references public.circles on delete cascade,
  allow_comments boolean default true,
  unlock_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Comments
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts on delete cascade not null,
  author_id uuid references public.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Reactions (no public counts)
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  type text not null check (type in ('heart', 'support', 'appreciate')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (post_id, user_id)
);

-- 7. Journals (Private)
create table public.journals (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.users on delete cascade not null,
  receiver_id uuid references public.users on delete cascade not null,
  content text not null,
  is_whisper boolean default false not null,
  image_url text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. User Privacy Lookups (Privacy-first contact matching hashes)
create table public.user_privacy_lookups (
  user_id uuid references public.users(id) on delete cascade not null primary key,
  email_hash text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  source_user_id uuid references public.users on delete cascade not null,
  type text not null check (type in ('reaction', 'comment')),
  post_id uuid references public.posts on delete cascade not null,
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) --

alter table public.users enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.journals enable row level security;
alter table public.messages enable row level security;
alter table public.user_privacy_lookups enable row level security;
alter table public.notifications enable row level security;

-- Users: Anyone can read basic profiles (can restrict later), users can update their own
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- Circles: Owners can manage their circles
create policy "Users can view their own circles." on public.circles for select using (auth.uid() = owner_id);
create policy "Users can insert their own circles." on public.circles for insert with check (auth.uid() = owner_id);
create policy "Users can update their own circles." on public.circles for update using (auth.uid() = owner_id);
create policy "Users can delete their own circles." on public.circles for delete using (auth.uid() = owner_id);

-- Circle Members: Owners can manage circle members
create policy "Users can view members of their circles." on public.circle_members for select using (
  exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
);
create policy "Users can manage members of their circles." on public.circle_members for all using (
  exists (select 1 from public.circles where id = circle_id and owner_id = auth.uid())
);

-- Posts: Visibility rules
create policy "Users can view posts based on visibility" on public.posts for select using (
  auth.uid() = author_id -- author can always see
  or (visibility = 'all_friends') -- simplify for now: assume everyone logged in is a "friend" or implement friend logic
  or (visibility = 'circle' and exists (
    select 1 from public.circle_members cm where cm.circle_id = posts.circle_id and cm.user_id = auth.uid()
  ))
);
create policy "Users can insert their own posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Users can update their own posts" on public.posts for update using (auth.uid() = author_id);
create policy "Users can delete their own posts" on public.posts for delete using (auth.uid() = author_id);

-- Journals: strictly private
create policy "Users can only see their own journal entries" on public.journals for all using (auth.uid() = author_id);

-- Messages: sender and receiver can see
create policy "Users can read their messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);

-- User Privacy Lookups: Users can read their own mapping (Service Role handles bulk queries via Actions)
create policy "Users can view their own privacy lookup" on public.user_privacy_lookups for select using (auth.uid() = user_id);

-- Notifications: users can read and update their own notifications
create policy "Users can view their own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Trigger to create a user profile automatically on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  -- Create the public user profile
  insert into public.users (id, username, display_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name');

  -- Automatically insert SHA-256 hashed email into privacy lookups
  if new.email is not null then
    insert into public.user_privacy_lookups (user_id, email_hash)
    values (new.id, encode(digest(lower(new.email), 'sha256'), 'hex'))
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for automating comment notifications
create or replace function public.handle_new_comment_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author_id uuid;
begin
  -- Get the author of the post
  select author_id into post_author_id from public.posts where id = new.post_id;
  
  -- Only notify if the commentator is not the post author
  if post_author_id is not null and post_author_id != new.author_id then
    insert into public.notifications (user_id, source_user_id, type, post_id)
    values (post_author_id, new.author_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$;

create or replace trigger on_comment_created
  after insert on public.comments
  for each row execute procedure public.handle_new_comment_notification();

-- Trigger for automating reaction notifications
create or replace function public.handle_new_reaction_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author_id uuid;
begin
  -- Get the author of the post
  select author_id into post_author_id from public.posts where id = new.post_id;
  
  -- Only notify if the reactor is not the post author
  if post_author_id is not null and post_author_id != new.user_id then
    insert into public.notifications (user_id, source_user_id, type, post_id)
    values (post_author_id, new.user_id, 'reaction', new.post_id);
  end if;
  return new;
end;
$$;

create or replace trigger on_reaction_created
  after insert on public.reactions
  for each row execute procedure public.handle_new_reaction_notification();

-- ENABLE REALTIME BROADCASTING FOR INSTANT MESSAGES AND NOTIFICATIONS
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- BACKFILL SCRIPT FOR EXISTING USERS (Run in Supabase SQL editor):
-- insert into public.user_privacy_lookups (user_id, email_hash)
-- select id, encode(digest(lower(email), 'sha256'), 'hex')
-- from auth.users
-- on conflict (user_id) do nothing;
