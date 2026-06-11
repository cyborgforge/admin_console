-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    lead_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    job_title VARCHAR(255),

    email VARCHAR(255),
    phone VARCHAR(20),

    source VARCHAR(100),

    status VARCHAR(50)
    DEFAULT 'discovery'
    CHECK (
        status IN (
            'discovery',
            'contacted',
            'reviewing',
            'closed-won',
            'closed-lost'
        )
    ),

    assigned_to TEXT,

    created_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_activity_date TIMESTAMPTZ,
    last_activity_name VARCHAR(255),
    next_follow_up TIMESTAMPTZ,

    location_state VARCHAR(100),
    location_city VARCHAR(100),

    tags TEXT,

    product_interest VARCHAR(100)
    CHECK (
        product_interest IN (
            'Pharmacy',
            'Hospital',
            'Others'
        )
        OR product_interest IS NULL
    ),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    created_by UUID NOT NULL REFERENCES auth.users(id),

    CONSTRAINT valid_email CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        OR email IS NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status
ON leads(status);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to
ON leads(assigned_to);

CREATE INDEX IF NOT EXISTS idx_leads_created_date
ON leads(created_date);

CREATE INDEX IF NOT EXISTS idx_leads_created_by
ON leads(created_by);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Users can view leads in their organization" ON leads;
DROP POLICY IF EXISTS "Users can create leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads in their organization" ON leads;
DROP POLICY IF EXISTS "Users can delete leads" ON leads;

-- Secure Policies

CREATE POLICY "Users can view own leads"
ON leads
FOR SELECT
USING (
    created_by = auth.uid()
);

CREATE POLICY "Users can create own leads"
ON leads
FOR INSERT
WITH CHECK (
    created_by = auth.uid()
);

CREATE POLICY "Users can update own leads"
ON leads
FOR UPDATE
USING (
    created_by = auth.uid()
)
WITH CHECK (
    created_by = auth.uid()
);

CREATE POLICY "Users can delete own leads"
ON leads
FOR DELETE
USING (
    created_by = auth.uid()
);