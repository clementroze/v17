---
slug: ibm
title: IBM
subtitle: Bringing modern UX principles to legacy mainframe infrastructure.
homeDescription: Bringing modern UX principles to legacy mainframe infrastructure.
role: Design Intern
type: Visual design, Design system, Enterprise design
about:
  - As a Design Intern at IBM's Silicon Valley Lab, I took a mainframe setup process still stuck on "green screen" terminals and rebuilt it from the ground up.
    - The result was a guided, visual experience instead of a complex, text-based workflow.
finalDesigns: Final designs
---

## What is IMS?

IBM's [Information Management System](https://www.ibm.com/products/ims), or IMS, is a high-speed database and transaction manager used on mainframe computers. Originally built in the 1960s for the Apollo moon landing to track rocket parts, it helps large banks, airlines, and stores handle millions of quick daily tasks safely.

IMS remains the backbone of some of the world's most critical systems: powering 72% of Fortune Global 500 banks, processing up to 100,000 transactions per second, and maintaining 99.9999999% availability (just 30 milliseconds of downtime per year)!

![todo](/images/ibm/ims-history.png) IBM IMS origins and the system's foundational role in the Apollo space program {1000px}

## What is IVP?

When you install a new version of your Mac's or iPhone's software, you usually just download it from Apple's servers and it installs automatically. IVP, or Installation Verification Program, is the enterprise equivalent of making sure everything a new install is configured correctly and ready to use.

It runs a series of checks to verify that a new IMS system (ie: a database) is configured properly and functioning as expected. This program has looked and worked the same since the start of IMS over 60 years ago. My team and I worked on revamping it with a brand new UI.

HMW How might we make a 60-year-old, text-based program feel as modern and intuitive as consumer software, withoutu losing the trust of engineers who rely on it?

## Old interface

Below is a look at some of the "green screen" interfaces; the screens IVP used before the redesign. They are text-based, monospace, and rely on cryptic keyboard commands rather than modern UI conventions.

![/images/ibm/old-4.png "ALT TODO" | /images/ibm/old-2.png "ALT TODO"] IVP start screen where you choose an environment by typing a number | Sub-option selection where you use forward slash `/` to enable settings

![/images/ibm/old-3.png "ALT TODO" | /images/ibm/old-1.png "ALT TODO"] Loading screen, with the word `PATIENCE` as the only sign of progress | Variables shown in a dense table, where symbols like `*` and `!` mark status and abbreviations like `Chg`, `Doc`, and `eNt` stand for actions

## IVP legacy process

We started by mapping the flow of IVP. As you can see, even this setup process alone, before the actual IMS database system is involved, is quite complicated.

IVP runs in four phases:

- Initialization: select initial parameters
- Variable Gathering: define variables and settings
- File Tailoring: place the variables into jobs
- Execution: run the jobs

This structure is a holdover from a decades-old process, a direct reflection of the legacy of IBM's mainframe software.

![flow](/images/ibm/flow.png) FLOW

## Part 1 - Manual "translation"

To better understand how IVP worked, and to also familiarize ourselves with the types of screens, we dissected each screen, state, and panel that the terminal could render, and created a modern 1:1 equivalent using proper interfaces, as well as using [Carbon](https://carbondesignsystem.com/) (IBM's design system)

![/images/ibm/old-5.png "ALT TODO" | /images/ibm/phase-new.png "ALT TODO"] Before: Phase navigation and restart options are embedded in a text-based menu | After: Phase navigation is organized into tabs with visual progress tracking and guided actions

![/images/ibm/old-4.png "ALT TODO" | /images/ibm/env-new.png "ALT TODO"] Before: User types numbers to select their environment | After: User selects an IVP environment using visual cards and icons

![/images/ibm/old-1.png "ALT TODO" | /images/ibm/vg-new.png "ALT TODO"] Before: User scrolls through a text-based variable list and edits values using action codes | After: User manages variables through data tables with inline editing and status indicators

Once this was done, we moved into the second phase of this project: to completely redesign this whole process.

## Part 2 - Introducing Configuration as Code

The second part of my internship was revamping this lengthy installation process from the ground up. Coming in as interns with no prior history with IVP – but with the knowledge of Part 1 – turned out to be an advantage: we could bring a fresh approach to a decades-old system.

Another team had been building a tool called Configuration as Code: a YAML file that holds every parameter an IMS system needs to import. It became the middleware that let us glue the pieces together.

### What does the YAML file look like?

A YAML file (YAML Ain't Markup Language) is a plain-text format that uses indentation and key-value pairs to encode data.

For example:

- `imsid: IMS1` (line 5) is a setting: the variable `imsid` is assigned the value `IMS1`.
- `- member_name: DFSPB001` (line 17) is an array item: the `-` marks it as one entry in a list, and the parameters indented beneath it belong to that specific item

```yaml
# -*- coding: utf-8 -*-
# (c) Copyright IBM Corp. 2025

vars:
  imsid: IMS1
  ims_hlq: IMSTESTL.IMS1
ims:
  ims_id: "{{ vars.imsid }}"
  ims_sys_hlq: IMSV15
  ims_hlq: "{{ vars.ims_hlq }}"
  ims_type: DB/DC
  ims_unit: SYSALLDA
  ims_target_user: IBMUSER

  ims_proclib:
    members:
      - member_name: DFSPB001
        config:
          dynamic_terminal_auto_logoff_time: 1440
          aoi_buffer_pool_upper_limit: 2047M
          aoi_type2_security_settings: false
          : R
          appc_enablement: false
          appc_security_setting: F
          ims_vtam_appl_id_for_rsr: APPL7
          automatic_restart_manager_registration: false
          dynamic_terminal_auto_signoff_time: 1440
          automatic_restart: false
          dedb_maximum_buffer_size: 0
          coordinator_controller_convert_abend_on_cancel: false
```

### Updated flow

Configuration as Code fundamentally changed how we approached IVP. Instead of guiding users through hundreds of sequential inputs, the system now revolves around a single, reusable configuration YAML file. This leads to a shorter flow that starts with the YAML import/discovery, editing the parameters, and ultimately running the jobs all in one.

![flow2](/images/ibm/flow-2.png) The main differences with the flow from Part 1 is that "File tailoring" and "Execution" are now combined under one "Apply" step

## Final designs

First, the user lands on the Configuration Center screen. From there, they can choose to create a new system, test an existing one, or if they really want to, go through the legacy IVP process instead. Once they hit "Create," there are 3 ways to do this:

- Discover an existing IMS system and clone it
- Use an official IBM template to start the system from
- Upload their own configuration file

![/images/ibm/config-center.png "ALT TODO" | /images/ibm/create.png "ALT TODO"] Configuration Center landing page | Options when creating a new system

Then, depending on the option picked above, users either "discover" (ie: locate and select) an existing database to use to clone, or they upload an existing YAML file that they already have.

![/images/ibm/discover.png "ALT TODO" | /images/ibm/upload.png "ALT TODO"] Discovering an existing IMS system | Uploading a YAML configuration file to use its parameters

The next step is the "Edit" step. Users see a table with all the values/variables organized into categories. They can also open the raw configuration file of the YAML file if they wish to edit that instead, which maps 1 to 1 to the UI table. To edit, they can click on the value where there is inline editing with validation checks (eg: to check for typos and incorrect value types).

![/images/ibm/edit.png "ALT TODO" | /images/ibm/inline.png "ALT TODO"] Users can edit through the table interface or with the raw configuration file editor | Inline editing and validation allows for seamless editing of the parameters

Once they're finished editing, users proceed to the "Apply" step. Their job is vastly simplified compared to the legacy IVP version: they only have to click "Run," and all the jobs are queued up automatically in the right order in the backend and then executed seamlessly. If a runtime error occurs, the user gets a detailed screen showing what happened.

![/images/ibm/run.png "ALT TODO" | /images/ibm/error.png "ALT TODO"] Users can track the progress of the new system being configured | If a runtime error occurs, users are shown details

The Configuration Center can intelligently identify the error and suggest a solution. The user can fix the error directly in a modal, without losing the context of the Apply screen. Finally, the last step is to review the newly configured system. Users can even export a new YAML file with the updated variables and parameters that were newly generated.

![/images/ibm/fix.png "ALT TODO" | /images/ibm/review.png "ALT TODO"] AI identifies, analyzes, and prompts the user with a fix – all from the same screen | The final page lets user review their newly configured system

## Looking ahead: integrating AI

One of the last things we did was to identify usecases for integrating AI (from IBM's [watsonx.ai](https://www.ibm.com/products/watsonx-ai)) into the configuration flow. Here are a few examples:

### AI configuration assistant

Ask questions in natural language and receive contextual explanations without leaving the setup flow.

![todo](/images/ibm/ai-1.png) Configuration assistant

### AI-powered YAML validation

Detects syntax errors in configuration files and proposes fixes.

![todo](/images/ibm/ai-2.png) YAML validation

### AI migration analysis

Evaluates configuration values to identify incompatibilities system between different versions.

![todo](/images/ibm/ai-3.png) Migration analysis

## Learnings & reflections

IVP is a genuinely complex system, and reading through pages of [documentation](https://www.ibm.com/docs/en/zos-basic-skills?topic=ims-installation-verification-program-ivp) wasn't enough. Throughout the whole summer, regularly leaning on more experienced devs on the team was very helpful.

When I mentioned my work to some friends, one of the points that was raised was: couldn't AI have done most of this? Here is my answer to that:

Phase 1 was a literal translation: same process, same steps, same confirmations, just re-skinned from terminal text into a clickable UI. That kind of 1:1 conversion is exactly what AI is good at, and we did use it to iterate faster on component choices. But we still built most of those screens by hand, because the point of Phase 1 wasn't speed, it was learning the system well enough to redesign it in Phase 2.

Phase 2 was different: rethinking the flow from first principles. AI could suggest a "simplified" or "revamped" version if prompted, but there was no way to know if that version actually worked without presenting it to clients, talking it through with colleague devs, and reasoning through the mainframe's edge cases ourselves — an AI will confidently hallucinate details about a system this complex. None of that (walking over to a colleague's desk for a two-minute gut check, reading a room in a client meeting) is something AI can do. So yes, a lot of this could theoretically be AI-generated, but it would be lower quality and impossible to fully trust.

Two other lessons stuck with me: how much legacy behavior matters to long-time IVP users, since change takes time and trust; and just how different the pace and process of a large, decades-old company feels day to day.
