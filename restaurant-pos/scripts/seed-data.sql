-- Insert sample employees
INSERT INTO employees (pin, name, role) VALUES
('1234', 'John Manager', 'manager'),
('5678', 'Jane Cashier', 'cashier'),
('9012', 'Bob Cook', 'cook'),
('3456', 'Alice Prep', 'prep'),
('7890', 'Mike Cashier', 'cashier');

-- Insert categories
INSERT INTO categories (name, sort_order) VALUES
('Bowls', 1),
('Sides', 2),
('Drinks', 3),
('Desserts', 4);

-- Get category IDs for menu items
DO $$
DECLARE
    bowls_id UUID;
    sides_id UUID;
    drinks_id UUID;
    desserts_id UUID;
BEGIN
    SELECT id INTO bowls_id FROM categories WHERE name = 'Bowls';
    SELECT id INTO sides_id FROM categories WHERE name = 'Sides';
    SELECT id INTO drinks_id FROM categories WHERE name = 'Drinks';
    SELECT id INTO desserts_id FROM categories WHERE name = 'Desserts';

    -- Insert menu items
    INSERT INTO menu_items (name, price, category_id, is_available) VALUES
    ('Chicken Bowl', 12.99, bowls_id, TRUE),
    ('Beef Bowl', 14.99, bowls_id, TRUE),
    ('Veggie Bowl', 10.99, bowls_id, TRUE),
    ('Fish Bowl', 13.99, bowls_id, TRUE),
    ('French Fries', 4.99, sides_id, TRUE),
    ('Onion Rings', 5.99, sides_id, TRUE),
    ('Side Salad', 3.99, sides_id, TRUE),
    ('Soda', 2.99, drinks_id, TRUE),
    ('Water', 1.99, drinks_id, TRUE),
    ('Juice', 3.49, drinks_id, TRUE),
    ('Ice Cream', 4.99, desserts_id, TRUE),
    ('Cookie', 2.99, desserts_id, TRUE);
END $$;

-- Insert sample modifiers for bowls
DO $$
DECLARE
    chicken_bowl_id UUID;
    beef_bowl_id UUID;
    veggie_bowl_id UUID;
    fish_bowl_id UUID;
    protein_modifier_id UUID;
    sauce_modifier_id UUID;
    toppings_modifier_id UUID;
BEGIN
    SELECT id INTO chicken_bowl_id FROM menu_items WHERE name = 'Chicken Bowl';
    SELECT id INTO beef_bowl_id FROM menu_items WHERE name = 'Beef Bowl';
    SELECT id INTO veggie_bowl_id FROM menu_items WHERE name = 'Veggie Bowl';
    SELECT id INTO fish_bowl_id FROM menu_items WHERE name = 'Fish Bowl';

    -- Add protein modifier for bowls
    INSERT INTO modifiers (menu_item_id, name, max_selections, required) VALUES
    (chicken_bowl_id, 'Protein', 1, TRUE),
    (beef_bowl_id, 'Protein', 1, TRUE),
    (veggie_bowl_id, 'Protein', 1, TRUE),
    (fish_bowl_id, 'Protein', 1, TRUE);

    -- Add sauce modifier for bowls
    INSERT INTO modifiers (menu_item_id, name, max_selections, required) VALUES
    (chicken_bowl_id, 'Sauce', 2, FALSE),
    (beef_bowl_id, 'Sauce', 2, FALSE),
    (veggie_bowl_id, 'Sauce', 2, FALSE),
    (fish_bowl_id, 'Sauce', 2, FALSE);

    -- Add toppings modifier for bowls
    INSERT INTO modifiers (menu_item_id, name, max_selections, required) VALUES
    (chicken_bowl_id, 'Toppings', 3, FALSE),
    (beef_bowl_id, 'Toppings', 3, FALSE),
    (veggie_bowl_id, 'Toppings', 3, FALSE),
    (fish_bowl_id, 'Toppings', 3, FALSE);

    -- Add modifier options for protein
    INSERT INTO modifier_options (modifier_id, name, price) 
    SELECT m.id, 'Grilled Chicken', 0.00 FROM modifiers m 
    JOIN menu_items mi ON m.menu_item_id = mi.id 
    WHERE m.name = 'Protein' AND mi.name = 'Chicken Bowl';

    INSERT INTO modifier_options (modifier_id, name, price) 
    SELECT m.id, 'Beef', 0.00 FROM modifiers m 
    JOIN menu_items mi ON m.menu_item_id = mi.id 
    WHERE m.name = 'Protein' AND mi.name = 'Beef Bowl';

    INSERT INTO modifier_options (modifier_id, name, price) 
    SELECT m.id, 'Tofu', 0.00 FROM modifiers m 
    JOIN menu_items mi ON m.menu_item_id = mi.id 
    WHERE m.name = 'Protein' AND mi.name = 'Veggie Bowl';

    INSERT INTO modifier_options (modifier_id, name, price) 
    SELECT m.id, 'Salmon', 0.00 FROM modifiers m 
    JOIN menu_items mi ON m.menu_item_id = mi.id 
    WHERE m.name = 'Protein' AND mi.name = 'Fish Bowl';

    -- Add sauce options
    INSERT INTO modifier_options (modifier_id, name, price) 
    SELECT m.id, option.name, option.price FROM modifiers m 
    CROSS JOIN (VALUES 
        ('Teriyaki', 0.00),
        ('Spicy Mayo', 0.50),
        ('Sriracha', 0.00),
        ('Ranch', 0.50)
    ) AS option(name, price)
    WHERE m.name = 'Sauce';

    -- Add topping options
    INSERT INTO modifier_options (modifier_id, name, price) 
    SELECT m.id, option.name, option.price FROM modifiers m 
    CROSS JOIN (VALUES 
        ('Lettuce', 0.00),
        ('Tomatoes', 0.00),
        ('Onions', 0.00),
        ('Cheese', 1.00),
        ('Avocado', 1.50),
        ('Bacon', 2.00)
    ) AS option(name, price)
    WHERE m.name = 'Toppings';
END $$;
