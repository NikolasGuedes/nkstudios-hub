import { z } from 'zod';

export const contactRequestSchema = z
  .object({
    name: z
      .string({ required_error: 'REQUIRED' })
      .trim()
      .min(2, 'TOO_SHORT')
      .max(80, 'TOO_LONG')
      .refine((value) => !/[\r\n]/.test(value), 'INVALID'),
    email: z
      .string({ required_error: 'REQUIRED' })
      .trim()
      .max(254, 'TOO_LONG')
      .email('INVALID'),
    description: z
      .string({ required_error: 'REQUIRED' })
      .trim()
      .min(10, 'TOO_SHORT')
      .max(3000, 'TOO_LONG'),
    // Honeypot: real users never see or fill this field.
    company: z.string().max(0).optional().default(''),
  })
  .strict();

export type ContactRequest = z.infer<typeof contactRequestSchema>;

export type ContactFieldErrors = Partial<
  Record<'name' | 'email' | 'description' | 'form', string>
>;

export function getContactFieldErrors(error: z.ZodError): ContactFieldErrors {
  const fields: ContactFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field === 'name' || field === 'email' || field === 'description') {
      fields[field] ??= issue.message;
      continue;
    }

    fields.form ??= 'INVALID';
  }

  return fields;
}
