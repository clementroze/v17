---
slug: microsoft
title: Microsoft
subtitle: Reimagining the document creation experience for the next billion users.
year: 2024
role: Design Intern
type: UX Design, Accessibility research, Motion design, User testing
hero: /images/microsoft-hero.jpg
cover: /images/microsoft-cover.jpg
about:
  - Microsoft's Office division serves over 1.4 billion users worldwide across Word, Excel, PowerPoint, and a growing suite of AI-assisted tools.
  - I joined the Word team to explore how document creation could feel more fluid, adaptive, and accessible for users across vastly different contexts and devices.
  - The project culminated in a redesigned compose surface that is currently in extended beta testing.
---

## Context

Despite being one of the most widely used applications in the world, Word's core editing experience had not seen a significant redesign in over a decade. Menus had grown bloated, the toolbar was a source of constant confusion in usability studies, and the experience felt disconnected from how people actually write today.

The challenge was not to reinvent writing, but to get out of the way of it.

## Research

We partnered with the Microsoft Research team on an existing longitudinal study tracking how 800 participants used Word over 90 days. The data revealed that 70% of all toolbar interactions involved just six commands — but those six commands were buried among 140 visible options.

We also ran our own observational sessions focusing on first-generation Office users in emerging markets, where the density of the interface was a significant barrier to entry.

## Approach

The central idea was progressive disclosure at the surface level: show nothing you don't need right now, and reveal depth only when asked for it. The toolbar collapses to a floating action strip by default, with contextual options surfacing based on what the user is doing.

We prototyped five distinct directions before converging on a model we called "intent-first" editing — where the interface responds to what you're trying to accomplish rather than presenting all possibilities simultaneously.

- Contextual formatting: controls appear only when text is selected
- Smart suggestions: AI surfaces the three most likely next actions
- Ambient rulers: margins and spacing collapse until you need them
- Focus mode: everything except the writing surface fades on inactivity

## Testing & iteration

We ran three rounds of moderated usability testing with 12 participants each. The first round revealed that hiding the toolbar entirely caused anxiety for power users who relied on visual scanning. We introduced a persistent "more" handle that satisfied both groups without compromising the clean default state.

![/images/microsoft-testing.jpg]

## Outcome

The redesigned surface reduced time-to-first-keystroke by 18% in task-based testing. Accessibility scores improved significantly, with the new layout achieving a WCAG AA pass rate of 97% versus 71% for the legacy toolbar.

The motion system I designed for reveal and collapse animations was documented and handed off to the Office Design Language team for broader adoption.

![/images/microsoft-outcome-a.jpg | /images/microsoft-outcome-b.jpg | /images/microsoft-outcome-c.jpg]
