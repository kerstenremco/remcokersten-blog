---
title: busvertrektijden.nl - real-time Dutch bus departures
description: >-
  Live bus departure times for every stop in the Netherlands, on the web and on your Home Assistant dashboard.
heroImage: busvertrektijden-ha.png
tags:
  - NodeJS
  - PostgreSQL
  - Redis
  - Python
links:
  - "website/https://www.busvertrektijden.nl"
  - "github/https://github.com/kerstenremco/busvertrektijden-api-v2"
order: 80
---

A real-time departure board for every bus stop in the Netherlands.

You search for a stop and see which buses are leaving next. Each departure shows its delay or cancellation and any disruption notice that affects it. The data comes from the GTFS feed provided by [OVapi](https://gtfs.ovapi.nl/): the timetable is refreshed periodically, and the realtime feeds are checked every minute or so. This API also feeds a custom Home Assistant integration and dashboard card, so you can keep your own stop's departures on your smart-home dashboard.

## Features

- Fuzzy stop search across all Dutch stops, with rewrites for large stations that have several platforms (for example, "Groningen" covers every platform at the main station).
- Upcoming departures with realtime delays and cancellations, sorted by time until departure.
- Disruption alerts for a whole stop and for individual routes.
- Filtering by line number and a configurable number of results.
- A Home Assistant integration with a guided setup: search for a stop, pick it from a list and optionally filter by line. It creates a sensor that updates every minute.
- A Home Assistant dashboard card that shows delays, struck-through cancelled departures and active alerts.

## Architecture

The backend is split into a few small services that run in Docker:

- **Timetable import:** A Python script downloads the national GTFS dataset and bulk-loads it into staging tables with PostgreSQL `COPY`. It then moves the data into the live tables and refreshes a materialized view of the trips that run today. This keeps the departure queries small and fast.
- **Realtime worker:** A cron-based Node.js worker polls the GTFS-Realtime protobuf feeds for trip updates and alerts. It uses `If-Modified-Since` so it skips feeds that haven't changed, and writes compact per-stop and per-trip entries to Redis with a TTL.
- **REST API:** A Fastify API combines the schedule from PostgreSQL with the realtime data in Redis, then works out the actual departure times. Request and response schemas are defined with TypeBox, which also generates the Swagger/OpenAPI docs.
- **Home Assistant:** The custom integration polls the API. The card is a Lit web component that reads the sensor's attributes. Both are [distributed through HACS](https://github.com/kerstenremco/busvertrektijden-ha/wiki/Installatie-HomeAssistant).

## Tech stack

- Backend API: Node.js, TypeScript, Fastify, TypeBox, Swagger/OpenAPI
- Data: PostgreSQL (materialized views, and SQL functions), Redis, Python import pipeline
- Home Assistant: custom integration in Python (aiohttp, config flow), card with Lit, bundled with Parcel
