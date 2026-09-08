import { z } from "zod";

const email = z.string().trim().toLowerCase().email("A valid email is required");
const password = z.string().min(8, "Password must be at least 8 characters long");

export const registerSchema = z.object({
  body: z.object({
    organizationName: z.string().trim().min(2, "Organization name is required"),
    name: z.string().trim().min(2, "Name is required"),
    email,
    password,
    websiteUrl: z.string().trim().url().optional().or(z.literal("")),
    supportEmail: email.optional(),
    timezone: z.string().trim().min(1).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, "Password is required"),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: password,
  }),
  params: z.object({}),
  query: z.object({}),
});
