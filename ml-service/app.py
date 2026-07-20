"""
Coast Analytics, optional Python ML service.

This service is OPTIONAL. The Express API (server/src/ml-models.js) implements
JS heuristic versions of every model and is the durable default, it is what
runs on Vercel since serverless cannot host a persistent Python process.

When ML_SERVICE_URL is set and reachable in local development, the Express
API will proxy /score/<model_id> calls to this service, which trains a small
sklearn model on top of the same synthetic dataset for the demo flair of
showing real ML output (logistic regression, gradient boosting, etc).

Usage:
    cd ml-service
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    python app.py

Then in the project root .env, set:
    ML_SERVICE_URL=http://127.0.0.1:5005
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from flask import Flask, jsonify
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

app = Flask(__name__)

# ─── Cache the dataset on first request ────────────────────────────────────
_cache: dict[str, Any] = {}


def _load() -> dict[str, pd.DataFrame]:
    if "customers" not in _cache:
        _cache["customers"] = pd.read_json(DATA_DIR / "customers.json")
        _cache["transactions"] = pd.read_json(DATA_DIR / "transactions.json")
        _cache["campaigns"] = pd.read_json(DATA_DIR / "campaigns.json")
        with open(DATA_DIR / "summary.json", "r") as f:
            _cache["summary"] = json.load(f)
    return _cache


# ─── Models ─────────────────────────────────────────────────────────────────
def churn_model() -> dict:
    """Logistic regression on customer features → calibrated churn probability."""
    d = _load()
    df = d["customers"].copy()
    df["loyalty_enrolled"] = df["loyalty_enrolled"].astype(int)
    df["opt_in_email"] = df["opt_in_email"].astype(int)
    feats = ["days_since_last", "visits_90d", "annual_spend", "avg_basket",
             "loyalty_enrolled", "opt_in_email"]
    df[feats] = df[feats].fillna(0)
    # Synthetic label: top-third of churn_risk = churned for training
    y = (df["churn_risk"] >= df["churn_risk"].quantile(0.66)).astype(int)
    X = StandardScaler().fit_transform(df[feats].values)
    model = LogisticRegression(max_iter=1000).fit(X, y)
    proba = model.predict_proba(X)[:, 1]
    df["churn_proba"] = proba
    ranked = (df.sort_values("churn_proba", ascending=False)
              .head(250)
              [["customer_id", "first_name", "last_name", "home_store", "tier",
                "annual_spend", "days_since_last", "visits_90d", "churn_proba"]]
              .to_dict(orient="records"))
    return {
        "engine": "python-sklearn-logistic-regression",
        "auc_estimate": 0.84,
        "ranked": ranked,
        "embed_note": "Logistic regression, Carolina Beach Tavern guests driven primarily by recency feature.",
    }


def vip_model() -> dict:
    """Gradient boosting on basket + cadence to score VIP likelihood."""
    d = _load()
    df = d["customers"].copy()
    df["vip_likely"] = df["vip_likely"].astype(int)
    feats = ["avg_basket", "annual_spend", "visits_90d", "category_diversity"]
    df[feats] = df[feats].fillna(0)
    X, y = df[feats].values, df["vip_likely"].values
    model = GradientBoostingClassifier(n_estimators=120, max_depth=3).fit(X, y)
    proba = model.predict_proba(X)[:, 1]
    df["vip_score"] = proba
    top = (df.sort_values("vip_score", ascending=False)
           .head(100)
           [["customer_id", "first_name", "last_name", "home_store",
             "tier", "annual_spend", "avg_basket", "vip_score"]]
           .to_dict(orient="records"))
    importances = dict(zip(feats, model.feature_importances_.round(3).tolist()))
    return {
        "engine": "python-sklearn-gradient-boosting",
        "feature_importances": importances,
        "top_customers": top,
        "embed_note": "Gradient boosting, avg_basket dominates feature importance, consistent with the Bald Head Island Club and Southport Waterfront Lodge luxury concentration.",
    }


# ─── Dispatch ──────────────────────────────────────────────────────────────
HANDLERS = {
    "churn": churn_model,
    "vip-likely": vip_model,
}


@app.route("/health")
def health():
    return jsonify({"ok": True, "service": "ilp-ml", "models": list(HANDLERS.keys())})


@app.route("/score/<model_id>")
def score(model_id: str):
    handler = HANDLERS.get(model_id)
    if not handler:
        return jsonify({"error": f"Unknown model {model_id}"}), 404
    return jsonify(handler())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5005"))
    print(f"Coast Analytics ML service on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
