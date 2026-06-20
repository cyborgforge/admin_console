export type ItemType = "core" | "add_on"
export type ItemStatus = "active" | "inactive"
export type ItemKind = "product" | "service"

export interface ProductModule {
  id: string
  product_code: string
  product_name: string
  description: string
  category: string
  type: ItemType
  price: number
  tax_percentage: number
  status: ItemStatus
  notes: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface ProductService {
  id: string
  service_code: string
  service_name: string
  description: string
  category: string
  type: ItemType
  duration: string
  price: number
  tax_percentage: number
  status: ItemStatus
  notes: string
  created_at: string
  updated_at: string
  created_by: string
}

export type AnyItem = ProductModule | ProductService

export const getName = (kind: ItemKind, item: AnyItem) =>
  kind === "product" ? (item as ProductModule).product_name : (item as ProductService).service_name

export const getCode = (kind: ItemKind, item: AnyItem) =>
  kind === "product" ? (item as ProductModule).product_code : (item as ProductService).service_code
