-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    deal_id UUID,
    client_id UUID NOT NULL,
    branch_id UUID,
    contact_id UUID,
    quotation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    subtotal_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_quotations_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
    CONSTRAINT fk_quotations_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_quotations_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT fk_quotations_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_quotations_quotation_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_deal_id ON quotations(deal_id);
CREATE INDEX idx_quotations_client_id ON quotations(client_id);
CREATE INDEX idx_quotations_branch_id ON quotations(branch_id);
CREATE INDEX idx_quotations_contact_id ON quotations(contact_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view quotations" ON quotations
    FOR SELECT USING (true);

CREATE POLICY "Users can create quotations" ON quotations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update quotations" ON quotations
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete quotations" ON quotations
    FOR DELETE USING (true);
