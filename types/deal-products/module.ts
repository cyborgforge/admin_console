export interface DealProductModule {
  id: string

  deal_id: string

  product_module_id: string

  quantity: number

  deal_unit_price: number

  deal_tax_percentage: number | null

  discount_percent: number | null

  created_at: string

  updated_at: string

  created_by: string | null

  product_module?: {
    id: string
    product_name: string
    product_code: string
  } | null
}