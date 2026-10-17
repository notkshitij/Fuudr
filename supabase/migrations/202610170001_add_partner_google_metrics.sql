-- Google Places metrics must be stored separately from avg_rating/total_reviews.
-- Those existing columns may be maintained by database review triggers.
alter table public.partners
  add column if not exists google_rating numeric(2, 1),
  add column if not exists google_review_count integer,
  add column if not exists google_place_id text;

comment on column public.partners.google_rating is
  'Latest Google Places rating captured when the partner confirms their location.';
comment on column public.partners.google_review_count is
  'Latest Google Places userRatingCount captured with google_rating.';
comment on column public.partners.google_place_id is
  'Stable Google Places identifier for the selected restaurant.';

-- Preserve currently displayed values until each partner selects their Google place again.
update public.partners
set
  google_rating = coalesce(google_rating, avg_rating),
  google_review_count = coalesce(google_review_count, total_reviews)
where google_rating is null or google_review_count is null;

-- The partners table uses column-level grants. Give signed-in partners access to
-- the new fields while leaving row access constrained by the existing RLS policy.
grant select (
  google_rating,
  google_review_count,
  google_place_id
) on public.partners to authenticated;

grant update (
  google_rating,
  google_review_count,
  google_place_id
) on public.partners to authenticated;
