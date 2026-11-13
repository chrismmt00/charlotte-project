// Service detail content, lifted from the design canvas (Service.dc.html).
// Prices here are display copy for the detail pages; the numbers must match src/lib/offers.js.
export const OFFER_DETAILS = {
  W1: { code: 'W1', name: 'Starter Website', setup: 499, monthly: 49, optional: true, bestFor: 'A landing page or a few pages: what you do, hours, where you are, how to reach you. No booking or payments. For a business that needs to be found, not a full site.', includes: ['Landing page or up to 5 pages', 'Contact form, map, hours and reviews', 'Optional monthly: hosting, our admin, small changes', 'Site, code and data are yours on final payment'], cta: 'Start with a site' },
  W2: { code: 'W2', name: 'Standard Website', setup: 1499, monthly: 49, optional: true, bestFor: 'A full site with more pages, more content and design rounds. For when the site has to sell what you do, not just say where you are.', includes: ['[PAGE CAP] custom pages, [ROUNDS] design rounds', 'Layout and content built around your business', 'Optional monthly: hosting, our admin, small changes', 'Site, code and data are yours on final payment'], cta: 'Replace my site' },
  WB: { code: 'WB', name: 'Website + Booking', setup: 999, monthly: 79, optional: true, badge: 'Most popular', bestFor: 'For appointment businesses booking by DM or on a marketplace.', includes: ['Starter Website plus online booking', 'Deposits through your own Stripe', 'Text and email reminders', 'Your calendar and client list'], cta: 'Get booking on my site' },
  BK: { code: 'BK', name: 'Booking add-on', setup: 799, monthly: 79, optional: true, bestFor: 'For a decent site someone else built, where booking still happens by call or DM.', includes: ['Booking added to the site you keep', 'Deposits through your own Stripe', 'Text and email reminders', 'Your calendar and client list'], cta: 'Add booking to my site' },
  EC: { code: 'EC', name: 'Ecommerce store', setup: 999, monthly: 99, optional: true, bestFor: 'For products sold by DM or Cash App, with no store yet.', includes: ['Products, cart and checkout', 'Checkout through your own Stripe', 'No cut of your sales', 'Optional monthly: hosting, our admin, support'], cta: 'Open my store' },
  RC: { code: 'RC', name: 'Restaurant core', setup: 1499, monthly: 149, required: true, bestFor: 'For spots with no direct ordering, or on delivery apps only.', includes: ['Site, menu admin and online ordering', 'Customer records, staff roles, reports', 'Mobile-friendly ordering included', 'No per-order commission from us'], cta: 'Book a restaurant demo' },
  RK: { code: 'RK', name: 'Restaurant core + 1 kiosk', setup: 1798, monthly: 178, required: true, bestFor: 'For counter service with lines.', includes: ['Everything in Restaurant core', 'One self-serve kiosk', 'Extra kiosks: $299 setup, $29/month each', 'Kiosk hardware billed separately'], cta: 'Book a kiosk demo' },
  AI: { code: 'AI', name: 'AI automation', setup: 499, monthly: 49, optional: true, note: '+ usage', bestFor: 'For a business with a good site whose follow-ups are still manual.', includes: ['One job: text-back, reviews, intake or follow-ups', 'Guardrails and a human handoff', 'Optional monthly: hosting and care', 'Usage billed separately'], cta: 'Automate a follow-up' },
  AH: { code: 'Custom', name: 'Custom AI harness', setup: 1499, from: true, monthly: 99, optional: true, note: '+ usage', founding: 'Founding price. Rises to $2,499 after our first few clients.', bestFor: 'For one workflow run by an agent.', includes: ['An agent wired to your tools', 'Permissions, logs and testing', 'Your workflow and integrations are yours on final payment', 'Usage billed separately'], cta: 'Scope a harness' },
  CA: { code: 'Custom', name: 'Custom web application', setup: 2499, from: true, monthly: 99, optional: true, founding: 'Founding price. Rises to $3,499 after our first few clients.', bestFor: 'For one focused workflow with login.', includes: ['One focused workflow', 'Login, roles and a dashboard', 'Fixed quote before we build', 'Custom code is yours on final payment'], cta: 'Get a fixed quote' }
};

export const SERVICES = {
  websites: {
    label: 'Websites', title: 'A website that does its job.',
    lede: 'Fast, mobile-first and built around what customers call to ask: hours, prices, where you are, how to reach you. Starter is a landing page or a few pages. Standard is a full site. Neither takes bookings or payments. Run either on our admin for a monthly fee, or take the code and run it yourself.',
    cta: 'Start with a site', ctaTitle: 'Let’s get you a site that works.', offers: ['W1', 'W2'], featured: 'W1',
    featuresTitle: 'What every site gets',
    features: [['Built for phones first', 'Most customers find you on a phone. We design for that screen first, then scale up.'], ['Answers before they call', 'Hours, location, services and prices where people look for them.'], ['Your domain, your content', 'Registered to you. If you ever leave, it all goes with you.'], ['Monthly plan, optional', 'Hosting, our admin, support and small changes, with the limits written in your proposal. Or take the code and run it yourself.']],
    demo: 'site', demoTag: 'Example layout', demoTitle: 'One page, every answer.', demoText: 'What customers call to ask sits on the first screen: what you do, when you’re open, where you are and how to book.',
    who: ['No website yet', 'Instagram or Linktree only', 'A site from years ago', 'A site that’s down or redirects to spam'],
    notes: [['Adding booking later', 'Booking on a site we built is +$500 setup and +$30/month. On a Standard Website, your plan moves to $79/month.'], ['Starter or Standard?', 'Starter is the cheaper site: a landing page or up to 5 pages. Standard is a full site, with [PAGE CAP] pages and [ROUNDS] design rounds. Neither takes appointments or payments; that is Website + Booking or Ecommerce.']],
    faq: [['How many pages do I get?', 'Starter Website covers up to 5 pages. Standard Website covers [PAGE CAP]. Your proposal lists the pages and design rounds before you pay anything.'], ['Can you fix my current site instead?', 'Sometimes. Often a rebuild is faster and costs less. We’ll tell you which on the first call.'], ['Who owns the domain?', 'You do. If you don’t have one, we help you register it in your name.'], ['Do I have to pay monthly?', 'No. The monthly plan is for running your site on our hosting and admin. Skip it and we hand you the code to run yourself.'], ['What happens if I cancel?', 'You keep your domain, content, customer list and the site itself, with a full export.']]
  },
  booking: {
    label: 'Booking', title: 'Let customers book themselves.',
    lede: 'Customers pick a time and pay a deposit on your own site, not in your DMs or on a marketplace that charges you. Reminders go out on their own.',
    cta: 'Get booking on my site', ctaTitle: 'Stop booking in your DMs.', offers: ['WB', 'BK'], featured: 'WB',
    featuresTitle: 'What booking handles',
    features: [['Deposits that cut no-shows', 'Clients pay a deposit when they book, straight into your own Stripe account.'], ['Reminders by text and email', 'Sent before every appointment, automatically.'], ['Your hours, your rules', 'Set services, lengths, breaks and days off. Change them any time.'], ['A client list you own', 'Every booking adds to a customer list you can export.']],
    demo: 'booking', demoTag: 'Booking demo', demoTitle: 'Three taps and a deposit.', demoText: 'Pick a service, a day and a time, then pay a deposit. This is the flow your customers see.',
    who: ['Barbers', 'Hair salons and braiders', 'Nail, lash and esthetics studios', 'Detailers', 'Trainers', 'Home services'],
    notes: [['Already on a Klyvora site?', 'Adding booking later is +$500 setup and +$30/month. The Booking add-on is for owners keeping a site someone else built.'], ['Messaging usage', 'Text reminders run on a messaging service. That usage is billed separately.'], ['Monthly plan, optional', 'Pay it and we host the booking system and you run it from our admin. Skip it and take the code.']],
    faq: [['Do I need my own Stripe account?', 'Yes, and it stays yours. We help you set it up. Deposits go straight to you and we take no cut.'], ['I already have a website. Can I keep it?', 'Yes. The Booking add-on, $799 setup and $79/month, adds booking to a site someone else built.'], ['What happens when someone doesn’t show?', 'You keep the deposit, under the policy you set.'], ['Can I move off a booking marketplace?', 'Yes. We set up your services and hours, and your customers book with you directly.']]
  },
  ecommerce: {
    label: 'Ecommerce', title: 'Sell online without giving up a cut.',
    lede: 'A small store for the products you sell by DM and Cash App today. Checkout runs through your own Stripe account, and we take nothing per order.',
    cta: 'Open my store', ctaTitle: 'Move your DM orders to a real store.', offers: ['EC'], featured: 'EC',
    featuresTitle: 'What the store includes',
    features: [['Products, cart, checkout', 'A clean store with the pieces you need and nothing you don’t.'], ['Your own Stripe account', 'Money lands in your account. Stripe bills its own processing fee.'], ['No per-order commission', 'Setup and a flat monthly plan. Never a percentage of your sales.'], ['Care every month', 'Hosting, support and small changes, with limits in your proposal.']],
    demo: 'store', demoTag: 'Store demo', demoTitle: 'From DM to checkout.', demoText: 'Customers browse, add to cart and pay on your site. You get the order and the customer, and nobody takes a cut.',
    who: ['Boutiques', 'Product brands', 'Bakeries taking preorders', 'Anyone selling by DM'],
    notes: [['Billed by others', 'Payment processing, shipping and delivery services, and third-party subscriptions are billed by those providers.'], ['Products at launch', 'Your proposal says how many products we load before launch: [PRODUCT CAP].']],
    faq: [['Do you take a percentage of sales?', 'No. We charge setup and an optional flat monthly plan.'], ['Who owns the customer list?', 'You do, along with your Stripe account and order history.'], ['What if I cancel?', 'You keep your domain, content, products and customer list, with a full export.']]
  },
  restaurants: {
    label: 'Restaurants', title: 'Your own ordering, no commissions.',
    lede: 'Your menu, online ordering and self-serve kiosks on one system, with staff roles and reporting. Orders on your own channel carry no per-order commission from us.',
    cta: 'Book a restaurant demo', ctaTitle: 'See it with your own menu.', offers: ['RC', 'RK'], featured: 'RC',
    featuresTitle: 'One system for the counter and the web',
    features: [['Menu admin', 'Change items, prices and sold-out status yourself.'], ['Online ordering', 'Customers order from your site on any phone. Mobile ordering is included.'], ['Self-serve kiosks', 'Customers order at the counter, and the line moves faster.'], ['Records and reports', 'Customer records, staff roles and sales reports in one place.']],
    demo: 'menu', demoTag: 'Ordering demo', demoTitle: 'Your menu, your channel.', demoText: 'The same menu runs on your site and your kiosk. Change a price once and it changes everywhere.',
    who: ['Counter service', 'Takeout spots', 'Food trucks', 'Bakeries and cafes'],
    notes: [['Kiosk hardware', 'Hardware, onsite installation and travel are billed separately. Hardware is paid in full before we order it.'], ['More kiosks', 'Each extra kiosk is $299 setup and $29/month.'], ['Monthly plan, required', 'Ordering, kiosks and kitchen screens need someone watching them every day, so restaurant plans include the monthly.']],
    addOns: true, pilot: true,
    faq: [['Do I have to leave the delivery apps?', 'No. Keep them for reach and move regulars to your own ordering, where we take no commission.'], ['Who processes payments?', 'Your own Stripe account. Stripe bills its processing fee; we never take a percentage.'], ['Is there a branded app?', 'Yes, as an add-on from $1,499 setup and $49/month. Ask us about timing.'], ['What if I cancel?', 'You keep your domain, menu, content and customer list, with a full export.']]
  },
  ai: {
    label: 'AI automation', title: 'The follow-ups, handled.',
    lede: 'Small AI tools that do one job well: text back missed calls, ask for reviews, take intake and follow up. Each one has guardrails and hands off to a person when it should.',
    cta: 'Automate a follow-up', ctaTitle: 'Pick the follow-up you keep forgetting.', offers: ['AI', 'AH'], featured: 'AI',
    featuresTitle: 'Jobs it takes off your plate',
    features: [['Missed-call text-back', 'Miss a call and the caller gets a text with a way to book.'], ['Review requests', 'After a visit, customers get a short message with a link to leave a review.'], ['Intake', 'New leads answer a few questions before you call them back.'], ['Follow-ups', 'Quotes and no-replies get a polite nudge on the schedule you set.']],
    demo: 'sms', demoTag: 'Text-back demo', demoTitle: 'A missed call becomes a booking.', demoText: 'When you miss a call, the caller gets a text with a way to book. If they ask something outside its guardrails, it hands off to you.',
    who: ['You have a good site', 'You miss calls while you work', 'Reviews come by luck', 'Follow-ups live in your head'],
    notes: [['How usage works', 'AI and messaging usage is billed separately each month, based on what your tool sends and processes. Rates: [USAGE RATES].'], ['Want something bigger?', 'A custom AI harness wires an agent to your tools with permissions, logs and testing.']],
    faq: [['Will it talk to customers without me knowing?', 'Every tool has guardrails and a handoff. You can see the conversations and step in.'], ['Do I need a new website?', 'No. AI automation works best on a good site you already have.'], ['What does usage cost?', 'It depends on volume. Usage is billed separately each month: [USAGE RATES].']]
  },
  custom: {
    label: 'Custom web apps', title: 'One workflow, built around you.',
    lede: 'A focused web app with login, roles and a dashboard, for the job you run on spreadsheets and group texts today. Fixed quote up front, and the custom code is yours on final payment.',
    cta: 'Get a fixed quote', ctaTitle: 'Show us the spreadsheet.', offers: ['CA'], featured: 'CA',
    featuresTitle: 'How a custom build runs',
    features: [['Free call', 'We map the workflow and where it breaks.'], ['Fixed quote', 'A plain-English proposal: scope, price, milestones and what you own.'], ['Weekly demos', 'The real thing running on real data, every week.'], ['Handover', 'Custom code transfers to you on final payment.']],
    demo: 'dash', demoTag: 'Example app', demoTitle: 'Spreadsheets, retired.', demoText: 'Jobs, customers and schedules in one place, with logins for your team and the right permissions for each person.',
    who: ['Spreadsheets doing an app’s job', 'Paper forms', 'Dispatch by group text', 'Tools that don’t talk to each other'],
    notes: [['What you own', 'Everything we build for you, the app, its code and its data, is yours on final payment.'], ['Starting scope', 'One focused workflow with login, roles and a dashboard. Anything beyond that is quoted before we build it.']],
    faq: [['Do I have to pay monthly?', 'No. The $99/month plan for hosting and support is optional.'], ['Why “from” $2,499?', 'That’s the founding price for one focused workflow. It rises to $3,499 after our first few clients. Bigger scopes get a fixed quote.'], ['How do payments work?', '50% at kickoff, 30% at a working demo and 20% at acceptance.']]
  }
};

export const SERVICE_ORDER = ["websites", "booking", "ecommerce", "restaurants", "ai", "custom"];

// Booking demo data.
export const DEMO_SERVICES = [['Cut', '30 min'], ['Cut and beard', '45 min'], ['Kids cut', '30 min']];
export const DEMO_DAYS = ['Thu', 'Fri', 'Sat', 'Mon', 'Tue'];
export const DEMO_SLOTS = ['10:00', '11:30', '1:00', '2:30', '4:00', '5:30'];
