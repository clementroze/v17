---
slug: microsoft
title: Microsoft
subtitle: Copilot-powered B2B sales tools designed for Gen Z buyers.
homeDescription: AI-powered B2B tools for Gen Z buyers.
role: Lead Designer & PM of 6 consultants
type: DCC Collaboration
about:
  - Through Design Consulting at Cornell, I led a team of 6 consultants during a five-month collaboration with Microsoft.
  - We analyzed 50 research papers, conducted 90 interviews, and designed two integrated solutions spanning the B2B buyer journey.
finalDesigns: Final flow & high-fidelity mockups
---

## Intro

In Spring 2024, we partnered with a team at Microsoft to explore how Copilot can better serve the next generation of B2B buyers.

Some are now stepping into roles as B2B buyers, yet the tools they're expected to use often reflect outdated workflows.

Recognizing this shift, our goal was to understand how AI assistants could evolve to deliver meaningful value not only to sellers, but also to these emerging Gen Z buyers. These are people who are tech-savvy, AI-comfortable, and redefining how business purchasing gets done.

HMW How might we leverage Gen Z's digital fluency and comfort with AI agents to design more effective, personalized, and trustworthy sales interactions?

## Research

We analyzed 50+ academic and industry papers focused on:

- Gen Z digital behaviors and values
- Evolving B2B buyer expectations

We also conducted 90 interviews:

- 66 with Gen Z professionals
- 24 with B2B buyers, including early-career Gen Z buyers

We found several key insights:

- AI is seen as a support tool, not a decision-maker
- Gen Z expects tools to be fast, personalized, ethical, and transparent
- AI is most valuable when it automates repetitive tasks (e.g. research, document review, product comparisons)
- Effective AI design must simplify complexity and enhance (not replace) human input

## User journey

To have the most context possible when designing our flows, we set out to understand the B2B procurement process.

B2B buyers follow a structured procurement journey. It begins with identifying internal needs and gathering stakeholder requirements. They then create detailed RFPs and conduct solution and supplier research. After receiving vendor bids, they compare and assess options based on fit, risks, and benefits. Finally, they review contracts, finalize purchase orders, and establish relationships with selected vendors.

## Low fidelity mockups

The feature I designed fit into the Discovery flow of the buyer. Specifically, I designed a match refinement tool. It’s essentially a feature designed to help the buyers narrow down and find products that match their exact requirements.

The features we designed fit as a Copilot extension on the browser.

![Low-fi sketch of a product page with highlighted text and floating comment popovers, plus a button to find alternative products.](/images/microsoft/lowfi.png) Low-fi sketch of the product page

The first version of this feature actually looked very different than what I ended up with. In this version, users would be able to highlight information directly on the product page and add comments with their thoughts.

However, this approach had some usability challenges: activating the highlighting feature was unintuitive, and the interaction as a whole felt too complex for a quick task.

![A scraped product-feature table with thumbs-up and thumbs-down controls on each attribute, beside a list of alternative products.](/images/microsoft/iteration.png) Mid-fi wireframe where users can like or dislike attributes of the product

My next iteration consisted in scraping and compiling the features from the webpage and adding them to an organized table. Buyers would then be able to either “thumbs up” or “thumbs down” specific attributes of the product, which would help Copilot determine alternative products.

## Making buyer input more intuitive and customizable

I had to change the “Thumbs up” and “thumbs down” mechanism. While simple, it limited buyers to binary feedback and didn't capture the specific criteria driving their decisions.

![/images/microsoft/interaction.png "Copilot extension showing the feature table with thumbs-up and thumbs-down buttons on each row." | /images/microsoft/binary.png "The same table using plus and minus buttons on each row instead of thumbs." | /images/microsoft/natural.png "The table with an editable Adjust criteria text box open on one row, asking what would make the product a better fit."]

COLS

### Rethinking interaction methods

The early concept used like/dislike buttons, but these felt too casual and imprecise for sales.

---

### Limits of binary controls

I explored plus/minus symbols to signal “increase” or “decrease,” which worked well for numeric features like price or speed, but not for categorical ones, such as “Duplex Printing”.

---

### Natural

### Enabling natural expression

Ultimately, I went with an editable text box, accessed via “Adjust criteria”. Each row allowing buyers to specify, in their own words, what would make a product a better fit.

ENDCOLS

## Final flow & high-fidelity mockups

The last step was to put everything into a Copilot extension in the browser. Here is the whole flow.

![High-fidelity browser mockup of a printer product page with the Copilot extension panel open alongside it.](/images/microsoft/hifi.png)

![/images/microsoft/criteria.png "Copilot panel with the Print Speed row expanded into an editable Adjust criteria text box." | /images/microsoft/changes.png "Copilot feature list with several adjusted values shown in blue and marked with indicator dots."] Adjusting the criteria on the “Print Speed” attribute of the printer product. | Changes are indicated with blue text and an indicator dot.

![/images/microsoft/loading.png "Copilot panel showing a spinner with Finding alternatives while it searches." | /images/microsoft/alt.png "Copilot alternative-product result with a comparison table of original versus new values for speed and cost."] Loading screen | Alternative products found by Copilot, with a table showing the comparison of the original/new values.

## Learnings & reflections

This was my first time as a Project Manager for Design Consulting at Cornell: it was both a challenging and rewarding experience. I had the opportunity to work on a complex product space while also growing as a leader.

Through pivots, team coordination, and navigating ambiguity, I learned what it takes to guide a group of my peers toward delivering work we’re all proud of.
