-- Keep direct browser updates protected while providing a narrow operation for
-- refreshing Google metrics after a partner selects an autocomplete result.
create or replace function public.partners_guard_rating_fields()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if current_user not in ('anon', 'authenticated') then
    return NEW;
  end if;

  if public.is_admin() then
    return NEW;
  end if;

  NEW.avg_rating := OLD.avg_rating;
  NEW.total_reviews := OLD.total_reviews;
  return NEW;
end;
$function$;

create or replace function public.refresh_my_google_rating(
  p_rating numeric,
  p_total_reviews integer
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  updated_partner jsonb;
  partner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_rating < 0 or p_rating > 5 then
    raise exception 'Rating must be between 0 and 5';
  end if;

  if p_total_reviews < 0 then
    raise exception 'Review count cannot be negative';
  end if;

  -- Legacy partner rows use their own UUID and are associated with Supabase
  -- Auth by email. Prefer a direct UUID match for newer rows, then use the
  -- authenticated JWT email just like the partner login/profile flow.
  select p.id
  into partner_id
  from public.partners as p
  where p.id = auth.uid()
     or lower(p.email) = lower(auth.jwt() ->> 'email')
  order by (p.id = auth.uid()) desc
  limit 1;

  if partner_id is null then
    raise exception 'Partner profile not found';
  end if;

  update public.partners
  set avg_rating = p_rating,
      total_reviews = p_total_reviews
  where id = partner_id
  returning jsonb_build_object(
    'id', id,
    'avg_rating', avg_rating,
    'total_reviews', total_reviews
  ) into updated_partner;

  return updated_partner;
end;
$function$;

revoke all on function public.refresh_my_google_rating(numeric, integer) from public;
grant execute on function public.refresh_my_google_rating(numeric, integer) to authenticated;
