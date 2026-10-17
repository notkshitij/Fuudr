alter table public.partners
  drop column if exists google_rating,
  drop column if exists google_review_count,
  drop column if exists google_place_id;
