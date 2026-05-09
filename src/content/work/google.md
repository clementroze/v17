---
slug: google
title: Google
subtitle: Building the next generation of collaborative design tooling for DCC teams.
year: 2024
role: Design Intern
type: UX Research, Systems design, Prototyping, Design systems
hero: /images/google-hero.jpg
cover: /images/google-cover.jpg
about:
  - Google is one of the world's most recognized technology companies, operating across search, cloud, hardware, and enterprise software.
  - During this internship I embedded within the DCC (Design, Creative, and Content) organization to rethink how large creative teams collaborate at scale.
  - I delivered a high-fidelity prototype and a system of reusable components that shipped to an internal pilot of 200+ designers.
---

## Context

Large creative organizations face a paradox: the more designers you hire, the harder it becomes to maintain consistency. At Google's scale, with thousands of contributors across dozens of products, design drift is inevitable without strong tooling.

The DCC team had identified that their existing collaboration workflows relied too heavily on ad-hoc Slack threads and disconnected Figma files. The brief was to design a unified collaboration layer that could sit on top of existing tools rather than replace them.

## Discovery & research

We ran 24 structured interviews with designers, design leads, and cross-functional partners across three time zones. The core tension that emerged was between speed and traceability — teams wanted to move fast but had no way to track why design decisions were made.

Three themes dominated our findings: visibility into work-in-progress, clarity around decision ownership, and friction in async feedback loops.

We also conducted a competitive audit of tools like Notion, Linear, and Loom to understand how other teams had solved adjacent problems.

## Design principles

From our research we distilled three principles that guided every design decision:

- Ambient awareness: teams should feel the pulse of work without being interrupted
- Decision trails: every meaningful change should carry a rationale attached to it
- Low ceremony: the tool should reward quick, casual use just as well as formal reviews

## Solution

I designed a lightweight sidebar overlay that integrates directly with Figma. It surfaces active collaborators, flags open decisions, and lets anyone leave a structured annotation with a required "why" field.

The key insight was treating the tool as a communication layer rather than a separate app. By keeping it in-context, we eliminated the context-switching that caused teams to abandon other solutions.

![/images/google-solution.jpg]

## Outcome

The pilot launched to 200 designers across Workspace and Cloud. Within three weeks, the number of async feedback cycles dropped by 34% and decision documentation coverage increased from 12% to 61% on piloted projects.

The component library I built during the project was adopted by two other teams and contributed back to the internal design system.

![/images/google-outcome-a.jpg | /images/google-outcome-b.jpg]
