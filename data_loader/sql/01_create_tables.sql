-- Data Loader Database Schema
-- This script creates the necessary tables for the CSV data loader feature

-- Create data_loader_jobs table for tracking import jobs
CREATE TABLE IF NOT EXISTS data_loader_jobs (
    id SERIAL PRIMARY KEY,
    job_id UUID DEFAULT gen_random_uuid() UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('products', 'customers')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'processing', 'completed', 'failed')),
    file_name VARCHAR(255),
    total_rows INTEGER,
    processed_rows INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    field_mapping JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create data_loader_rows table for storing CSV data
CREATE TABLE IF NOT EXISTS data_loader_rows (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES data_loader_jobs(job_id) ON DELETE CASCADE,
    row_number INTEGER,
    raw_data JSONB, -- Original CSV row data
    mapped_data JSONB, -- Mapped data after field mapping
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data_loader_errors table for error logging
CREATE TABLE IF NOT EXISTS data_loader_errors (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES data_loader_jobs(job_id) ON DELETE CASCADE,
    row_id INTEGER REFERENCES data_loader_rows(id) ON DELETE CASCADE,
    error_type VARCHAR(50), -- 'validation', 'import', 'mapping'
    error_message TEXT,
    field_name VARCHAR(100),
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_loader_jobs_job_id ON data_loader_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_data_loader_jobs_status ON data_loader_jobs(status);
CREATE INDEX IF NOT EXISTS idx_data_loader_jobs_type ON data_loader_jobs(type);
CREATE INDEX IF NOT EXISTS idx_data_loader_jobs_created_at ON data_loader_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_data_loader_rows_job_id ON data_loader_rows(job_id);
CREATE INDEX IF NOT EXISTS idx_data_loader_rows_status ON data_loader_rows(status);
CREATE INDEX IF NOT EXISTS idx_data_loader_rows_row_number ON data_loader_rows(job_id, row_number);

CREATE INDEX IF NOT EXISTS idx_data_loader_errors_job_id ON data_loader_errors(job_id);
CREATE INDEX IF NOT EXISTS idx_data_loader_errors_row_id ON data_loader_errors(row_id);
CREATE INDEX IF NOT EXISTS idx_data_loader_errors_type ON data_loader_errors(error_type);

-- Add comments for documentation
COMMENT ON TABLE data_loader_jobs IS 'Tracks CSV import jobs and their status';
COMMENT ON TABLE data_loader_rows IS 'Stores individual CSV rows for processing';
COMMENT ON TABLE data_loader_errors IS 'Logs errors encountered during import process';

COMMENT ON COLUMN data_loader_jobs.job_id IS 'Unique identifier for the import job';
COMMENT ON COLUMN data_loader_jobs.type IS 'Type of data being imported (products or customers)';
COMMENT ON COLUMN data_loader_jobs.status IS 'Current status of the import job';
COMMENT ON COLUMN data_loader_jobs.field_mapping IS 'JSON mapping of CSV fields to database fields';

COMMENT ON COLUMN data_loader_rows.raw_data IS 'Original CSV row data as JSON';
COMMENT ON COLUMN data_loader_rows.mapped_data IS 'Transformed data after field mapping';
COMMENT ON COLUMN data_loader_rows.status IS 'Processing status of individual row';

COMMENT ON COLUMN data_loader_errors.error_type IS 'Type of error (validation, import, mapping)';
COMMENT ON COLUMN data_loader_errors.field_name IS 'Name of field that caused the error';
COMMENT ON COLUMN data_loader_errors.field_value IS 'Value that caused the error';
