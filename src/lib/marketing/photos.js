// Public-site photography. Every photo is free to use under the Unsplash License
// (https://unsplash.com/license): commercial use allowed, no attribution required.
// Licenses were checked on each photo page on 2026-11-15. Credits are kept here for the record.
// Images are served from Unsplash's CDN (hotlinked), which sizes and compresses them on request.
export const PHOTOS = {
  owner: {
    id: "1556742049-0cfed4f6a45d",
    alt: "A smiling shop owner helping a customer at the counter",
    credit: "Clay Banks",
    page: "https://unsplash.com/photos/Ox6SW103KtM",
  },
  cafeOwner: {
    id: "1753351052363-53ce102830eb",
    alt: "A cafe owner standing in her coffee shop",
    credit: "Vitaly Gariev",
    page: "https://unsplash.com/photos/QGg-vsPYbu8",
  },
  cafe: {
    id: "1769114474398-a7aef0625ef0",
    alt: "A barista working behind the counter of a sunlit cafe",
    credit: "Oksana Demenko",
    page: "https://unsplash.com/photos/N76Cadq2wQs",
  },
  kitchen: {
    id: "1622021142947-da7dedc7c39a",
    alt: "A chef preparing vegetables in a restaurant kitchen",
    credit: "Pylyp Sukhenko",
    page: "https://unsplash.com/photos/y-XZf_TNRms",
  },
  tablet: {
    id: "1758519289791-ffce8889ca8c",
    alt: "A restaurant team member in an apron holding a tablet",
    credit: "Vitaly Gariev",
    page: "https://unsplash.com/photos/0e2eYxBiP6A",
  },
  daycare: {
    id: "1788882679829-fee300e8ae4a",
    alt: "A teacher crafting with clay alongside two young children",
    credit: "Yegor Makarenko",
    page: "https://unsplash.com/photos/NM7C5yiZZjI",
  },
  playroom: {
    id: "1761208663763-c4d30657c910",
    alt: "Children playing with toys in a bright playroom",
    credit: "Rewired Digital",
    page: "https://unsplash.com/photos/4UFIg9htJgE",
  },
  classroom: {
    id: "1777056491418-d4ff81a4ad92",
    alt: "Young children sitting together at a classroom table",
    credit: "Anna Zwiefel",
    page: "https://unsplash.com/photos/eg63-okc-yg",
  },
  nails: {
    id: "1632345031435-8727f6897d53",
    alt: "A client getting her nails done at a nail salon",
    credit: "Giorgio Trovato",
    page: "https://unsplash.com/photos/gb6gtiTZKB8",
  },
  salon: {
    id: "1633681926022-84c23e8cb2d6",
    alt: "A modern hair salon with styling chairs and round mirrors",
    credit: "Benyamin Bohlouli",
    page: "https://unsplash.com/photos/LGXN4OSQSa4",
  },
  manicure: {
    id: "1690749138086-7422f71dc159",
    alt: "A nail technician painting a client's nails",
    credit: "Pablo Escobar",
    page: "https://unsplash.com/photos/zRkla85Xe2o",
  },
  packing: {
    id: "1770013413878-2530e2c3d82b",
    alt: "An online store owner checking an order on her phone beside packed boxes",
    credit: "Rifki Kurniawan",
    page: "https://unsplash.com/photos/k63Or81F8-M",
  },
  shipping: {
    id: "1648747067192-790595bc6d5e",
    alt: "A small business owner preparing a cardboard box for shipping",
    credit: "M. Cooper",
    page: "https://unsplash.com/photos/V5XaBkW6PO8",
  },
  website: {
    id: "1678690832311-bb6e361989ca",
    alt: "A laptop showing a business website on a wooden desk",
    credit: "Carriza Maiquez",
    page: "https://unsplash.com/photos/RTdvy9izXvw",
  },
  webDesign: {
    id: "1586880244406-556ebe35f282",
    alt: "A designer reviewing a website layout on a laptop",
    credit: "Roberto Cortese",
    page: "https://unsplash.com/photos/ejhjSZKTeeg",
  },
  laptop: {
    id: "1544006659-f0b21884ce1d",
    alt: "Hands working on a laptop at a bright desk",
    credit: "Štefan Štefančík",
    page: "https://unsplash.com/photos/5p_7M5MP2Iw",
  },
  whiteboard: {
    id: "1581091877018-dac6a371d50f",
    alt: "Two colleagues planning a workflow at a whiteboard",
    credit: "ThisisEngineering",
    page: "https://unsplash.com/photos/uOhBxB23Wao",
  },
  team: {
    id: "1557804506-669a67965ba0",
    alt: "A team reviewing a plan together on laptops and a whiteboard",
    credit: "Austin Distel",
    page: "https://unsplash.com/photos/wD1LRb9OeEo",
  },
  office: {
    id: "1681949287382-052ea3954a51",
    alt: "A small team meeting in a sunlit office",
    credit: "Sable Flow",
    page: "https://unsplash.com/photos/KHpjeuaWOec",
  },
  conversation: {
    id: "1573496546038-82f9c39f6365",
    alt: "Two business owners talking and laughing by a window",
    credit: "Christina @ wocintechchat.com",
    page: "https://unsplash.com/photos/VpcgTEKerEQ",
  },
  meeting: {
    id: "1714974528232-f62051870736",
    alt: "Two people discussing a project at a table",
    credit: "Vitaly Gariev",
    page: "https://unsplash.com/photos/f4TM45jATYU",
  },
  apron: {
    id: "1687422808248-f807f4ea2a2e",
    alt: "A business owner in an apron checking his phone",
    credit: "Ali Mkumbwa",
    page: "https://unsplash.com/photos/uk3ey_vhDKA",
  },
  charlotte: {
    id: "1789152733593-ee12bfb20bd4",
    alt: "The Charlotte, North Carolina skyline at golden hour",
    credit: "Alex Ruth",
    page: "https://unsplash.com/photos/-r30YZ8Z76Q",
  },
};

// Photos per industry: [hero, supporting, detail].
export const INDUSTRY_PHOTOS = {
  restaurants: ["cafe", "kitchen", "tablet"],
  daycare: ["daycare", "playroom", "classroom"],
  beauty: ["nails", "salon", "manicure"],
  ecommerce: ["packing", "shipping", "laptop"],
};

export const SERVICE_PHOTOS = {
  websites: "website",
  automation: "laptop",
  software: "whiteboard",
};

const WIDTHS = [480, 720, 960, 1280, 1680];

export function photoUrl(key, w = 1280) {
  const p = PHOTOS[key];
  return `https://images.unsplash.com/photo-${p.id}?auto=format&fit=crop&w=${w}&q=72`;
}

export function photoSrcSet(key) {
  return WIDTHS.map((w) => `${photoUrl(key, w)} ${w}w`).join(", ");
}
