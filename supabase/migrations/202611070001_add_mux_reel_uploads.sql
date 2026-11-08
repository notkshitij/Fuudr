alter table public.reels
  drop constraint if exists reels_video_provider_check,
  add constraint reels_video_provider_check
    check (video_provider in ('cloudinary', 'bunny', 'mux'));

create table public.mux_reel_uploads (
  id uuid primary key,
  partner_id uuid not null references public.partners (id) on delete cascade,
  mux_upload_id text unique,
  asset_id text unique,
  playback_id text,
  status text not null default 'processing'
    check (status in ('processing', 'ready', 'errored'))
);

alter table public.mux_reel_uploads enable row level security;
revoke all on public.mux_reel_uploads from public, anon, authenticated;
grant select, insert, update, delete on public.mux_reel_uploads to service_role;
