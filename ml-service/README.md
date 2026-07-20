# Coast Analytics, ML Service (optional)

This is the optional Python ML service. It is **not required**. The JS
heuristic engine in `server/src/ml-models.js` is the durable default and is
what runs on Vercel (serverless cannot host a persistent Python process).

When this service is running locally and `ML_SERVICE_URL` is set, the
Express API will proxy `/api/models/<id>` requests here first and fall back
to the JS heuristics if the service is unreachable.

## Run it

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Then in the project root `.env`:

```
ML_SERVICE_URL=http://127.0.0.1:5005
```

## Implemented models

- `churn`, logistic regression on guest features
- `vip-likely`, gradient boosting on basket + cadence

The other 11 models always use the JS heuristics. Extend `HANDLERS` in
`app.py` to add more.
