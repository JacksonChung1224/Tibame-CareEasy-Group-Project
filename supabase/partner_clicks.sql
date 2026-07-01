-- ════════════════════════════════════════════════════════════════
--  partner_clicks — 企業服務 / 政府管道 導流點擊成效追蹤
--  ────────────────────────────────────────────────────────────────
--  安全屬性：新增資料表，不影響任何現有試算輸出。
--  RLS 策略沿用專案慣例：anon 可 INSERT、禁止 SELECT；
--  僅 authenticated（後台）可讀取彙整。
--
--  執行方式：Supabase Dashboard → SQL Editor 貼上執行。
-- ════════════════════════════════════════════════════════════════

create table if not exists public.partner_clicks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz      not null default now(),
  package_id  text             not null check (package_id in ('care','transport','aids','respite')),
  channel     text             not null check (channel in ('partner','gov')),
  brand       text,                       -- 企業品牌（partner 時帶入；gov 為 null）
  cms_level   integer,                     -- 當下試算 CMS 級數（可選）
  identity    text                         -- 身分別 general/midlow/low（可選）
);

-- 查詢效能：常用「依包別 / 通路 / 時間」彙整成效
create index if not exists idx_partner_clicks_pkg     on public.partner_clicks (package_id);
create index if not exists idx_partner_clicks_channel on public.partner_clicks (channel);
create index if not exists idx_partner_clicks_created on public.partner_clicks (created_at);

-- ── Row Level Security ────────────────────────────────────────
alter table public.partner_clicks enable row level security;

-- 允許匿名前端寫入（與 assessment_records 一致）
drop policy if exists "anon can insert clicks" on public.partner_clicks;
create policy "anon can insert clicks"
  on public.partner_clicks
  for insert
  to anon
  with check (true);

-- 僅後台（authenticated / service role）可讀取
drop policy if exists "authenticated can read clicks" on public.partner_clicks;
create policy "authenticated can read clicks"
  on public.partner_clicks
  for select
  to authenticated
  using (true);

-- ── 後台彙整用 View（可選，方便算「本月導流成效」）─────────────
create or replace view public.partner_clicks_summary as
select
  date_trunc('month', created_at) as month,
  package_id,
  channel,
  brand,
  count(*) as clicks
from public.partner_clicks
group by 1, 2, 3, 4
order by 1 desc, 5 desc;
