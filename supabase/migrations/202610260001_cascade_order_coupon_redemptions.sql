-- Keep coupon usage tied to the lifetime of its order. PostgreSQL performs
-- the cascade in the same transaction, so a failed order deletion cannot
-- accidentally release the customer's redemption.
begin;

alter table public.coupon_redemptions
  drop constraint coupon_redemptions_order_id_fkey;

alter table public.coupon_redemptions
  add constraint coupon_redemptions_order_id_fkey
  foreign key (order_id) references public.orders (id)
  on delete cascade;

commit;
