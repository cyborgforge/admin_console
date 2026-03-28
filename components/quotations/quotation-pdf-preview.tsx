"use client"

import { useCallback, useState } from "react"
import { Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Quotation } from "@/types/quotation"

interface QuotationPDFPreviewProps {
  quotation: Quotation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotationPDFPreview({
  quotation,
  open,
  onOpenChange,
}: QuotationPDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  const generatePDF = useCallback(async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/quotations/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quotation }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${quotation.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [quotation])

  // Calculate line items total
  const lineItemsTotal = quotation.lineItems?.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  ) || quotation.amount

  const subtotal = lineItemsTotal
  const discount = quotation.discount || 0
  const gst = Math.round((subtotal - discount) * 0.18)
  const total = subtotal - discount + gst

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{quotation.id} - Quotation Preview</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void generatePDF()}
                disabled={isGenerating}
              >
                <Download size={16} />
                {isGenerating ? "Generating..." : "Download PDF"}
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Quotation for {quotation.client}
          </DialogDescription>
        </DialogHeader>

        <div id={`quotation-pdf-${quotation.id}`} className="bg-white p-8 text-gray-800">
          {/* Header */}
          <div className="mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">QUOTATION</h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Quotation No.</p>
                <p className="font-mono font-bold text-lg">{quotation.id}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Date</p>
                <p className="font-mono font-bold text-lg">
                  {new Date(quotation.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Bill To
              </p>
              <p className="font-bold text-lg text-gray-900">{quotation.client}</p>
              <p className="text-sm text-gray-600">{quotation.organization}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Valid Until
              </p>
              <p className="font-mono font-bold text-lg">{quotation.expiry}</p>
              <p className="text-sm text-gray-600">Quote expires on this date</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 font-bold text-gray-700">
                    Description
                  </th>
                  <th className="text-center py-3 px-2 font-bold text-gray-700 w-20">
                    Qty
                  </th>
                  <th className="text-right py-3 px-2 font-bold text-gray-700 w-24">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-2 font-bold text-gray-700 w-24">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotation.lineItems?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-3 px-2 text-gray-800">{item.name}</td>
                    <td className="text-center py-3 px-2 text-gray-800">
                      {item.quantity}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-gray-800">
                      {fmt(item.unitPrice)}
                    </td>
                    <td className="text-right py-3 px-2 font-mono font-bold text-gray-900">
                      {fmt(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-72">
              <div className="flex justify-between py-2 text-sm border-b border-gray-300">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-mono font-semibold">{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-2 text-sm border-b border-gray-300">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-mono font-semibold text-green-600">
                    − {fmt(discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm border-b border-gray-300">
                <span className="text-gray-600">GST (18%)</span>
                <span className="font-mono font-semibold">{fmt(gst)}</span>
              </div>
              <div className="flex justify-between py-3 text-lg font-bold">
                <span className="text-gray-900">Total</span>
                <span className="font-mono text-green-600">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="mb-8 p-4 bg-gray-50 rounded">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Notes
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {quotation.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-6 border-t border-gray-300">
            <p>This is a computer-generated document.</p>
            <p>Thank you for your business.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
