-- Database Migrations: Updating Game Schema with History Tables

-- 1. Create Vocabulary Words Ledger Table
CREATE TABLE IF NOT EXISTS vocabulary_words (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    meanings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for high-speed vocabulary search and uniqueness per user
CREATE INDEX IF NOT EXISTS ix_vocabulary_words_word ON vocabulary_words (word);
CREATE UNIQUE INDEX IF NOT EXISTS ix_vocabulary_words_user_word ON vocabulary_words (user_id, word);

-- 2. Create Game Matches History Table
CREATE TABLE IF NOT EXISTS game_matches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    mode VARCHAR(50) NOT NULL DEFAULT 'classic',
    word_count INTEGER NOT NULL DEFAULT 0,
    words_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
