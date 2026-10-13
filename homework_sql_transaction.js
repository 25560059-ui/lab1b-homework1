const mysql = require("mysql2/promise");

async function processOrder() {
  // Cấu hình thông tin kết nối đúng với FreeDB của bạn
  const conn = await mysql.createConnection({
    host: "sql.freedb.tech", // Host FreeDB của bạn
    user: "u_ugOVhI", // Username của bạn
    password: "wwkJVUc88fB5", // Thay mật khẩu FreeDB của bạn vào đây
    database: "freedb_BTnWU4CX", // Tên Database thực tế trên Workbench
    port: 3306,
  });

  // Dữ liệu giả định cho đơn hàng: Khách hàng ID=1 mua 2 cái Sản phẩm ID=1
  const customerId = 1;
  const productId = 1;
  const orderQuantity = 2;

  try {
    console.log("🚀 Bắt đầu Transaction...");
    await conn.beginTransaction();

    // Lấy thông tin giá sản phẩm & số lượng tồn kho
    const [productRows] = await conn.execute(
      "SELECT price, stock FROM products WHERE id = ?",
      [productId],
    );
    if (productRows.length === 0) throw new Error("Sản phẩm không tồn tại!");

    const productPrice = parseFloat(productRows[0].price);
    const currentStock = productRows[0].stock;
    const orderTotal = productPrice * orderQuantity;

    // Lấy thông tin số dư của khách hàng
    const [customerRows] = await conn.execute(
      "SELECT balance FROM customers WHERE id = ?",
      [customerId],
    );
    if (customerRows.length === 0) throw new Error("Khách hàng không tồn tại!");
    const currentBalance = parseFloat(customerRows[0].balance);

    // BƯỚC 1: Kiểm tra số dư >= Tổng tiền VÀ Tồn kho >= Số lượng mua
    console.log(
      `[Bước 1] Kiểm tra: Số dư (${currentBalance}) >= Tổng tiền (${orderTotal}) AND Tồn kho (${currentStock}) >= Mua (${orderQuantity})`,
    );
    if (currentBalance < orderTotal) {
      throw new Error("Số dư khách hàng không đủ để thanh toán!");
    }
    if (currentStock < orderQuantity) {
      throw new Error("Sản phẩm không đủ số lượng tồn kho!");
    }

    // BƯỚC 2: Trừ tiền khách hàng
    console.log("[Bước 2] Trừ tiền khách hàng (UPDATE balance)...");
    await conn.execute(
      "UPDATE customers SET balance = balance - ? WHERE id = ?",
      [orderTotal, customerId],
    );

    // BƯỚC 3: Trừ số lượng tồn kho sản phẩm
    console.log("[Bước 3] Trừ tồn kho sản phẩm (UPDATE stock)...");
    await conn.execute("UPDATE products SET stock = stock - ? WHERE id = ?", [
      orderQuantity,
      productId,
    ]);

    // BƯỚC 4: Tạo đơn hàng mới trong bảng orders
    console.log("[Bước 4] Tạo đơn hàng mới (INSERT INTO orders)...");
    const [orderResult] = await conn.execute(
      "INSERT INTO orders (customer_id, total_amount, created_at) VALUES (?, ?, NOW())",
      [customerId, orderTotal],
    );
    const newOrderId = orderResult.insertId;

    // BƯỚC 5: Tạo chi tiết đơn hàng trong bảng order_items
    console.log("[Bước 5] Tạo chi tiết đơn hàng (INSERT INTO order_items)...");
    await conn.execute(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
      [newOrderId, productId, orderQuantity, productPrice],
    );

    // NẾU TẤT CẢ THÀNH CÔNG -> COMMIT
    await conn.commit();
    console.log(
      "✅ GIAO DỊCH THÀNH CÔNG! Dữ liệu đã được Commit vào Database.",
    );
  } catch (error) {
    // NẾU CÓ BẤT KỲ LỖI NÀO -> ROLLBACK DỮ LIỆU
    await conn.rollback();
    console.error("❌ GIAO DỊCH THẤT BẠI! Đã Rollback toàn bộ dữ liệu.");
    console.error("Lý do lỗi:", error.message);
  } finally {
    await conn.end();
  }
}

processOrder();
