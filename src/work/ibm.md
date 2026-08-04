---
slug: ibm
title: IBM
subtitle: Bringing modern UX principles to legacy mainframe infrastructure.
homeDescription: Bringing modern UX principles to legacy mainframe infrastructure.
role: Design Intern
type: Visual design, Design system, Enterprise design
about:
  - As a Design Intern at IBM's Silicon Valley Lab, I worked on IVP, the setup process that verifies a new IMS system is configured correctly.
  - It was still run through "green screen" terminal interfaces, so I redesigned the process end-to-end, turning a complex, keyboard-driven setup into a guided, visual experience.
finalDesigns: TODO
---

## What is IMS?

IBM's Information Management System, or IMS, is a high-speed database and transaction manager used on mainframe computers. Originally built in the 1960s for the Apollo moon landing to track rocket parts, it still helps large banks, airlines, and stores handle millions of quick daily tasks safely.

IMS remains the backbone of some of the world's most critical systems: powering 72% of Fortune Global 500 banks, processing up to 100,000 transactions per second, and maintaining 99.9999999% availability (just 30 milliseconds of downtime per year)!

![todo](/images/ibm/ims-history.png) IBM IMS origins and the system's foundational role in the Apollo space program {1000px}

## What is IVP?

When you install a new version of your Mac's or iPhone's software, you usually just download it from Apple's servers and it installs automatically. IVP, or Installation Verification Program, is the enterprise equivalent of making sure everything a new install is configured correctly and ready to use.

It runs a series of checks to verify that a new IMS system (ie: a database) is configured properly and functioning as expected. This program has looked and worked the smae since the start of IMS over 60 years ago. My team and I worked on revamping it with a brand new UI.

## Old interface

Below is a look at some of the "green screen" interfaces; the screens IVP used before the redesign. They are text-based, monospace, and reliant on cryptic keyboard commands rather than modern UI conventions.

![/images/ibm/old-4.png "ALT TODO" | /images/ibm/old-2.png "ALT TODO"] IVP start screen where you choose an environment by typing a number | Sub-option selection where you use forward slash `/` to enable settings

![/images/ibm/old-3.png "ALT TODO" | /images/ibm/old-1.png "ALT TODO"] Loading screen, with the word "PATIENCE" as the only sign of progress | Variables shown in a dense table, where symbols like `*` and `!` mark status and abbreviations like `Chg`, `Doc`, and `eNt` stand for actions

## Process

We started by mapping the flow of IVP. As you can see, even this setup process alone, before the actual IMS database system is involved, is quite complicated.

IVP runs in four phases:

- Initialization: select initial parameters
- Variable Gathering: define variables and settings
- File Tailoring: place the variables into jobs
- Execution: run the jobs

This structure is a holdover from a decades-old process, a direct reflection of the legacy of IBM's mainframe software.

![flow](/images/ibm/flow.png) FLOW

## Phase 1 - Manual "Translation"

To better understand how IVP worked, and to also familiarize ourselves with the types of screens, we dissected each screen, state, and panel that the terminal could render, and created a modern 1:1 equivalent using proper interfaces, as well as using [Carbon](https://carbondesignsystem.com/) (IBM's design system)

![/images/ibm/old-4.png "ALT TODO" | /images/ibm/env-new.png "ALT TODO"] Before: User types numbers to select their environment | After: User selects an IVP environment using visual cards and icons

![/images/ibm/old-5.png "ALT TODO" | /images/ibm/phase-new.png "ALT TODO"] Before: Phase navigation and restart options are embedded in a text-based menu | After: Phase navigation is organized into tabs with visual progress tracking and guided actions

![/images/ibm/old-1.png "ALT TODO" | /images/ibm/vg-new.png "ALT TODO"] Before: User scrolls through a text-based variable list and edits values using action codes | After: User manages variables through data tables with inline editing and status indicators

Once this was done, we moved into the second phase of this project: to completely redesign this whole process.

## Phase 2 - Introducing Configuration as Code

Another team had been working on a tool called "Configuration as Code." This was basically a YAML file that contained all of the parameters that an IMS system would "import."

## Looking ahead: integrating AI

One of the last things we did was to identify usecases for integrating AI (from IBM's [watsonx.ai](https://www.ibm.com/products/watsonx-ai)).

![todo](/images/ibm/ai-1.png) AI configuration assistant - Ask questions in natural language and receive contextual explanations without leaving the setup flow

![todo](/images/ibm/ai-2.png) AI-powered YAML validation - detects syntax error in configuration files and proposes fixes

![todo](/images/ibm/ai-3.png) AI migration analysis - evaluates configuration values to identify incompatibilities
