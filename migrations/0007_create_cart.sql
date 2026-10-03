CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Cart_Items stays at product_id (not sku_id) in Sprint 2 — see docs/SPRINT_2.md §8.
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(10, 2) NOT NULL
);
