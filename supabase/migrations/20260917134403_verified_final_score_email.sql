-- Growth Phase 1, Phase 7: connect newly verified football finals to the
-- durable Phase 6 member product-email engine.
--
-- The integration is dormant until private.final_score_email_activation is
-- explicitly activated after the application renderer is deployed. A durable
-- minimum game date and baseline of already-final game IDs exclude historical
-- results. No scan or backfill is performed.

create table private.final_score_notification_games (
  game_id text primary key,
  game_date date not null,
  kickoff text not null,
  away_team_name text not null check (char_length(away_team_name) between 1 and 120),
  home_team_name text not null check (char_length(home_team_name) between 1 and 120),
  away_school_slug text check (
    away_school_slug is null
    or away_school_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  home_school_slug text check (
    home_school_slug is null
    or home_school_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint final_score_notification_games_has_followable_school check (
    away_school_slug is not null or home_school_slug is not null
  )
);

create table private.final_score_email_activation (
  singleton boolean primary key default true check (singleton),
  activated_at timestamptz,
  minimum_game_date date,
  baseline_verified_final_game_ids text[] not null default '{}',
  activated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint final_score_email_activation_complete check (
    (activated_at is null and minimum_game_date is null)
    or (activated_at is not null and minimum_game_date is not null)
  )
);

insert into private.final_score_email_activation (singleton) values (true);

alter table private.final_score_notification_games enable row level security;
alter table private.final_score_email_activation enable row level security;

revoke all on table private.final_score_notification_games
  from public, anon, authenticated;
revoke all on table private.final_score_email_activation
  from public, anon, authenticated;

insert into private.final_score_notification_games (
  game_id, game_date, kickoff, away_team_name, home_team_name,
  away_school_slug, home_school_slug
) values
  ('midlothian-heritage-at-stephenville-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Midlothian Heritage', 'Stephenville', 'midlothian-heritage', 'stephenville'),
  ('stephenville-at-brownwood-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Stephenville', 'Brownwood', 'stephenville', 'brownwood'),
  ('lubbock-cooper-at-stephenville-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Lubbock Cooper', 'Stephenville', 'lubbock-cooper', 'stephenville'),
  ('stephenville-at-abilene-wylie-2026-week-4', '2026-09-18'::date, '2026-09-18T19:00:00-05:00', 'Stephenville', 'Abilene Wylie', 'stephenville', 'abilene-wylie'),
  ('stephenville-vs-canyon-west-plains-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Canyon West Plains', 'Stephenville', 'canyon-west-plains', 'stephenville'),
  ('lampasas-at-stephenville-2026-week-7', '2026-10-09'::date, '2026-10-09T19:00:00-05:00', 'Lampasas', 'Stephenville', 'lampasas', 'stephenville'),
  ('china-spring-at-stephenville-2026-week-8', '2026-10-16'::date, '2026-10-16T19:00:00-05:00', 'China Spring', 'Stephenville', 'china-spring', 'stephenville'),
  ('stephenville-at-jarrell-2026-week-9', '2026-10-23'::date, '2026-10-23T19:00:00-05:00', 'Stephenville', 'Jarrell', 'stephenville', 'jarrell'),
  ('burnet-at-stephenville-2026-week-10', '2026-10-30'::date, '2026-10-30T19:00:00-05:00', 'Burnet', 'Stephenville', 'burnet', 'stephenville'),
  ('stephenville-at-marble-falls-2026-week-11', '2026-11-06'::date, '2026-11-06T19:00:00-06:00', 'Stephenville', 'Marble Falls', 'stephenville', 'marble-falls'),
  ('cisco-at-clyde-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Cisco', 'Clyde', 'cisco', 'clyde'),
  ('breckenridge-at-cisco-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Breckenridge', 'Cisco', 'breckenridge', 'cisco'),
  ('cisco-at-stamford-2026-week-4', '2026-09-18'::date, '2026-09-18T19:00:00-05:00', 'Cisco', 'Stamford', 'cisco', 'stamford'),
  ('jacksboro-at-cisco-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Jacksboro', 'Cisco', 'jacksboro', 'cisco'),
  ('anson-at-cisco-2026-week-7', '2026-10-09'::date, '2026-10-09T19:00:00-05:00', 'Anson', 'Cisco', 'anson', 'cisco'),
  ('abilene-tlca-at-cisco-2026-week-9', '2026-10-23'::date, '2026-10-23T19:00:00-05:00', 'Abilene Texas Leadership', 'Cisco', 'abilene-texas-leadership', 'cisco'),
  ('cisco-at-hico-2026-week-10', '2026-10-30'::date, '2026-10-30T19:00:00-05:00', 'Cisco', 'Hico', 'cisco', 'hico'),
  ('de-leon-at-cisco-2026-week-11', '2026-11-06'::date, '2026-11-06T19:00:00-06:00', 'De Leon', 'Cisco', 'de-leon', 'cisco'),
  ('breckenridge-at-comanche-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Breckenridge', 'Comanche', 'breckenridge', 'comanche'),
  ('comanche-at-cisco-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Comanche', 'Cisco', 'comanche', 'cisco'),
  ('clyde-at-comanche-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Clyde', 'Comanche', 'clyde', 'comanche'),
  ('comanche-at-clifton-2026-week-4', '2026-09-18'::date, '2026-09-18T19:00:00-05:00', 'Comanche', 'Clifton', 'comanche', 'clifton'),
  ('tolar-at-comanche-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Tolar', 'Comanche', 'tolar', 'comanche'),
  ('comanche-at-millsap-2026-week-7', '2026-10-09'::date, '2026-10-09T19:00:00-05:00', 'Comanche', 'Millsap', 'comanche', 'millsap'),
  ('comanche-at-dublin-2026-week-8', '2026-10-16'::date, '2026-10-16T19:00:00-05:00', 'Comanche', 'Dublin', 'comanche', 'dublin'),
  ('rio-vista-at-comanche-2026-week-9', '2026-10-23'::date, '2026-10-23T19:00:00-05:00', 'Rio Vista', 'Comanche', 'rio-vista', 'comanche'),
  ('comanche-at-eastland-2026-week-10', '2026-10-30'::date, '2026-10-30T19:00:00-05:00', 'Comanche', 'Eastland', 'comanche', 'eastland'),
  ('hamilton-at-comanche-2026-week-11', '2026-11-06'::date, '2026-11-06T19:00:00-06:00', 'Hamilton', 'Comanche', 'hamilton', 'comanche'),
  ('san-saba-at-de-leon-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'San Saba', 'De Leon', 'san-saba', 'de-leon'),
  ('early-at-de-leon-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Early', 'De Leon', 'early', 'de-leon'),
  ('hico-at-de-leon-2026-week-8', '2026-10-16'::date, '2026-10-16T19:00:00-05:00', 'Hico', 'De Leon', 'hico', 'de-leon'),
  ('de-leon-at-anson-2026-week-9', '2026-10-23'::date, '2026-10-23T19:00:00-05:00', 'De Leon', 'Anson', 'de-leon', 'anson'),
  ('abilene-tlca-at-de-leon-2026-week-10', '2026-10-30'::date, '2026-10-30T19:00:00-05:00', 'Abilene Texas Leadership', 'De Leon', 'abilene-texas-leadership', 'de-leon'),
  ('holland-at-hico-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Holland', 'Hico', 'holland', 'hico'),
  ('cross-plains-at-hico-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Cross Plains', 'Hico', 'cross-plains', 'hico'),
  ('hico-at-moody-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Hico', 'Moody', 'hico', 'moody'),
  ('hico-at-meridian-2026-week-4', '2026-09-18'::date, '2026-09-18T19:00:00-05:00', 'Hico', 'Meridian', 'hico', 'meridian'),
  ('florence-at-hico-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Florence', 'Hico', 'florence', 'hico'),
  ('abilene-tlca-at-hico-2026-week-7', '2026-10-09'::date, '2026-10-09T19:00:00-05:00', 'Abilene Texas Leadership', 'Hico', 'abilene-texas-leadership', 'hico'),
  ('hico-at-anson-2026-week-11', '2026-11-06'::date, '2026-11-06T19:00:00-06:00', 'Hico', 'Anson', 'hico', 'anson'),
  ('hawley-at-merkel-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Hawley', 'Merkel', 'hawley', 'merkel'),
  ('early-at-hawley-2026-week-4', '2026-09-18'::date, '2026-09-18T19:00:00-05:00', 'Early', 'Hawley', 'early', 'hawley'),
  ('hawley-at-post-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Hawley', 'Post', 'hawley', 'post'),
  ('de-leon-at-hawley-2026-week-7', '2026-10-09'::date, '2026-10-09T19:00:00-05:00', 'De Leon', 'Hawley', 'de-leon', 'hawley'),
  ('cisco-at-hawley-2026-week-8', '2026-10-16'::date, '2026-10-16T19:00:00-05:00', 'Cisco', 'Hawley', 'cisco', 'hawley'),
  ('hawley-at-hico-2026-week-9', '2026-10-23'::date, '2026-10-23T19:00:00-05:00', 'Hawley', 'Hico', 'hawley', 'hico'),
  ('anson-at-hawley-2026-week-10', '2026-10-30'::date, '2026-10-30T19:00:00-05:00', 'Anson', 'Hawley', 'anson', 'hawley'),
  ('hawley-at-abilene-tlca-2026-week-11', '2026-11-05'::date, '2026-11-05T19:00:00-06:00', 'Hawley', 'Abilene Texas Leadership', 'hawley', 'abilene-texas-leadership'),
  ('hawley-at-albany-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Hawley', 'Albany', 'hawley', 'albany'),
  ('anson-at-albany-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Anson', 'Albany', 'anson', 'albany'),
  ('albany-at-de-leon-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Albany', 'De Leon', 'albany', 'de-leon'),
  ('albany-at-coleman-2026-week-4', '2026-09-18'::date, '2026-09-18T19:00:00-05:00', 'Albany', 'Coleman', 'albany', 'coleman'),
  ('cross-plains-at-albany-2026-week-6', '2026-10-02'::date, '2026-10-02T19:00:00-05:00', 'Cross Plains', 'Albany', 'cross-plains', 'albany'),
  ('albany-at-winters-2026-week-9', '2026-10-23'::date, '2026-10-23T19:00:00-05:00', 'Albany', 'Winters', 'albany', 'winters'),
  ('miles-at-albany-2026-week-10', '2026-10-30'::date, '2026-10-30T19:00:00-05:00', 'Miles', 'Albany', 'miles', 'albany'),
  ('albany-at-hamlin-2026-week-11', '2026-11-06'::date, '2026-11-06T19:00:00-06:00', 'Albany', 'Hamlin', 'albany', 'hamlin'),
  ('stamford-at-haskell-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Stamford', 'Haskell', 'stamford', 'haskell'),
  ('de-leon-at-stamford-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'De Leon', 'Stamford', 'de-leon', 'stamford'),
  ('stamford-at-hawley-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Stamford', 'Hawley', 'stamford', 'hawley'),
  ('miles-at-stamford-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Miles', 'Stamford', 'miles', 'stamford'),
  ('stamford-at-hamlin-2026-week-6', '2026-10-02'::date, '2026-10-02T19:00:00-05:00', 'Stamford', 'Hamlin', 'stamford', 'hamlin'),
  ('albany-at-stamford-2026-week-7', '2026-10-09'::date, '2026-10-09T19:00:00-05:00', 'Albany', 'Stamford', 'albany', 'stamford'),
  ('stamford-at-cross-plains-2026-week-8', '2026-10-16'::date, '2026-10-16T19:00:00-05:00', 'Stamford', 'Cross Plains', 'stamford', 'cross-plains'),
  ('goldthwaite-at-stamford-2026-week-10', '2026-10-30'::date, '2026-10-30T19:00:00-05:00', 'Goldthwaite', 'Stamford', 'goldthwaite', 'stamford'),
  ('stamford-at-winters-2026-week-11', '2026-11-06'::date, '2026-11-06T19:00:00-06:00', 'Stamford', 'Winters', 'stamford', 'winters'),
  ('junction-at-goldthwaite-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Junction', 'Goldthwaite', 'junction', 'goldthwaite'),
  ('goldthwaite-at-granger-2026-week-2', '2026-09-04'::date, '2026-09-04T19:30:00-05:00', 'Goldthwaite', 'Granger', 'goldthwaite', 'granger'),
  ('goldthwaite-at-san-saba-2026-week-3', '2026-09-11'::date, '2026-09-11T19:30:00-05:00', 'Goldthwaite', 'San Saba', 'goldthwaite', 'san-saba'),
  ('de-leon-at-goldthwaite-2026-week-4', '2026-09-18'::date, '2026-09-18T19:00:00-05:00', 'De Leon', 'Goldthwaite', 'de-leon', 'goldthwaite'),
  ('winters-at-goldthwaite-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Winters', 'Goldthwaite', 'winters', 'goldthwaite'),
  ('goldthwaite-at-miles-2026-week-6', '2026-10-02'::date, '2026-10-02T19:00:00-05:00', 'Goldthwaite', 'Miles', 'goldthwaite', 'miles'),
  ('hamlin-at-goldthwaite-2026-week-7', '2026-10-09'::date, '2026-10-09T19:00:00-05:00', 'Hamlin', 'Goldthwaite', 'hamlin', 'goldthwaite'),
  ('goldthwaite-at-albany-2026-week-8', '2026-10-16'::date, '2026-10-16T19:00:00-05:00', 'Goldthwaite', 'Albany', 'goldthwaite', 'albany'),
  ('cross-plains-at-goldthwaite-2026-week-9', '2026-10-23'::date, '2026-10-23T19:00:00-05:00', 'Cross Plains', 'Goldthwaite', 'cross-plains', 'goldthwaite'),
  ('brownwood-at-abilene-wylie-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Brownwood', 'Abilene Wylie', 'brownwood', 'abilene-wylie'),
  ('hamilton-at-bremond-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Hamilton', 'Bremond', 'hamilton', null),
  ('reagan-county-at-mason-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Reagan County', 'Mason', null, 'mason'),
  ('post-at-anson-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Post', 'Anson', 'post', 'anson'),
  ('ballinger-at-eastland-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Ballinger', 'Eastland', null, 'eastland'),
  ('merkel-at-early-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Merkel', 'Early', 'merkel', 'early'),
  ('baird-vs-abilene-tlca-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Baird', 'Abilene Texas Leadership', null, 'abilene-texas-leadership'),
  ('tolar-at-boyd-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Tolar', 'Boyd', 'tolar', null),
  ('coleman-at-grape-creek-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Coleman', 'Grape Creek', 'coleman', null),
  ('dublin-at-bangs-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Dublin', 'Bangs', 'dublin', 'bangs'),
  ('bruceville-eddy-at-cross-plains-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Bruceville-Eddy', 'Cross Plains', null, 'cross-plains'),
  ('crosbyton-at-hamlin-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Crosbyton', 'Hamlin', null, 'hamlin'),
  ('sonora-at-miles-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Sonora', 'Miles', null, 'miles'),
  ('abilene-texas-leadership-at-san-angelo-texas-leadership-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Abilene Texas Leadership', 'San Angelo TLCA', 'abilene-texas-leadership', null),
  ('santo-at-chilton-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Santo', 'Chilton', 'santo', null),
  ('santo-at-dublin-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Santo', 'Dublin', 'santo', 'dublin'),
  ('haskell-at-santo-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Haskell', 'Santo', 'haskell', 'santo'),
  ('roscoe-at-santo-2026-week-4', '2026-09-18'::date, '2026-09-18T19:00:00-05:00', 'Roscoe', 'Santo', 'roscoe', 'santo'),
  ('crawford-at-santo-2026-week-5', '2026-09-25'::date, '2026-09-25T19:00:00-05:00', 'Crawford', 'Santo', 'crawford', 'santo'),
  ('santo-at-frost-2026-week-6', '2026-10-02'::date, '2026-10-02T19:00:00-05:00', 'Santo', 'Frost', 'santo', 'frost'),
  ('mart-at-santo-2026-week-8', '2026-10-16'::date, '2026-10-16T19:00:00-05:00', 'Mart', 'Santo', 'mart', 'santo'),
  ('santo-at-hubbard-2026-week-9', '2026-10-23'::date, '2026-10-23T19:00:00-05:00', 'Santo', 'Hubbard', 'santo', 'hubbard'),
  ('meridian-at-santo-2026-week-10', '2026-10-30'::date, '2026-10-30T19:00:00-05:00', 'Meridian', 'Santo', 'meridian', 'santo'),
  ('santo-at-wortham-2026-week-11', '2026-11-06'::date, '2026-11-06T19:00:00-06:00', 'Santo', 'Wortham', 'santo', 'wortham'),
  ('hamlin-at-seymour-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Hamlin', 'Seymour', 'hamlin', 'seymour'),
  ('miles-at-christoval-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Miles', 'Christoval', 'miles', 'christoval'),
  ('shamrock-at-winters-2026-week-1', '2026-08-27'::date, '2026-08-27T19:00:00-05:00', 'Shamrock', 'Winters', null, 'winters'),
  ('colorado-city-at-winters-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Colorado City', 'Winters', 'colorado-city', 'winters'),
  ('crawford-at-mcgregor-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Crawford', 'McGregor', 'crawford', null),
  ('centerville-at-crawford-2026-week-2', '2026-09-04'::date, '2026-09-04T19:30:00-05:00', 'Centerville', 'Crawford', null, 'crawford'),
  ('frost-at-blooming-grove-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Frost', 'Blooming Grove', 'frost', 'blooming-grove'),
  ('itasca-at-frost-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Itasca', 'Frost', 'itasca', 'frost'),
  ('hubbard-at-milano-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Hubbard', 'Milano', 'hubbard', null),
  ('snook-at-hubbard-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Snook', 'Hubbard', null, 'hubbard'),
  ('whitney-at-mart-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Whitney', 'Mart', null, 'mart'),
  ('mart-at-axtell-2026-week-2', '2026-09-04'::date, '2026-09-04T19:30:00-05:00', 'Mart', 'Axtell', 'mart', null),
  ('dawson-at-meridian-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Dawson', 'Meridian', null, 'meridian'),
  ('cross-roads-at-meridian-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Cross Roads', 'Meridian', null, 'meridian'),
  ('itasca-at-meridian-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Itasca', 'Meridian', 'itasca', 'meridian'),
  ('wortham-at-valley-mills-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Wortham', 'Valley Mills', 'wortham', 'valley-mills'),
  ('dawson-at-wortham-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Dawson', 'Wortham', null, 'wortham'),
  ('san-saba-at-eastland-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'San Saba', 'Eastland', 'san-saba', 'eastland'),
  ('mason-at-hamilton-2026-week-2', '2026-09-04'::date, '2026-09-04T19:30:00-05:00', 'Mason', 'Hamilton', 'mason', 'hamilton'),
  ('millsap-at-jacksboro-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Millsap', 'Jacksboro', 'millsap', 'jacksboro'),
  ('millsap-at-callisburg-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Millsap', 'Callisburg', 'millsap', null),
  ('kerens-at-rio-vista-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Kerens', 'Rio Vista', null, 'rio-vista'),
  ('rio-vista-at-rosebud-lott-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Rio Vista', 'Rosebud-Lott', 'rio-vista', null),
  ('clyde-at-tolar-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Clyde', 'Tolar', 'clyde', 'tolar'),
  ('clifton-at-bosqueville-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Clifton', 'Bosqueville', 'clifton', null),
  ('west-at-clifton-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'West', 'Clifton', null, 'clifton'),
  ('burnet-at-llano-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Burnet', 'Llano', 'burnet', null),
  ('taylor-at-burnet-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Taylor', 'Burnet', null, 'burnet'),
  ('china-spring-at-waco-connally-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'China Spring', 'Waco Connally', 'china-spring', null),
  ('china-spring-at-waco-university-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'China Spring', 'Waco University', 'china-spring', null),
  ('austin-navarro-at-jarrell-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Austin Navarro', 'Jarrell', null, 'jarrell'),
  ('midland-christian-at-jarrell-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Midland Christian', 'Jarrell', null, 'jarrell'),
  ('lampasas-at-gatesville-2026-week-1', '2026-08-28'::date, '2026-08-28T19:30:00-05:00', 'Lampasas', 'Gatesville', 'lampasas', null),
  ('pflugerville-connally-at-lampasas-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Pflugerville Connally', 'Lampasas', null, 'lampasas'),
  ('lockhart-at-marble-falls-2026-week-1', '2026-08-28'::date, '2026-08-28T19:00:00-05:00', 'Lockhart', 'Marble Falls', null, 'marble-falls'),
  ('little-river-academy-at-marble-falls-2026-week-2', '2026-09-04'::date, '2026-09-04T19:00:00-05:00', 'Little River Academy', 'Marble Falls', null, 'marble-falls'),
  ('olney-at-anson-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Olney', 'Anson', 'olney', 'anson'),
  ('eastland-at-grape-creek-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Eastland', 'Grape Creek', 'eastland', null),
  ('hamilton-at-brady-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Hamilton', 'Brady', 'hamilton', 'brady'),
  ('keene-at-dublin-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Keene', 'Dublin', null, 'dublin'),
  ('mcgregor-at-millsap-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'McGregor', 'Millsap', null, 'millsap'),
  ('atlas-homeschool-at-rio-vista-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Atlas HomeSchool', 'Rio Vista', null, 'rio-vista'),
  ('tolar-at-mart-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Tolar', 'Mart', 'tolar', 'mart'),
  ('austin-at-jarrell-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Austin', 'Jarrell', null, 'jarrell'),
  ('marble-falls-at-fredericksburg-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Marble Falls', 'Fredericksburg', 'marble-falls', null),
  ('lago-vista-at-burnet-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Lago Vista', 'Burnet', null, 'burnet'),
  ('lampasas-at-central-catholic-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Lampasas', 'Central Catholic', 'lampasas', null),
  ('gatesville-at-china-spring-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Gatesville', 'China Spring', null, 'china-spring'),
  ('clifton-at-italy-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Clifton', 'Italy', 'clifton', null),
  ('cross-plains-at-bangs-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Cross Plains', 'Bangs', 'cross-plains', 'bangs'),
  ('hamlin-at-archer-city-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Hamlin', 'Archer City', 'hamlin', null),
  ('reagan-county-at-miles-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Reagan County', 'Miles', null, 'miles'),
  ('winters-at-san-angelo-tlca-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Winters', 'San Angelo TLCA', 'winters', null),
  ('riesel-at-frost-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Riesel', 'Frost', null, 'frost'),
  ('hubbard-at-dawson-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Hubbard', 'Dawson', 'hubbard', null),
  ('valley-mills-at-crawford-2026-week-3', '2026-09-11'::date, '2026-09-11T19:30:00-05:00', 'Valley Mills', 'Crawford', 'valley-mills', 'crawford'),
  ('wortham-at-blooming-grove-2026-week-3', '2026-09-11'::date, '2026-09-11T19:30:00-05:00', 'Wortham', 'Blooming Grove', 'wortham', 'blooming-grove'),
  ('abilene-texas-leadership-at-coleman-2026-week-3', '2026-09-11'::date, '2026-09-11T19:00:00-05:00', 'Abilene Texas Leadership', 'Coleman', 'abilene-texas-leadership', 'coleman')
;

create or replace function private.create_verified_final_score_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activation private.final_score_email_activation%rowtype;
  game private.final_score_notification_games%rowtype;
  school_slugs text[];
  created_event_id uuid;
begin
  if not new.verified
     or new.status <> 'final'
     or new.home_score is null
     or new.away_score is null then
    return new;
  end if;

  -- Only the first verified-final transition is notification-worthy.
  if tg_op = 'UPDATE'
     and old.verified
     and old.status = 'final' then
    return new;
  end if;

  select config.* into activation
  from private.final_score_email_activation config
  where config.singleton;

  if activation.activated_at is null
     or new.verified_at is null
     or new.verified_at < activation.activated_at
     or new.game_id = any(activation.baseline_verified_final_game_ids) then
    return new;
  end if;

  select registered_game.* into game
  from private.final_score_notification_games registered_game
  where registered_game.game_id = new.game_id;

  -- Unregistered IDs are not canonical repository games and cannot create
  -- member email events.
  if game.game_id is null or game.game_date < activation.minimum_game_date then
    return new;
  end if;

  select array_agg(distinct slug order by slug)
  into school_slugs
  from unnest(array[game.away_school_slug, game.home_school_slug]) slug
  where slug is not null;

  if school_slugs is null or cardinality(school_slugs) = 0 then
    return new;
  end if;

  insert into private.product_notification_events (
    category,
    source_key,
    relevant_school_slugs,
    occurred_at,
    content_snapshot,
    test_only,
    created_by
  ) values (
    'final_score',
    'game-final:' || new.game_id,
    school_slugs,
    new.verified_at,
    jsonb_build_object(
      'kind', 'verified_final',
      'game_id', new.game_id,
      'game_date', game.game_date,
      'kickoff', game.kickoff,
      'away_team_name', game.away_team_name,
      'home_team_name', game.home_team_name,
      'away_school_slug', game.away_school_slug,
      'home_school_slug', game.home_school_slug,
      'away_score', new.away_score,
      'home_score', new.home_score,
      'final_status', 'final',
      'verified_at', new.verified_at,
      'cta_path', '/games/' || new.game_id
    ),
    false,
    new.updated_by
  )
  on conflict (category, source_key) do nothing
  returning id into created_event_id;

  if created_event_id is not null then
    perform private.materialize_product_notification_event(created_event_id);
  end if;

  return new;
end;
$$;

revoke all on function private.create_verified_final_score_event()
  from public, anon, authenticated;

create trigger create_product_event_after_verified_final
after insert or update on public.game_state
for each row
execute function private.create_verified_final_score_event();

-- Version the worker claim interface so the existing Phase 6 function remains
-- available during deployment. The v2 result adds the recipient's matching
-- followed school slugs for truthful member-facing explanation copy.
create or replace function public.claim_product_email_delivery_v2(worker_secret text)
returns table (
  delivery_id uuid,
  claim_token uuid,
  event_id uuid,
  category text,
  recipient_user_id uuid,
  recipient_email text,
  attempt_count integer,
  relevant_school_slugs text[],
  matched_school_slugs text[],
  content_snapshot jsonb,
  occurred_at timestamptz,
  test_only boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate private.product_email_deliveries%rowtype;
  event_row private.product_notification_events%rowtype;
  current_email text;
  current_matched_school_slugs text[];
  eligible boolean;
  acceptance_count integer;
  acceptance_limit integer;
begin
  if not private.product_email_worker_authorized(worker_secret) then
    raise exception 'Invalid product email worker credentials';
  end if;

  select config.max_provider_acceptances_per_24h into acceptance_limit
  from private.product_email_worker_config config
  where config.singleton;

  select count(*)::integer into acceptance_count
  from private.product_email_deliveries delivery
  where delivery.provider_accepted_at >= now() - interval '24 hours';

  if acceptance_count >= acceptance_limit then
    return;
  end if;

  loop
    select delivery.*
    into candidate
    from private.product_email_deliveries delivery
    where (
        delivery.status in ('pending', 'retryable')
        and delivery.next_attempt_at <= now()
      ) or (
        delivery.status = 'processing'
        and delivery.claimed_at < now() - interval '10 minutes'
      )
    order by delivery.created_at, delivery.id
    for update skip locked
    limit 1;

    if candidate.id is null then
      return;
    end if;

    if candidate.status = 'processing'
       and candidate.first_attempt_at is not null
       and candidate.first_attempt_at < now() - interval '23 hours' then
      update private.product_email_deliveries delivery
      set status = 'terminal_failed',
          claimed_at = null,
          claim_token = null,
          last_error = 'Ambiguous provider acceptance exceeded the safe idempotency retry window',
          updated_at = now()
      where delivery.id = candidate.id;
      candidate := null;
      continue;
    end if;

    select event.* into event_row
    from private.product_notification_events event
    where event.id = candidate.event_id;

    select lower(btrim(auth_user.email)) into current_email
    from auth.users auth_user
    where auth_user.id = candidate.recipient_user_id
      and auth_user.email is not null
      and auth_user.email_confirmed_at is not null;

    select array_agg(follow.school_slug order by follow.school_slug)
    into current_matched_school_slugs
    from public.school_follows follow
    where follow.user_id = candidate.recipient_user_id
      and follow.school_slug = any(event_row.relevant_school_slugs);

    select
      candidate.recipient_user_id is not null
      and current_email is not null
      and exists (
        select 1
        from public.member_account_status account_status
        where account_status.user_id = candidate.recipient_user_id
          and account_status.status = 'active'
      )
      and exists (
        select 1
        from public.member_notification_preferences preferences
        where preferences.user_id = candidate.recipient_user_id
          and case candidate.category
            when 'final_score' then preferences.final_score_email
            when 'new_coverage' then preferences.new_coverage_email
            else false
          end
      )
      and coalesce(cardinality(current_matched_school_slugs), 0) > 0
      and not exists (
        select 1
        from private.product_email_suppressions suppression
        where suppression.email_sha256 = encode(
          extensions.digest(current_email, 'sha256'),
          'hex'
        )
      )
    into eligible;

    if not coalesce(eligible, false) then
      update private.product_email_deliveries delivery
      set status = 'cancelled',
          cancelled_at = now(),
          claimed_at = null,
          claim_token = null,
          recipient_email = case
            when candidate.recipient_user_id is null then null
            else delivery.recipient_email
          end,
          last_error = 'Recipient no longer eligible before provider send',
          updated_at = now()
      where delivery.id = candidate.id;
      candidate := null;
      continue;
    end if;

    candidate.claim_token := gen_random_uuid();

    update private.product_email_deliveries delivery
    set status = 'processing',
        recipient_email = current_email,
        attempt_count = delivery.attempt_count + 1,
        first_attempt_at = coalesce(delivery.first_attempt_at, now()),
        claimed_at = now(),
        claim_token = candidate.claim_token,
        last_error = null,
        updated_at = now()
    where delivery.id = candidate.id
    returning delivery.* into candidate;

    return query
    select
      candidate.id,
      candidate.claim_token,
      event_row.id,
      candidate.category,
      candidate.recipient_user_id,
      current_email,
      candidate.attempt_count,
      event_row.relevant_school_slugs,
      current_matched_school_slugs,
      event_row.content_snapshot,
      event_row.occurred_at,
      event_row.test_only;
    return;
  end loop;
end;
$$;

revoke all on function public.claim_product_email_delivery_v2(text)
  from public, authenticated, service_role;
grant execute on function public.claim_product_email_delivery_v2(text) to anon;
