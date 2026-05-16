import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { ReceiptSchema, type Receipt } from "./schema";

export const EXTRACTION_PROMPT = `You are a receipt-parsing assistant. Extract the following fields from the receipt image:
- merchant: store or merchant name exactly as printed
- date: transaction date in ISO 8601 format (YYYY-MM-DD)
- total: the grand total amount as a plain number with no currency symbol or thousands separators
- currency: the ISO 4217 currency code (e.g. MYR, USD, SGD, EUR). If only a symbol is shown, infer the code (RM => MYR, $ => USD unless context suggests otherwise, € => EUR).

If a field is missing or unreadable, give your best inference rather than refusing. Return only the structured fields.`;

export async function extractReceipt(imageBytes: Uint8Array, mediaType: string): Promise<Receipt> {
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: ReceiptSchema,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          { type: "image", image: imageBytes, mediaType },
        ],
      },
    ],
  });
  return object;
}
