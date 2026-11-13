-- Defense in depth for financial invariants. These checks supplement request validation.
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_nonnegative_prices" CHECK ("setupCents" >= 0 AND "monthlyCents" >= 0);
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_nonnegative_prices" CHECK ("setupCents" >= 0 AND "monthlyCents" >= 0);
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_restaurant_plan" CHECK ("offerCode" NOT IN ('RC','RK') OR "monthly" = true);
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_valid_balance" CHECK ("amountCents" >= 0 AND "paidCents" >= 0 AND "paidCents" <= "amountCents");
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_valid_amount" CHECK ("amountCents" >= 0 AND "percent" IN (50,30,20));
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_nonnegative_mrr" CHECK ("mrrCents" >= 0);
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_nonnegative_price" CHECK ("priceCents" >= 0);
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_nonnegative_amount" CHECK ("amountCents" >= 0);
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_positive_minutes" CHECK ("minutes" > 0);
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_nonnegative_minutes" CHECK ("minutes" >= 0);
