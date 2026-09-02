export interface ICreateCheckoutPayload {
  productId: string;
  successUrl?: string;
  content?: string;
  websiteUrl?: string;
  metadata?: Record<string, any>;
}

