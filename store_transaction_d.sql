
CREATE DATABASE IF NOT EXISTS store_transaction_db;
USE store_transaction_db;


CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100),
    balance DECIMAL(12,2)
);


CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(150),
    price DECIMAL(12,2),
    stock INT
);


CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    total_amount DECIMAL(12,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);


CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    quantity INT,
    price DECIMAL(12,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);


INSERT INTO customers (full_name, balance) VALUES ('Nguyen Van A', 5000.00);
INSERT INTO products (product_name, price, stock) VALUES ('MacBook Pro M3', 1500.00, 10);
