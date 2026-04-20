UPDATE public.plans
SET monthly_price_cents = 2400,
    stripe_monthly_price_id = 'price_1TOBmfL34Z8Db3WQ9eUi1gBU',
    updated_at = now()
WHERE slug = 'basic';

UPDATE public.plans
SET monthly_price_cents = 6900,
    stripe_monthly_price_id = 'price_1TOBn8L34Z8Db3WQaLYUP3pK',
    updated_at = now()
WHERE slug = 'pro';