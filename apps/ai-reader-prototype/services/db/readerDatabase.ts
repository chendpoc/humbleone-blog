import { mkdirSync } from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const readerDataDirectory = path.join(process.cwd(), 'data')
const defaultReaderDatabasePath = path.join(readerDataDirectory, 'reader.sqlite')

let database: Database.Database | null = null

export function getReaderDatabase() {
  if (!database) {
    const databasePath = process.env.READER_DB_PATH?.trim() || defaultReaderDatabasePath

    mkdirSync(path.dirname(databasePath), { recursive: true })
    database = new Database(databasePath, {
      timeout: 5000,
    })
    initializeReaderDatabase(database)
  }

  return database
}

function initializeReaderDatabase(db: Database.Database) {
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS article_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      body_json TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('rss', 'web')),
      status TEXT NOT NULL CHECK (status IN ('ok', 'failed')),
      error TEXT,
      text_length INTEGER NOT NULL,
      source_hash TEXT NOT NULL,
      extracted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_article_contents_article_id
      ON article_contents(article_id);

    CREATE INDEX IF NOT EXISTS idx_article_contents_source_hash
      ON article_contents(source_hash);

    CREATE TABLE IF NOT EXISTS article_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      url TEXT NOT NULL,
      target_language TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      source_hash TEXT NOT NULL,
      translated_title TEXT NOT NULL,
      translated_body_json TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('ok', 'failed')),
      error_message TEXT,
      translated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (url, target_language, provider, model, prompt_version, source_hash)
    );

    CREATE INDEX IF NOT EXISTS idx_article_translations_article_id
      ON article_translations(article_id);

    CREATE INDEX IF NOT EXISTS idx_article_translations_lookup
      ON article_translations(url, target_language, provider, model, prompt_version, source_hash);

    CREATE TABLE IF NOT EXISTS article_ai_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id TEXT NOT NULL,
      url TEXT NOT NULL,
      output_type TEXT NOT NULL,
      language TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      input_hash TEXT NOT NULL,
      output_json TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('ok', 'failed')),
      error_message TEXT,
      generated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (url, output_type, language, provider, model, prompt_version, input_hash)
    );

    CREATE INDEX IF NOT EXISTS idx_article_ai_outputs_article_id
      ON article_ai_outputs(article_id);

    CREATE INDEX IF NOT EXISTS idx_article_ai_outputs_lookup
      ON article_ai_outputs(url, output_type, language, provider, model, prompt_version, input_hash);

    CREATE TABLE IF NOT EXISTS source_fetch_states (
      source_id TEXT PRIMARY KEY,
      rsshub_route TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      update_frequency TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('idle', 'ok', 'empty', 'failed', 'skipped')),
      item_count INTEGER NOT NULL DEFAULT 0,
      raw_item_count INTEGER,
      normalized_item_count INTEGER,
      last_checked_at TEXT,
      last_success_at TEXT,
      next_check_at TEXT,
      last_error TEXT,
      last_feed_hash TEXT,
      last_item_published_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_source_fetch_states_next_check
      ON source_fetch_states(next_check_at);

    CREATE TABLE IF NOT EXISTS feed_items (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      published_at TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      item_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_feed_items_source_published
      ON feed_items(source_id, published_at DESC);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_items_source_url
      ON feed_items(source_id, url);

    CREATE TABLE IF NOT EXISTS reader_article_states (
      article_id TEXT PRIMARY KEY,
      source_id TEXT,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      saved INTEGER NOT NULL DEFAULT 0,
      favorited INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reader_article_states_saved
      ON reader_article_states(saved, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_reader_article_states_favorited
      ON reader_article_states(favorited, updated_at DESC);

    CREATE TABLE IF NOT EXISTS fetch_runs (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      endpoint TEXT,
      fetch_method TEXT NOT NULL,
      trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'bootstrap', 'debug')),
      status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed', 'empty')),
      started_at TEXT NOT NULL,
      finished_at TEXT,
      duration_ms INTEGER,
      raw_item_count INTEGER NOT NULL DEFAULT 0,
      normalized_item_count INTEGER NOT NULL DEFAULT 0,
      inserted_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_fetch_runs_source_started
      ON fetch_runs(source_id, started_at DESC);

    CREATE INDEX IF NOT EXISTS idx_fetch_runs_started
      ON fetch_runs(started_at DESC);

    CREATE VIRTUAL TABLE IF NOT EXISTS article_search USING fts5(
      article_id UNINDEXED,
      url UNINDEXED,
      title,
      body
    );
  `)

  ensureColumn(db, 'source_fetch_states', 'raw_item_count', 'INTEGER')
  ensureColumn(db, 'source_fetch_states', 'normalized_item_count', 'INTEGER')
  backfillArticleSearchIndex(db)
}

function ensureColumn(db: Database.Database, tableName: string, columnName: string, definition: string) {
  const columns = db.pragma(`table_info(${tableName})`) as Array<{ name: string }>

  if (columns.some((column) => column.name === columnName)) {
    return
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
}

type ArticleSearchBackfillRow = {
  article_id: string
  body_json: string
  status: string
  title: string
  url: string
}

function backfillArticleSearchIndex(db: Database.Database) {
  const contentCount = db
    .prepare("SELECT COUNT(*) AS count FROM article_contents WHERE status = 'ok'")
    .get() as { count: number }
  const searchCount = db
    .prepare('SELECT COUNT(*) AS count FROM article_search')
    .get() as { count: number }

  if (searchCount.count >= contentCount.count) {
    return
  }

  const rows = db
    .prepare(`
      SELECT article_id, url, title, body_json, status
      FROM article_contents
      WHERE status = 'ok'
    `)
    .all() as ArticleSearchBackfillRow[]
  const deleteSearch = db.prepare('DELETE FROM article_search')
  const insertSearch = db.prepare(`
    INSERT INTO article_search (article_id, url, title, body)
    VALUES (?, ?, ?, ?)
  `)
  const rebuild = db.transaction((records: ArticleSearchBackfillRow[]) => {
    deleteSearch.run()

    records.forEach((record) => {
      insertSearch.run(
        record.article_id,
        record.url,
        record.title,
        parseBodyJson(record.body_json).join('\n\n'),
      )
    })
  })

  rebuild(rows)
}

function parseBodyJson(value: string) {
  try {
    const parsed = JSON.parse(value)

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}
