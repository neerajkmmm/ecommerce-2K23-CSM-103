CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    shipping_address VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- order_items.sku_id (not product_id) — the Sprint 2 change from Sprint 1, see docs/SPRINT_2.md §2.
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    sku_id INTEGER NOT NULL REFERENCES skus(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL
);
