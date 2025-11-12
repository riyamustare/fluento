#!/usr/bin/env bash
# Minimal script to run an RQ worker in production
set -e

REDIS_URL=${REDIS_URL:-redis://localhost:6379/0}
export REDIS_URL

echo "Starting RQ worker on queue 'default' (Redis: $REDIS_URL)"
echo "Starting multiple RQ workers (count=${WORKER_COUNT:-2})"
WORKER_COUNT=${WORKER_COUNT:-2}
for i in $(seq 1 $WORKER_COUNT); do
	echo "Starting worker $i"
	rq worker default &
done
wait
