# Build My Holiday — Sequence Diagrams

How a request moves through the app, step by step. The diagrams use [Mermaid](https://mermaid.js.org/), which GitHub and VS Code (with a Mermaid preview extension) draw automatically.

**Who's who in the diagrams**

| Name | What it is | Code |
|---|---|---|
| User | The traveler in the browser | — |
| Frontend | React app (Vite dev server proxies `/api` to the backend) | `frontend/src` |
| Router | FastAPI endpoint | `backend/app/*/router.py` |
| Service | Business logic for one feature | `backend/app/*/service.py`, `changes/apply.py` |
| Adapter | The only bridge from API JSON to the engine | `backend/app/core/engine_adapter.py` |
| Builder | Builds packages | `backend/app/builder/` |
| Changes | Options and change side effects | `backend/app/changes/options.py`, `side_effects.py` |
| Validator | Checks every travel rule | `backend/app/rules/` |
| Store | In-memory catalog | `backend/app/catalog/store.py` |
| Inventory | Seats and rooms already booked | `backend/app/inventory/` |
| DB | MySQL | `backend/app/models/`, repositories |

**Contents**

1. [App startup](#1-app-startup)
2. [Search and build a package](#2-search-and-build-a-package)
3. [Inside the builder: how one package is formed](#3-inside-the-builder-how-one-package-is-formed)
4. [Pick one of the three options (G4)](#4-pick-one-of-the-three-options-g4)
5. [See alternatives and change part of the trip](#5-see-alternatives-and-change-part-of-the-trip)
6. [Change cities, and undo](#6-change-cities-and-undo)
7. [Book the trip](#7-book-the-trip)
8. [Find a booking by its number](#8-find-a-booking-by-its-number)
9. [Quick request (one line of text)](#9-quick-request-one-line-of-text)
10. [Download the trip](#10-download-the-trip)

---

## 1. App startup

The catalog is loaded once into memory, so building a package never waits on the database.

```mermaid
sequenceDiagram
    autonumber
    participant Main as main.py
    participant Migrate as core/migrate.py
    participant Seed as catalog/seed.py
    participant Loader as catalog/loader.py
    participant Store as CatalogStore
    participant DB as MySQL

    Main->>Migrate: apply_schema() — run database/schema/*.sql
    Migrate->>DB: CREATE TABLE IF NOT EXISTS ...
    Main->>Seed: seed catalog if the JSON files changed (hash check)
    Seed->>DB: insert flights, hotels, rooms, transfers, attractions
    Main->>Store: load()
    Store->>Loader: load_catalog()
    alt MySQL available
        Loader->>DB: read catalog tables
    else MySQL down or DB_AUTO_INIT=false
        Loader->>Loader: read data/catalog/*.json
    end
    Loader-->>Store: catalog + lookup indexes (by airport, date, city…)
    Note over Main: serves /api/* and /images/* — ready
```

---

## 2. Search and build a package

`POST /api/packages`. With "Compare 3 options" ticked, the frontend sends `mode: "three"`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend (RequestPage)
    participant R as packages/router.py
    participant S as PackageService
    participant A as Adapter
    participant B as Builder (search.build)
    participant DB as MySQL

    User->>FE: fill search bar, click Search
    FE->>R: POST /api/packages {departure_city, destination_country, start_date, nights, adults, child_ages, budget, mode}
    R->>R: TripRequestSchema checks fields (dates 1–20 Apr, 3–10 nights, ≤ 9 travelers, ages 0–17)
    alt invalid input
        R-->>FE: 422 INVALID_INPUT {field_errors}
        FE-->>User: red message under the search bar
    end
    R->>S: create_package(request)
    S->>DB: save trip request (trips)
    S->>A: build(request)
    A->>B: build(TripRequest, mode)
    B-->>A: BuildResult (outcome, package, alternatives, city_plans, …)
    A-->>S: result as plain dicts
    alt NO_PACKAGE
        S-->>R: {outcome: NO_PACKAGE, reason}
        R-->>FE: 200
        FE-->>User: "No trip available" + reason
    else PACKAGE or OVER_BUDGET
        S->>DB: save package + version 1 (status PLANNED or OVER_BUDGET)
        opt mode = three
            S->>DB: save cheapest / fastest / best rated as their own packages
        end
        S->>S: add totals, day-by-day timeline, item details
        S-->>R: package view (+ alternatives, + cheapest_total / over_by / suggestion if over budget)
        R-->>FE: 201
        alt has three options
            FE-->>User: "Pick your trip" cards
        else over budget
            FE-->>User: "This trip doesn't fit your budget" + cheapest + suggestion
        else
            FE-->>User: open the trip page
        end
    end
```

---

## 3. Inside the builder: how one package is formed

`builder/search.py` → `build()`. Every city plan is built the same way, then the best is chosen.

```mermaid
sequenceDiagram
    autonumber
    participant B as search.build()
    participant St as Store
    participant CP as city_plans.py
    participant H as hotels.py
    participant T as transfers.py
    participant AT as attractions.py
    participant AS as assemble.py
    participant V as Validator
    participant SEL as selector.py
    participant ALT as alternatives.py

    B->>St: home airport, country, flights landing on start day / leaving on last day (enough seats)
    alt no flight either way
        B-->>B: NO_PACKAGE with the reason
    end
    B->>CP: enumerate_plans(cities, nights, min 2 per city, linked cities)
    CP-->>B: every order × every night split (Menon: 27 plans)
    loop each city plan
        B->>H: stay_options(city, check-in, nights) — fits family, rooms free every night, cheapest first (cached)
        B->>T: arrival_options: pickup = landing + 60 min
        B->>T: return_options: leave hotel = take-off − 180 min − drive time
        Note over B: cheapest (flight + transfer + hotel) chosen for each end separately
        B->>T: intercity_options: first slot ≥ 10:00 on the move day
        B->>AT: schedule(): one open activity per full day (Kuhn matching, no repeats)
        B->>AS: assemble(parts) → Package (items in time order)
        B->>V: validate(package)
        alt any rule broken
            V-->>B: violations → drop this plan, remember why
        else valid
            V-->>B: [] → keep as candidate
        end
    end
    B->>SEL: choose(candidates): city rule c* = max(1, nights ÷ 3), cheapest within budget, trying c*, c*−1…1, then c*+1
    alt one fits the budget
        SEL-->>B: PACKAGE
    else none fits
        SEL-->>B: OVER_BUDGET (cheapest + how much over + suggestion)
    end
    opt mode = three
        B->>ALT: three(candidates, budget)
        ALT-->>B: cheapest, fastest (shortest flights), best rated (most stars within budget)
    end
```

---

## 4. Pick one of the three options (G4)

The three options are already saved, so choosing one just opens it. The results are remembered in the browser tab for the back link.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant RP as RequestPage
    participant SS as sessionStorage
    participant PP as PackagePage
    participant API as Backend

    RP->>SS: saveLastResults(request, outcome) and URL becomes /?view=results
    User->>RP: click "Choose" on a card
    RP->>PP: open /package/{package_id}
    PP->>API: GET /api/packages/{id}
    API-->>PP: package, totals, timeline, city plans
    PP->>SS: is this package one of the saved options?
    PP-->>User: trip page with "← Back to your 3 options"
    User->>PP: click back (or browser Back)
    PP->>RP: open /?view=results
    RP->>SS: loadLastResults()
    RP-->>User: same three cards + search bar filled in
```

---

## 5. See alternatives and change part of the trip

Options come from `GET …/options/{hotel|flight|attraction}`. The change is `PATCH /api/packages/{id}`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as PackagePage + ChangeDrawer
    participant CR as changes/router.py
    participant CS as ChangeService (changes/apply.py)
    participant A as Adapter
    participant O as options.py
    participant SE as side_effects.py
    participant V as Validator
    participant DB as MySQL

    User->>FE: click "Change flight" / "Change hotel" / "Add an activity"
    FE->>CR: GET /api/packages/{id}/options/flight?leg=arrival
    CR->>CS: get_options
    CS->>DB: current version snapshot
    CS->>A: options(snapshot, kind, params)
    A->>O: options(package, kind)
    loop each candidate
        O->>SE: apply_change on a copy
        O->>V: validate(copy)
        Note over O: keep only valid ones, price_diff = new total − current total
    end
    O-->>FE: options with price_diff, details, side effects
    User->>FE: search / sort / filter, then Select
    FE->>CR: PATCH /api/packages/{id} {kind, new_catalog_id, params, base_version}
    CR->>CS: apply_change
    CS->>DB: load package
    alt package is BOOKED
        CS-->>FE: 409 ALREADY_BOOKED
    else base_version is old
        CS-->>FE: 409 VERSION_CONFLICT
    end
    CS->>A: apply_change(snapshot, change)
    A->>SE: apply_change(package, Change)
    Note over SE: G1 knock-on fixes: re-time airport transfers,<br/>warn about check-in / check-out times,<br/>drop activities you can no longer reach
    SE-->>A: new package + side_effects + warnings
    CS->>A: validate(new package)
    alt rules broken
        CS-->>FE: 409 RULE_VIOLATION {violations} (package unchanged)
        FE-->>User: "That change didn't work" + reasons
    else valid
        CS->>DB: save as new version (version + 1)
        CS-->>FE: 200 {version, total, items, side_effects, warnings}
        FE->>CR: GET /api/packages/{id} (refresh)
        FE-->>User: updated trip + "Your trip was updated" notes
    end
```

---

## 6. Change cities, and undo

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as PackagePage
    participant PR as packages/router.py
    participant S as PackageService
    participant A as Adapter
    participant B as Builder
    participant DB as MySQL

    Note over User,DB: Change cities (G3)
    User->>FE: click a plan in "Try a different city split"
    FE->>PR: POST /api/packages/{id}/rebuild {city_plan, base_version}
    PR->>S: rebuild_package
    S->>DB: load package (refuse if BOOKED or version is old)
    S->>A: rebuild(snapshot, city_plan)
    A->>B: rebuild(request, plan)
    alt plan cannot be built
        B-->>FE: 409 INVALID_CITY_PLAN
    else built
        S->>DB: save as new version
        S-->>FE: 200 updated package
    end

    Note over User,DB: Undo
    User->>FE: click "Undo last change"
    FE->>PR: POST /api/packages/{id}/undo
    PR->>S: undo_package
    alt version 1 or BOOKED
        S-->>FE: 409 CANNOT_UNDO / ALREADY_BOOKED
    else
        S->>DB: copy the previous version as a NEW version (history is never deleted)
        S-->>FE: 200 restored package
    end
```

---

## 7. Book the trip

`POST /api/packages/{id}/confirm`. Seats and rooms are checked and reserved here (S2).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as PackagePage + ConfirmDialog
    participant RR as reservations/router.py
    participant RS as ReservationService
    participant A as Adapter
    participant INV as InventoryService
    participant REF as reference.py
    participant DB as MySQL

    User->>FE: click "Book this trip", enter name + email, "Book now"
    FE->>RR: POST /api/packages/{id}/confirm {base_version, customer_name, customer_email, customer_phone}
    RR->>RS: confirm_package
    RS->>DB: load package
    alt already BOOKED
        RS-->>FE: 201 same reference (already_confirmed) — safe to click twice
    else base_version is old
        RS-->>FE: 409 VERSION_CONFLICT
    end
    RS->>A: validate(snapshot)
    alt rules broken
        RS-->>FE: 409 RULE_VIOLATION
    end
    RS->>INV: check_availability(items)
    INV->>DB: seats / rooms already used
    alt not enough left
        INV-->>FE: 409 SOLD_OUT
    end
    RS->>REF: generate 10-digit reference (retry if taken)
    RS->>DB: save reservation + reservation items + frozen snapshot (items BOOKED, booking.reference)
    RS->>INV: allocate_inventory(reservation, items)
    INV->>DB: record seats and rooms used
    RS->>DB: package status = BOOKED
    RS-->>FE: 201 {reference, items, total_inr}
    FE-->>User: "Your trip is booked!" + booking number
```

---

## 8. Find a booking by its number

`GET /api/reservations/{ref}`. Works after a backend restart, because it's read from MySQL.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as ReservationPage + LookupBox
    participant RR as reservations/router.py
    participant RS as ReservationService
    participant DB as MySQL

    User->>FE: "Find a booking", type 10 digits, "Find booking"
    FE->>RR: GET /api/reservations/{ref}
    RR->>RS: get_reservation(ref)
    alt not exactly 10 digits
        RS-->>FE: 400 INVALID_REFERENCE
    end
    RS->>DB: find reservation by reference
    alt not found
        RS-->>FE: 404 "Reservation not found"
        FE-->>User: "Reservation not found" message
    else found
        RS-->>FE: 200 {reference, status, customer, total, items with details, snapshot}
        FE-->>User: confirmation page (itinerary, price paid, Before you go tips)
    end
```

---

## 9. Quick request (one line of text)

`POST /api/parse` (S1). Rules only, no AI.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as QuickRequestBox
    participant PR as parser/router.py
    participant QP as parser/quick_request.py
    participant St as Store

    User->>FE: "2 adults 1 kid age 6 Bengaluru to Japan 10 Apr 6 nights 3.5 lakh", "Fill search"
    FE->>PR: POST /api/parse {text}
    PR->>QP: parse(text)
    QP->>St: known departure cities, countries, aliases (UAE, BLR…)
    QP->>QP: patterns for people, ages, dates, nights, budget (lakh / k / ₹)
    QP-->>PR: {request, unparsed words, warnings}
    PR-->>FE: 200
    FE-->>User: search bar filled in + "Ignored: …" notes
```

---

## 10. Download the trip

`GET /api/packages/{id}/export` (M5) — the shared trip format from `data/DATA_DICTIONARY.md`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend
    participant ER as export/router.py
    participant TF as export/trip_format.py
    participant DB as MySQL

    User->>FE: "Download trip"
    FE->>ER: GET /api/packages/{id}/export
    ER->>DB: current version snapshot
    alt not found
        ER-->>FE: 404
    end
    ER->>TF: serialize_to_trip_format(snapshot)
    TF-->>ER: trip JSON (items with status, booking reference after confirm)
    ER-->>FE: 200 application/json, attachment trip-{id}.json
    FE-->>User: file downloaded
```
