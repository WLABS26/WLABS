import {
  Smile,
  Activity,
  Wrench,
  Zap,
  Scale,
  Calculator,
  Building2,
  UtensilsCrossed,
  Sparkles,
  HardHat,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

import type { IndustryKey } from "@/modules/shared/types";

export const INDUSTRY_ICONS: Record<IndustryKey, LucideIcon> = {
  dentist: Smile,
  physiotherapist: Activity,
  plumber: Wrench,
  electrician: Zap,
  lawyer: Scale,
  accountant: Calculator,
  real_estate: Building2,
  restaurant: UtensilsCrossed,
  beauty_clinic: Sparkles,
  construction: HardHat,
  other: Briefcase,
};
