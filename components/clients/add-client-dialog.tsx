"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { getSupabaseClient } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Client } from "@/types/client"

export function AddClientDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [organization, setOrganization] = useState("")
  const [industry, setIndustry] = useState("Pharmacy")
  const [city, setCity] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [gst, setGst] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Pharmacy Suite"])

  const interests = [
    "Pharmacy Suite",
    "Clinic Suite",
    "Retail Suite",
    "POS & Billing",
    "Inventory",
    "Online Ordering",
    "HRMS",
    "Analytics",
  ]

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    )
  }

  const resetForm = () => {
    setName("")
    setRole("")
    setOrganization("")
    setIndustry("Pharmacy")
    setCity("")
    setEmail("")
    setPhone("")
    setGst("")
    setNotes("")
    setSelectedInterests(["Pharmacy Suite"])
  }

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const validatePhone = (phoneValue: string) => {
    if (!phoneValue.trim()) return true
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/
    return phoneRegex.test(phoneValue)
  }

  const validateGST = (gstValue: string) => {
    if (!gstValue.trim()) return true
    const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/
    return gstRegex.test(gstValue)
  }

  async function saveClient() {
    if (!name.trim() || !organization.trim() || !email.trim()) {
      toast.error("Name, organization and email are required.")
      return
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.")
      return
    }

    if (phone.trim() && !validatePhone(phone)) {
      toast.error("Please enter a valid phone number (minimum 10 digits).")
      return
    }

    if (gst.trim() && !validateGST(gst)) {
      toast.error("Please enter a valid GST number.")
      return
    }

    setSaving(true)

    try {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      const payload = {
        name: name.trim(),
        role: role.trim() || "Owner",
        organization: organization.trim(),
        industry,
        city: city.trim() || "Chennai",
        email: email.trim(),
        phone: phone.trim() || "+91 90000 00000",
        product: selectedInterests[0] || "Pharmacy Suite",
        status: "prospect",
        gst: gst.trim() || "-",
        notes: [notes.trim(), selectedInterests.length ? `Interests: ${selectedInterests.join(", ")}` : ""]
          .filter(Boolean)
          .join("\n"),
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const responseData = (await response.json()) as { error?: string }
        throw new Error(responseData.error ?? "Failed to create client.")
      }

      const responseData = (await response.json()) as {
        client?: Client
      }

      window.dispatchEvent(
        new CustomEvent("client:changed", {
          detail: {
            client: responseData.client,
          },
        }),
      )
      toast.success("Client added successfully.")
      setOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create client."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className={triggerClassName}>
          <Plus size={13} />
          Add Client
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="panel add-client-sheet" showCloseButton={false}>
        <SheetHeader className="panel-header add-client-header">
          <div>
            <SheetTitle className="panel-title text-(--text)">Add new client</SheetTitle>
            <SheetDescription className="panel-subtitle">Fill in the client details below</SheetDescription>
          </div>
          <SheetClose asChild>
            <button type="button" className="close-btn" aria-label="Close add client panel" onClick={resetForm}>
              <X size={14} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="panel-body add-client-body">
          <div>
            <div className="section-heading">Contact info</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact name</label>
                <Input className="form-input" placeholder="e.g. Ravi Kumar" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Role / Designation</label>
                <Input className="form-input" placeholder="e.g. Procurement Head" value={role} onChange={(event) => setRole(event.target.value)} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: "10px" }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <Input className="form-input" type="email" placeholder="contact@company.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <Input className="form-input" placeholder="+91 98xxx xxxxx" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <div className="section-heading">Organisation</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Organisation name</label>
                <Input className="form-input" placeholder="Company / Hospital name" value={organization} onChange={(event) => setOrganization(event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-input" value={industry} onChange={(event) => setIndustry(event.target.value)}>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Clinic">Healthcare / Clinic</option>
                  <option value="Retail">Retail</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: "10px" }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <Input className="form-input" placeholder="e.g. Chennai" value={city} onChange={(event) => setCity(event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GST number</label>
                <Input className="form-input" placeholder="29AAAAA0000A1Z5" style={{ fontFamily: "var(--mono)", fontSize: "12px" }} value={gst} onChange={(event) => setGst(event.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <div className="section-heading">Interested in</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {interests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`interest-tag ${selectedInterests.includes(interest) ? "active" : ""}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <Textarea className="form-input" rows={3} placeholder="Any relevant notes about this client…" style={{ resize: "vertical" }} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>

        <SheetFooter className="panel-footer add-client-footer">
          <SheetClose asChild>
            <Button type="button" className="btn btn-ghost" variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>
          </SheetClose>
          <Button type="button" className="btn btn-primary add-client-save" onClick={() => void saveClient()} disabled={saving}>{saving ? "Saving..." : "Save client"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
