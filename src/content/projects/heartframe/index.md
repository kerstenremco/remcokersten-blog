---
title: HeartFrame - iOS App to Track Relationship Milestones
description: >-
  HeartFrame is an iOS app that lets couples keep track of how long they’ve been together and build a timeline with memories and pictures along the way.
heroImage: heartframe.png
tags:
  - Swift
links:
  - "website/https://heartframe.remcokersten.nl"
  - "appstore/https://apps.apple.com/app/id6746423559"
order: 40
---

A native iOS app for couples that celebrates your time together and keeps your shared memories in one place. It works fully offline.

During onboarding you enter your own name, your partner's name and the date you got together. From then on, HeartFrame shows exactly how long you've been together in years, months and days. You can add a memory for each special moment, with a title, description, date and a set of photos. A home screen widget keeps the counter visible without opening the app, and you can turn any milestone into a share-ready image for social media.

## Features

- A relationship timer that shows the time together in years, months and days, with a customisable date format.
- A memory timeline. Each memory can have photos (picked through PhotosPicker), a description and an optional date, and the list can be sorted either way.
- A full-screen photo viewer with pinch-to-zoom and swipe-to-dismiss gestures.
- Home screen widgets in small and medium sizes. They can be configured with App Intents, for example to switch on a colourful background.
- Shareable images: each milestone is rendered as a 1080×1080 gradient card in every colour theme, and you swipe through the previews before sharing.
- A guided tour for first-time users and an in-app feedback form.
- Privacy by design: no account and no cloud, and all data stays on the device.

## Architecture

HeartFrame is a SwiftUI app built with MVVM. It has two targets, the main app and a WidgetKit extension.

- **Persistence:** SwiftData models (`Pair`, `Person`, `Memory`, `Photo`) with cascading relationships. Photos are stored as external binary data so the database stays small.
- **App ↔ widget communication:** the app and the widget share an App Group. Settings such as the "together since" date, theme colours and date format are written to shared `UserDefaults`. Every change calls `WidgetCenter` to reload the widget timelines, and the widget refreshes itself once a day.
- **Performance:** photos are downsampled on a background queue with ImageIO (`CGImageSourceCreateThumbnailAtIndex`) before they're shown. This keeps memory use low in grids that hold many high-resolution images.
- **Image generation:** the share cards are SwiftUI views rendered to images with `ImageRenderer` and shared through the native `ShareLink`.

## Tech stack

- Language & UI: Swift, SwiftUI, Swift Concurrency (async/await)
- Persistence: SwiftData, App Groups with shared UserDefaults
- Apple frameworks: WidgetKit, App Intents, PhotosUI, ImageIO, Combine
- Tooling: Xcode
