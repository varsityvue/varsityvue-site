#!/usr/bin/env bash
set -euo pipefail
# Compare unchanged main using only the same fixed disposable loopback database.
[[ ${1:-} =~ ^[a-f0-9]{40}$ ]]
baseline_root=$(mktemp -d)
trap 'git worktree remove --force "$baseline_root/repo"; rm -rf "$baseline_root"' EXIT
git worktree add --detach "$baseline_root/repo" "$1"
ln -s "$PWD/node_modules" "$baseline_root/repo/node_modules"
cd "$baseline_root/repo"
bash supabase/tests/coverage_demand_operations_race.sh
bash supabase/tests/coverage_demand_race.sh
