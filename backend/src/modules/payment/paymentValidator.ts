import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const paymentSchema = z
  .object({
    artist: z.string().min(1),
    amount: z.number().int().positive(),
    currency: z.enum(['USD', 'RWF', 'EUR']),
    type: z.enum(['SUPPORT', 'PURCHASE']),
    status: z.enum(['PENDING', 'RECEIVED', 'PAID']),
    providedBy: z
      .object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().min(1).optional(),
      })
      .optional(),
    art: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'PURCHASE' && !data.art) {
        return false;
      }
      return true;
    },
    {
      message: 'Art is required for purchase',
    }
  );

export const momoPaymentRequestSchema = z.object({
  amount: z.string(),
  currency: z.enum(['USD', 'RWF', 'EUR']),
  externalId: z.string(),
  payer: z.object({
    partyIdType: z.enum(['MSISDN']),
    partyId: z.string().regex(/^0\d{9}$/),
  }),
  payerMessage: z.string(),
  payeeNote: z.string(),
});

export const mapPaymentToMoMoRequest = (
  paymentData: TPaymentFields,
  payerMessage: string,
  payeeNote: string
): TMoMoPaymentRequestFields => {
  const { amount, currency, providedBy } = paymentData;
  const phoneNumber = providedBy?.phoneNumber || '';

  const momoPaymentRequest: TMoMoPaymentRequestFields = {
    amount: amount.toString(),
    currency,
    externalId: uuidv4(),
    payer: {
      partyIdType: 'MSISDN',
      partyId: phoneNumber,
    },
    payerMessage,
    payeeNote,
  };

  return momoPaymentRequest;
};

export const withdrawPaymentSchema = z.object({
  amount: z.number({
    message: 'Amount required',
  }),
  phoneNumber: z.string({
    message: 'Phone Number required',
  }),
});

export type TMoMoPaymentRequestFields = z.infer<
  typeof momoPaymentRequestSchema
>;
export type TPaymentFields = z.infer<typeof paymentSchema>;

export const validatePayment = (data: any): TPaymentFields => {
  const payment = paymentSchema.safeParse(data);
  if (!payment.success) {
    throw new Error(payment.error.errors[0].message);
  }
  return payment.data;
};
