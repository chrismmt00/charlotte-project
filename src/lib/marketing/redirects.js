// Exact public routes only. Authentication, proposals, APIs, and application routes are excluded.
export const MARKETING_REDIRECTS = [
  ["/services", "/solutions"],
  ["/services/websites", "/websites"],
  ["/services/booking", "/solutions/beauty"],
  ["/services/restaurants", "/solutions/restaurants"],
  ["/services/ecommerce", "/solutions/ecommerce"],
  ["/services/ai", "/ai-software"],
  ["/services/custom", "/ai-software#custom-software"],
  ["/booking", "/solutions/beauty"],
  ["/quote", "/contact"],
  ["/founding", "/contact"],
];
