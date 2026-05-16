import { z } from "zod";
import type { CreateUserFormCaller } from "@/features/users/types/user";

const uuidSchema = z.string().uuid({ message: "Invalid id" });

export function createCreateUserSchema(opts: { caller: CreateUserFormCaller }) {
  return z
    .object({
      full_name: z.string().min(2, "Full name must be at least 2 characters"),
      email: z.string().trim().email("Enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z.enum(["owner", "agent"]),
      owner_id: z.string(),
      /** Optional selection (empty OK). Form uses default `venue_ids: []`; ids are opaque strings until backend UUIDs confirmed. */
      venue_ids: z.array(z.string()),
    })
    .superRefine((data, ctx) => {
      if (opts.caller === "owner") {
        if (data.role !== "agent") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Owners can only create agents",
            path: ["role"],
          });
        }
      }

      if (opts.caller === "super_admin" && data.role === "agent") {
        const oid = data.owner_id.trim();
        if (!oid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Select an owner for this agent",
            path: ["owner_id"],
          });
        } else if (!z.string().uuid().safeParse(oid).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Select an owner for this agent",
            path: ["owner_id"],
          });
        }
      }
    });
}
