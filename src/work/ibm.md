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

When you install a new version of your Mac's or iPhone's software, you usually just download it from Apple's servers and it installs automatically. IVP, or Installation Verification Program, is the enterprise equivalent: it makes sure a new install is configured correctly and ready to use.

It runs a series of checks to verify that a new IMS system (ie: a database) is configured properly and functioning as expected. This program has looked and worked the same since the start of IMS over 60 years ago. My team and I worked on giving it a brand new UI.

HMW How might we make a 60-year-old, text-based program feel as modern and intuitive as consumer software, without losing the trust of engineers who rely on it?

## Old interface

Below is a look at some of the "green screen" interfaces; the screens IVP used before the redesign. They are text-based, monospace, and rely on cryptic keyboard commands rather than modern UI conventions.

![/images/ibm/old-4.png "Green screen terminal showing a numbered list of IMS environments to choose from" | /images/ibm/old-2.png "Green screen terminal showing sub-options toggled on with a forward slash"] IVP start screen where you choose an environment by typing a number | Sub-option selection where you use forward slash `/` to enable settings

![/images/ibm/old-3.png "Green screen loading indicator displaying only the word PATIENCE" | /images/ibm/old-1.png "Green screen table of IMS variables with cryptic status symbols and abbreviations"] Loading screen, with the word `PATIENCE` as the only sign of progress | Variables shown in a dense table, where symbols like `*` and `!` mark status and abbreviations like `Chg`, `Doc`, and `eNt` stand for actions

## IVP legacy process

We started by mapping the flow of IVP. As you can see, even this setup process alone – before the actual IMS database system is involved – is quite complicated.

IVP runs in four phases:

- Initialization: select initial parameters
- Variable Gathering: define variables and settings
- File Tailoring: place the variables into jobs
- Execution: run the jobs

This structure is a holdover from a decades-old process, a direct reflection of the legacy of IBM's mainframe software.

![Diagram of the four-phase legacy IVP flow: Initialization, Variable Gathering, File Tailoring, and Execution](/images/ibm/flow.png) The legacy IVP flow, phase by phase

## Part 1 - Manual "translation"

To better understand how IVP worked, and to familiarize ourselves with the process, we dissected each screen, state, and panel the terminal could render, then rebuilt each one as a modern 1:1 equivalent using proper UI components and [Carbon](https://carbondesignsystem.com/) (IBM's design system).

![/images/ibm/old-5.png "Green screen menu listing phase navigation and restart options as plain text" | /images/ibm/phase-new.png "Redesigned phase navigation shown as tabs with a visual progress tracker"] Before: phase navigation and restart options are buried in a text menu | After: phase navigation is organized into tabs with visual progress tracking and guided actions

![/images/ibm/old-4.png "Green screen terminal showing a numbered list of IMS environments to choose from" | /images/ibm/env-new.png "Redesigned environment picker shown as a grid of visual cards with icons"] Before: user types numbers to pick their environment | After: selecting an IVP environment using visual cards and icons

![/images/ibm/old-1.png "Green screen table of IMS variables with cryptic status symbols and abbreviations" | /images/ibm/vg-new.png "Redesigned data table with inline editing and status indicators for each variable"] Before: scrolling a text-based variable list and editing via action codes | After: user manages variables in an editable data table

Once this was done, we moved into the second phase of this project: to completely redesign this whole process.

## Part 2 - Introducing Configuration as Code

The second part of my internship was revamping this lengthy installation process from the ground up. Coming in as an intern with no prior history with IVP – but with the knowledge from Part 1 – turned out to be an advantage: we could bring a fresh approach to a decades-old system.

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

Configuration as Code fundamentally changed how we approached IVP. Instead of guiding users through hundreds of sequential inputs, the system now revolves around a single, reusable configuration YAML file. This leads to a shorter flow that starts with the YAML import/discovery, moves to editing the parameters, and ends with running the jobs – all in one place.

![Diagram of the updated IVP flow](/images/ibm/flow-2.png) The updated flow merge File Tailoring and Execution into one Apply step

## Final designs

First, the user lands on the Configuration Center screen. From there, they can choose to create a new system, test an existing one, or if they really want to, go through the legacy IVP process instead. Once they hit "Create," there are 3 ways to do this:

- Discover an existing IMS system and clone it
- Use an official IBM template to start from
- Upload their own configuration file

![/images/ibm/config-center.png "Configuration Center landing page with options to create, test, or run the legacy IVP process" | /images/ibm/create.png "Three three ways to create a new system: discover, template, or upload"] The Configuration Center landing page | Choosing how to create a new system

Then, depending on the option picked above, users either "discover" (i.e. locate and select) an existing database to clone, or they upload an existing YAML file they already have.

![/images/ibm/discover.png "Screen for locating and selecting an existing IMS system to clone" | /images/ibm/upload.png "Screen for uploading a YAML configuration file"] Discovering an existing IMS system to clone | Uploading a YAML configuration file to reuse its parameters

The next step is the "Edit." Users see a table with all the values and variables organized into categories. They can also open the raw configuration file if they'd rather edit that directly, which maps 1 to 1 to the UI table. To edit, they click a value for inline editing with built-in vaildation (e.g. catching typos and incorrect value types).

![/images/ibm/edit.png "Table view of configuration values organized into categories, with a toggle to view the raw YAML file" | /images/ibm/inline.png "A value being edited inline, with a validation error shown as a tooltip"] Editing through the table, or with the raw configuration file | Inline editing with real-time validation

Once they're finished editing, users move to the "Apply" step. Their job is far simpler than in the legacy IVP flow: they just click "Run," and every job is queued in the right order and executed automatically. If a runtime error occurs, the user gets a detailed screen showing what happened.

![/images/ibm/run.png "ALT TODO" | /images/ibm/error.png "Error screen with details about a failed job"] Users can track the progress of the new system being configured | If a runtime error occurs, users are shown details

The Configuration Center can intelligently identify the error and suggest a fix. Users can apply it directly from a modal, without losing the context of the Apply screen. Finally, the last step is to review the newly configured system. Users can even export a new YAML file with the updated variables and parameters that were generated.

![/images/ibm/fix.png "Modal showing an AI-suggested fix for a configuration error, layered over the Apply screen" | /images/ibm/review.png "Final review screen summarizing the newly configured system"] AI identifies, analyzes, and prompts the user with a fix – all from the same screen | The final page lets user review their newly configured system

## Looking ahead: integrating AI

One of the last things I did was to identify usecases for integrating AI (from IBM's [watsonx.ai](https://www.ibm.com/products/watsonx-ai)) into the configuration flow. Here are a few examples:

### AI configuration assistant

Users ask questions in natural language and receive contextual explanations without leaving the setup flow.

![Chat panel where a user asks a natural-language question about their configuration and receives a contextual answer](/images/ibm/ai-1.png) Configuration assistant

### AI-powered YAML validation

This tool detects syntax errors in configuration files and proposes fixes.

![YAML validation panel highlighting a syntax error alongside a suggested ](/images/ibm/ai-2.png) YAML validation

### AI migration analysis

Finally, this tool evaluates configuration values to flag incompatibilities between system versions.

![Migration analysis screen flagging configuration values that are incompatible with the target version](/images/ibm/ai-3.png) Migration analysis

## Learnings & reflections

IVP is a genuinely complex system, and reading pages of [documentation](https://www.ibm.com/docs/en/zos-basic-skills?topic=ims-installation-verification-program-ivp) wasn't enough. Throughout the whole summer, regularly leaning on more experienced devs on the team was very helpful and also helped us see things from their point of view.

Another lesson that stuck with me: legacy behavior matters more than I expected, and trust from long-time IVP users takes real work to earn. During our three client calls, engineers were initially skeptical of trading their whole process for a new web interface. They were less resistant to the change itself and more concerned with how their day-to-day would be affected. We listened closely, and looking back, several of the concerns they raised became actual features in the final product.
