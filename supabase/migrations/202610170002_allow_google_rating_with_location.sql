create or replace function public.partners_guard_rating_fields()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  -- Internal functions, service role and SQL editor remain unrestricted.
  if current_user not in ('anon', 'authenticated') then
    return NEW;
  end if;

  if public.is_admin() then
    return NEW;
  end if;

  -- A signed-in partner may refresh Google metrics only as part of selecting
  -- a different Google location. Existing RLS still limits which row they own.
  if current_user = 'authenticated'
     and (
       NEW.address is distinct from OLD.address
       or NEW.latitude is distinct from OLD.latitude
       or NEW.longitude is distinct from OLD.longitude
       or NEW.google_map_link is distinct from OLD.google_map_link
     ) then
    return NEW;
  end if;

  NEW.avg_rating := OLD.avg_rating;
  NEW.total_reviews := OLD.total_reviews;
  return NEW;
end;
$function$;
