-- Seed system event templates linked to default categories
INSERT INTO public.event_templates (name, is_system, category_id, sort_order, prefill_data, page_layout)
SELECT 
  c.name,
  true,
  c.id,
  c.sort_order,
  CASE c.slug
    WHEN 'sport' THEN '{"startTime":"14:00","endTime":"17:00","ctaButtonText":"Inschrijven","shortDescription":"Sportief evenement voor jong en oud."}'::jsonb
    WHEN 'proeverij' THEN '{"startTime":"19:00","endTime":"22:00","ctaButtonText":"Reserveer je plek","shortDescription":"Ontdek bijzondere smaken tijdens deze proeverij."}'::jsonb
    WHEN 'live-muziek' THEN '{"startTime":"21:00","endTime":"01:00","ctaButtonText":"Bekijk line-up","shortDescription":"Live muziek in een gezellige sfeer."}'::jsonb
    WHEN 'thema-avond' THEN '{"startTime":"20:00","endTime":"23:00","ctaButtonText":"Doe mee","shortDescription":"Een avond vol entertainment en gezelligheid."}'::jsonb
    ELSE '{"startTime":"20:00","endTime":"23:00","ctaButtonText":"Meer info","shortDescription":""}'::jsonb
  END,
  '{}'::jsonb
FROM public.categories c
WHERE c.is_default = true
ON CONFLICT DO NOTHING;