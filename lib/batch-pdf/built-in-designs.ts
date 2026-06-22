export type BuiltInDesignCategory =
  | "certificate"
  | "nameBadge"
  | "mailingLabel"
  | "appointmentCard";

export type BuiltInDesign = {
  id: string;
  name: string;
  category: BuiltInDesignCategory;
  variant: "classic" | "modern";
  description: string;
  publicPath: string;
  fileName: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  finishedWidthIn: number;
  finishedHeightIn: number;
};

const BUILT_IN_DESIGNS: BuiltInDesign[] = [
  {
    id: "certificate-classic",
    name: "Certificate — Classic",
    category: "certificate",
    variant: "classic",
    description: "Elegant ivory certificate with gold flourishes.",
    publicPath: "/starter-designs/certificate-classic.png",
    fileName: "certificate-classic.png",
    intrinsicWidth: 3300,
    intrinsicHeight: 2550,
    finishedWidthIn: 11,
    finishedHeightIn: 8.5,
  },
  {
    id: "certificate-modern",
    name: "Certificate — Modern",
    category: "certificate",
    variant: "modern",
    description: "Swiss-inspired charcoal-and-gold certificate.",
    publicPath: "/starter-designs/certificate-modern.png",
    fileName: "certificate-modern.png",
    intrinsicWidth: 3300,
    intrinsicHeight: 2550,
    finishedWidthIn: 11,
    finishedHeightIn: 8.5,
  },
  {
    id: "name-badge-classic",
    name: "Name Badge — Classic",
    category: "nameBadge",
    variant: "classic",
    description: "Welcoming badge with HELLO / MY NAME IS layout.",
    publicPath: "/starter-designs/name-badge-classic.png",
    fileName: "name-badge-classic.png",
    intrinsicWidth: 1200,
    intrinsicHeight: 900,
    finishedWidthIn: 4,
    finishedHeightIn: 3,
  },
  {
    id: "name-badge-modern",
    name: "Name Badge — Modern",
    category: "nameBadge",
    variant: "modern",
    description: "Contemporary EVENT PASS design.",
    publicPath: "/starter-designs/name-badge-modern.png",
    fileName: "name-badge-modern.png",
    intrinsicWidth: 1200,
    intrinsicHeight: 900,
    finishedWidthIn: 4,
    finishedHeightIn: 3,
  },
  {
    id: "mailing-label-classic",
    name: "Mailing Label — Classic",
    category: "mailingLabel",
    variant: "classic",
    description: "Restrained ivory stationery label.",
    publicPath: "/starter-designs/mailing-label-classic.png",
    fileName: "mailing-label-classic.png",
    intrinsicWidth: 1200,
    intrinsicHeight: 600,
    finishedWidthIn: 4,
    finishedHeightIn: 2,
  },
  {
    id: "mailing-label-modern",
    name: "Mailing Label — Modern",
    category: "mailingLabel",
    variant: "modern",
    description: "Clean label with charcoal left rail.",
    publicPath: "/starter-designs/mailing-label-modern.png",
    fileName: "mailing-label-modern.png",
    intrinsicWidth: 1200,
    intrinsicHeight: 600,
    finishedWidthIn: 4,
    finishedHeightIn: 2,
  },
  {
    id: "appointment-card-classic",
    name: "Appointment Card — Classic",
    category: "appointmentCard",
    variant: "classic",
    description: "Warm ivory appointment card with clear labels.",
    publicPath: "/starter-designs/appointment-card-classic.png",
    fileName: "appointment-card-classic.png",
    intrinsicWidth: 1050,
    intrinsicHeight: 600,
    finishedWidthIn: 3.5,
    finishedHeightIn: 2,
  },
  {
    id: "appointment-card-modern",
    name: "Appointment Card — Modern",
    category: "appointmentCard",
    variant: "modern",
    description: "Dark premium reminder card with gold accents.",
    publicPath: "/starter-designs/appointment-card-modern.png",
    fileName: "appointment-card-modern.png",
    intrinsicWidth: 1050,
    intrinsicHeight: 600,
    finishedWidthIn: 3.5,
    finishedHeightIn: 2,
  },
];

export function getBuiltInDesigns(): BuiltInDesign[] {
  return [...BUILT_IN_DESIGNS];
}

export function getBuiltInDesignById(id: string): BuiltInDesign | null {
  return BUILT_IN_DESIGNS.find((d) => d.id === id) ?? null;
}

export function getBuiltInDesignByFileName(fileName: string): BuiltInDesign | null {
  return BUILT_IN_DESIGNS.find((d) => d.fileName === fileName) ?? null;
}
