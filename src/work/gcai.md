---
slug: gcai
title: General Counsel AI
subtitle: Designing an AI-powered legal research platform from zero to launch.
year: 2026
role: Lead Product Designer
type: Product design, Brand identity, Design systems, Prototyping
cover: /images/gcai/cover.png
about:
  - General Counsel AI is an early-stage startup building intelligent research and drafting tools for legal professionals and in-house counsel teams.
  - As the first and only designer, I owned the end-to-end product experience from initial wireframes through to the public launch.
  - The platform now serves over 40 law firms and legal teams in its early access program.
---

## Context

Legal research is one of the most time-intensive parts of a lawyer's work. Senior associates at large firms routinely spend 6–10 hours on research tasks that AI can now assist with in minutes. But existing AI tools for law were built by engineers for engineers — dense, untrusted, and impossible to audit.

General Counsel AI was founded on a single thesis: that AI for law had to be explainable above all else. Every answer had to show its sources, its reasoning chain, and its confidence level.

## The design challenge

The core challenge was building trust in an AI product within a profession that is structurally risk-averse and citation-dependent. Lawyers don't want answers — they want defensible answers. Every design decision had to serve that constraint.

I ran a discovery sprint with eight lawyers across corporate, IP, and litigation practices. Two things became immediately clear: they would not use any tool that couldn't show its work, and they needed the output to be citation-ready for client memos.

## System design

I built the design system from scratch using Figma variables with light and dark modes, targeting a professional but approachable aesthetic that felt closer to a research tool than a chatbot.

The core interaction pattern is what I call "structured provenance" — every AI response is rendered as a card that expands to show the source documents, the exact passages cited, and the model's confidence score. Users can click any citation to open the source inline.

- Research canvas: multi-threaded query workspace with persistent history
- Memo mode: structured output formatted for client-ready documents
- Source panel: inline document viewer with highlighted passages
- Audit trail: timestamped log of every query and response for compliance

![/images/gcai-system.jpg]

## Brand & visual language

With no existing brand, I developed the full visual identity. The palette is deliberately restrained — near-black backgrounds with a single electric blue accent, communicating precision and authority without feeling cold.

Typography is set in a pairing of a geometric sans for UI and a humanist serif for document output, reinforcing the distinction between interface and artifact.

## Launch & results

The platform launched to early access in early 2026. In the first six weeks, average session length was 34 minutes — well above the 8-minute benchmark for legal SaaS tools. The most-used feature was the citation panel, validating the core design hypothesis.

Two of the initial law firm customers have since requested enterprise contracts, and the team is now fundraising a seed round.

![/images/gcai-launch-a.jpg | /images/gcai-launch-b.jpg]
