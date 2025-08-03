-- Initialize Scribo Database Schema
-- This script creates the initial database structure for development

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    google_id TEXT UNIQUE,
    profile_picture TEXT,
    user_tier TEXT NOT NULL DEFAULT 'free',
    tier_expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    stats JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    -- Future implementation: vitalicio tier for unlimited access
    -- vitalicio users will have user_tier='vitalicio' and tier_expires_at=NULL
    CONSTRAINT valid_user_tier CHECK (user_tier IN ('free', 'premium', 'vitalicio'))
);

-- Create essays table
CREATE TABLE IF NOT EXISTS essays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    theme TEXT NOT NULL,
    theme_id TEXT,
    ai_model TEXT NOT NULL DEFAULT 'deepseek',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'draft',
    score REAL,
    feedback TEXT,
    grammar_errors JSONB DEFAULT '[]'::jsonb,
    corrected_at TIMESTAMP
);

-- Create corrections table
CREATE TABLE IF NOT EXISTS corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    score REAL NOT NULL,
    feedback JSONB NOT NULL,
    suggestions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_time REAL NOT NULL DEFAULT 0.0
);

-- Create custom_themes table
CREATE TABLE IF NOT EXISTS custom_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    keywords JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create sessions table for caching user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create analysis_usage table for tier-based rate limiting
CREATE TABLE IF NOT EXISTS analysis_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL, -- 'paragraph_analysis', 'essay_correction', 'deep_analysis'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_analysis_type CHECK (analysis_type IN ('paragraph_analysis', 'essay_correction', 'deep_analysis'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_essays_user_id ON essays(user_id);
CREATE INDEX IF NOT EXISTS idx_essays_created_at ON essays(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_essays_status ON essays(status);
CREATE INDEX IF NOT EXISTS idx_corrections_essay_id ON corrections(essay_id);
CREATE INDEX IF NOT EXISTS idx_corrections_created_at ON corrections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_analysis_usage_user_type ON analysis_usage(user_id, analysis_type);
CREATE INDEX IF NOT EXISTS idx_analysis_usage_created_at ON analysis_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(user_tier);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for essays table
CREATE TRIGGER update_essays_updated_at 
    BEFORE UPDATE ON essays 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO users (email, name, google_id) VALUES 
    ('supernvxofc@gmail.com', 'Nicolas Mendes de Araújo', 'sample_google_id_123')
ON CONFLICT (email) DO NOTHING;

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.name,
    COUNT(e.id) as total_essays,
    AVG(e.score) as average_score,
    MAX(e.created_at) as last_essay_date,
    COUNT(CASE WHEN e.score IS NOT NULL THEN 1 END) as corrected_essays
FROM users u
LEFT JOIN essays e ON u.id = e.user_id
GROUP BY u.id, u.email, u.name;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scribo_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scribo_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO scribo_user;