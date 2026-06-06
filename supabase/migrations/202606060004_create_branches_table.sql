-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address_line_1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' OR email IS NULL),
    CONSTRAINT fk_branches_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_branches_client_id ON branches(client_id);

-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view branches" ON branches
    FOR SELECT USING (true);

CREATE POLICY "Users can create branches" ON branches
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update branches" ON branches
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete branches" ON branches
    FOR DELETE USING (true);
