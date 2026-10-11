---
title: wiegaaterkoffiehalen.nl - decide who's on coffee duty
description: >-
  With Metwiegaaterkoffiehalen.nl, your team can quickly and fairly decide who’s on coffee duty!
heroImage: wiegaaterkoffiehalen.png
tags:
  - React
  - NodeJS
  - Flutter
  - AWS
links:
  - "website/https://www.wiegaaterkoffiehalen.nl"
  - "appstore/https://apps.apple.com/nl/app/wiegaaterkoffiehalen-nl/id6737775867"
  - "playstore/https://play.google.com/store/apps/details?id=nl.kerstenit.wgekh"
order: 100
---

A free web and mobile app that settles the age-old office question fairly and fast.

A team member starts a coffee round in their group. Colleagues get notified right away and have a set amount of time to place their order from the group’s own drinks list. When the timer runs out, the system randomly picks one of the people who ordered to do the coffee run. That person gets an email and a push notification with the full order list. Everyone in the group sees the result live.

## Features

- Groups with member management, roles and invite links. People without an account are invited automatically.
- A customisable drinks menu per group, with extras and notes on each order.
- Timed coffee rounds with random selection, plus a “I’ll go myself” option.
- Real-time updates and online presence through WebSockets.
- Push and email notifications, which members can turn on or off per group.

## Architecture

The project is a set of services. At its centre is a REST API that runs in a container. Event-driven serverless functions on AWS handle the work that runs in the background:

- When a round starts, the API puts a message on an SQS queue with a delay equal to the round’s length. When the delay ends, a Lambda function closes the round and picks who goes.
- Notifications fan out through SNS to separate Lambdas for email (SES), push (Firebase Cloud Messaging) and real-time group refreshes.
- A WebSocket API (API Gateway + Lambda + DynamoDB) keeps track of who is online and sends live updates to each group.
- Sign-in uses Amazon Cognito with custom auth-challenge Lambda triggers.

## Tech stack

- Web frontend: React 19; end-to-end tests with Cypress
- Mobile app (iOS & Android): Flutter, Riverpod
- Backend API: Node.js, Express, MongoDB, Swagger/OpenAPI docs, Prometheus metrics
- Cloud & infrastructure: AWS (Lambda, SQS, SNS, SES, API Gateway WebSockets, Cognito, SSM Parameter Store, S3, CloudFront), defined as infrastructure as code with CloudFormation
