import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const personSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  phone: phoneSchema,
  year: z.string().trim().min(1, "Select a year"),
  dept: z.string().trim().min(1, "Select a department"),
});

const memberSchema = z.object({
  name: z.string().trim().min(2, "Name required"),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[6-9]\d{9}$/.test(val),
      "Enter a valid 10-digit number"
    ),
  year: z.string().trim().min(1, "Year required"),
  dept: z.string().trim().min(1, "Department required"),
});

export const createTeamSchema = z.object({
  sportSlug: z.string().trim().min(1),
  teamName: z.string().trim().min(2).max(80).optional(),
  category: z.string().trim().min(1),
  captain: personSchema,
  members: z.array(memberSchema).optional().default([]),
});

export const joinTeamSchema = z.object({
  sportSlug: z.string().trim().min(1),
  teamCode: z.string().trim().min(6).max(6),
  member: personSchema,
});

export const adminTeamMutationSchema = z.object({
  action: z.enum(["close", "open"]),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;

export { personSchema };
