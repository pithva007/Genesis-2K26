export type FieldType = "text" | "tel" | "select" | "number" | "email";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required: boolean;
}

export interface SportConfig {
  slug: string;
  name: string;
  type: "team" | "individual";
  maxMembers: number;
  categories: string[];
  fields: FormField[];
  icon: string;
  accent: string;
}

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const DEPARTMENTS = [
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
  "AIDS",
  "AIML",
  "CSD",
  "MBA",
  "MCA",
  "Other",
];

const TEAM_FIELDS: FormField[] = [
  { name: "teamName", label: "Team Name", type: "text", placeholder: "Enter a team name", required: true },
  { name: "category", label: "Category", type: "select", required: true },
  { name: "captainName", label: "Captain Name", type: "text", placeholder: "Enter captain name", required: true },
  { name: "captainPhone", label: "Captain Phone", type: "tel", placeholder: "10-digit mobile number", required: true },
  { name: "captainYear", label: "Captain Year", type: "select", required: true, options: YEARS },
  { name: "captainDept", label: "Captain Department", type: "select", required: true, options: DEPARTMENTS },
];

export const SPORT_OPTION_FIELDS = {
  year: YEARS,
  dept: DEPARTMENTS,
};

export const SPORTS_CONFIG: SportConfig[] = [
  { slug: "cricket", name: "Cricket", type: "team", maxMembers: 15, categories: ["Men", "Women", "Open"], fields: TEAM_FIELDS, icon: "cricket", accent: "from-emerald-500 to-lime-600" },
  { slug: "football", name: "Football", type: "team", maxMembers: 11, categories: ["Men", "Women", "Open"], fields: TEAM_FIELDS, icon: "football", accent: "from-sky-500 to-blue-700" },
  { slug: "basketball", name: "Basketball", type: "team", maxMembers: 5, categories: ["Men", "Women", "Open"], fields: TEAM_FIELDS, icon: "basketball", accent: "from-orange-500 to-amber-700" },
  { slug: "volleyball", name: "Volleyball", type: "team", maxMembers: 6, categories: ["Men", "Women", "Open"], fields: TEAM_FIELDS, icon: "volleyball", accent: "from-violet-500 to-fuchsia-700" },
  { slug: "kabaddi", name: "Kabaddi", type: "team", maxMembers: 7, categories: ["Men", "Women", "Open"], fields: TEAM_FIELDS, icon: "kabaddi", accent: "from-red-500 to-rose-700" },
  { slug: "table-tennis", name: "Table Tennis", type: "individual", maxMembers: 2, categories: ["Singles", "Doubles", "Mixed Doubles"], fields: TEAM_FIELDS, icon: "table-tennis", accent: "from-cyan-500 to-sky-700" },
  { slug: "carrom", name: "Carrom", type: "individual", maxMembers: 2, categories: ["Singles", "Doubles"], fields: TEAM_FIELDS, icon: "carrom", accent: "from-amber-500 to-yellow-700" },
  { slug: "badminton", name: "Badminton", type: "individual", maxMembers: 2, categories: ["Singles", "Doubles", "Mixed Doubles"], fields: TEAM_FIELDS, icon: "badminton", accent: "from-purple-500 to-indigo-700" },
  { slug: "throwball", name: "Throwball", type: "team", maxMembers: 6, categories: ["Women", "Open"], fields: TEAM_FIELDS, icon: "throwball", accent: "from-pink-500 to-rose-700" },
  { slug: "weight-lifting", name: "Weight Lifting", type: "individual", maxMembers: 1, categories: ["Men", "Women"], fields: TEAM_FIELDS, icon: "weight-lifting", accent: "from-slate-500 to-zinc-700" },
  { slug: "athletics", name: "Athletics", type: "individual", maxMembers: 1, categories: ["100m", "200m", "400m", "800m", "1500m", "Long Jump", "High Jump", "Shot Put", "Javelin", "4x100m Relay"], fields: TEAM_FIELDS, icon: "athletics", accent: "from-teal-500 to-emerald-700" },
  { slug: "mixed-cricket", name: "Mixed Cricket", type: "team", maxMembers: 15, categories: ["Mixed"], fields: TEAM_FIELDS, icon: "mixed-cricket", accent: "from-lime-500 to-green-700" },
];

export function getSportBySlug(slug: string) {
  return SPORTS_CONFIG.find((sport) => sport.slug === slug);
}

export function getSportByName(name: string) {
  return SPORTS_CONFIG.find((sport) => sport.name.toLowerCase() === name.toLowerCase());
}
