# PDF Generation Flow

This document explains, end to end, how PDF generation works in this project, which dependencies are involved, and how data moves from UI action to downloaded file or emailed attachment.

## Scope

The PDF system currently supports:

- Quotation PDF download
- Quotation PDF email attachment
- Invoice PDF API generation
- Invoice PDF email attachment (background send)

## Dependencies and What They Do

### 1) puppeteer

Role:
- Launches a headless Chromium browser in local or standard Node.js environments.
- Converts server-generated HTML into a PDF buffer.

Used in:
- app/api/invoices/generate-pdf/route.ts
- app/api/invoices/send-to-client/route.ts
- app/api/quotations/generate-pdf/route.ts
- app/api/quotations/send-to-client/route.ts

Why it exists:
- It provides the browser engine used by all PDF routes.

### 2) resend

Role:
- Sends emails with generated PDF attachments.

Used in:
- app/api/quotations/send-to-client/route.ts
- app/api/invoices/send-to-client/route.ts

Why it exists:
- Handles outbound transactional email delivery for quotations and invoices.

### 3) next/server (NextRequest, NextResponse, after)

Role:
- Defines server route handlers and HTTP responses.
- Sends binary PDF content for downloads.
- Runs invoice send process in background using after(...).

Used in:
- app/api/quotations/generate-pdf/route.ts
- app/api/invoices/generate-pdf/route.ts
- app/api/quotations/send-to-client/route.ts
- app/api/invoices/send-to-client/route.ts

## Runtime Strategy

All PDF routes are Node runtime routes (`runtime = "nodejs"`).

Environment behavior:

- All routes launch with puppeteer and sandbox-disabled args:
   - --no-sandbox
   - --disable-setuid-sandbox

## End-to-End Flows

## A) Quotation PDF Download Flow

Entry point (UI):
- components/quotations/quotation-pdf-preview.tsx
- Function: generatePDF()

Step-by-step:

1. User opens Quotation Preview and clicks Download PDF.
2. Client reads Supabase session token and calls:
   - POST /api/quotations/generate-pdf
   - Body: { quotation }
   - Headers include Authorization Bearer token.
3. API route validates quotation payload.
4. API calculates totals:
   - lineItemsTotal
   - subtotal
   - discount
   - gst
   - total
5. API builds quotation HTML template string (inline CSS + quotation data).
6. API launches headless browser based on environment strategy.
7. API creates a page and injects HTML with page.setContent(...).
8. API renders PDF via page.pdf(...), A4 with defined margins.
9. API closes browser.
10. API returns binary PDF bytes with headers:
   - Content-Type: application/pdf
   - Content-Disposition: attachment; filename="<quotation-id>.pdf"
11. Client reads response blob, creates object URL, triggers browser download, then revokes URL.

Success outcome:
- User gets a downloaded .pdf file named from quotation ID.

## B) Quotation Send-to-Client Flow (Email Attachment)

Entry points:
- components/quotations/quotation-pdf-preview.tsx (manual send)
- components/quotations/new-quote-dialog.tsx (auto send when status is sent)

Server route:
- app/api/quotations/send-to-client/route.ts

Step-by-step:

1. Client calls POST /api/quotations/send-to-client with { quotation }.
2. Route validates:
   - RESEND_API_KEY is configured.
   - quotation payload exists.
   - recipient email exists (quotation.email).
3. Route generates quotation HTML.
4. Route launches browser with Puppeteer.
5. Route renders PDF buffer from HTML.
6. Route sends email using Resend:
   - subject includes quotation ID
   - PDF attached as <quotation-id>.pdf
7. Route updates Supabase quotations.sent_at timestamp.
8. Route returns success JSON.

Success outcome:
- Client receives email with quotation PDF attachment.

## C) Invoice PDF Generation API Flow

Server route:
- app/api/invoices/generate-pdf/route.ts

Step-by-step:

1. Client (or caller) sends POST /api/invoices/generate-pdf with { invoice }.
2. Route validates required invoice fields.
3. Route computes subtotal, discount, GST amount, and total.
4. Route generates invoice HTML using generateInvoiceHTML(...).
5. Route launches Puppeteer with headless browser.
6. Route renders PDF via page.pdf({ format: "A4" }).
7. Route closes browser.
8. Route returns PDF bytes with attachment headers:
   - Content-Type: application/pdf
   - Content-Disposition: attachment; filename="<invoice-id>.pdf"

Success outcome:
- Caller receives downloadable invoice PDF.

## D) Invoice Send-to-Client Flow (Background)

Entry point (UI):
- components/invoices/new-invoice-dialog.tsx
- Triggered when invoice status is sent.

Server route:
- app/api/invoices/send-to-client/route.ts

Step-by-step:

1. Client creates invoice and, for sent status, calls POST /api/invoices/send-to-client with { invoice }.
2. Route validates invoice payload and recipient email.
3. Route schedules background work using after(async () => ...).
4. Route immediately returns 202 Accepted (send started).
5. Background task:
   - Generates invoice HTML
   - Launches Puppeteer
   - Renders PDF
   - Sends email via Resend with PDF attachment
   - Closes browser in finally block

Success outcome:
- API responds quickly while email sending completes asynchronously.

## Request and Response Summary

### Download routes

POST /api/quotations/generate-pdf
- Request body: { quotation }
- Response: application/pdf bytes (attachment)

POST /api/invoices/generate-pdf
- Request body: { invoice }
- Response: application/pdf bytes (attachment)

### Send routes

POST /api/quotations/send-to-client
- Request body: { quotation }
- Response: JSON success/failure

POST /api/invoices/send-to-client
- Request body: { invoice }
- Response: 202 Accepted JSON (background send started)

## Environment Variables

Required for sending:
- RESEND_API_KEY

Optional:
- RESEND_FROM_EMAIL (default fallback is used if unset)

Runtime switch:
- VERCEL (used to determine serverless Chromium launch path in quotation routes)

## Source Map

Core routes:
- app/api/quotations/generate-pdf/route.ts
- app/api/quotations/send-to-client/route.ts
- app/api/invoices/generate-pdf/route.ts
- app/api/invoices/send-to-client/route.ts

UI triggers:
- components/quotations/quotation-pdf-preview.tsx
- components/quotations/new-quote-dialog.tsx
- components/invoices/new-invoice-dialog.tsx

## Notes and Operational Considerations

- HTML templates are built inline in route handlers; visual changes to PDFs are done in those template strings.
- Browser startup is the heaviest part of generation, so keeping templates lightweight improves throughput.
- Sandboxed Chromium flags are disabled in local launch config to avoid environment-specific launch errors.
- Invoice send route intentionally uses background execution for better API responsiveness.
