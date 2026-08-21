export interface StoreLocation {
  slug: string;
  name: string;
  phone: string;
  address: string;
  hours: string;
}

export const LOCATIONS: StoreLocation[] = [
  {
    slug: "arnold",
    name: "Arnold",
    phone: "636-333-3324",
    address: "141 Arnold Crossroads Center, Arnold, MO",
    hours: "Mon–Sat 10am–7pm, Sun 12pm–5pm",
  },
  {
    slug: "ballwin",
    name: "Ballwin",
    phone: "636-256-1702",
    address: "14748 Manchester Rd, Ballwin, MO",
    hours: "Mon–Sat 10am–7pm, Sun 12pm–5pm",
  },
];
