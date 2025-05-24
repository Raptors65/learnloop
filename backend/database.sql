-- LearnLoop Database Schema
-- Run this in your Supabase SQL editor

-- Users table (automatically created by Supabase Auth, but we can add custom fields)
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  picture text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Topics table (nodes in the learning graph)
create table if not exists public.topics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  name text not null,
  color text default '#8b5cf6',
  size integer default 5,
  position_x real,
  position_y real,
  expanded boolean default false,
  notes text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Topic relationships table (links in the learning graph)
create table if not exists public.topic_relationships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  source_topic_id uuid references public.topics(id) on delete cascade not null,
  target_topic_id uuid references public.topics(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source_topic_id, target_topic_id)
);

-- Row Level Security (RLS) policies
alter table public.user_profiles enable row level security;
alter table public.topics enable row level security;
alter table public.topic_relationships enable row level security;

-- Policies for user_profiles
create policy "Users can view own profile" on public.user_profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.user_profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.user_profiles
  for insert with check (auth.uid() = id);

-- Policies for topics
create policy "Users can view own topics" on public.topics
  for select using (auth.uid() = user_id);

create policy "Users can insert own topics" on public.topics
  for insert with check (auth.uid() = user_id);

create policy "Users can update own topics" on public.topics
  for update using (auth.uid() = user_id);

create policy "Users can delete own topics" on public.topics
  for delete using (auth.uid() = user_id);

-- Policies for topic_relationships
create policy "Users can view own relationships" on public.topic_relationships
  for select using (auth.uid() = user_id);

create policy "Users can insert own relationships" on public.topic_relationships
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own relationships" on public.topic_relationships
  for delete using (auth.uid() = user_id);

-- Indexes for better performance
create index if not exists topics_user_id_idx on public.topics(user_id);
create index if not exists topic_relationships_user_id_idx on public.topic_relationships(user_id);
create index if not exists topic_relationships_source_idx on public.topic_relationships(source_topic_id);
create index if not exists topic_relationships_target_idx on public.topic_relationships(target_topic_id);

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();

create trigger handle_topics_updated_at
  before update on public.topics
  for each row execute function public.handle_updated_at();

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, name, picture)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'picture'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();