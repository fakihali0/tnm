import { z } from "zod";
import type { TFunction } from "i18next";

export const createPartnerApplicationSchema = (t: TFunction) =>
  z.object({
    firstName: z
      .string()
      .min(1, t("partners.applicationForm.validation.firstNameRequired")),
    lastName: z
      .string()
      .min(1, t("partners.applicationForm.validation.lastNameRequired")),
    email: z
      .string()
      .email(t("partners.applicationForm.validation.emailInvalid"))
      .min(1, t("partners.applicationForm.validation.emailRequired")),
    phone: z.string().optional(),
    company: z.string().optional(),
    country: z.string().optional(),
    partnerType: z.enum(["affiliate", "ib", "regional"]).refine(
      (val) => ["affiliate", "ib", "regional"].includes(val),
      { message: t("partners.applicationForm.validation.partnerTypeRequired") }
    ),
    experience: z.string().optional(),
    goals: z.string().optional(),
  });

export type PartnerApplicationFormData = z.infer<
  ReturnType<typeof createPartnerApplicationSchema>
>;
