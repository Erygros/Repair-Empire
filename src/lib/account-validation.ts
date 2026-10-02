import { z } from "zod";

export const normalizeUsername = (value: string) => value.trim().toLowerCase();
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
const email = z.string().transform(normalizeEmail).pipe(z.email("Ungültige E-Mail-Adresse."));
export const registrationSchema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_-]{3,24}$/, "Username: 3–24 Zeichen, Buchstaben, Zahlen, _ oder -."),
  ceoName: z.string().trim().transform(value => value.replace(/\s+/g, " ")).pipe(z.string().min(2, "CEO-Name muss 2–24 Zeichen lang sein.").max(24, "CEO-Name muss 2–24 Zeichen lang sein.")),
  email,
  emailConfirm: email,
  password: z.string().min(10, "Das Passwort benötigt mindestens 10 Zeichen.").max(128, "Das Passwort darf höchstens 128 Zeichen lang sein."),
  passwordConfirm: z.string(),
  terms: z.literal(true, { error: "Die rechtliche Zustimmung ist erforderlich." }),
}).superRefine((value, ctx) => {
  if (value.email !== value.emailConfirm) ctx.addIssue({ code: "custom", path: ["emailConfirm"], message: "E-Mails stimmen nicht überein." });
  if (value.password !== value.passwordConfirm) ctx.addIssue({ code: "custom", path: ["passwordConfirm"], message: "Passwörter stimmen nicht überein." });
});
