-- RoomMatch V10 Supabase registration integration (run ONCE in SQL Editor).
-- Requires existing public.member_profiles, public.admin_users and public.is_admin() from admin schema.
-- Existing 3 admin users and their permissions are unchanged.
-- IMPORTANT: Auth.users email uniqueness is enforced by Supabase Auth.

-- Prevent duplicate phone numbers among member accounts (blank phone numbers not indexed).
create unique index if not exists member_profiles_phone_unique
on public.member_profiles (phone)
where phone is not null and phone <> '';

-- Prevent phone being saved in different spellings. V10 normalizes to +CCdigits.
create or replace function public.roommatch_new_member()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  info jsonb := coalesce(new.raw_user_meta_data,'{}'::jsonb);
  mobile text := nullif(info->>'phone','');
begin
  -- Only writes non-sensitive profile metadata. Never stores a password, selfie or ID.
  insert into public.member_profiles (
    id, full_name, email, phone, school, area, budget, sleep, cleanliness, bio
  ) values (
    new.id,
    left(coalesce(info->>'full_name',''),100),
    lower(new.email),
    mobile,
    left(coalesce(info->>'school',''),120),
    left(coalesce(info->>'area',''),100),
    case when (info->>'budget') ~ '^[0-9]{1,6}$' then (info->>'budget')::integer else null end,
    left(coalesce(info->>'sleep',''),40),
    left(coalesce(info->>'cleanliness',''),40),
    left(coalesce(info->>'bio',''),450)
  );
  return new;
end;
$$;

-- Trigger runs inside the signup transaction so a valid account gets exactly one profile.
drop trigger if exists roommatch_create_member_profile on auth.users;
create trigger roommatch_create_member_profile
  after insert on auth.users for each row
  execute function public.roommatch_new_member();

-- Existing admins are untouched. Member profiles are still protected by existing RLS.
-- Verify: select count(*) from public.member_profiles;
