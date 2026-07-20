---
title: "Guest Churn Prediction for Multi-Property Operators"
slug: "guest-churn-prediction"
date: "2026-05-08"
author: "Oak Island AI"
category: "Predictive Models"
readTime: "6 min read"
excerpt: "A practical framework for scoring churn risk across hotels, dining, spa, and event properties. Includes a 45-day at-risk threshold tuned for seasonal hospitality cadence and an honest take on what win-back actually moves."
---

## The right question

The first question is not *what is our churn rate*. That number is too big and too slow. The right question is *which specific guests are about to churn this week, and what do we do for each of them*.

Answering that requires a per-guest score (not a portfolio percentage) and a sensible threshold for action.

## A 45-day at-risk threshold

For hospitality, we anchor the threshold at 45 days since last visit, combined with a churn-probability score of 0.65 or higher. The pair matters. Days-since alone produces too many false positives during the shoulder seasons (it is *normal* for a summer-resort guest to disappear in November). The probability score handles that by combining recency, frequency, and the seasonal context of the home property.

The result: a list of guests who are genuinely at risk *given the season they are in*, not just guests who have not visited recently.

## Property-level patterns we see

In the demo dataset (Northwood Hospitality Group, 9 fictional the Carolina coast properties), the at-risk rate by property looks like this:

- **Carolina Beach Tavern** (casual dining): roughly 2x the chain average. This is the canonical pattern. Casual dining attracts transient guests, and after Labor Day a meaningful slice never comes back.
- **Bald Head Island Club** (luxury resort): well below average. Loyalty in luxury resorts is sticky once the first stay converts.
- **Southport Waterfront Lodge** (spa): low at-risk rate, but high CLV concentration, so the losses you do see are expensive.
- **Holden Beach Pavilion** (event venue): structurally low repeat-visit rate. Events are one-and-done by design, so churn is measured differently here (we look at corporate-account repeat-booking instead of guest-level retention).

The reporting that matters is per-property *and* per-guest, not just chain-wide.

## What actually works for win-back

Three actions, ranked by what we see move incremental revenue when measured against a holdout:

1. **High-value win-back (Platinum and high-Gold).** A real, named offer (room credit, dining credit, spa add-on), not a percent discount. These guests notice the offer, not the percentage.
2. **Mid-tier reactivation (Gold).** A 10% to 15% offer paired with a reason to come (a seasonal package, a new menu launch, a property-specific event). The reason matters more than the discount.
3. **Silver reactivation.** A push or SMS rather than email. In our demo data, push beats email by 28% on redemption for Silver guests. Email open rates are not the right metric here, redemption is.

We deliberately do not recommend blanket reactivation campaigns to the whole at-risk pool. The discount margin matters, and the Platinum guest who would have come anyway does not need 20% off their next stay.

## What you do not do

You do not run a single chain-wide churn email. You do not optimize for open rate. You do not measure the campaign against itself, you measure it against a permanent holdout (we keep a 5% holdout across all marketing programs).

Churn prediction is useful only if it changes who you talk to and what you say to them. If the output of the model goes into the same blast that everyone else got, the model did nothing.
