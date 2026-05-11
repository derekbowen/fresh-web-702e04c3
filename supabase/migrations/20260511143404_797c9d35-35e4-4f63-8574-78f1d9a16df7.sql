update public.content_404_log l
set resolved_at = now(),
    resolution_notes = coalesce(resolution_notes, 'auto: content_pages row now exists')
where resolved_at is null
  and exists (select 1 from public.content_pages cp where cp.url_path = l.url_path);

create or replace function public.auto_resolve_404_for_page()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.content_404_log
     set resolved_at = now(),
         resolution_notes = coalesce(resolution_notes, 'auto: content_pages row created/updated')
   where resolved_at is null
     and url_path = new.url_path;
  return new;
end;
$$;

drop trigger if exists trg_auto_resolve_404_on_content_pages on public.content_pages;
create trigger trg_auto_resolve_404_on_content_pages
after insert or update of url_path on public.content_pages
for each row execute function public.auto_resolve_404_for_page();