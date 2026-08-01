# Meridian FastAPI Orders Service

Python subservice for BoLD FastAPI BOLA/IDOR testing. It lives in the Meridian repo for the demo,
but it must be deployed to a Python host such as Render, Railway, or Fly. Vercel's Meridian
deployment will not run this FastAPI service.

## Local Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Test

```bash
curl -H "X-User-Id: userA" http://localhost:8000/api/orders/1
curl -H "X-User-Id: userA" http://localhost:8000/api/orders/2
```

The second request is the intentional BOLA: user A reads user B's order.

## Deploy Env

```env
BOLD_INGEST_URL=...
BOLD_INGEST_KEY=...
BOLD_OWNER_FIELDS=owner_id
```
