import {
  INDUSTRIES,
  CUSTOM_SERVICES,
  money,
  serviceById,
} from "@/lib/marketing/catalog";
import { INDUSTRY_PHOTOS } from "@/lib/marketing/photos";
import { CONTACT } from "@/lib/site";

// What each page's link preview shows. Headlines, labels and features are the
// page's own copy; prices come from the catalog so previews never drift from it.
const lowest = (list) => money(Math.min(...list.map((s) => s.setup)));
const web = serviceById("websites");
const auto = serviceById("automation");
const soft = serviceById("software");

export const SHARE = {
  home: {
    alt: "Klyvora Studio: a custom website and one system to run your business",
    eyebrow: "Custom websites + business software",
    title: "A custom website. One system to run your business.",
    em: "One system",
    photo: "owner",
    float: { label: "Orders", text: "Online ordering for pickup" },
    chips: ["Custom design", "Straightforward setup", "Charlotte, NC"],
  },
  solutions: {
    alt: "Klyvora industry solutions for restaurants, childcare, beauty and retail",
    eyebrow: "Industry solutions",
    title: "Business software built for your industry.",
    em: "your industry.",
    mosaic: ["cafe", "daycare", "nails", "packing"],
    chips: [`Setup from ${lowest(INDUSTRIES)}`, "4 industries"],
  },
  pricing: {
    alt: "Klyvora pricing for industry solutions and custom services",
    eyebrow: "Pricing · USD",
    title: "Simple pricing. Software built around your business.",
    em: "Simple pricing.",
    photo: "cafeOwner",
    float: { label: "Setup", text: "Pay once for design and setup" },
    chips: [
      `Industry solutions from ${lowest(INDUSTRIES)}`,
      `Custom services from ${lowest(CUSTOM_SERVICES)}`,
    ],
  },
  websites: {
    alt: "Klyvora custom website design",
    eyebrow: "Custom websites",
    title: "A website that looks like your business, not everyone else’s.",
    em: "your business,",
    photo: "website",
    chips: [
      `From ${money(web.setup)} project setup`,
      "Two design revision rounds",
    ],
  },
  aiSoftware: {
    alt: "Klyvora AI automation and custom software",
    eyebrow: "AI & software",
    title: "Practical tools. More room to focus.",
    em: "More room to focus.",
    photo: "office",
    chips: [
      `AI automation from ${money(auto.setup)}`,
      `Custom software from ${money(soft.setup)}`,
    ],
  },
  about: {
    alt: "Klyvora Studio, based in Charlotte, North Carolina",
    eyebrow: "Klyvora Studio · Charlotte, NC",
    title: "Built for the businesses doing the everyday work.",
    em: "everyday work.",
    photo: "charlotte",
    chips: ["Based in Charlotte, NC"],
  },
  contact: {
    alt: "Get a quote from Klyvora Studio",
    eyebrow: "Get a quote",
    title: "Tell us about your business.",
    em: "your business.",
    photo: "conversation",
    chips: [CONTACT.email, CONTACT.phone],
  },
};

export function industryShare(s) {
  const [photo] = INDUSTRY_PHOTOS[s.id];
  return {
    alt: `Klyvora ${s.name}: ${s.title}`,
    eyebrow: s.name,
    title: s.title,
    photo,
    float: { label: "Included", text: s.features[1] },
    chips: [
      `Setup from ${money(s.setup)}`,
      `${money(s.monthly)}/month`,
      ...(s.tablet ? ["Tablet included"] : []),
    ],
  };
}
