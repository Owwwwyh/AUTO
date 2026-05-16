import { z } from "zod";

export const ReceiptSchema = z.object({
  merchant: z.string().describe("Store or merchant name exactly as printed on the receipt"),
  date: z.string().describe("Transaction date in ISO 8601 format YYYY-MM-DD"),
  total: z.number().describe("Grand total amount as a plain number, with no currency symbol"),
  currency: z.string().describe("ISO 4217 currency code, e.g. MYR, USD, SGD. Infer from symbol if not printed (RM => MYR)."),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
