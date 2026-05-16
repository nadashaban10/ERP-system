import { z } from "zod";

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} is required`);

export const createVenueSchema = z.object({
  name_ar: nonEmpty("Arabic name"),
  name_en: nonEmpty("English name"),
  type: z.enum(["hall", "hotel", "garden", "boat", "other"]),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  city: z.enum(["cairo", "giza", "alexandria", "other"]),
  district: z.string().optional(),
  phone_1: nonEmpty("Primary phone"),
  phone_2: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  logo_url: z.string().optional(),
  marketplace_active: z.boolean(),
  edit_cutoff_days: z.number().int().positive().max(365),
  edit_cutoff_override: z.boolean(),
  subscription_plan: z.enum(["trial", "starter", "professional"]),
  trial_ends_at: z.string().optional(),
  owner_id: z.string(),
});

export type CreateVenueSchemaIn = z.input<typeof createVenueSchema>;
export type CreateVenueSchemaOut = z.output<typeof createVenueSchema>;

/** Form + submit shape (same as schema output). */
export type CreateVenueFormValues = CreateVenueSchemaOut;
