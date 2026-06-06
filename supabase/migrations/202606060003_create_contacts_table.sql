-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    department VARCHAR(255),
    email VARCHAR(255),
    mobile VARCHAR(20),
    phone VARCHAR(20),
    linkedin VARCHAR(255),
    client_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' OR email IS NULL),
    CONSTRAINT fk_contacts_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_contacts_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_contacts_client_id ON contacts(client_id);
CREATE INDEX idx_contacts_branch_id ON contacts(branch_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view contacts" ON contacts
    FOR SELECT USING (true);

CREATE POLICY "Users can create contacts" ON contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update contacts" ON contacts
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete contacts" ON contacts
    FOR DELETE USING (true);
