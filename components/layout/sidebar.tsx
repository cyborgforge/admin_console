"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  Users,
  UserRoundPlus,
  Handshake,
  Package,
  ClipboardList,
  ReceiptText,
  RefreshCw,
  LifeBuoy,
  Briefcase,
  UserPlus,
  FileStack,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useQuotations } from "@/hooks/use-quotations"

// const navMain = [
//   { href: "/", label: "Dashboard", icon: LayoutGrid },
//   { href: "/leads", label: "Leads", icon: Landmark },
//   { href: "/quotations", label: "Quotations", icon: FileText },
//   { href: "/clients", label: "Clients", icon: Users },
//   { href: "/invoices", label: "Invoices", icon: ReceiptText },
//   { href: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
//   { href: "/accounts", label: "Accounts", icon: Landmark },
//   {href:"/ProductManagement",label:"Producs",icon:Package}
// ]

// const navViews = [{ href: "/pipeline", label: "Pipeline", icon: BarChart3 }]

const navSections = [
  {
    title: "CRM",
    items: [
      {
        href: "/leads",
        label: "Leads",
        icon: UserRoundPlus,
      },
      {
        href: "/clients",
        label: "Clients",
        icon: Users,
      },
      {
        href: "/deals",
        label: "Deals ",
        icon: Handshake,
      },
      {
        href: "/contacts",
        label: "Contacts ",
        icon: Users,
      },
      {
        href: "/ProductManagement",
        label: "Product Configuration ",
        icon: Package,
      },
    ],
  },

  {
    title: "Client Operations",
    items: [
      {
        href:"/", // "/client-onboarding",
        label: "Client Onboarding",
        icon: ClipboardList,
      },
      
    ],
  },

  {
    title: "Billing & Revenue",
    items: [
      {
        href: "/", //"/invoices",
        label: "Invoices ",
        icon: ReceiptText,
      },
      {
        href: "/", //"/subscriptions",
        label: "Subscriptions ",
        icon: RefreshCw,
      },
    ],
  },

  {
    title: "Support",
    items: [
      {
        href: "/support", //"/support",
        label: "Support ",
        icon: LifeBuoy,
      },
    ],
  },

  {
    title: "HR",
    items: [
      {
        href: "/", // "/employee-onboarding",
        label: "Employee Onboarding ",
        icon: UserPlus,
      },
      {
        href:"/", // "/career-portal",
        label: "Career Portal",
        icon: Briefcase,
      },
    ],
  },

  {
    title: "Content Management",
    items: [
      {
        href: "/", //"/content",
        label: "Content ",
        icon: FileStack,
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { quotations } = useQuotations()

  async function handleSignOut() {
    try {
      await signOut()
      toast.success("Signed out successfully.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out."
      toast.error(message)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">F</div>
        <div>
          <div className="logo-text">FluxWorks</div>
          <div className="logo-sub">Admin Console</div>
        </div>
      </div>

      <nav className="sidebar-nav">

        {/*---  new nav bar rendering */ }
        <Link
  href="/"
  className={cn("nav-item", pathname === "/" && "active")}
>
  <LayoutGrid size={15} />
  Dashboard
</Link>

{navSections.map((section) => (
  <div key={section.title}>
    <div className="nav-section">{section.title}</div>

    {section.items.map((item, index) => {
      const Icon = item.icon
      const active =
        item.href === "/"
          ? (pathname === "/" && item.href !== "/")
          : (pathname.startsWith(item.href) && item.href !== "/")

      const badge =
        item.href === "/quotations"
          ? String(quotations.length)
          : undefined

      return (
        <Link
          key={index}
          href={item.href}
          className={cn("nav-item", active && "active")}
        >
          <Icon size={15} />
          {item.label}
          {badge && (
            <span className="nav-badge">
              {badge}
            </span>
          )}
        </Link>
      )
    })}
  </div>
))}
{/* --- */}

        {/* <div className="nav-section">CRM</div>
        <div className="nav-section">Billing and Revenue</div>
        <div className="nav-section">Support</div>
        <div className="nav-section">HR</div>
        <div className="nav-section">Content Management</div>
        {navMain.map((item) => {
          const Icon = item.icon
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const badge = item.href === "/quotations" ? String(quotations.length) : undefined

          return (
            <Link key={item.href} href={item.href} className={cn("nav-item", active && "active")}>
              <Icon size={15} />
              {item.label}
              {badge ? <span className="nav-badge">{badge}</span> : null}
            </Link>
          )
        })}

        <div className="nav-section">Views</div>
        {navViews.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className={cn("nav-item", active && "active")}>
              <Icon size={15} />
              {item.label}
            </Link>
          )
        })} */}

        <div className="nav-section">Settings</div>
        <button type="button" className="nav-item" onClick={() => void handleSignOut()}>
          <Settings size={15} />
          Sign Out
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="avatar">{user.initials}</div>
        <div>
          <div className="avatar-name">{user.name}</div>
          <div className="avatar-role">{user.role}</div>
        </div>
      </div>
    </aside>
  )
}