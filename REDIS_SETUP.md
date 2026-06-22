# Redis Setup & Verification Guide

## Prerequisites

- Redis 6+ or Docker with Redis image

## Option 1: Docker (Recommended)

### Start Redis with memory limits & eviction policy

```bash
docker run -d \
  --name redis-cache \
  -p 6379:6379 \
  redis:7 \
  redis-server \
    --maxmemory 256mb \
    --maxmemory-policy allkeys-lru \
    --requirepass strongpass123
```

**With password:** Update `backend/src/main/resources/application.properties`:
```properties
redis.password=strongpass123
```

### Check Redis is running

```bash
docker logs redis-cache
docker exec redis-cache redis-cli ping
# Response: PONG
```

---

## Option 2: Local Redis Installation

### Verify Redis is running

```bash
redis-cli ping
# Response: PONG
```

### Configure memory & eviction policy in `redis.conf`

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Then restart Redis.

---

## Verify Caching Works

### 1. Start backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend should log: `Enabling caching...` or similar.

### 2. Test cache hit/miss (Example: Roles)

**First request (cache miss — hits DB):**
```bash
curl -sS http://localhost:8080/api/roles | jq .
# Response time: ~50-200ms (depends on DB)
```

**Second request immediately (cache hit — from Redis):**
```bash
curl -sS http://localhost:8080/api/roles | jq .
# Response time: ~5-20ms (Redis is ~10x faster)
```

### 3. Check cache metrics

```bash
# Cache hits
curl http://localhost:8080/actuator/metrics/cache.gets

# Cache puts
curl http://localhost:8080/actuator/metrics/cache.puts

# Full Prometheus export
curl http://localhost:8080/actuator/prometheus | grep cache
```

### 4. Verify eviction on write

**Update a role (should evict cache):**
```bash
curl -X PUT http://localhost:8080/api/roles/{roleId} \
  -H "Content-Type: application/json" \
  -d '{"name":"NewRoleName","description":"Updated"}'
```

**Next read (cache miss — DB hit again):**
```bash
curl -sS http://localhost:8080/api/roles | jq .
# Metrics should show a new cache.puts entry
```

---

## Expected Cache Behavior

| Endpoint | Cache | TTL | Eviction |
|----------|-------|-----|----------|
| GET `/api/roles` | ✅ 1h | roles | on create/update/delete role |
| GET `/api/permissions` | ✅ 1h | permissions | on create/update/delete permission |
| GET `/api/hierarchy` | ✅ 1h | roleHierarchy | on add/remove hierarchy link |
| GET `/api/dashboard/stats` | ✅ 5m | dashboard | on any role/permission/user change |
| GET `/api/users` | ✅ 15m | users | on create/update/delete/role-assign user |
| POST/PUT/DELETE endpoints | ❌ No cache | — | evict related caches |

---

## Troubleshooting

**Redis connection refused**
- Check Redis is running: `redis-cli ping`
- Verify host/port in `application.properties`
- If password set, verify `redis.password` matches

**Cache not working**
- Verify backend logs show `@EnableCaching` is active
- Check `/actuator/metrics/cache.gets` exists
- Verify no Redis connection errors in backend logs

**High response times still**
- Cache TTL may have expired (try immediately after first request)
- Check Redis memory: `redis-cli info memory`
- If memory full, eviction policy not working — restart Redis with `--maxmemory-policy`

---

## Production Checklist

- [ ] Redis runs in separate container/server (not same as app)
- [ ] Redis password set (`--requirepass` or AUTH)
- [ ] maxmemory configured (256mb minimum for this app)
- [ ] maxmemory-policy set to `allkeys-lru` or `volatile-lru`
- [ ] Redis backup/persistence enabled (AOF or RDB)
- [ ] Firewall restricts Redis access to app server only
- [ ] TLS enabled for Redis connections (optional, requires Spring config)
- [ ] Monitor: cache hit ratio, memory usage, evictions
