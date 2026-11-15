import { z } from "zod";
import { SERVICES, serviceById, money, recurringLabel } from "./catalog.js";

export const INDUSTRY_OPTIONS = [
  "Restaurants & Cafes",
  "Daycare & Childcare",
  "Beauty & Wellness",
  "Ecommerce & Retail",
  "Other",
];
const short = z.string().trim().max(300);
export const inquirySchema = z.object({
  name: z.string().trim().max(200).min(1, "Tell us your name."),
  business: short.min(1, "Enter your business name."),
  email: z.string().trim().max(254).email("Enter a valid email address."),
  phone: z.string().trim().max(50).default(""),
  industry: z.enum(["", ...INDUSTRY_OPTIONS]).default(""),
  service: z.enum(["", ...SERVICES.map((s) => s.id)]).default(""),
  siteUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      if (!value) return true;
      try {
        return ["https:", "http:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "Use a full website address starting with https:// or http://.")
    .default(""),
  equipment: z.string().trim().max(2000).default(""),
  message: z
    .string()
    .trim()
    .min(
      10,
      "Tell us a little more about the project (at least 10 characters).",
    )
    .max(7000),
  company_website: z.string().max(2048).default(""),
});

// Keep new commercial IDs out of the legacy Offer foreign key. Selection and hardware
// remain visible in the existing inbox and exports without changing contracts or invoices.
export function leadPayload(inquiry) {
  const service = serviceById(inquiry.service);
  const details = [
    `Industry: ${inquiry.industry || "Not specified"}`,
    `Service: ${service?.name || "Not sure yet"}`,
    ...(service
      ? [
          `Published starting price (USD): ${money(service.setup)} setup; ${recurringLabel(service)}. Final scope subject to written proposal.`,
        ]
      : []),
    `Existing hardware or software: ${inquiry.equipment || "Not specified"}`,
    "",
    "Project description:",
    inquiry.message,
  ].join("\n");
  return {
    name: inquiry.name,
    business: inquiry.business,
    email: inquiry.email,
    phone: inquiry.phone,
    siteUrl: inquiry.siteUrl,
    message: details,
    source: "Website quote request",
    offerCode: null,
    company_website: inquiry.company_website,
  };
}
