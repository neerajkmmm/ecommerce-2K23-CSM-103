CREATE TABLE IF NOT EXISTS variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    option_values JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- jsonb has no default B-tree opclass, so uniqueness is enforced on its text form.
CREATE UNIQUE INDEX IF NOT EXISTS uq_variants_product_option
    ON variants (product_id, (option_values::text));
