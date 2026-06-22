"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabaseClient"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditClientPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    role: "",
    organization: "",
    industry: "",
    email: "",
    phone: "",
    city: "",
    gst: "",
    product: "",
    status: "active",
    notes: "",
  })

  useEffect(() => {
    const loadClient = async () => {
      try {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", id)
          .single()

        if (error || !data) {
          router.push("/clients")
          return
        }

        setForm({
          name: data.name || "",
          role: data.role || "",
          organization: data.organization || "",
          industry: data.industry || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.city || "",
          gst: data.gst || "",
          product: data.product || "",
          status: data.status || "active",
          notes: data.notes || "",
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void loadClient()
  }, [id, router])

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const supabase = getSupabaseClient()

      const { error } = await supabase
        .from("clients")
        .update({
          name: form.name,
          role: form.role,
          organization: form.organization,
          industry: form.industry,
          email: form.email,
          phone: form.phone,
          city: form.city,
          gst: form.gst,
          product: form.product,
          status: form.status,
          notes: form.notes,
        })
        .eq("id", id)

      if (error) throw error

      window.dispatchEvent(new CustomEvent("client:changed"))

      router.push(`/clients/${id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to update client")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="edit-loading">
        Loading client...
      </div>
    )
  }

  return (
    <>
      <div className="edit-client-page">

        <button
          className="back-btn"
          onClick={() => router.back()}
        >
          <ArrowLeft size={16} />
          Back to Client
        </button>

        <div className="edit-header">
          <h1>Edit Client</h1>
          <p>Update client profile and business details.</p>
        </div>

        <div className="edit-card">

          <div className="form-grid">

            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Client Name"
            />

            <input
              value={form.organization}
              onChange={(e) => updateField("organization", e.target.value)}
              placeholder="Organization"
            />

            <input
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
              placeholder="Role"
            />

            <input
              value={form.industry}
              onChange={(e) => updateField("industry", e.target.value)}
              placeholder="Industry"
            />

            <input
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Email"
            />

            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Phone"
            />

            <input
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="City"
            />

            <input
              value={form.gst}
              onChange={(e) => updateField("gst", e.target.value)}
              placeholder="GST Number"
            />

            <input
              value={form.product}
              onChange={(e) => updateField("product", e.target.value)}
              placeholder="Product"
            />

            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
              <option value="churned">Churned</option>
            </select>

          </div>

          <textarea
            rows={6}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Client notes..."
          />

          <div className="actions">

            <button
              className="ghost-btn"
              onClick={() => router.back()}
            >
              Cancel
            </button>

            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>
        </div>
      </div>

      <style jsx>{`
        .edit-client-page {
          min-height: 100vh;
          background: #141416;
          padding: 24px;
          color: #c8d0e0;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #8b95a8;
          cursor: pointer;
          margin-bottom: 20px;
        }

        .back-btn:hover {
          color: #e8eaf0;
        }

        .edit-header {
          margin-bottom: 24px;
        }

        .edit-header h1 {
          color: #e8eaf0;
          font-size: 28px;
          margin-bottom: 6px;
        }

        .edit-header p {
          color: #8b95a8;
        }

        .edit-card {
          background: #161920;
          border: 1px solid #2a3040;
          border-radius: 12px;
          padding: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        input,
        select,
        textarea {
          width: 100%;
          background: #1e2229;
          border: 1px solid #2a3040;
          color: #e8eaf0;
          border-radius: 8px;
          padding: 12px;
          outline: none;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #3b82f6;
        }

        textarea {
          resize: vertical;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        .ghost-btn {
          background: transparent;
          border: 1px solid #2a3040;
          color: #c8d0e0;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
        }

        .save-btn {
          background: #3b82f6;
          border: none;
          color: white;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
        }

        .save-btn:hover {
          background: #2563eb;
        }

        .edit-loading {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #141416;
          color: #c8d0e0;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}
