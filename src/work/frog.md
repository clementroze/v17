---
slug: frog
title: frog
subtitle: Designing the next-generation mobile commodity trading platform.
homeDescription: Next-gen mobile commodity trading platform.
role: Design Intern
type: Research, UX design, Prototyping, Client presentation
about:
  - [frog](https://www.frog.co) is a design agency renowned for its innovative approach to creating meaningful experiences that advance both people and planet.
  - Last summer, working from the Paris studio, I had the unique opportunity to work with a grain trading company to design the first B2C, mobile trading platform.
  - I collaborated across design and business teams to deliver a mid-fidelity, highly functional prototype showcasing this mobile platform.
whyNoAI:
  - The main trading interaction, which I call the ["wheel of fortune"](#designing-the-next-generation-trading-model), came from noticing that existing tools for this were far too dense. The solution came from an unrelated, everyday moment instead: setting an alarm for the next day and noticing how naturally that scrolling picker wheel could map onto a completely different problem. Spotting that kind of connection in an ordinary moment isn't something AI can do.
  - Beyond that one interaction, this project ran on dozens of client workshops where being human meant reading the room, sensing when an idea wasn't landing, and sketching a different direction on the spot.
  - ![](/images/frog/no-ai.mov) AI couldn't have made the connection between the iOS alarm clock setting and trading tools!
  - ![](/images/frog/diml.mp4) A "Day In My Life" video that AI certainly can't do! {500px}
finalDesigns: Designing the next-generation trading model
---

## Context

Grain trading has traditionally been a B2B business, with complex platforms like Engelhart, Metalshub, and Vosbor dominating the space. These platforms resemble tools like the Bloomberg Terminal or TC2000: powerful but overwhelming for new or casual users. Our goal was to explore a direct-to-consumer (B2C) mobile experience.

The trading process is deeply tied to physical constraints – trucks or boats with specific loading quantities, established protocols, and strict flows that we couldn't change. This meant that it was in the user interface itself that we needed to design innovative new approaches.

![A four-up grid of dense, dark professional trading terminals packed with candlestick charts, data tables, and rows of small red-and-green price figures.](/images/frog/tools.png) Traditional tools are too complex or overwhelming for consumers

HMW How might we make complex trading interactions accessible and intuitive for first-time mobile users?

## Understanding trading workflows

We first mapped out the trading workflow into six core flows:

- Onboarding: Setting up accounts, teams, and uploading financial documents
- Home: Dashboard with market prices and next actions todo
- Trading: Main screen to browse products, buy, and sell
- Execution: Managing and completing active orders
- Reporting: Accessing market reports and downloadable analysis
- Admin: Backend tools for platform administrators

Our three-person design team collaborated across all flows to understand how they interconnect. But for client presentations, we each "owned" specific sections; I focused primarily on the Trading screens.

## Core trading mechanism

To design this platform for trading, we first had to understand how grain traders and the market works.

At its most basic level, grain trading involves sellers listing a quantity at a certain price: this is an offer. On the other hand, buyers submit bids specifying the price they're willing to buy for a particular volume and spec.

![Diagram comparing a mismatched corn offer (No trade) with a matching one (Yes trade).](/images/frog/trading.png) How trading basically works {1200px}

For example, a seller might list Russian corn at $9,300 pounds per metric ton ($/mT) for 3,000 mT. A buyer, for example a local feed mill, might place a bid offering $8,200 for 2,000 mT of similar corn.

A trade occurs when both parties agree. Our platform facilitates this with a real-time marketplace showing live listings and prices.

## Graph and listings mode

Traders want multiple ways to view market data. Some prefer a high-level graphical overview of prices and trends, while others need a dense, detailed listing view for making trades.

To accommodate this, I designed a toggle in the bottom right corner, easily accessible on mobile, letting users switch between:

- Graph mode: Simplified analytics and charts
- Listings mode: Full list of market offers and bids

![Two phone mockups with a pill toggle showing the graph and listings mode.](/images/frog/mode.png) Graph and Listings mode

## Filters and Views

Through our discussions with our experts, we found that traders rarely look at every single listing on the market at once. Instead, they filter by product, origin, and destination port. However, many track several sets of filters at the same time.

For example, a trader might monitor Russian corn arriving at New York as well as Ukrainian corn headed to Boston.

To manage this, I introduced Views: preset collections of filters users can easily switch between. The default “All” View would show every listing, while custom Views isolate specific filters for quick access.

![Annotated pills (All, Russia to New York, Ukraine to Boston) beside a phone showing switchable View tabs.](/images/frog/views.png) Views are preset collections of filters

## Designing listing cards for mobile

Unlike the straightforward Graph mode, Listings mode was challenging. Simply transplanting dense tables filled with data onto mobile screens wouldn’t work.

Instead, we used self-contained listing cards, each representing either a bid or offer, with clear details:

- Commodity
- Origin
- Destination port
- Price per metric ton
- Minimum Order Quantity, or MOQ (basically the minimum amount of product that a supplier is willing to sell in a single order)
- Quantity available
- Expiry date

We reinforced context with color-coding: red for offers (sellers) and green for bids (buyers), which is consistent with trading conventions.

![Annotated green bid card for Corn from Russia to New York, labeling price, MOQ, quantity available, and expiry.](/images/frog/card.png) LABEL HERE

## Designing the next-generation trading model

To move beyond traditional table layouts, I designed a “wheel-inspired” interaction for the marketplace, where offers and bids visually anchor opposite ends of the screen.

I was inspired by Depth of Market tools, which are too complex for this app. And I was also inspired by the picker view UI when setting an alarm in iOS.

![/images/frog/complex.png "A dense desktop Depth of Market trading tool, heavily annotated with numbered callouts for its bid and offer price ladders and controls." | /images/frog/alarm.png "The iOS Add Alarm screen with a scrollable time picker wheel set."] Complicated and unintuitive trading tools | Setting an alarm is just a scroll away

![An iOS-style date picker wheel that can be drgaged up and down.](/images/frog/scroller.gif) I inspired myself iOS’ picker view UI interactions {800px}

Put together, this model creates a push-pull dynamic that reflects live trading:

- Offers (higher prices) appear above
- Bids (lower prices) appear below
- The lowest offer and the highest bid sit at the center. There’s also the current market spread (the difference between lowest offer and highest bid) as well as the last traded price, updated live.

Swiping up reveals more bids and swiping down shows more offers. The tabs labeled “Offers”, “Bids”, and “All” also jump directly to the respective sections.

This spatial layout mirrors how traders scan for price advantages, time sensitivity, and MOQ constraints. It makes the interface both functional and intuitive, especially for touchscreen, mobile devices.

![A prototype showing how the interactive trading view works.](/images/frog/vid.mov) {800px}

![Three annotated phone screens for the All, Offers, and Bids tabs, explaining the red offer and green bid lists and how they scroll.](/images/frog/three.png) Annotations detailing how the listings screen works

![/images/frog/down.png "A hand swiping down on the phone marketplace, a pink arrow marking the gesture that reveals more offers." | /images/frog/up.png "A hand swiping up on the phone marketplace, a pink arrow marking the gesture that reveals more bids."] Swiping down reveals more offers | Swiping up reveals more bids

## Responding to and creating orders

### Responding to orders

By tapping a listing card, trader see more details for the order. They select a purchase quantity and then confirm with a One-Time Password (OTP). Speed is critical, since order can expire or be taken by others, but the OTP confirmation was necessary to prevent mistakes.

### Creating an order

Traders start by choosing bid or offer, then they select the commodity and origin.

If trading directly with a counterparty (Over-The-Counter, OTC), they toggle to enter a private code.

Next, they input quantity, destination port and warehouse, price, and listing duration.

After reviewing the order and confirming with an OTP, it launches live on the market.

Initially, this form was a single page. However, I received feedback from the client that it was too long and felt a bit intimidating, risking costly errors. Breaking it into multiple steps introduced intentional friction to ensure quality and guided users with clear labels.

![Multi-step phone flow for creating an order: product, port, price, validity, review, OTP confirmation, then an order-confirmed screen.](/images/frog/new-order.png) The flow for creating a new order

## Navigating the complexity of trading

Even simplified, trading is filled with jargon and acronyms. For example:

> “I’m watching an Argentinian wheat listing at 7,200 $/ mT FOT with a 360 mT MOQ, but there’s an OTC bid for Ukrainian soy at a CIF-equivalent price out of Boston expiring in 18 hours.”

This means a trader is considering buying Argentinian wheat at a fixed price of $7,200 per metric ton of wheat. But he is also eyeing a separate time-sensitive offer for Ukrainian soy where the seller handles delivery to the port of Boston. All while managing volume requirements and comparing deal terms.

I probably wouldn’t have understood what any of that meant about 3 months ago! However, traders bounce these terms around frequently, so it was important that the platform enabled traders to navigate around these different options.

To help users navigate, I designed clear, color-coded tags on listing cards:

- Bid and offer tags followed the typical buy/sell colors (red/green)
- FOT (Free on Truck, meaning goods are transported domestically via truck) and FOB (Free on Board, meaning goods are transported internationally via boat) are logistical terms that indicate delivery conditions, and gray implies a neutral metadata, which is why we chose it for that.
- We used orange as a cautionary status for OTC since they were off-market and custom negotiations, which are a slightly riskier.

![Legend of color-coded card tags: green Bid, red Offer, blue My order, gray FOT and FOB, orange OTC, each with a definition.](/images/frog/types.png) Different types of tags listing cards use {800px}

## Learnings & reflections

During this internship, I learnt immensely about how the market works and how trading is done with physical commodities. Grain trading is a pretty niche topic, but I loved how deeply we went to understand all the processes! My design team didn’t do this by ourselves – we had the help of a dedicated business team which we partnered with daily to create all the screens.

Building the listings screen (which we affectionally named the “Wheel of fortune” due to its spinning character) was also incredibly fun! Since we were also making a prototype for the client, I was able to push Figma prototyping to the limit to really show the interactive behavior of the page.

Finally, this was my first experience working in the consulting industry. I learned how to present design work effectively to clients, how to communicate the value of staying in mid-fidelity during exploratory stages, and how important it is to use real data instead of placeholder text. Many of the experts we presented to would focus on even minor data inconsistencies, which could easily distract from the actual design decisions we were trying to showcase.
