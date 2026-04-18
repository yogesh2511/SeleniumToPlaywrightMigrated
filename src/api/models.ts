/**
 * API Models – replaces Java POJO classes in api/models/*.java
 *
 * Java used Jackson @JsonProperty annotations for serialization.
 * TypeScript interfaces + plain JSON are sufficient here.
 * Jackson ObjectMapper is replaced by JSON.parse / JSON.stringify.
 */

// ─── Address (replaces Address.java) ────────────────────────────────────────
export interface Address {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

// ─── Customer (replaces Customer.java) ──────────────────────────────────────
export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: Address;
}

// ─── Item (replaces Item.java) ───────────────────────────────────────────────
export interface Item {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

// ─── Payment (replaces Payment.java) ────────────────────────────────────────
export interface Payment {
  method: string;
  transaction_id: string;
  amount: number;
  currency: string;
}

// ─── Shipping (replaces Shipping.java) ──────────────────────────────────────
export interface Shipping {
  method: string;
  cost: number;
  estimated_delivery: string;
}

// ─── Order (replaces Order.java) ─────────────────────────────────────────────
export interface Order {
  order_id: string;
  customer: Customer;
  items: Item[];
  payment: Payment;
  shipping: Shipping;
  order_status: string;
  created_at: string;
}

// ─── ParsedBody (wraps the echo endpoint's response structure) ────────────────
export interface EchoResponseBody {
  path?: string;
  ip?: string;
  headers?: Record<string, string>;
  method?: string;
  parsedBody?: Order;
}
