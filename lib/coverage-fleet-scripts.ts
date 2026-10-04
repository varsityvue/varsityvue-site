// Fixed operational schema only. No per-request or per-instance keys.
export const FLEET_PREFIX = "coverage:fleet:v1:";
export const FLEET_CLOCK = "local now = tonumber(redis.call('TIME')[1])";
const common = `
${FLEET_CLOCK}
local current = math.floor(now / 300)
local latest = math.floor((now - 30) / 300) - 1
local state = KEYS[1]
for _, key in ipairs(KEYS) do
  local kind = redis.call('TYPE', key).ok
  if kind ~= 'none' and kind ~= 'hash' then return redis.error_reply('invalid store') end
end
local function num(key, field) return tonumber(redis.call('HGET', key, field) or '0') end
local function initialize()
  if redis.call('EXISTS', state) == 0 then
    redis.call('HSET', state, 'last_window', latest - 2, 'failure_streak', 0, 'capacity_streak', 0,
      'clean_windows', 0, 'incident', 4, 'revision', 1, 'notified_revision', 0,
      'notify_after', 0, 'lease_until', 0, 'transport_fault', 1, 'last_eval', 0)
  end
end
local function latch(flag)
  local old = num(state, 'incident')
  local next = bit.bor(old, flag)
  if next ~= old then
    local revision = math.min(1000000000, num(state, 'revision') + 1)
    if revision == 1000000000 then next = bit.bor(next, 4) end
    redis.call('HSET', state, 'incident', next, 'revision', revision,
      'notify_after', 0, 'lease_until', 0)
  end
end
local function uncertain()
  redis.call('HSET', state, 'transport_fault', 1, 'clean_windows', 0)
  latch(4)
end
initialize()
`;

// ARGV: window, accepted, database_failure, capacity_failure, indeterminate bit.
export const FLEET_RECORD_SCRIPT = common + `
local window = tonumber(ARGV[1])
if not window or window % 1 ~= 0 or KEYS[2] ~= '${FLEET_PREFIX}b:' .. string.format('%.0f', window) then
  return redis.error_reply('invalid bucket')
end
if window > current or window < current - 1 or now >= (window + 1) * 300 + 30
  or window <= num(state, 'last_window') or num(KEYS[2], 'finalized') == 1 then
  uncertain()
  return 0
end
local fields = {'accepted', 'database_failure', 'capacity_failure'}
local values = {}
for i, field in ipairs(fields) do
  local delta = tonumber(ARGV[i + 1])
  if not delta or delta % 1 ~= 0 or delta < 0 or delta > 1000000 then return redis.error_reply('invalid delta') end
  local value = num(KEYS[2], field) + delta
  values[i] = math.min(value, 1000000)
  if value >= 1000000 then uncertain() end
end
if ARGV[5] ~= '0' and ARGV[5] ~= '1' then return redis.error_reply('invalid flag') end
local bad = ARGV[5] == '1' or values[1] == 1000000 or values[2] == 1000000 or values[3] == 1000000
redis.call('HSET', KEYS[2], 'accepted', values[1], 'database_failure', values[2],
  'capacity_failure', values[3], 'finalized', 0)
if bad then redis.call('HSET', KEYS[2], 'indeterminate', 1) uncertain()
elseif redis.call('HEXISTS', KEYS[2], 'indeterminate') == 0 then redis.call('HSET', KEYS[2], 'indeterminate', 0) end
redis.call('EXPIREAT', KEYS[2], (window + 1) * 300 + 86400)
if values[2] + values[3] > 0 then redis.call('HSET', state, 'clean_windows', 0) end
return 1
`;

// KEYS: singleton, then current-14 through current buckets (15 fixed keys).
// ARGV: operation, current window, expected revision, reviewed window, signal acknowledgment.
export const FLEET_CENTRAL_SCRIPT = common + `
if tonumber(ARGV[2]) ~= current or #KEYS ~= 16 then return redis.error_reply('clock mismatch') end
for i = 2, 16 do
  if KEYS[i] ~= '${FLEET_PREFIX}b:' .. string.format('%.0f', current - 16 + i) then return redis.error_reply('invalid keys') end
end
local function bucket(window) return KEYS[window - current + 16] end
local function snapshot()
  return {num(state, 'last_window'), num(state, 'incident'), num(state, 'revision'),
    num(state, 'transport_fault'), num(state, 'clean_windows'), num(state, 'last_eval')}
end
local op = ARGV[1]
if op == 'evaluate' then
  local last = num(state, 'last_window')
  if last > latest or latest - last > 12 or (num(state, 'last_eval') > 0 and now - num(state, 'last_eval') > 660) then
    uncertain()
    redis.call('HSET', state, 'failure_streak', 0, 'capacity_streak', 0, 'clean_windows', 0)
    last = latest - 2
  end
  for window = last + 1, latest do
    local key = bucket(window)
    local a, d, c = num(key, 'accepted'), num(key, 'database_failure'), num(key, 'capacity_failure')
    local bad = num(key, 'indeterminate') == 1 or a >= 1000000 or d >= 1000000 or c >= 1000000
    local failed = d + c >= 5 and d + c >= a
    local capacity = c >= 5
    local fs = failed and math.min(2, num(state, 'failure_streak') + 1) or 0
    local cs = capacity and math.min(2, num(state, 'capacity_streak') + 1) or 0
    local clean = not bad and a > 0 and d + c == 0 and math.min(2, num(state, 'clean_windows') + 1) or 0
    if bad then uncertain() clean = 0 end
    if fs == 2 then latch(1) end
    if cs == 2 then latch(2) end
    redis.call('HSET', state, 'failure_streak', fs, 'capacity_streak', cs, 'clean_windows', clean, 'last_window', window)
    -- Materialize empty finalized windows; this distinguishes later deletion from no traffic.
    redis.call('HSET', key, 'accepted', a, 'database_failure', d, 'capacity_failure', c, 'indeterminate', bad and 1 or 0, 'finalized', 1)
    redis.call('EXPIREAT', key, (window + 1) * 300 + 86400)
  end
  -- A missing finalized recovery bucket cannot be treated as a zero-failure bucket.
  for window = latest - 1, latest do
    if num(bucket(window), 'finalized') ~= 1 then uncertain() end
  end
  redis.call('HSET', state, 'last_eval', now)
  return snapshot()
elseif op == 'review' then
  return snapshot()
elseif op == 'fault' then
  uncertain()
  return {1}
elseif op == 'recover' then
  if tonumber(ARGV[3]) ~= num(state, 'revision') or tonumber(ARGV[4]) ~= latest
    or num(state, 'last_window') ~= latest or now - num(state, 'last_eval') > 90
    or num(state, 'clean_windows') < 2 or num(state, 'incident') == 0
    or num(state, 'revision') >= 999999999 then return {0} end
  for window = latest - 1, current do
    local key = bucket(window)
    if num(key, 'database_failure') + num(key, 'capacity_failure') > 0 or num(key, 'indeterminate') == 1 then return {0} end
    if window <= latest and (num(key, 'accepted') < 1 or num(key, 'finalized') ~= 1) then return {0} end
  end
  redis.call('HSET', state, 'incident', 0, 'transport_fault', 0, 'revision', num(state, 'revision') + 1,
    'notify_after', 0, 'lease_until', 0)
  return {1}
elseif op == 'claim' then
  if num(state, 'notified_revision') >= num(state, 'revision') or now < num(state, 'notify_after')
    or now < num(state, 'lease_until') then return {0} end
  redis.call('HSET', state, 'lease_until', now + 10, 'notify_after', now + 60)
  return {num(state, 'revision'), num(state, 'incident')}
elseif op == 'ack' then
  if tonumber(ARGV[3]) == num(state, 'revision') then
    if ARGV[5] == '1' then redis.call('HSET', state, 'notified_revision', ARGV[3]) end
    redis.call('HSET', state, 'lease_until', 0)
  end
  return {1}
end
return redis.error_reply('invalid operation')
`;
