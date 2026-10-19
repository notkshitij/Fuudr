alter table public.reels
  add column if not exists video_provider text not null default 'cloudinary',
  add column if not exists provider_video_id text,
  add column if not exists thumbnail_url text;

alter table public.reels
  drop constraint if exists reels_video_provider_check;

alter table public.reels
  add constraint reels_video_provider_check
  check (video_provider in ('cloudinary', 'bunny'));

create index if not exists reels_provider_video_id_idx
  on public.reels (provider_video_id)
  where provider_video_id is not null;
