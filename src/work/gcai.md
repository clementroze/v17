---
slug: gcai
title: General Counsel AI
subtitle: Building the design foundation for an AI legal platform.
role: Lead Product Designer
type: Product design, Brand identity, Design systems, Prototyping
about:
  - [General Counsel AI](https://gc.ai), or GC AI, is a legal workspace that helps in-house teams with their day-to-day legal tasks.
  - I joined as the first designer to lead the design and development of the user interface, working closely with the founders to shape multiple iterations of the product.
  - This page contains little tidbids of various components, surfaces, and flows that I created.
finalDesigns: The core workspace

---

## Where it started

When I joined, GC AI was a single chat box bolted onto a model — functional, but visually cold and clinical. As the product evolved, the cracks started showing: sidebars grew disorganized, navigation became confusing, and the architecture couldn't scale with new features.

The 2025 rebrand by [Monopo](https://monopo.nyc) brought a warmer palette and updated styles. I used that opening to rethink the platform's visual & UX design from the ground up.

![old](/images/gcai/old.png) The original interface of GC AI

HMW How might we make a powerful AI feel as precise and reliable as the legal work it supports?

## Grounding the work in research

Before redesigning anything, I met with GC AI customers, in-house counsel, to observe how they used the product and probe for friction points.

Their feedback mirrored what I'd already flagged in my own review:

- Chat organization was hard to navigate
- Uploading large document sets was cumbersome
- Prompts were difficult to surface and reuse
- Split sidebars created visual noise

![research](/images/gcai/research.png) Synthesizing patterns from our user conversations

From there, I built low- and mid-fidelity prototypes to run usability tests against the new layouts.

![lowfis](/images/gcai/lowfis.png) Initial low- and mid-fidelity mocks presented during user interviews

## Building a design system

With the direction set, I first conducted an audit of existing components like buttons and inputs. My main findings were that:

- There were too many variants for each component
- The actual Figma library wasn't built as efficiently and lacked new features like slots, advanced variables, etc.
- The color palette of the previous design system used cooler tones, while the new app needed to look more like the marketing page (with the revamped, warmed color palette)

![components](/images/gcai/components.png) Before and after of several components

I built out the foundations: a type scale, color tokens, and a library of components that every surface could share. This let us move fast without the interface drifting apart as we added features.

![design system](/images/gcai/design-system.png) A slice of the components and styles used in GC AI's new look {1000px}

## The core workspace

The heart of GC AI is the workspace, where a user poses a question and the assistant works through it. I designed the default state to feel calm and focused, with plenty of room for the response and its citations to breathe.

### A three-layer surface hierarchy

The interface is built on three distinct tonal layers that create depth without noise.

The shell — a deep navy #003047 — wraps the entire application and contains the sidebar navigation. It doubles as a brand carrier: navy is GC AI's primary color, so its presence at the outermost layer means every screen opens with a consistent identity signal.

The main section uses two tints of beige — a warmer #FAF3EC for the sidebar and a near-white #FFFCF9 for the content — to quietly separate navigation from work without resorting to hard borders or heavy contrast.

Finally, interactive elements like text fields, buttons, and the chat composer use pure white (#FFFFFF) to lift off the beige canvas.

![messaging](/images/gcai/messaging.png) Messaging with the AI

## Editing and versioning

Legal work is iterative, so drafts don't always survive first contact. I designed an editing flow that fits directly inside the messaging interface. It lets users refine their input, track changes as they go, and step back through previous versions when needed.

![/images/gcai/edit.png | /images/gcai/editing.png | /images/gcai/versions.png] Entering edit mode | Editing a draft inline | Browsing version history

## Company profiles and account menu

To make the workspace feel like a real product and not just a tool, I also designed the surrounding surfaces too.

### Company profiles

Company profiles give the AI persistent context about an entity — its structure, risk tolerance, and more. In-house counsel often juggle multiple subsidiaries or affiliated companies at once, so being able to switch contexts at the top of every chat keeps the assistant grounded in the right company before any work begins.

### Account menu

The account menu is where the user manages their profile, settings, and organization. It also doubles as a natural home for new features. The Personalization toggle, for instance, is surfaced here with a "New!" tooltip, making it a low-friction way to introduce capabilities.

![/images/gcai/company.png | /images/gcai/profile.png] Company profile menu | User account menu

## Context window

When users work through long, document-heavy chats, their context window – the amount of information the AI can hold in memory at once — starts to fill up. GC AI surfaces this transparently through a usage indicator in the chat composer, showing a live percentage and a breakdown.

The indicator tracks two context tiers: normal (up to 200K tokens) and extended (up to 1M). It's displayed as a segmented bar where green (#74A75A) and purple (#B721B7) fill in as the chat grows. When things get critical, the bar shifts to amber (#DE8703) and red (#D16268), and the status label updates to match. Color carries the signal, but for accessibility, I added icons and explicit text labels to back it up so the indicator works for everyone.

![/images/gcai/context-1.png | /images/gcai/context-2.png | /images/gcai/context-3.png] Default context indicator | Using normal context | Normal context nearly full

![/images/gcai/context-4.png | /images/gcai/context-5.png | /images/gcai/context-6.png] Using extended context | Extended context nearly full | Entier context window is full

## Queue and loading states

Because legal research can take time, I paid close attention to the in-between moments.

### Queueing messages

A queue lets users line up work and keep moving instead of waiting on the AI between sends. Queued messages stack above the composer, and each one can be edited, saved as a prompt, or jumped to immediately by interrupting the current response.

![queue](/images/gcai/queue.png) Queuing up multiple pieces of work

### Loading states

While the AI works, it doesn't just spin — it thinks through each action in sequence. A single query like:

> "Attached is our AI feature spec. Research CA's new AI disclosure laws and draft compliant user-facing language"

...might involve several distinct steps: pulling relevant law, cross-referencing the spec, then drafting the response. To keep the user informed without overwhelming them, I designed a set of pills that collapses by default and expands on hover. Clicking any pill surfaces the thinking trace for that specific action.

The pills stay visually minimal when collapsed, which keeps the interface calm during what could otherwise feel like a long wait. They also double as a branding moment: each action gets a tint derived from the primary navy #003047, divided evenly across however many steps the query takes — two actions split it into two tints, eight into eight. The more complex the task, the richer the gradient.

![loading](/images/gcai/loading.png) A loading state that keeps users informed

![thinking states](/images/gcai/thinking-states.mov) Prototype of the thinking states

## Learnings & reflections

Being the first designer at GC AI meant wearing every hat: researcher, product designer, and sometimes front-end developer. This was particulary useful when I was prototyping complex interactions like the [pill loading states](#loading-states).

The biggest lesson for me was that in the legal world, polish isn't decoration, it's credibility. Every pixel of precision earned us a little more trust, and watching the product grow from a single chat box into a real workspace was one of the most rewarding things I've worked on.
