export type ProductModuleStatus =
  | "active"
  | "inactive"

export interface ProductModule {
  id: string

  product_code: string

  product_name: string

  description: string | null

  category: string | null

  type: string | null

  price: number | null

  tax_percentage: number | null

  status: ProductModuleStatus

  notes: string | null

  created_at: string

  updated_at: string

  created_by: string | null
}

export interface CreateProductModulePayload {
  product_code: string

  product_name: string

  description?: string

  category?: string

  type?: string

  price?: number

  tax_percentage?: number

  status?: ProductModuleStatus

  notes?: string
}

export interface UpdateProductModulePayload {
  product_code?: string

  product_name?: string

  description?: string | null

  category?: string | null

  type?: string | null

  price?: number | null

  tax_percentage?: number | null

  status?: ProductModuleStatus

  notes?: string | null
}

export type ProductModuleDraft = {
  product_code: string

  product_name: string

  description: string

  category: string

  type: string

  price: string

  tax_percentage: string

  status: ProductModuleStatus

  notes: string
}

export const DEFAULT_PRODUCT_MODULE_DRAFT: ProductModuleDraft = {
  product_code: "",

  product_name: "",

  description: "",

  category: "",

  type: "",

  price: "",

  tax_percentage: "",

  status: "active",

  notes: "",
}