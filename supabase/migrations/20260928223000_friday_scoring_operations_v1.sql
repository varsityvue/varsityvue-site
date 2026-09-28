-- Snapshot of 249 playable canonical repository games from getGames() at e9cbb3b.
-- Add a reviewed registry row in a future migration when new scheduled games enter the repository.
create table private.canonical_game_identity (game_id text primary key, away_school_slug text not null, home_school_slug text not null, constraint distinct_canonical_teams check (away_school_slug <> home_school_slug));
alter table private.canonical_game_identity enable row level security;
revoke all on private.canonical_game_identity from public, anon, authenticated;
insert into private.canonical_game_identity (game_id,away_school_slug,home_school_slug) values
  ('abilene-texas-leadership-at-coleman-2026-week-3', 'abilene-texas-leadership', 'coleman'),
  ('abilene-texas-leadership-at-san-angelo-texas-leadership-2026-week-2', 'abilene-texas-leadership', 'san-angelo-texas-leadership'),
  ('abilene-texas-leadership-at-winters-2026-week-4', 'abilene-texas-leadership', 'winters'),
  ('abilene-tlca-at-cisco-2026-week-9', 'abilene-texas-leadership', 'cisco'),
  ('abilene-tlca-at-de-leon-2026-week-10', 'abilene-texas-leadership', 'de-leon'),
  ('abilene-tlca-at-hico-2026-week-7', 'abilene-texas-leadership', 'hico'),
  ('albany-at-coleman-2026-week-4', 'albany', 'coleman'),
  ('albany-at-de-leon-2026-week-3', 'albany', 'de-leon'),
  ('albany-at-hamlin-2026-week-11', 'albany', 'hamlin'),
  ('albany-at-stamford-2026-week-7', 'albany', 'stamford'),
  ('albany-at-winters-2026-week-9', 'albany', 'winters'),
  ('anson-at-abilene-tlca-2026-week-8', 'anson', 'abilene-texas-leadership'),
  ('anson-at-albany-2026-week-2', 'anson', 'albany'),
  ('anson-at-cisco-2026-week-7', 'anson', 'cisco'),
  ('anson-at-haskell-2026-week-4', 'anson', 'haskell'),
  ('anson-at-hawley-2026-week-10', 'anson', 'hawley'),
  ('atlas-homeschool-at-rio-vista-2026-week-3', 'atlas-homeschool', 'rio-vista'),
  ('austin-at-jarrell-2026-week-3', 'austin', 'jarrell'),
  ('austin-navarro-at-jarrell-2026-week-1', 'austin-navarro', 'jarrell'),
  ('baird-vs-abilene-tlca-2026-week-1', 'baird', 'abilene-texas-leadership'),
  ('ballinger-at-eastland-2026-week-1', 'ballinger', 'eastland'),
  ('bowie-at-city-view-2026-week-5', 'bowie', 'city-view'),
  ('boyd-at-jacksboro-2026-week-2', 'boyd', 'jacksboro'),
  ('breckenridge-at-anson-2026-week-5', 'breckenridge', 'anson'),
  ('breckenridge-at-cisco-2026-week-3', 'breckenridge', 'cisco'),
  ('breckenridge-at-comanche-2026-week-1', 'breckenridge', 'comanche'),
  ('breckenridge-at-henrietta-2026-week-11', 'breckenridge', 'henrietta'),
  ('breckenridge-at-holliday-2026-week-9', 'breckenridge', 'holliday'),
  ('bridgeport-at-henrietta-2026-week-5', 'bridgeport', 'henrietta'),
  ('brownwood-at-abilene-wylie-2026-week-1', 'brownwood', 'abilene-wylie'),
  ('bruceville-eddy-at-cross-plains-2026-week-1', 'bruceville-eddy', 'cross-plains'),
  ('bruceville-eddy-at-hubbard-2026-week-4', 'bruceville-eddy', 'hubbard'),
  ('burnet-at-llano-2026-week-1', 'burnet', 'llano'),
  ('burnet-at-stephenville-2026-week-10', 'burnet', 'stephenville'),
  ('centerville-at-crawford-2026-week-2', 'centerville', 'crawford'),
  ('chico-at-abilene-texas-leadership-2026-week-5', 'chico', 'abilene-texas-leadership'),
  ('childress-at-holliday-2026-week-4', 'childress', 'holliday'),
  ('china-spring-at-stephenville-2026-week-8', 'china-spring', 'stephenville'),
  ('china-spring-at-waco-connally-2026-week-1', 'china-spring', 'waco-connally'),
  ('china-spring-at-waco-university-2026-week-2', 'china-spring', 'waco-university'),
  ('cisco-at-clyde-2026-week-1', 'cisco', 'clyde'),
  ('cisco-at-hawley-2026-week-8', 'cisco', 'hawley'),
  ('cisco-at-hico-2026-week-10', 'cisco', 'hico'),
  ('cisco-at-stamford-2026-week-4', 'cisco', 'stamford'),
  ('city-view-at-breckenridge-2026-week-7', 'city-view', 'breckenridge'),
  ('city-view-at-iowa-park-2026-week-4', 'city-view', 'iowa-park'),
  ('city-view-at-jacksboro-2026-week-11', 'city-view', 'jacksboro'),
  ('city-view-at-merkel-2026-week-9', 'city-view', 'merkel'),
  ('city-view-at-vernon-2026-week-3', 'city-view', 'vernon'),
  ('clifton-at-bosqueville-2026-week-1', 'clifton', 'bosqueville'),
  ('clifton-at-hamilton-2026-week-8', 'clifton', 'hamilton'),
  ('clifton-at-italy-2026-week-3', 'clifton', 'italy'),
  ('clifton-at-millsap-2026-week-11', 'clifton', 'millsap'),
  ('clifton-at-rio-vista-2026-week-5', 'clifton', 'rio-vista'),
  ('clyde-at-breckenridge-2026-week-4', 'clyde', 'breckenridge'),
  ('clyde-at-comanche-2026-week-3', 'clyde', 'comanche'),
  ('clyde-at-tolar-2026-week-2', 'clyde', 'tolar'),
  ('coleman-at-grape-creek-2026-week-1', 'coleman', 'grape-creek'),
  ('colorado-city-at-winters-2026-week-2', 'colorado-city', 'winters'),
  ('comanche-at-cisco-2026-week-2', 'comanche', 'cisco'),
  ('comanche-at-clifton-2026-week-4', 'comanche', 'clifton'),
  ('comanche-at-dublin-2026-week-8', 'comanche', 'dublin'),
  ('comanche-at-eastland-2026-week-10', 'comanche', 'eastland'),
  ('comanche-at-millsap-2026-week-7', 'comanche', 'millsap'),
  ('compass-academy-at-merkel-2026-week-4', 'compass-academy', 'merkel'),
  ('crawford-at-hubbard-2026-week-7', 'crawford', 'hubbard'),
  ('crawford-at-marlin-2026-week-4', 'crawford', 'marlin'),
  ('crawford-at-mcgregor-2026-week-1', 'crawford', 'mcgregor'),
  ('crawford-at-santo-2026-week-5', 'crawford', 'santo'),
  ('crawford-at-wortham-2026-week-9', 'crawford', 'wortham'),
  ('crosbyton-at-hamlin-2026-week-1', 'crosbyton', 'hamlin'),
  ('cross-plains-at-albany-2026-week-6', 'cross-plains', 'albany'),
  ('cross-plains-at-baird-2026-week-4', 'cross-plains', 'baird'),
  ('cross-plains-at-bangs-2026-week-3', 'cross-plains', 'bangs'),
  ('cross-plains-at-goldthwaite-2026-week-9', 'cross-plains', 'goldthwaite'),
  ('cross-plains-at-hico-2026-week-2', 'cross-plains', 'hico'),
  ('cross-plains-at-miles-2026-week-11', 'cross-plains', 'miles'),
  ('cross-roads-at-meridian-2026-week-2', 'cross-roads', 'meridian'),
  ('dawson-at-meridian-2026-week-1', 'dawson', 'meridian'),
  ('dawson-at-wortham-2026-week-2', 'dawson', 'wortham'),
  ('de-leon-at-anson-2026-week-9', 'de-leon', 'anson'),
  ('de-leon-at-cisco-2026-week-11', 'de-leon', 'cisco'),
  ('de-leon-at-goldthwaite-2026-week-4', 'de-leon', 'goldthwaite'),
  ('de-leon-at-hawley-2026-week-7', 'de-leon', 'hawley'),
  ('de-leon-at-stamford-2026-week-2', 'de-leon', 'stamford'),
  ('dublin-at-bangs-2026-week-1', 'dublin', 'bangs'),
  ('dublin-at-clifton-2026-week-9', 'dublin', 'clifton'),
  ('dublin-at-hamilton-2026-week-7', 'dublin', 'hamilton'),
  ('dublin-at-millsap-2026-week-5', 'dublin', 'millsap'),
  ('dublin-at-tolar-2026-week-11', 'dublin', 'tolar'),
  ('early-at-breckenridge-2026-week-2', 'early', 'breckenridge'),
  ('early-at-de-leon-2026-week-5', 'early', 'de-leon'),
  ('early-at-hawley-2026-week-4', 'early', 'hawley'),
  ('eastland-at-clifton-2026-week-7', 'eastland', 'clifton'),
  ('eastland-at-dublin-2026-week-4', 'eastland', 'dublin'),
  ('eastland-at-grape-creek-2026-week-3', 'eastland', 'grape-creek'),
  ('eastland-at-millsap-2026-week-9', 'eastland', 'millsap'),
  ('eastland-at-rio-vista-2026-week-11', 'eastland', 'rio-vista'),
  ('florence-at-hico-2026-week-5', 'florence', 'hico'),
  ('frost-at-blooming-grove-2026-week-1', 'frost', 'blooming-grove'),
  ('frost-at-crawford-2026-week-11', 'frost', 'crawford'),
  ('frost-at-dawson-2026-week-4', 'frost', 'dawson'),
  ('frost-at-mart-2026-week-7', 'frost', 'mart'),
  ('frost-at-meridian-2026-week-9', 'frost', 'meridian'),
  ('gatesville-at-china-spring-2026-week-3', 'gatesville', 'china-spring'),
  ('goldthwaite-at-albany-2026-week-8', 'goldthwaite', 'albany'),
  ('goldthwaite-at-granger-2026-week-2', 'goldthwaite', 'granger'),
  ('goldthwaite-at-miles-2026-week-6', 'goldthwaite', 'miles'),
  ('goldthwaite-at-san-saba-2026-week-3', 'goldthwaite', 'san-saba'),
  ('goldthwaite-at-stamford-2026-week-10', 'goldthwaite', 'stamford'),
  ('hamilton-at-brady-2026-week-3', 'hamilton', 'brady'),
  ('hamilton-at-bremond-2026-week-1', 'hamilton', 'bremond'),
  ('hamilton-at-comanche-2026-week-11', 'hamilton', 'comanche'),
  ('hamilton-at-eastland-2026-week-5', 'hamilton', 'eastland'),
  ('hamilton-at-tolar-2026-week-9', 'hamilton', 'tolar'),
  ('hamlin-at-archer-city-2026-week-3', 'hamlin', 'archer-city'),
  ('hamlin-at-cross-plains-2026-week-5', 'hamlin', 'cross-plains'),
  ('hamlin-at-goldthwaite-2026-week-7', 'hamlin', 'goldthwaite'),
  ('hamlin-at-miles-2026-week-9', 'hamlin', 'miles'),
  ('hamlin-at-seymour-2026-week-2', 'hamlin', 'seymour'),
  ('haskell-at-santo-2026-week-3', 'haskell', 'santo'),
  ('hawley-at-abilene-tlca-2026-week-11', 'hawley', 'abilene-texas-leadership'),
  ('hawley-at-albany-2026-week-1', 'hawley', 'albany'),
  ('hawley-at-hico-2026-week-9', 'hawley', 'hico'),
  ('hawley-at-merkel-2026-week-2', 'hawley', 'merkel'),
  ('hawley-at-post-2026-week-5', 'hawley', 'post'),
  ('henrietta-at-boyd-2026-week-3', 'henrietta', 'boyd'),
  ('henrietta-at-city-view-2026-week-10', 'henrietta', 'city-view'),
  ('henrietta-at-holliday-2026-week-7', 'henrietta', 'holliday'),
  ('henrietta-at-jacksboro-2026-week-9', 'henrietta', 'jacksboro'),
  ('henrietta-at-marlow-2026-week-2', 'henrietta', 'marlow'),
  ('hico-at-anson-2026-week-11', 'hico', 'anson'),
  ('hico-at-de-leon-2026-week-8', 'hico', 'de-leon'),
  ('hico-at-meridian-2026-week-4', 'hico', 'meridian'),
  ('hico-at-moody-2026-week-3', 'hico', 'moody'),
  ('holland-at-hico-2026-week-1', 'holland', 'hico'),
  ('holliday-at-city-view-2026-week-8', 'holliday', 'city-view'),
  ('holliday-at-merkel-2026-week-11', 'holliday', 'merkel'),
  ('holliday-at-muenster-2026-week-2', 'holliday', 'muenster'),
  ('holliday-at-whitesboro-2026-week-5', 'holliday', 'whitesboro'),
  ('holliday-at-windthorst-2026-week-1', 'holliday', 'windthorst'),
  ('hubbard-at-dawson-2026-week-3', 'hubbard', 'dawson'),
  ('hubbard-at-frost-2026-week-8', 'hubbard', 'frost'),
  ('hubbard-at-mart-2026-week-10', 'hubbard', 'mart'),
  ('hubbard-at-milano-2026-week-1', 'hubbard', 'milano'),
  ('hubbard-at-wortham-2026-week-6', 'hubbard', 'wortham'),
  ('iowa-park-at-henrietta-2026-week-1', 'iowa-park', 'henrietta'),
  ('iowa-park-at-holliday-2026-week-3', 'iowa-park', 'holliday'),
  ('itasca-at-frost-2026-week-2', 'itasca', 'frost'),
  ('itasca-at-meridian-2026-week-3', 'itasca', 'meridian'),
  ('jacksboro-at-bowie-2026-week-4', 'jacksboro', 'bowie'),
  ('jacksboro-at-breckenridge-2026-week-8', 'jacksboro', 'breckenridge'),
  ('jacksboro-at-cisco-2026-week-5', 'jacksboro', 'cisco'),
  ('jacksboro-at-holliday-2026-week-10', 'jacksboro', 'holliday'),
  ('jacksboro-at-peaster-2026-week-3', 'jacksboro', 'peaster'),
  ('junction-at-goldthwaite-2026-week-1', 'junction', 'goldthwaite'),
  ('keene-at-dublin-2026-week-3', 'keene', 'dublin'),
  ('kerens-at-rio-vista-2026-week-1', 'kerens', 'rio-vista'),
  ('lago-vista-at-burnet-2026-week-3', 'lago-vista', 'burnet'),
  ('lampasas-at-central-catholic-2026-week-3', 'lampasas', 'central-catholic'),
  ('lampasas-at-gatesville-2026-week-1', 'lampasas', 'gatesville'),
  ('lampasas-at-stephenville-2026-week-7', 'lampasas', 'stephenville'),
  ('little-river-academy-at-marble-falls-2026-week-2', 'little-river-academy', 'marble-falls'),
  ('lockhart-at-marble-falls-2026-week-1', 'lockhart', 'marble-falls'),
  ('lubbock-cooper-at-stephenville-2026-week-3', 'lubbock-cooper', 'stephenville'),
  ('marble-falls-at-fredericksburg-2026-week-3', 'marble-falls', 'fredericksburg'),
  ('mart-at-axtell-2026-week-2', 'mart', 'axtell'),
  ('mart-at-centerville-2026-week-4', 'mart', 'centerville'),
  ('mart-at-crawford-2026-week-6', 'mart', 'crawford'),
  ('mart-at-meridian-2026-week-11', 'mart', 'meridian'),
  ('mart-at-santo-2026-week-8', 'mart', 'santo'),
  ('mason-at-hamilton-2026-week-2', 'mason', 'hamilton'),
  ('mcgregor-at-millsap-2026-week-3', 'mcgregor', 'millsap'),
  ('meridian-at-crawford-2026-week-8', 'meridian', 'crawford'),
  ('meridian-at-hubbard-2026-week-5', 'meridian', 'hubbard'),
  ('meridian-at-santo-2026-week-10', 'meridian', 'santo'),
  ('merkel-at-breckenridge-2026-week-10', 'merkel', 'breckenridge'),
  ('merkel-at-colorado-city-2026-week-3', 'merkel', 'colorado-city'),
  ('merkel-at-early-2026-week-1', 'merkel', 'early'),
  ('merkel-at-henrietta-2026-week-8', 'merkel', 'henrietta'),
  ('merkel-at-jacksboro-2026-week-7', 'merkel', 'jacksboro'),
  ('midland-christian-at-jarrell-2026-week-2', 'midland-christian', 'jarrell'),
  ('midlothian-heritage-at-stephenville-2026-week-1', 'midlothian-heritage', 'stephenville'),
  ('miles-at-albany-2026-week-10', 'miles', 'albany'),
  ('miles-at-christoval-2026-week-2', 'miles', 'christoval'),
  ('miles-at-eldorado-2026-week-4', 'miles', 'eldorado'),
  ('miles-at-stamford-2026-week-5', 'miles', 'stamford'),
  ('miles-at-winters-2026-week-7', 'miles', 'winters'),
  ('millsap-at-callisburg-2026-week-2', 'millsap', 'callisburg'),
  ('millsap-at-hamilton-2026-week-10', 'millsap', 'hamilton'),
  ('millsap-at-jacksboro-2026-week-1', 'millsap', 'jacksboro'),
  ('millsap-at-rio-vista-2026-week-8', 'millsap', 'rio-vista'),
  ('millsap-at-tolar-2026-week-4', 'millsap', 'tolar'),
  ('munday-at-hamlin-2026-week-4', 'munday', 'hamlin'),
  ('olney-at-anson-2026-week-3', 'olney', 'anson'),
  ('pflugerville-connally-at-lampasas-2026-week-2', 'pflugerville-connally', 'lampasas'),
  ('post-at-anson-2026-week-1', 'post', 'anson'),
  ('reagan-county-at-mason-2026-week-1', 'reagan-county', 'mason'),
  ('reagan-county-at-miles-2026-week-3', 'reagan-county', 'miles'),
  ('rice-at-wortham-2026-week-4', 'rice', 'wortham'),
  ('riesel-at-frost-2026-week-3', 'riesel', 'frost'),
  ('rio-vista-at-comanche-2026-week-9', 'rio-vista', 'comanche'),
  ('rio-vista-at-dublin-2026-week-10', 'rio-vista', 'dublin'),
  ('rio-vista-at-hamilton-2026-week-4', 'rio-vista', 'hamilton'),
  ('rio-vista-at-rosebud-lott-2026-week-2', 'rio-vista', 'rosebud-lott'),
  ('rio-vista-at-tolar-2026-week-7', 'rio-vista', 'tolar'),
  ('roscoe-at-santo-2026-week-4', 'roscoe', 'santo'),
  ('san-angelo-texas-leadership-at-merkel-2026-week-5', 'san-angelo-texas-leadership', 'merkel'),
  ('san-saba-at-de-leon-2026-week-1', 'san-saba', 'de-leon'),
  ('san-saba-at-eastland-2026-week-2', 'san-saba', 'eastland'),
  ('santo-at-chilton-2026-week-1', 'santo', 'chilton'),
  ('santo-at-dublin-2026-week-2', 'santo', 'dublin'),
  ('santo-at-frost-2026-week-6', 'santo', 'frost'),
  ('santo-at-hubbard-2026-week-9', 'santo', 'hubbard'),
  ('santo-at-wortham-2026-week-11', 'santo', 'wortham'),
  ('shamrock-at-winters-2026-week-1', 'shamrock', 'winters'),
  ('snook-at-hubbard-2026-week-2', 'snook', 'hubbard'),
  ('sonora-at-miles-2026-week-1', 'sonora', 'miles'),
  ('stamford-at-cross-plains-2026-week-8', 'stamford', 'cross-plains'),
  ('stamford-at-hamlin-2026-week-6', 'stamford', 'hamlin'),
  ('stamford-at-haskell-2026-week-1', 'stamford', 'haskell'),
  ('stamford-at-hawley-2026-week-3', 'stamford', 'hawley'),
  ('stamford-at-winters-2026-week-11', 'stamford', 'winters'),
  ('stephenville-at-abilene-wylie-2026-week-4', 'stephenville', 'abilene-wylie'),
  ('stephenville-at-brownwood-2026-week-2', 'stephenville', 'brownwood'),
  ('stephenville-at-jarrell-2026-week-9', 'stephenville', 'jarrell'),
  ('stephenville-at-marble-falls-2026-week-11', 'stephenville', 'marble-falls'),
  ('stephenville-vs-canyon-west-plains-2026-week-5', 'canyon-west-plains', 'stephenville'),
  ('taylor-at-burnet-2026-week-2', 'taylor', 'burnet'),
  ('tolar-at-boyd-2026-week-1', 'tolar', 'boyd'),
  ('tolar-at-clifton-2026-week-10', 'tolar', 'clifton'),
  ('tolar-at-comanche-2026-week-5', 'tolar', 'comanche'),
  ('tolar-at-eastland-2026-week-8', 'tolar', 'eastland'),
  ('tolar-at-mart-2026-week-3', 'tolar', 'mart'),
  ('valley-mills-at-crawford-2026-week-3', 'valley-mills', 'crawford'),
  ('west-at-clifton-2026-week-2', 'west', 'clifton'),
  ('whitesboro-at-city-view-2026-week-1', 'whitesboro', 'city-view'),
  ('whitney-at-mart-2026-week-1', 'whitney', 'mart'),
  ('windthorst-at-city-view-2026-week-2', 'windthorst', 'city-view'),
  ('windthorst-at-henrietta-2026-week-4', 'windthorst', 'henrietta'),
  ('winters-at-cross-plains-2026-week-10', 'winters', 'cross-plains'),
  ('winters-at-goldthwaite-2026-week-5', 'winters', 'goldthwaite'),
  ('winters-at-hamlin-2026-week-8', 'winters', 'hamlin'),
  ('winters-at-san-angelo-tlca-2026-week-3', 'winters', 'san-angelo-texas-leadership'),
  ('wortham-at-blooming-grove-2026-week-3', 'wortham', 'blooming-grove'),
  ('wortham-at-frost-2026-week-10', 'wortham', 'frost'),
  ('wortham-at-mart-2026-week-5', 'wortham', 'mart'),
  ('wortham-at-meridian-2026-week-7', 'wortham', 'meridian'),
  ('wortham-at-valley-mills-2026-week-1', 'wortham', 'valley-mills');

-- Enforce the repository matchup at the database boundary. This trigger does not
-- scan or update historical rows as part of migration application.
create or replace function private.enforce_canonical_game_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare canonical private.canonical_game_identity%rowtype;
begin
  select * into canonical from private.canonical_game_identity where game_id = new.game_id;
  if not found then
    raise exception using errcode = '22023', message = 'Unknown canonical game ID. Register the repository matchup before writing game state.';
  end if;
  -- Historical incomplete verified finals remain untouched until the separately
  -- authorized identity-only reconciliation. No incidental update repairs them.
  if tg_op = 'UPDATE' then
    if old.verified and old.status = 'final'
       and old.away_school_slug is null and old.home_school_slug is null then
      if new.away_school_slug is distinct from old.away_school_slug
         or new.home_school_slug is distinct from old.home_school_slug then
        raise exception using errcode = '22023', message = 'Historical FINAL identity requires reviewed reconciliation.';
      end if;
      return new;
    end if;
  end if;
  if (new.away_school_slug is not null and new.away_school_slug <> canonical.away_school_slug)
     or (new.home_school_slug is not null and new.home_school_slug <> canonical.home_school_slug) then
    raise exception using errcode = '22023', message = 'Game identity does not match the canonical repository matchup.';
  end if;
  new.away_school_slug := canonical.away_school_slug;
  new.home_school_slug := canonical.home_school_slug;
  return new;
end;
$$;
revoke all on function private.enforce_canonical_game_identity() from public, anon, authenticated;
create trigger enforce_canonical_game_identity before insert or update on public.game_state
for each row execute function private.enforce_canonical_game_identity();

alter table public.game_state add column score_revision bigint not null default 0
  constraint game_state_score_revision_nonnegative check (score_revision >= 0);
create or replace function private.bump_game_score_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.score_revision := old.score_revision + 1;
  return new;
end;
$$;
revoke all on function private.bump_game_score_revision() from public,anon,authenticated;
create trigger game_state_bump_score_revision before update on public.game_state
for each row execute function private.bump_game_score_revision();

alter table public.score_submissions
  add column expected_state_updated_at timestamptz,
  add column expected_state_revision bigint,
  add column expected_state_absent boolean not null default false;

-- Preserve the existing moderation record, terminal guard, and superseding behavior.
-- The advisory transaction lock serializes even two first updates when no state row exists.
create or replace function public.apply_score_submission_review()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  affected_rows integer;
  current_state public.game_state%rowtype;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'approved' then
      perform pg_advisory_xact_lock(hashtextextended(new.game_id, 7319));
      select * into current_state from public.game_state where game_id = new.game_id for update;
      if (found and (new.expected_state_absent or new.expected_state_updated_at is null
                     or new.expected_state_revision is null
                     or current_state.updated_at is distinct from new.expected_state_updated_at
                     or current_state.score_revision is distinct from new.expected_state_revision))
         or (not found and (not new.expected_state_absent or new.expected_state_updated_at is not null
                            or new.expected_state_revision is not null)) then
        raise exception using errcode = '40001', message = 'Game changed — review the current score.';
      end if;
      new.reviewed_at := coalesce(new.reviewed_at, now());
      insert into public.score_submission_events (submission_id,event_type,actor_id,note,payload)
      values (new.id,'approved',new.reviewed_by,new.review_note,
        jsonb_build_object('game_id',new.game_id,'home_score',new.home_score,
          'away_score',new.away_score,'game_status',new.game_status,'period',new.period,'clock',new.clock));
      insert into public.game_state (
        game_id,status,home_score,away_score,period,clock,source_submission_id,
        verified,verified_at,updated_by,result_type
      ) values (
        new.game_id,new.game_status,new.home_score,new.away_score,new.period,new.clock,
        new.id,true,now(),new.reviewed_by,
        case when new.game_status='final' and new.home_score<>new.away_score then 'played' else null end
      )
      on conflict (game_id) do update set
        status=excluded.status,home_score=excluded.home_score,away_score=excluded.away_score,
        period=excluded.period,clock=excluded.clock,source_submission_id=excluded.source_submission_id,
        verified=true,verified_at=excluded.verified_at,updated_by=excluded.updated_by,
        result_type=excluded.result_type,official_winner_school_slug=null,updated_at=now()
      where not (public.game_state.verified and public.game_state.status in ('final','cancelled','postponed'));
      get diagnostics affected_rows = row_count;
      if affected_rows = 0 then
        raise exception using errcode = 'P0001', message = 'Approval blocked: this game already has a verified terminal state.';
      end if;
      update public.score_submissions set status='superseded', reviewed_by=new.reviewed_by,
        reviewed_at=now(), review_note=coalesce(review_note,'Superseded by approved score update '||new.id::text)
      where game_id=new.game_id and id<>new.id and status='pending';
    elsif new.status='rejected' then
      new.reviewed_at := coalesce(new.reviewed_at,now());
      insert into public.score_submission_events(submission_id,event_type,actor_id,note)
      values(new.id,'rejected',new.reviewed_by,new.review_note);
    elsif new.status='superseded' then
      insert into public.score_submission_events(submission_id,event_type,actor_id,note)
      values(new.id,'superseded',new.reviewed_by,new.review_note);
    end if;
  end if;
  return new;
end;
$$;

-- This single RPC is the trusted live/first-FINAL path. Ordinary members continue
-- using submit_score_submission and remain pending for review.
create function public.submit_trusted_score_update(
  p_game_id text, p_home_score integer, p_away_score integer, p_game_status text,
  p_period text, p_clock text, p_source_note text,
  p_expected_state_updated_at timestamptz, p_expected_state_revision bigint,
  p_expected_state_absent boolean
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare actor_id uuid := auth.uid(); submission_id uuid;
begin
  if actor_id is null or not private.can_moderate_scores() then
    raise exception using errcode='42501', message='Trusted score authority required.';
  end if;
  if p_game_status not in ('live','final') or p_away_score is null or p_home_score is null
    or p_away_score not between 0 and 150 or p_home_score not between 0 and 150
    or char_length(coalesce(p_period,''))>30 or char_length(coalesce(p_clock,''))>30
    or char_length(coalesce(p_source_note,''))>1000 then
    raise exception using errcode='22023', message='Invalid score or status.';
  end if;
  insert into public.score_submissions(
    game_id,submitted_by,home_score,away_score,game_status,period,clock,source_note,
    expected_state_updated_at,expected_state_revision,expected_state_absent
  ) values (
    p_game_id,actor_id,p_home_score,p_away_score,p_game_status,
    case when p_game_status='live' then nullif(btrim(p_period),'') else null end,
    case when p_game_status='live' then nullif(btrim(p_clock),'') else null end,
    nullif(btrim(p_source_note),''),p_expected_state_updated_at,p_expected_state_revision,p_expected_state_absent
  ) returning id into submission_id;
  update public.score_submissions set status='approved',reviewed_by=actor_id,
    review_note='Approved at submission by trusted score authority.'
  where id=submission_id and status='pending';
  return submission_id;
end;
$$;
revoke all on function public.submit_trusted_score_update(text,integer,integer,text,text,text,text,timestamptz,bigint,boolean) from public,anon;
grant execute on function public.submit_trusted_score_update(text,integer,integer,text,text,text,text,timestamptz,bigint,boolean) to authenticated;

-- The legacy trusted branch must not bypass the expected-state marker.
create or replace function public.submit_score_submission(
  p_game_id text,p_home_score integer,p_away_score integer,p_game_status text,
  p_period text default null,p_clock text default null,p_source_note text default null
) returns table(submission_id uuid,submission_status public.score_submission_status)
language plpgsql security invoker set search_path = '' as $$
declare actor_id uuid := auth.uid(); created_submission_id uuid;
begin
  if actor_id is null then raise exception using errcode='42501',message='Authentication required.'; end if;
  if private.can_moderate_scores() then
    raise exception using errcode='22023',message='Trusted operators must use the scoring operations editor.';
  end if;
  insert into public.score_submissions(game_id,submitted_by,home_score,away_score,game_status,period,clock,source_note)
  values(p_game_id,actor_id,p_home_score,p_away_score,p_game_status,p_period,p_clock,p_source_note)
  returning id into created_submission_id;
  return query select s.id,s.status from public.score_submissions s where s.id=created_submission_id;
end;
$$;
