export interface DealProductService {
  id: string

  deal_id: string

  product_service_id: string

  quantity: number

  deal_unit_price: number

  deal_tax_percentage: number | null

  discount_percent: number | null

  created_at: string

  updated_at: string

  created_by: string | null

  product_service?: {
    id: string
    service_name: string
    service_code: string
  } | null
}