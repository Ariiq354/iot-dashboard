import { z } from "zod";

export const loginSchema = z.object({
  username: z.string("Usernam wajib diisi"),
  password: z.string("Password wajib diisi").min(8, "Password minimal 8 karakter"),
  rememberMe: z.boolean(),
});

export type LoginSchema = z.output<typeof loginSchema>;

export const initLoginFormdata: Partial<LoginSchema> = {
  username: undefined,
  password: undefined,
  rememberMe: false,
};
