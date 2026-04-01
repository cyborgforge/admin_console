import { after, NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { requestPdfBuffer } from "@/lib/pdfService"

type InvoicePdfLineItem = {
  description: string
  quantity: number
  rate: number
}

type InvoicePdfPayload = {
  id: string
  client: string
  org: string
  email?: string
  due: string
  gstin?: string
  gstRate: number
  taxType: "igst" | "cgst_sgst"
  discount: number
  paymentTerms?: string
  lineItems: InvoicePdfLineItem[]
}

const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "Resend <onboarding@resend.dev>"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function generateInvoiceHTML(invoice: InvoicePdfPayload): string {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const discount = Math.max(0, Math.min(subtotal, invoice.discount || 0))
  const taxableAmount = subtotal - discount
  const gstAmount = Math.round(taxableAmount * ((invoice.gstRate || 18) / 100))
  const total = taxableAmount + gstAmount

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'DM Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .container { width: 210mm; min-height: 297mm; padding: 40px; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
          .branding h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
          .branding p { font-size: 12px; color: #888; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { font-size: 22px; font-weight: 700; color: #3b82f6; margin-bottom: 4px; }
          .invoice-title p { font-size: 12px; color: #888; }
          .bill-to-section { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
          .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #aaa; margin-bottom: 4px; }
          .content-main { font-size: 12.5px; color: #1a1a2e; font-weight: 600; margin-bottom: 4px; }
          .content-sub { font-size: 12.5px; color: #555; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 20px; }
          thead { background: #f4f6fa; }
          th {
            text-align: left; padding: 8px 10px; font-size: 10px; color: #888;
            text-transform: uppercase; letter-spacing: 0.06em;
          }
          td { padding: 9px 10px; border-bottom: 1px solid #f0f0f0; }
          .money { font-family: 'DM Mono', monospace; }
          .summary { display: flex; justify-content: flex-end; margin-bottom: 20px; }
          .summary-box { width: 260px; font-size: 12.5px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; color: #555; }
          .summary-row.total {
            border-top: 2px solid #1a1a2e; margin-top: 6px; padding: 8px 0;
            font-weight: 700; font-size: 14px;
          }
          .total-amount { color: #10b981; font-family: 'DM Mono', monospace; }
          .footer-message {
            margin-top: 20px; padding: 12px; background: #f4f6fa; border-radius: 6px;
            font-size: 11.5px; color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="branding">
              <h1>Fluxworks</h1>
              <p>Software Solutions</p>
            </div>
            <div class="invoice-title">
              <h2>INVOICE</h2>
              <p>${invoice.id}</p>
            </div>
          </div>

          <div class="bill-to-section">
            <div>
              <div class="label">Bill to</div>
              <div class="content-main">${invoice.client || "-"}</div>
              <div class="content-sub">${invoice.org || "-"}</div>
              <div class="content-sub">${invoice.email || "-"}</div>
              <div class="content-sub">GSTIN: ${invoice.gstin || "-"}</div>
            </div>
            <div style="text-align: right;">
              <div class="label">Details</div>
              <div class="content-sub">Due: ${invoice.due || "-"}</div>
              <div class="content-sub">Tax type: ${invoice.taxType === "cgst_sgst" ? "CGST + SGST" : "IGST"}</div>
              <div class="content-sub">GST: ${invoice.gstRate}%</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.lineItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;" class="money">${fmt(item.rate)}</td>
                  <td style="text-align: right;" class="money">${fmt(item.quantity * item.rate)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-box">
              <div class="summary-row"><span>Subtotal</span><span class="money">${fmt(subtotal)}</span></div>
              ${
                discount > 0
                  ? `<div class="summary-row"><span>Discount</span><span class="money" style="color:#10b981;">− ${fmt(discount)}</span></div>`
                  : ""
              }
              <div class="summary-row"><span>GST (${invoice.gstRate}%)</span><span class="money">${fmt(gstAmount)}</span></div>
              <div class="summary-row total"><span>Total</span><span class="total-amount">${fmt(total)}</span></div>
            </div>
          </div>

          <div class="footer-message">${invoice.paymentTerms || "Payment due as per agreed terms."}</div>
        </div>
      </body>
    </html>
  `
}

async function sendInvoiceInBackground(invoice: InvoicePdfPayload, recipientEmail: string) {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured")
  }

  const resend = new Resend(resendApiKey)
  const html = generateInvoiceHTML(invoice)

  const pdfBuffer = await requestPdfBuffer({
    html,
    fileName: `${invoice.id}.pdf`,
    options: {
      format: "A4",
      printBackground: true,
    },
  })

  const response = await resend.emails.send({
    from: resendFromEmail,
    to: recipientEmail,
    subject: `Invoice ${invoice.id} from Fluxworks`,
    html: `
      <div style="font-family: 'DM Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e; margin-bottom: 12px;">Hello ${invoice.client || invoice.org},</h2>
        <p style="margin-bottom: 16px;">Please find your invoice attached.</p>
        
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0;"><strong style="color: #1a1a2e;">Invoice Details:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Invoice ID:</strong> ${invoice.id}</li>
            <li style="margin-bottom: 8px;"><strong>Organization:</strong> ${invoice.org || "-"}</li>
            <li style="margin-bottom: 8px;"><strong>Due Date:</strong> ${invoice.due || "-"}</li>
            <li style="margin-bottom: 0;"><strong>Tax Type:</strong> ${invoice.taxType === "cgst_sgst" ? "CGST + SGST" : "IGST"}</li>
          </ul>
        </div>

        <div style="background: #f0f7ff; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
          <p style="margin: 0; color: #333; font-size: 14px;">
            ${invoice.paymentTerms || "Payment due as per agreed terms."}
          </p>
        </div>

        <p style="color: #666; margin-bottom: 12px;">If you have any questions or need clarification, please don't hesitate to reach out.</p>
        
        <p style="color: #666; margin: 0;">Best regards,<br/><strong>Fluxworks Team</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoice.id}.pdf`,
        content: pdfBuffer,
      },
    ],
  })

  if (response.error) {
    throw new Error(`Failed to send email: ${response.error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { invoice } = (await request.json()) as { invoice: InvoicePdfPayload }

    if (!invoice || !invoice.client || !Array.isArray(invoice.lineItems) || invoice.lineItems.length === 0) {
      return NextResponse.json({ error: "Invoice data is required" }, { status: 400 })
    }

    const recipientEmail = invoice.email?.trim()
    if (!recipientEmail) {
      return NextResponse.json({ error: "Client email is required to send invoice" }, { status: 400 })
    }

    after(async () => {
      try {
        await sendInvoiceInBackground(invoice, recipientEmail)
      } catch (backgroundError) {
        console.error(`Background invoice send failed for ${invoice.id} to ${recipientEmail}:`, backgroundError)
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Invoice send started in background for " + recipientEmail,
      },
      { status: 202 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending invoice"
    console.error("Error sending invoice:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
