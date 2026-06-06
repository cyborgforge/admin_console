-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_name VARCHAR(255) NOT NULL,
    client_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    primary_contact_id UUID,
    stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new', 'quote sent', 'negotiation', 'reviewing', 'hold', 'won', 'lost')),
    expected_value DECIMAL(15, 2),
    source_lead_id UUID,
    assigned_to UUID,
    description TEXT,
    current_quotation_id UUID,
    lost_reason VARCHAR(255),
    won_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_deals_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_deals_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_deals_primary_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_deals_source_lead FOREIGN KEY (source_lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_deals_client_id ON deals(client_id);
CREATE INDEX idx_deals_branch_id ON deals(branch_id);
CREATE INDEX idx_deals_primary_contact_id ON deals(primary_contact_id);
CREATE INDEX idx_deals_source_lead_id ON deals(source_lead_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_created_at ON deals(created_at);

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view deals" ON deals
    FOR SELECT USING (true);

CREATE POLICY "Users can create deals" ON deals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update deals" ON deals
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete deals" ON deals
    FOR DELETE USING (true);
