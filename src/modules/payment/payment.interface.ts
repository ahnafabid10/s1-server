export interface ICreateCheckoutPayload {
  productId: string;
  successUrl?: string;
  metadata?: Record<string, any>;
}
