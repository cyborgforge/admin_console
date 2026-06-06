-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    job_title VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'discovery' CHECK (status IN ('discovery', 'contacted', 'reviewing', 'closed-won', 'closed-lost')),
    assigned_to UUID,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    last_activity_name VARCHAR(255),
    next_follow_up TIMESTAMP WITH TIME ZONE,
    location_state VARCHAR(100),
    location_city VARCHAR(100),
    tags TEXT,
    product_interest VARCHAR(100) CHECK (product_interest IN ('Pharmacy', 'Hospital', 'Others') OR product_interest IS NULL),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' OR email IS NULL)
);

-- Create index on status for filtering
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_date ON leads(created_date);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view leads in their organization" ON leads
    FOR SELECT USING (true);

CREATE POLICY "Users can create leads" ON leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update leads in their organization" ON leads
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete leads" ON leads
    FOR DELETE USING (true);
