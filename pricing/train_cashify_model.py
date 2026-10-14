"""
Train a Cashify-style buyback price from the pricing-agent CSV.

Install:
    pip install pandas numpy scikit-learn catboost

Train:
    python pricing/train_cashify_model.py

Predict:
    python pricing/train_cashify_model.py --quote --brand Apple --model "iPhone 13" --storage 128GB --quiz "Device Age: Above 11 Months | ..."
"""

import argparse
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor, Pool
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

CSV_PATH = Path(r"C:\Users\Parth Patel\Downloads\pricing-agent-2026-10-14-05-32-06.csv")
ROOT = Path(__file__).resolve().parent
JSON_PATH = ROOT / "cashify_price_model.json"
CBM_PATH = ROOT / "cashify_price_model.cbm"

FEATURES = [
    "age_months",
    "warranty",
    "calls_ok",
    "touch_ok",
    "screen_original",
    "battery_penalty",
    "screen_damage",
    "display_defect",
    "panel_broken",
    "body_damage",
    "charger_missing",
    "has_box",
    "has_bill",
    "extra_tech",
]

# +1 means a higher value should raise the quote. Wrong-sign fits are dropped.
PRIORS = {
    "age_months": -1,
    "warranty": 1,
    "calls_ok": 1,
    "touch_ok": 1,
    "screen_original": 1,
    "battery_penalty": -1,
    "screen_damage": -1,
    "display_defect": -1,
    "panel_broken": -1,
    "body_damage": -1,
    "charger_missing": -1,
    "has_box": 1,
    "has_bill": 1,
    "extra_tech": -1,
}

LOG_CLIP = (-0.9, 0.5)
ALPHAS = [1.0, 3.0, 10.0, 30.0, 100.0]
# These exact rupee amounts repeat across flagships and cheap phones alike.
# When the same model has another quote, that quote is several times higher,
# so they are failed captures rather than buyback prices.
FAILED_QUOTE_VALUES = {480.0, 780.0, 1180.0}


def median_ape(actual, predicted):
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    return float(np.median(np.abs(predicted - actual) / np.maximum(actual, 1)))


def norm_key(value):
    return re.sub(r"\s+", " ", str(value).strip().casefold())


def storage_gb(value):
    """Last capacity in a '8 GB/256 GB' style cell, in GB."""
    if pd.isna(value):
        return np.nan
    text = str(value).upper().replace(" ", "")
    if "/" in text:
        text = text.split("/")[-1]
    match = re.search(r"(\d+\.?\d*)", text)
    if not match:
        return np.nan
    amount = float(match.group(1))
    if "TB" in text:
        amount *= 1024
    if abs(amount - round(amount)) < 1e-6:
        return int(round(amount))
    return amount


def parse_fields(quiz):
    fields = {}
    for part in str(quiz or "").split("|"):
        if ":" not in part:
            continue
        key, value = part.split(":", 1)
        fields[key.strip().casefold()] = value.strip()
    return fields


def _yes_no(text):
    if text is None or str(text).strip() == "":
        return np.nan
    folded = str(text).casefold()
    if folded.startswith("no") or "dead" in folded or "not working" in folded:
        return 0
    if folded.startswith("yes") or "working" in folded:
        return 1
    return np.nan


def _age_months(text):
    if text is None or str(text).strip() == "":
        return np.nan
    folded = str(text).casefold()
    if "above 11" in folded:
        return 18.0
    if "6" in folded and "11" in folded:
        return 8.5
    if "3" in folded and "6" in folded:
        return 4.5
    if "0" in folded and "3" in folded:
        return 1.5
    return np.nan


def _screen_damage(text):
    folded = str(text).casefold()
    if "cracked" in folded or "glass broken" in folded:
        return 2
    if "chipped" in folded or "more than 2" in folded:
        return 1
    if "1-2" in folded or "1–2" in folded:
        return 0.5
    if "no scratch" in folded:
        return 0
    return 0


def _spot_level(text):
    folded = str(text).casefold()
    if "no spot" in folded:
        return 0
    if "large" in folded or "heavy" in folded:
        return 2
    return 1


def _line_level(text):
    folded = str(text).casefold()
    if "no line" in folded:
        return 0
    if "visible line" in folded:
        return 2
    return 0


def _color_level(text):
    folded = str(text).casefold()
    if "no discolor" in folded:
        return 0
    if "major" in folded or "heavy" in folded:
        return 2
    return 1


def _scratch_level(text):
    folded = str(text).casefold()
    if "no scratch" in folded:
        return 0
    if "more than 2" in folded:
        return 2
    return 1


def _dent_level(text):
    folded = str(text).casefold()
    if "no dent" in folded:
        return 0
    if "major" in folded or "more than 2" in folded:
        return 2
    return 1


def _battery_penalty(battery_text, tech_text):
    battery = str(battery_text or "").casefold()
    tech = str(tech_text or "").casefold()
    penalty = np.nan if battery == "" else 0
    if "working fine" in battery:
        penalty = 0
    elif "80-85" in battery or "80–85" in battery:
        penalty = 1
    elif "in service" in battery or "less than 80" in battery:
        penalty = 2
    elif "faulty" in battery:
        penalty = 3
    if "battery faulty" in tech:
        penalty = 3 if pd.isna(penalty) else max(penalty, 3)
    return penalty


def _accessory_flags(text):
    if text is None or str(text).strip() == "":
        return {"has_box": np.nan, "has_bill": np.nan, "has_charger": np.nan}
    folded = str(text).strip().casefold()
    if folded in {"none", "no", "nan"}:
        return {"has_box": 0, "has_bill": 0, "has_charger": 0}
    parts = [part.strip() for part in folded.split(",")]
    return {
        "has_box": int(any("box" in part for part in parts)),
        "has_bill": int(any("bill" in part for part in parts)),
        "has_charger": int(any("charger" in part for part in parts)),
    }


def condition_features(quiz):
    fields = parse_fields(quiz)
    physical = fields.get("physical issues", "")
    physical_folded = physical.casefold()
    tech = fields.get("technical issues", "")
    screen_detail = fields.get("screen scratch/crack detail", fields.get("screen detail"))
    spots = fields.get("dead pixels/spots on screen")
    lines = fields.get("visible lines on screen")
    color = fields.get("discoloration on screen")
    panel = fields.get("panel condition")
    scratches = fields.get("scratches on device body")
    dents = fields.get("dents on device body")
    bent = fields.get("bent / loose screen", "")
    accessories = _accessory_flags(fields.get("accessories"))

    has_screen_detail = screen_detail is not None
    has_display_detail = any(value is not None for value in (spots, lines, color))
    has_body_detail = scratches is not None or dents is not None
    has_panel_detail = panel is not None

    if has_screen_detail:
        screen_damage = _screen_damage(screen_detail)
    elif "broken/scratch" in physical_folded or "cracked" in physical_folded:
        screen_damage = 2
    else:
        screen_damage = 0

    if has_display_detail:
        display_defect = max(
            _spot_level(spots) if spots is not None else 0,
            _line_level(lines) if lines is not None else 0,
            _color_level(color) if color is not None else 0,
        )
    elif "dead spot" in physical_folded or "visible line" in physical_folded or "discolor" in physical_folded:
        display_defect = 2
    else:
        display_defect = 0

    if has_panel_detail:
        panel_folded = panel.casefold()
        panel_broken = 0 if "no defect" in panel_folded else int("crack" in panel_folded or "broken" in panel_folded or "missing" in panel_folded)
    elif "panel missing" in physical_folded or "panel broken" in physical_folded:
        panel_broken = 1
    else:
        panel_broken = 0
    if "loose" in bent.casefold():
        panel_broken = max(panel_broken, 1)

    if has_body_detail:
        body_damage = max(
            _scratch_level(scratches) if scratches is not None else 0,
            _dent_level(dents) if dents is not None else 0,
        )
    elif "scratch/dent" in physical_folded or "dents on device body" in physical_folded:
        body_damage = 1
    else:
        body_damage = 0

    charger = fields.get("charger", "")
    charger_missing = np.nan
    if charger:
        charger_missing = 1 if "not available" in charger.casefold() else 0
    elif not pd.isna(accessories["has_charger"]):
        charger_missing = 1 - accessories["has_charger"]

    tech_parts = [part.strip().casefold() for part in str(tech).split(",")] if tech else []
    extra_tech = sum(part not in {"", "none", "no issues", "battery faulty"} for part in tech_parts)

    calls = fields.get("able to make calls", fields.get("calls functional"))
    screen = fields.get("original screen", fields.get("screen original"))
    return {
        "age_months": _age_months(fields.get("device age")),
        "warranty": _yes_no(fields.get("under warranty")),
        "calls_ok": _yes_no(calls),
        "touch_ok": _yes_no(fields.get("touch screen working")),
        "screen_original": _yes_no(screen) if screen is None or "copy" not in str(screen).casefold() else 0,
        "battery_penalty": _battery_penalty(fields.get("battery"), tech),
        "screen_damage": screen_damage,
        "display_defect": display_defect,
        "panel_broken": panel_broken,
        "body_damage": body_damage,
        "charger_missing": charger_missing,
        "has_box": accessories["has_box"],
        "has_bill": accessories["has_bill"],
        "extra_tech": extra_tech,
    }


def load_training_frame(path):
    raw = pd.read_csv(path, encoding="utf-8-sig")
    frame = raw[raw["Category"].astype(str).str.casefold() == "mobile"].copy()
    frame["price"] = pd.to_numeric(frame["Cashify Price (INR)"], errors="coerce")
    frame = frame[frame["price"].notna() & (frame["price"] > 0)].copy()
    frame = frame[~frame["price"].isin(FAILED_QUOTE_VALUES)].copy()
    frame["brand_key"] = frame["Brand"].map(norm_key)
    frame["model_key"] = frame["Model"].map(norm_key)
    frame = frame[~frame["brand_key"].isin(["", "nan"]) & ~frame["model_key"].isin(["", "nan"])].copy()
    frame["storage_gb"] = frame["Storage"].map(storage_gb)
    frame["trusted"] = frame["Status"].astype(str).str.casefold().eq("completed")
    features = pd.DataFrame([condition_features(quiz) for quiz in frame["Quiz Summary"]], index=frame.index)
    return pd.concat([frame, features], axis=1)


def _mode(series):
    modes = series.dropna().mode()
    if modes.empty:
        return series.dropna().iloc[0] if series.dropna().size else ""
    return modes.iloc[0]


def storage_elasticity(frame):
    slopes = []
    for (_, _), group in frame.groupby(["brand_key", "model_key"]):
        medians = group.dropna(subset=["storage_gb"]).groupby("storage_gb")["price"].median()
        if len(medians) < 2:
            continue
        x_values = np.log(medians.index.astype(float))
        y_values = np.log(medians.to_numpy(dtype=float))
        if np.std(x_values) == 0:
            continue
        slopes.append(float(np.polyfit(x_values, y_values, 1)[0]))
    if not slopes:
        return 0.2
    return float(np.clip(np.median(slopes), 0.0, 0.8))


def build_tables(frame, elasticity):
    phones = []
    for (brand_key, model_key, storage), group in frame.dropna(subset=["storage_gb"]).groupby(["brand_key", "model_key", "storage_gb"]):
        phones.append({
            "brand_key": brand_key,
            "model_key": model_key,
            "storage_gb": int(storage) if float(storage).is_integer() else float(storage),
            "median": float(group["price"].median()),
            "n": int(len(group)),
            "brand": str(_mode(group["Brand"])),
            "model": str(_mode(group["Model"])),
        })
    model_rows = []
    for (brand_key, model_key), group in frame.groupby(["brand_key", "model_key"]):
        model_rows.append({
            "brand_key": brand_key,
            "model_key": model_key,
            "median": float(group["price"].median()),
            "n": int(len(group)),
            "brand": str(_mode(group["Brand"])),
            "model": str(_mode(group["Model"])),
        })
    brands = {brand_key: float(group["price"].median()) for brand_key, group in frame.groupby("brand_key")}
    return {
        "elasticity": float(elasticity),
        "global_median": float(frame["price"].median()),
        "brands": brands,
        "models": model_rows,
        "phones": phones,
    }


def _index_tables(tables):
    phones = {}
    by_model = {}
    for row in tables["phones"]:
        phones[(row["brand_key"], row["model_key"], row["storage_gb"])] = row
        by_model.setdefault((row["brand_key"], row["model_key"]), []).append(row)
    models = {(row["brand_key"], row["model_key"]): row for row in tables["models"]}
    return phones, by_model, models


def lookup_base(tables, brand, model_name, storage):
    phones, by_model, models = _index_tables(tables)
    brand_key = norm_key(brand)
    model_key = norm_key(model_name)
    capacity = storage_gb(storage)
    exact = phones.get((brand_key, model_key, capacity))
    if exact is not None:
        return exact["median"], "same brand, model, and storage", exact["n"]

    known = by_model.get((brand_key, model_key), [])
    if known and pd.notna(capacity) and capacity > 0:
        nearest = min(known, key=lambda row: abs(np.log(row["storage_gb"]) - np.log(float(capacity))))
        scale = (float(capacity) / float(nearest["storage_gb"])) ** tables["elasticity"]
        return nearest["median"] * scale, "same model, nearby storage", nearest["n"]

    model_row = models.get((brand_key, model_key))
    if model_row is not None:
        return model_row["median"], "same model, any storage", model_row["n"]

    brand_median = tables["brands"].get(brand_key)
    if brand_median is not None:
        return brand_median, "same brand", None
    return tables["global_median"], "all phones", None


def reference_vector(frame):
    overridden = frame.loc[~frame["trusted"], FEATURES]
    reference = {}
    for column in FEATURES:
        median = overridden[column].median()
        reference[column] = 0.0 if pd.isna(median) else float(median)
    return reference


def peer_base(frame):
    """Median quote of the other rows for the same phone, ignoring this row."""
    bases = []
    model_groups = {key: group for key, group in frame.groupby(["brand_key", "model_key"])}
    for idx, row in frame.iterrows():
        group = model_groups[(row["brand_key"], row["model_key"])]
        peers = group.drop(index=idx, errors="ignore")
        if peers.empty:
            bases.append(np.nan)
            continue
        if pd.notna(row["storage_gb"]):
            exact = peers[peers["storage_gb"] == row["storage_gb"]]
            if not exact.empty:
                bases.append(float(exact["price"].median()))
                continue
        bases.append(float(peers["price"].median()))
    return pd.Series(bases, index=frame.index)


def _scale_predict(pipe, keep, values):
    scaler = pipe.named_steps["standardscaler"]
    ridge = pipe.named_steps["ridge"]
    matrix = np.asarray(values, dtype=float).reshape(1, -1) if np.ndim(values) == 1 else np.asarray(values, dtype=float)
    scale = np.where(scaler.scale_ == 0, 1.0, scaler.scale_)
    scaled = (matrix - scaler.mean_) / scale
    return ridge.intercept_ + scaled @ ridge.coef_


def fit_constrained(delta_x, y_values, alpha):
    columns = list(delta_x.columns)
    pipe = make_pipeline(StandardScaler(), Ridge(alpha=alpha))
    pipe.fit(delta_x, y_values)
    coef = pipe.named_steps["ridge"].coef_
    keep = [column for column, weight in zip(columns, coef) if PRIORS[column] == 0 or weight * PRIORS[column] > 0]
    if not keep:
        return None, []
    pipe.fit(delta_x[keep], y_values)
    return pipe, keep


def log_adjustment(pipe, keep, delta_row):
    if pipe is None or not keep:
        return 0.0
    ordered = [float(delta_row[column]) for column in keep]
    zeros = np.zeros(len(keep))
    raw = float(_scale_predict(pipe, keep, ordered)[0])
    origin = float(_scale_predict(pipe, keep, zeros)[0])
    return float(np.clip(raw - origin, LOG_CLIP[0], LOG_CLIP[1]))


def condition_loo(frame, reference):
    eligible = frame[frame["trusted"]].copy()
    bases = peer_base(frame)
    eligible = eligible.loc[bases.reindex(eligible.index).notna()].copy()
    eligible["peer_base"] = bases.reindex(eligible.index)
    if len(eligible) < 12:
        return {"apply": False, "reason": "fewer than 12 completed quotes with a peer phone", "rows": int(len(eligible))}

    filled = eligible[FEATURES].apply(pd.to_numeric, errors="coerce")
    for column in FEATURES:
        filled[column] = filled[column].fillna(reference[column])
    delta_x = filled - pd.Series(reference)
    y_values = np.log(eligible["price"].to_numpy(dtype=float) / eligible["peer_base"].to_numpy(dtype=float))
    y_values = np.clip(y_values, LOG_CLIP[0], LOG_CLIP[1])

    best = None
    for alpha in ALPHAS:
        predictions = []
        for position in range(len(eligible)):
            mask = np.ones(len(eligible), dtype=bool)
            mask[position] = False
            pipe, keep = fit_constrained(delta_x.iloc[mask], y_values[mask], alpha)
            predictions.append(np.exp(log_adjustment(pipe, keep, delta_x.iloc[position])))
        predicted = eligible["peer_base"].to_numpy(dtype=float) * np.asarray(predictions)
        actual = eligible["price"].to_numpy(dtype=float)
        mae = float(mean_absolute_error(actual, predicted))
        base_mae = float(mean_absolute_error(actual, eligible["peer_base"]))
        record = {
            "alpha": alpha,
            "mae": mae,
            "base_mae": base_mae,
            "mape": float(mean_absolute_percentage_error(actual, predicted)),
            "median_ape": median_ape(actual, predicted),
        }
        if best is None or record["mae"] < best["mae"]:
            best = record

    pipe, keep = fit_constrained(delta_x, y_values, best["alpha"])
    apply = best["mae"] < best["base_mae"] * 0.97
    return {
        "apply": apply,
        "rows": int(len(eligible)),
        "alpha": best["alpha"],
        "loo_mae": best["mae"],
        "loo_base_mae": best["base_mae"],
        "loo_mape": best["mape"],
        "loo_median_ape": best["median_ape"],
        "loo_base_mape": float(mean_absolute_percentage_error(eligible["price"], eligible["peer_base"])),
        "loo_base_median_ape": median_ape(eligible["price"], eligible["peer_base"]),
        "pipe": pipe,
        "keep": keep,
        "reference": reference,
    }


def condition_to_json(state):
    if not state.get("apply"):
        return {"apply": False, "rows": state.get("rows", 0), "reason": state.get("reason", "condition layer did not beat the base price")}
    pipe = state["pipe"]
    keep = state["keep"]
    scaler = pipe.named_steps["standardscaler"]
    ridge = pipe.named_steps["ridge"]
    return {
        "apply": True,
        "rows": state["rows"],
        "alpha": state["alpha"],
        "features": keep,
        "reference": state["reference"],
        "scaler_mean": [float(value) for value in scaler.mean_],
        "scaler_scale": [float(value if value != 0 else 1.0) for value in scaler.scale_],
        "coef": [float(value) for value in ridge.coef_],
        "intercept": float(ridge.intercept_),
        "clip": list(LOG_CLIP),
        "loo_mae": state["loo_mae"],
        "loo_base_mae": state["loo_base_mae"],
        "loo_mape": state["loo_mape"],
        "loo_base_mape": state["loo_base_mape"],
        "loo_median_ape": state.get("loo_median_ape"),
    }


def adjustment_from_json(condition, quiz):
    if not condition or not condition.get("apply"):
        return 1.0
    features = condition_features(quiz)
    reference = condition["reference"]
    deltas = []
    for column in condition["features"]:
        value = features[column]
        if value is None or (isinstance(value, float) and np.isnan(value)):
            value = reference[column]
        deltas.append(float(value) - float(reference[column]))
    mean = np.asarray(condition["scaler_mean"], dtype=float)
    scale = np.asarray(condition["scaler_scale"], dtype=float)
    coef = np.asarray(condition["coef"], dtype=float)
    scaled = (np.asarray(deltas) - mean) / scale
    origin = condition["intercept"] + ((0 - mean) / scale) @ coef
    raw = condition["intercept"] + scaled @ coef
    low, high = condition["clip"]
    return float(np.exp(np.clip(raw - origin, low, high)))


def train_catboost(frame):
    work = frame.copy()
    for column in FEATURES:
        work.loc[~work["trusted"], column] = np.nan
    cat_features = ["brand_key", "model_key"]
    numeric = ["storage_gb"] + FEATURES
    columns = cat_features + numeric
    features = work[columns]
    target = np.log1p(work["price"])
    x_train, x_test, y_train, y_test, price_train, price_test = train_test_split(
        features, target, work["price"], test_size=0.2, random_state=42
    )
    train_pool = Pool(x_train, y_train, cat_features=cat_features)
    test_pool = Pool(x_test, y_test, cat_features=cat_features)
    model = CatBoostRegressor(
        iterations=1500,
        learning_rate=0.05,
        depth=6,
        loss_function="MAE",
        random_seed=42,
        verbose=False,
        allow_writing_files=False,
    )
    model.fit(train_pool, eval_set=test_pool, use_best_model=True, early_stopping_rounds=50)
    predicted = np.expm1(model.predict(test_pool))
    lookup_predictions = []
    tables = build_tables(work.loc[price_train.index], storage_elasticity(work.loc[price_train.index]))
    for idx in price_test.index:
        row = work.loc[idx]
        base, _, _ = lookup_base(tables, row["Brand"], row["Model"], row["storage_gb"])
        lookup_predictions.append(base)
    lookup_predictions = np.asarray(lookup_predictions, dtype=float)
    actual = price_test.to_numpy(dtype=float)
    metrics = {
        "catboost_mae": float(mean_absolute_error(actual, predicted)),
        "catboost_mape": float(mean_absolute_percentage_error(actual, predicted)),
        "catboost_median_ape": median_ape(actual, predicted),
        "lookup_mae": float(mean_absolute_error(actual, lookup_predictions)),
        "lookup_mape": float(mean_absolute_percentage_error(actual, lookup_predictions)),
        "lookup_median_ape": median_ape(actual, lookup_predictions),
        "test_rows": int(len(actual)),
    }
    return model, metrics


def effect_table(condition):
    if not condition.get("apply"):
        return []
    samples = {
        "age_months": 1.5,
        "warranty": 1,
        "calls_ok": 0,
        "touch_ok": 0,
        "screen_original": 0,
        "battery_penalty": 3,
        "screen_damage": 2,
        "display_defect": 2,
        "panel_broken": 1,
        "body_damage": 2,
        "charger_missing": 1,
        "has_box": 1,
        "has_bill": 1,
        "extra_tech": 1,
    }
    labels = {
        "age_months": "Age 0-3 months instead of over 11 months",
        "warranty": "Under warranty",
        "calls_ok": "Cannot make calls",
        "touch_ok": "Touch screen not working",
        "screen_original": "Copy screen",
        "battery_penalty": "Battery faulty",
        "screen_damage": "Cracked glass",
        "display_defect": "Spots, lines, or discoloration",
        "panel_broken": "Cracked side or back panel",
        "body_damage": "Heavy body scratches or dents",
        "charger_missing": "Charger missing",
        "has_box": "Original box",
        "has_bill": "GST bill",
        "extra_tech": "One extra hardware fault",
    }
    rows = []
    reference = condition["reference"]
    for feature in condition["features"]:
        quiz_features = dict(reference)
        quiz_features[feature] = samples[feature]
        synthetic = {column: quiz_features[column] for column in FEATURES}
        # Rebuild through the JSON math with a fake quiz by calling the scaler directly.
        deltas = [synthetic[column] - reference[column] for column in condition["features"]]
        mean = np.asarray(condition["scaler_mean"], dtype=float)
        scale = np.asarray(condition["scaler_scale"], dtype=float)
        coef = np.asarray(condition["coef"], dtype=float)
        scaled = (np.asarray(deltas) - mean) / scale
        origin = condition["intercept"] + ((0 - mean) / scale) @ coef
        raw = condition["intercept"] + scaled @ coef
        low, high = condition["clip"]
        rows.append({"feature": feature, "label": labels[feature], "multiplier": float(np.exp(np.clip(raw - origin, low, high)))})
    return rows


def train(csv_path):
    frame = load_training_frame(csv_path)
    elasticity = storage_elasticity(frame)
    tables = build_tables(frame, elasticity)
    reference = reference_vector(frame)
    condition_state = condition_loo(frame, reference)
    condition = condition_to_json(condition_state)
    cat_model, holdout = train_catboost(frame)
    cat_model.save_model(str(CBM_PATH))
    artifact = {
        "version": 1,
        "source_rows": int(len(frame)),
        "trusted_rows": int(frame["trusted"].sum()),
        "tables": tables,
        "condition": condition,
        "holdout": holdout,
        "catboost_features": ["brand_key", "model_key", "storage_gb"] + FEATURES,
        "catboost_categorical": ["brand_key", "model_key"],
    }
    JSON_PATH.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    return artifact, effect_table(condition)


def load_artifact():
    return json.loads(JSON_PATH.read_text(encoding="utf-8"))


def explain_price(brand, model_name, storage, quiz_summary, artifact=None):
    artifact = artifact or load_artifact()
    base, method, samples = lookup_base(artifact["tables"], brand, model_name, storage)
    multiplier = adjustment_from_json(artifact["condition"], quiz_summary)
    used_catboost = False
    if method in {"same brand", "all phones"} and CBM_PATH.exists():
        model = CatBoostRegressor()
        model.load_model(str(CBM_PATH))
        features = condition_features(quiz_summary)
        row = {
            "brand_key": norm_key(brand),
            "model_key": norm_key(model_name),
            "storage_gb": storage_gb(storage),
        }
        row.update(features)
        predicted = float(np.expm1(model.predict(pd.DataFrame([row])[artifact["catboost_features"]]))[0])
        price = predicted
        method = "catboost fallback for an unseen model"
        multiplier = 1.0
        used_catboost = True
        base = predicted
    else:
        price = base * multiplier
    price = int(round(price / 10.0) * 10)
    return {
        "price": price,
        "base": int(round(base / 10.0) * 10),
        "multiplier": round(multiplier, 3),
        "method": method,
        "samples": samples,
        "used_catboost": used_catboost,
    }


def predict_price(*_args, brand, model_name, storage, quiz_summary, **_kwargs):
    return explain_price(brand, model_name, storage, quiz_summary)["price"]


def _money(value):
    return f"Rs {value:,.0f}"


def main():
    parser = argparse.ArgumentParser(description="Train or quote a Cashify-style phone price")
    parser.add_argument("--csv", type=Path, default=CSV_PATH)
    parser.add_argument("--quote", action="store_true")
    parser.add_argument("--brand", default="Apple")
    parser.add_argument("--model", default="iPhone 13")
    parser.add_argument("--storage", default="128GB")
    parser.add_argument("--quiz", default="")
    args = parser.parse_args()

    if args.quote and JSON_PATH.exists():
        result = explain_price(args.brand, args.model, args.storage, args.quiz)
        print(json.dumps(result, indent=2))
        return

    artifact, effects = train(args.csv)
    holdout = artifact["holdout"]
    condition = artifact["condition"]
    print(f"Priced mobile rows: {artifact['source_rows']}")
    print(f"Completed quizzes used for condition: {artifact['trusted_rows']}")
    print(f"Phones in the base table: {len(artifact['tables']['phones'])}")
    print(f"Storage elasticity: {artifact['tables']['elasticity']:.2f}")
    print(
        f"Holdout lookup MAE: {_money(holdout['lookup_mae'])}  "
        f"typical error {holdout['lookup_median_ape']:.1%}  (n={holdout['test_rows']})"
    )
    print(
        f"Holdout CatBoost MAE: {_money(holdout['catboost_mae'])}  "
        f"typical error {holdout['catboost_median_ape']:.1%}"
    )
    if condition.get("apply"):
        print(
            f"Condition leave-one-out MAE: {_money(condition['loo_mae'])} "
            f"vs base {_money(condition['loo_base_mae'])} "
            f"on {condition['rows']} completed quotes "
            f"(typical error {condition['loo_median_ape']:.1%})"
        )
        print("Condition multipliers against the usual quote:")
        for row in effects:
            print(f"  {row['label']}: x{row['multiplier']:.2f}")
    else:
        print("Condition adjustment left off:", condition.get("reason", "it did not beat the base price"))

    usual = (
        "Device Age: Above 11 Months | Under Warranty: No | Able to Make Calls: Yes | "
        "Touch Screen Working: Yes | Original Screen: Yes | Physical Issues: None | "
        "Battery: Battery Is Working Fine | Charger: Charger Not Available | "
        "Technical Issues: None | Accessories: None"
    )
    damaged = (
        "Device Age: Above 11 Months | Under Warranty: No | Able to Make Calls: Yes | "
        "Touch Screen Working: No | Original Screen: No | Physical Issues: Broken/scratch on device screen | "
        "Screen Scratch/Crack Detail: Screen cracked/ glass broken | Battery: Battery Faulty | "
        "Charger: Charger Not Available | Technical Issues: Battery Faulty, Finger Touch not working | Accessories: None"
    )
    for label, quiz in (("usual condition", usual), ("cracked screen and bad battery", damaged)):
        result = explain_price(args.brand, args.model, args.storage, quiz, artifact)
        print(f"{args.brand} {args.model} {args.storage} ({label}): {_money(result['price'])} via {result['method']}")
    print(f"Saved {JSON_PATH.name} and {CBM_PATH.name}")


if __name__ == "__main__":
    main()
