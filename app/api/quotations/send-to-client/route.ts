import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import chromium from "@sparticuz/chromium"
import puppeteerCore from "puppeteer-core"
import { getSupabaseServerClient } from "@/lib/supabaseServer"
import type { Quotation } from "@/types/quotation"

const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "Resend <onboarding@resend.dev>"

export const runtime = "nodejs"

function configureServerlessLibraryPath() {
  const libCandidates = [
    "/tmp/al2023/lib",
    "/tmp/al2/lib",
    "/tmp/al2/lib64",
    "/var/task/lib",
  ]

  const existing = process.env.LD_LIBRARY_PATH
    ? process.env.LD_LIBRARY_PATH.split(":")
    : []

  process.env.LD_LIBRARY_PATH = [...new Set([...libCandidates, ...existing])].join(":")
}

async function launchBrowser() {
  if (process.env.VERCEL) {
    configureServerlessLibraryPath()
    const executablePath = await chromium.executablePath()

    try {
      return await puppeteerCore.launch({
        args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
      })
    } catch (error) {
      console.error("Failed to launch Chromium on Vercel", {
        executablePath,
        ldLibraryPath: process.env.LD_LIBRARY_PATH,
        error,
      })
      throw error
    }
  }

  const localPuppeteer = await import("puppeteer")
  return localPuppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
}

function generateQuotationHTML(quotation: Quotation): string {
  const lineItemsTotal = quotation.lineItems?.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  ) || quotation.amount

  const subtotal = lineItemsTotal
  const discount = quotation.discount || 0
  const gst = Math.round((subtotal - discount) * 0.18)
  const total = subtotal - discount + gst

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'DM Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .container {
            width: 210mm;
            height: 297mm;
            padding: 40px;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
          }
          .branding h1 {
            font-size: 20px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 4px;
          }
          .branding p {
            font-size: 12px;
            color: #888;
          }
          .quotation-title {
            text-align: right;
          }
          .quotation-title h2 {
            font-size: 22px;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 4px;
          }
          .quotation-title p {
            font-size: 12px;
            color: #888;
          }
          .bill-to-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 32px;
          }
          .bill-to {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #aaa;
            margin-bottom: 4px;
          }
          .bill-to-content {
            font-size: 12.5px;
            color: #1a1a2e;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .bill-to-detail {
            font-size: 12.5px;
            color: #555;
            margin-bottom: 2px;
          }
          .details-content {
            font-size: 12.5px;
            color: #555;
            margin-bottom: 4px;
          }
          .details-badge {
            font-size: 12.5px;
            font-weight: 600;
            color: #10b981;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12.5px;
            margin-bottom: 20px;
          }
          thead {
            background: #f4f6fa;
          }
          th {
            text-align: left;
            padding: 8px 10px;
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          td {
            padding: 9px 10px;
            border-bottom: 1px solid #f0f0f0;
          }
          .price {
            font-family: 'DM Mono', monospace;
          }
          .summary {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
          }
          .summary-box {
            width: 220px;
            font-size: 12.5px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            color: #555;
          }
          .summary-row.total {
            border-top: 2px solid #1a1a2e;
            margin-top: 6px;
            padding: 8px 0;
            font-weight: 700;
            font-size: 14px;
          }
          .total-amount {
            color: #3b82f6;
            font-family: 'DM Mono', monospace;
          }
          .footer-message {
            margin-top: 20px;
            padding: 12px;
            background: #f4f6fa;
            border-radius: 6px;
            font-size: 11.5px;
            color: #666;
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
            <div class="quotation-title">
              <h2>QUOTATION</h2>
              <p>${quotation.id}</p>
            </div>
          </div>

          <div class="bill-to-section">
            <div>
              <div class="bill-to">Bill to</div>
              <div class="bill-to-content">${quotation.organization || "-"}</div>
              <div class="bill-to-detail">${quotation.email || "-"}</div>
              <div class="bill-to-detail">${quotation.phone || "-"}</div>
            </div>
            <div style="text-align: right;">
              <div class="bill-to">Details</div>
              <div class="details-content">Date: ${new Date(quotation.createdAt || new Date()).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</div>
              <div class="details-content">Expiry: ${quotation.expiry || "-"}</div>
              <div class="details-badge">Valid for 30 days</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${
                quotation.lineItems && quotation.lineItems.length > 0
                  ? quotation.lineItems.map((item) => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;" class="price">${fmt(item.unitPrice)}</td>
                </tr>
              `).join("")
                  : "<tr><td colspan='3' style='text-align: center; padding: 20px;'>No items added</td></tr>"
              }
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span class="price">${fmt(subtotal)}</span>
              </div>
              ${
                discount > 0
                  ? `<div class="summary-row">
                <span>Discount</span>
                <span class="price" style="color: #10b981;">− ${fmt(discount)}</span>
              </div>`
                  : ""
              }
              <div class="summary-row">
                <span>GST (18%)</span>
                <span class="price">${fmt(gst)}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span class="total-amount">${fmt(total)}</span>
              </div>
            </div>
          </div>

          <div class="footer-message">
            This quotation is valid for 30 days from the date of issue. Prices are subject to change upon renewal.
          </div>
        </div>
      </body>
    </html>
  `
}

async function sendQuotationEmail(quotation: Quotation, recipientEmail: string) {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured")
  }

  const resend = new Resend(resendApiKey)

  // Generate PDF
  const html = generateQuotationHTML(quotation)
  const browser = await launchBrowser()

  try {
    const page = await browser.newPage()
    await page.setContent(html)
    const pdf = await page.pdf({ format: "A4" })
    const pdfBuffer = Buffer.from(pdf)

    // Send email with PDF attachment
    const response = await resend.emails.send({
      from: resendFromEmail,
      to: recipientEmail,
      subject: `Quotation ${quotation.id} from Fluxworks`,
      html: `
        <h2>Hello ${quotation.client || quotation.organization},</h2>
        <p>Please find your quotation attached.</p>
        <p><strong>Quotation Details:</strong></p>
        <ul>
          <li>ID: ${quotation.id}</li>
          <li>Organization: ${quotation.organization}</li>
          <li>Valid for: 30 days</li>
        </ul>
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br/>Fluxworks Team</p>
      `,
      attachments: [
        {
          filename: `${quotation.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (response.error) {
      throw new Error(`Failed to send email: ${response.error.message}`)
    }

    // Update quotation in database to mark as sent
    const supabase = getSupabaseServerClient()
    const { error: updateError } = await supabase
      .from("quotations")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", quotation.id)

    if (updateError) {
      console.error("Failed to update quotation after send:", updateError)
    }
  } finally {
    await browser.close()
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      )
    }

    const { quotation } = await request.json() as { quotation: Quotation }

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation data is required" },
        { status: 400 }
      )
    }

    const recipientEmail = quotation.email?.trim()

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Recipient email is required to send quotation" },
        { status: 400 }
      )
    }

    await sendQuotationEmail(quotation, recipientEmail)

    return NextResponse.json(
      {
        success: true,
        message: "Quote sent to the client!",
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending quotation"
    console.error("Error sending quotation:", error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
