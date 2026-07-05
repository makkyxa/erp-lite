export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  ENGINEER = "ENGINEER",
}

export enum OrderStatus {
  CREATED = "CREATED",
  WAITING_PARTS = "WAITING_PARTS",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum OrderPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum PhotoType {
  BEFORE = "BEFORE",
  AFTER = "AFTER",
  DOCUMENT = "DOCUMENT",
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  comment?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  engine?: string;
  mileage: number;
  color?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  car_id: string;
  engineer_id?: string;
  created_by?: string;
  status: OrderStatus;
  priority: OrderPriority;
  problem_description: string;
  repair_description?: string;
  price: number;
  started_at?: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  min_stock: number;
  supplier?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  order_id: string;
  author_id: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  order_id: string;
  file_path: string;
  description?: string;
  photo_type: PhotoType;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_value?: string;
  new_value?: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
}
