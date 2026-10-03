CREATE TABLE IF NOT EXISTS skus (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    sku_code VARCHAR(40) NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skus_variant_id ON skus(variant_id);
