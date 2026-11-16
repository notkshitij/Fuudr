create table public.dish_video_submissions (
  id uuid primary key,
  partner_id uuid not null references public.partners (id),
  dish_name text not null check (char_length(dish_name) between 1 and 120),
  mobile text not null check (mobile ~ '^\+91[0-9]{10}$'),
  upi_id text not null check (char_length(upi_id) between 3 and 120),
  file_size_bytes integer not null check (file_size_bytes between 1 and 100000000),
  upload_source_hash text not null,
  mux_upload_id text unique,
  mux_asset_id text unique,
  mux_playback_id text,
  video_status text not null default 'awaiting_upload'
    check (video_status in ('awaiting_upload', 'ready', 'errored')),
  created_at timestamptz not null default now()
);

create index dish_video_upload_source_idx
  on public.dish_video_submissions (upload_source_hash, created_at);

alter table public.dish_video_submissions enable row level security;
revoke all on public.dish_video_submissions from public, anon, authenticated;
grant select, insert, update, delete on public.dish_video_submissions to service_role;

create function public.limit_dish_video_uploads()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.upload_source_hash, 0));
  if (select count(*) from public.dish_video_submissions
      where upload_source_hash = new.upload_source_hash
      and created_at > now() - interval '1 hour') >= 20 then
    raise sqlstate 'P0429' using message = 'Too many dish video uploads';
  end if;
  return new;
end;
$$;

create trigger limit_dish_video_uploads
before insert on public.dish_video_submissions
for each row execute function public.limit_dish_video_uploads();
