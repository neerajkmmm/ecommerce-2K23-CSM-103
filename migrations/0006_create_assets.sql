-- Table only in Sprint 2 — the upload pipeline is Sprint 3 (see docs/SPRINT_2.md §8).
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    variant_id INTEGER REFERENCES variants(id) ON DELETE SET NULL ON UPDATE CASCADE,
    storage_key VARCHAR(300) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('primary', 'gallery', 'swatch')),
    alt_text VARCHAR(200),
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_assets_product_id ON assets(product_id);
