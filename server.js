import { createServer } from "node:http";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_PRODUCTS } from "./src/data/demoProducts.js";

const root = dirname(fileURLToPath(import.meta.url));
const databasePath = join(root, ".data", "store.json");
const configuredDatabasePath = process.env.STORE_DB_PATH;
const activeDatabasePath = configuredDatabasePath || databasePath;
const port = Number(process.env.API_PORT || 3001);
const sessions = new Map();
const orderStatuses = [
  "Menunggu pembayaran",
  "Menunggu verifikasi",
  "Dikemas",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];
let database;
let saveQueue = Promise.resolve();

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: scryptSync(password, salt, 64).toString("hex"),
  };
}

function makeUser({ username, password, email, name, role = "customer" }) {
  return {
    id: randomBytes(12).toString("hex"),
    username,
    email,
    name,
    role,
    ...hashPassword(password),
    createdAt: new Date().toISOString(),
  };
}

async function loadDatabase() {
  try {
    database = JSON.parse(await readFile(activeDatabasePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    database = {
      products: DEMO_PRODUCTS.map((product) => ({
        ...product,
        stock: 10,
        isDemo: true,
      })),
      users: [
        makeUser({
          username: "admin",
          password: "admin123",
          email: "admin@yuka.local",
          name: "Admin Yuka",
          role: "admin",
        }),
        makeUser({
          username: "Andika",
          password: "yuka99",
          email: "andika@gmail.com",
          name: "Andika",
        }),
      ],
      orders: [],
      coupons: [
        {
          id: randomBytes(8).toString("hex"),
          code: "YUKA10",
          discountType: "percent",
          discountValue: 10,
          active: true,
          maxUses: 100,
          usedCount: 0,
        },
      ],
      reviews: [],
    };
    await persistDatabase();
  }
}

function persistDatabase() {
  const write = saveQueue.then(async () => {
    await mkdir(dirname(activeDatabasePath), { recursive: true });
    const temporaryPath = `${activeDatabasePath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(database, null, 2), "utf8");
    await rename(temporaryPath, activeDatabasePath);
  });
  saveQueue = write.catch(() => {});
  return write;
}

function send(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      const error = new Error("Ukuran data terlalu besar.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Format JSON tidak valid.");
    error.status = 400;
    throw error;
  }
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function requireUser(request, role) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  const userId = token && sessions.get(token);
  const user = database.users.find((item) => item.id === userId);
  if (!user) {
    const error = new Error("Silakan masuk dengan akun yang sesuai.");
    error.status = 401;
    throw error;
  }
  if (role === "admin" && user.role !== "admin") {
    const error = new Error("Akses ini hanya tersedia untuk admin.");
    error.status = 403;
    throw error;
  }
  return user;
}

function requiredText(value, label, maxLength = 180) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    const error = new Error(`${label} wajib diisi (maksimal ${maxLength} karakter).`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function validPrice(value, label, allowZero = false) {
  if (!Number.isFinite(value) || value < (allowZero ? 0 : 1)) {
    const error = new Error(`${label} tidak valid.`);
    error.status = 400;
    throw error;
  }
  return value;
}

function validInteger(value, label, allowZero = false) {
  if (!Number.isInteger(value) || value < (allowZero ? 0 : 1)) {
    const error = new Error(`${label} harus berupa bilangan bulat yang valid.`);
    error.status = 400;
    throw error;
  }
  return value;
}

function productRating(productId) {
  const approved = database.reviews.filter(
    (review) => review.productId === productId && review.approved,
  );
  return {
    rate: approved.length
      ? Number(
          (
            approved.reduce((sum, review) => sum + review.rating, 0) /
            approved.length
          ).toFixed(1),
        )
      : 0,
    count: approved.length,
  };
}

function productWithRating(product) {
  const rating = productRating(product.id);
  return {
    ...product,
    rating: rating.count > 0 ? rating : product.rating || rating,
  };
}

async function handler(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname;
  const method = request.method;

  if (path === "/api/health" && method === "GET") {
    return send(response, 200, { status: "ok" });
  }

  if (path === "/api/auth/login" && method === "POST") {
    const body = await readJson(request);
    const user = database.users.find(
      (item) => item.username.toLowerCase() === String(body.username || "").toLowerCase(),
    );
    if (!user) throw Object.assign(new Error("Username atau password salah."), { status: 401 });
    const candidate = scryptSync(String(body.password || ""), user.salt, 64);
    if (!timingSafeEqual(candidate, Buffer.from(user.hash, "hex"))) {
      throw Object.assign(new Error("Username atau password salah."), { status: 401 });
    }
    const token = randomBytes(32).toString("hex");
    sessions.set(token, user.id);
    return send(response, 200, { token, user: publicUser(user) });
  }

  if (path === "/api/auth/register" && method === "POST") {
    const body = await readJson(request);
    const username = requiredText(body.username, "Username", 40);
    const email = requiredText(body.email, "Email", 180);
    const password = requiredText(body.password, "Password", 128);
    if (password.length < 6) {
      throw Object.assign(new Error("Password minimal 6 karakter."), { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw Object.assign(new Error("Format email tidak valid."), { status: 400 });
    }
    if (database.users.some(
      (item) =>
        item.username.toLowerCase() === username.toLowerCase() ||
        item.email.toLowerCase() === email.toLowerCase(),
    )) {
      throw Object.assign(new Error("Username atau email sudah terdaftar."), { status: 409 });
    }
    const user = makeUser({
      username,
      email,
      password,
      name: requiredText(body.name || username, "Nama", 100),
    });
    database.users.push(user);
    await persistDatabase();
    return send(response, 201, { user: publicUser(user) });
  }

  if (path === "/api/auth/me" && method === "GET") {
    return send(response, 200, { user: publicUser(requireUser(request)) });
  }

  if (path === "/api/auth/logout" && method === "POST") {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (token) sessions.delete(token);
    return send(response, 200, { ok: true });
  }

  if (path === "/api/products" && method === "GET") {
    return send(response, 200, database.products.map(productWithRating));
  }

  if (path === "/api/products" && method === "POST") {
    requireUser(request, "admin");
    const body = await readJson(request);
    const product = {
      id: randomBytes(12).toString("hex"),
      title: requiredText(body.title, "Nama produk"),
      description: requiredText(body.description, "Deskripsi", 2000),
      category: requiredText(body.category, "Kategori", 80),
      price: validPrice(Number(body.price), "Harga"),
      stock: validInteger(Number(body.stock), "Stok", true),
      image: requiredText(body.image, "URL gambar", 1000),
      isDemo: true,
    };
    database.products.unshift(product);
    await persistDatabase();
    return send(response, 201, productWithRating(product));
  }

  const productMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch) {
    const id = decodeURIComponent(productMatch[1]);
    if (method === "GET") {
      const product = database.products.find((item) => item.id === id);
      if (!product) throw Object.assign(new Error("Produk tidak ditemukan."), { status: 404 });
      return send(response, 200, productWithRating(product));
    }
    requireUser(request, "admin");
    if (method === "PUT") {
      const product = database.products.find((item) => item.id === id);
      if (!product) throw Object.assign(new Error("Produk tidak ditemukan."), { status: 404 });
      const body = await readJson(request);
      product.title = requiredText(body.title, "Nama produk");
      product.description = requiredText(body.description, "Deskripsi", 2000);
      product.category = requiredText(body.category, "Kategori", 80);
      product.price = validPrice(Number(body.price), "Harga");
      product.stock = validInteger(Number(body.stock), "Stok", true);
      product.image = requiredText(body.image, "URL gambar", 1000);
      await persistDatabase();
      return send(response, 200, productWithRating(product));
    }
    if (method === "DELETE") {
      const index = database.products.findIndex((item) => item.id === id);
      if (index < 0) throw Object.assign(new Error("Produk tidak ditemukan."), { status: 404 });
      database.products.splice(index, 1);
      await persistDatabase();
      return send(response, 200, { ok: true });
    }
  }

  const reviewsMatch = path.match(/^\/api\/products\/([^/]+)\/reviews$/);
  if (reviewsMatch && method === "GET") {
    const productId = decodeURIComponent(reviewsMatch[1]);
    return send(
      response,
      200,
      database.reviews.filter((review) => review.productId === productId && review.approved),
    );
  }

  if (path === "/api/reviews" && method === "POST") {
    const user = requireUser(request);
    if (user.role !== "customer") {
      throw Object.assign(new Error("Akun admin tidak dapat mengirim ulasan."), { status: 403 });
    }
    const body = await readJson(request);
    const product = database.products.find((item) => item.id === body.productId);
    if (!product) throw Object.assign(new Error("Produk tidak ditemukan."), { status: 404 });
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw Object.assign(new Error("Rating harus antara 1 sampai 5."), { status: 400 });
    }
    if (database.reviews.some(
      (review) => review.productId === product.id && review.userId === user.id,
    )) {
      throw Object.assign(new Error("Kamu sudah mengirim ulasan untuk produk ini."), { status: 409 });
    }
    const review = {
      id: randomBytes(12).toString("hex"),
      productId: product.id,
      productTitle: product.title,
      userId: user.id,
      username: user.username,
      rating,
      comment: requiredText(body.comment, "Ulasan", 1000),
      approved: false,
      createdAt: new Date().toISOString(),
    };
    database.reviews.unshift(review);
    await persistDatabase();
    return send(response, 201, review);
  }

  if (path === "/api/coupons" && method === "GET") {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    const userId = token && sessions.get(token);
    const user = database.users.find((item) => item.id === userId);
    const coupons = user?.role === "admin"
      ? database.coupons
      : database.coupons.filter(
          (coupon) => coupon.active && coupon.usedCount < coupon.maxUses,
        );
    return send(response, 200, coupons);
  }

  if (path === "/api/orders" && method === "GET") {
    const user = requireUser(request);
    const orders = user.role === "admin"
      ? database.orders
      : database.orders.filter((order) => order.userId === user.id);
    return send(response, 200, orders);
  }

  if (path === "/api/orders" && method === "POST") {
    const user = requireUser(request);
    if (user.role !== "customer") {
      throw Object.assign(new Error("Akun admin tidak dapat melakukan checkout."), { status: 403 });
    }
    const body = await readJson(request);
    if (!Array.isArray(body.items) || !body.items.length) {
      throw Object.assign(new Error("Keranjang masih kosong."), { status: 400 });
    }
    const address = requiredText(body.address, "Alamat pengiriman", 300);
    const requestedItems = new Map();
    for (const entry of body.items) {
      const productId = String(entry.productId || "");
      const quantity = Number(entry.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw Object.assign(new Error("Produk atau jumlah barang tidak valid."), { status: 400 });
      }
      requestedItems.set(productId, (requestedItems.get(productId) || 0) + quantity);
    }
    const items = [...requestedItems].map(([productId, quantity]) => {
      const product = database.products.find((item) => item.id === productId);
      if (!product) {
        throw Object.assign(new Error("Produk atau jumlah barang tidak valid."), { status: 400 });
      }
      if (product.stock < quantity) {
        throw Object.assign(new Error(`Stok ${product.title} tidak mencukupi.`), { status: 409 });
      }
      return {
        productId: product.id,
        title: product.title,
        image: product.image,
        price: product.price,
        quantity,
      };
    });
    let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let couponCode = "";
    let discount = 0;
    if (body.couponCode) {
      couponCode = String(body.couponCode).trim().toUpperCase();
      const coupon = database.coupons.find(
        (item) =>
          item.code === couponCode &&
          item.active &&
          item.usedCount < item.maxUses,
      );
      if (!coupon) {
        throw Object.assign(new Error("Kupon tidak valid atau sudah habis."), { status: 400 });
      }
      discount = coupon.discountType === "percent"
        ? Math.floor((subtotal * coupon.discountValue) / 100)
        : Math.min(subtotal, coupon.discountValue);
      coupon.usedCount += 1;
    }
    for (const item of items) {
      const product = database.products.find((entry) => entry.id === item.productId);
      product.stock -= item.quantity;
    }
    const order = {
      id: `YS-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`,
      userId: user.id,
      customerName: user.name,
      items,
      subtotal,
      discount,
      total: subtotal - discount,
      couponCode,
      status: "Menunggu pembayaran",
      paymentStatus: "Belum dibayar",
      shippingNumber: "",
      createdAt: new Date().toISOString(),
      address,
    };
    database.orders.unshift(order);
    await persistDatabase();
    return send(response, 201, order);
  }

  const orderMatch = path.match(/^\/api\/orders\/([^/]+)\/(pay|verify|status)$/);
  if (orderMatch) {
    const [, id, action] = orderMatch;
    const user = requireUser(request, action === "pay" ? undefined : "admin");
    const order = database.orders.find((item) => item.id === decodeURIComponent(id));
    if (!order) throw Object.assign(new Error("Pesanan tidak ditemukan."), { status: 404 });
    if (user.role !== "admin" && order.userId !== user.id) {
      throw Object.assign(new Error("Kamu tidak memiliki akses ke pesanan ini."), { status: 403 });
    }
    if (method === "POST" && action === "pay") {
      if (order.paymentStatus !== "Belum dibayar") {
        throw Object.assign(new Error("Pesanan ini sudah dikirim untuk pembayaran."), { status: 409 });
      }
      order.paymentStatus = "Menunggu verifikasi";
      order.status = "Menunggu verifikasi";
      order.paymentMethod = "Simulasi";
      await persistDatabase();
      return send(response, 200, order);
    }
    if (method === "POST" && action === "verify") {
      if (order.paymentStatus !== "Menunggu verifikasi") {
        throw Object.assign(new Error("Pesanan belum menunggu verifikasi pembayaran."), { status: 409 });
      }
      order.paymentStatus = "Terverifikasi";
      order.status = "Dikemas";
      await persistDatabase();
      return send(response, 200, order);
    }
    if (method === "PATCH" && action === "status") {
      const body = await readJson(request);
      if (!orderStatuses.includes(body.status)) {
        throw Object.assign(new Error("Status pesanan tidak valid."), { status: 400 });
      }
      const allowedNextStatuses = {
        "Menunggu pembayaran": ["Dibatalkan"],
        "Menunggu verifikasi": ["Dibatalkan"],
        Dikemas: ["Dikirim", "Dibatalkan"],
        Dikirim: ["Selesai"],
        Selesai: [],
        Dibatalkan: [],
      };
      if (!allowedNextStatuses[order.status]?.includes(body.status)) {
        throw Object.assign(new Error("Perubahan status pesanan tidak diizinkan."), { status: 409 });
      }
      if (body.status === "Dikirim" && !body.shippingNumber && !order.shippingNumber) {
        throw Object.assign(new Error("Isi nomor resi sebelum mengirim pesanan."), { status: 400 });
      }
      if (body.status === "Dibatalkan" && order.status !== "Dibatalkan") {
        for (const item of order.items) {
          const product = database.products.find((entry) => entry.id === item.productId);
          if (product) product.stock += item.quantity;
        }
      }
      order.status = body.status;
      order.shippingNumber = body.shippingNumber
        ? requiredText(body.shippingNumber, "Nomor resi", 80)
        : order.shippingNumber;
      await persistDatabase();
      return send(response, 200, order);
    }
  }

  if (path === "/api/admin/summary" && method === "GET") {
    requireUser(request, "admin");
    return send(response, 200, {
      productCount: database.products.length,
      lowStockCount: database.products.filter((product) => product.stock < 5).length,
      orderCount: database.orders.length,
      pendingPayments: database.orders.filter(
        (order) => order.paymentStatus === "Menunggu verifikasi",
      ).length,
      revenue: database.orders
        .filter((order) => order.paymentStatus === "Terverifikasi")
        .reduce((sum, order) => sum + order.total, 0),
      customerCount: database.users.filter((item) => item.role === "customer").length,
      reviewCount: database.reviews.filter((review) => !review.approved).length,
    });
  }

  if (path === "/api/admin/users" && method === "GET") {
    requireUser(request, "admin");
    return send(response, 200, database.users.filter((user) => user.role === "customer").map(publicUser));
  }

  const customerMatch = path.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (customerMatch && method === "GET") {
    requireUser(request, "admin");
    const user = database.users.find(
      (item) => item.id === decodeURIComponent(customerMatch[1]) && item.role === "customer",
    );
    if (!user) throw Object.assign(new Error("Pelanggan tidak ditemukan."), { status: 404 });
    return send(response, 200, publicUser(user));
  }

  if (path === "/api/admin/reviews" && method === "GET") {
    requireUser(request, "admin");
    return send(response, 200, database.reviews);
  }

  const reviewMatch = path.match(/^\/api\/admin\/reviews\/([^/]+)$/);
  if (reviewMatch && method === "PATCH") {
    requireUser(request, "admin");
    const review = database.reviews.find((item) => item.id === decodeURIComponent(reviewMatch[1]));
    if (!review) throw Object.assign(new Error("Ulasan tidak ditemukan."), { status: 404 });
    const body = await readJson(request);
    review.approved = Boolean(body.approved);
    await persistDatabase();
    return send(response, 200, review);
  }
  if (reviewMatch && method === "DELETE") {
    requireUser(request, "admin");
    const index = database.reviews.findIndex((item) => item.id === decodeURIComponent(reviewMatch[1]));
    if (index < 0) throw Object.assign(new Error("Ulasan tidak ditemukan."), { status: 404 });
    database.reviews.splice(index, 1);
    await persistDatabase();
    return send(response, 200, { ok: true });
  }

  const couponMatch = path.match(/^\/api\/admin\/coupons(?:\/([^/]+))?$/);
  if (couponMatch) {
    requireUser(request, "admin");
    const id = couponMatch[1] && decodeURIComponent(couponMatch[1]);
    if (method === "POST" && !id) {
      const body = await readJson(request);
      const code = requiredText(body.code, "Kode kupon", 30).toUpperCase();
      const discountType = body.discountType === "fixed" ? "fixed" : "percent";
      const discountValue = validPrice(Number(body.discountValue), "Nilai diskon");
      const maxUses = validInteger(Number(body.maxUses), "Batas penggunaan");
      if (discountType === "percent" && discountValue > 100) {
        throw Object.assign(new Error("Diskon persen maksimal 100%."), { status: 400 });
      }
      if (database.coupons.some((coupon) => coupon.code === code)) {
        throw Object.assign(new Error("Kode kupon sudah digunakan."), { status: 409 });
      }
      const coupon = {
        id: randomBytes(8).toString("hex"),
        code,
        discountType,
        discountValue,
        active: true,
        maxUses,
        usedCount: 0,
      };
      database.coupons.push(coupon);
      await persistDatabase();
      return send(response, 201, coupon);
    }
    const index = database.coupons.findIndex((coupon) => coupon.id === id);
    if (index < 0) throw Object.assign(new Error("Kupon tidak ditemukan."), { status: 404 });
    if (method === "PATCH") {
      const body = await readJson(request);
      database.coupons[index].active = Boolean(body.active);
      await persistDatabase();
      return send(response, 200, database.coupons[index]);
    }
    if (method === "DELETE") {
      database.coupons.splice(index, 1);
      await persistDatabase();
      return send(response, 200, { ok: true });
    }
  }

  return send(response, 404, { message: "Endpoint tidak ditemukan." });
}

await loadDatabase();
createServer((request, response) => {
  handler(request, response).catch((error) => {
    if (response.headersSent) {
      console.error("API response failed after headers were sent.", error);
      response.destroy(error);
      return;
    }
    if (!error.status) console.error("Unhandled API error.", error);
    send(response, error.status || 500, {
      message: error.status ? error.message : "Terjadi kesalahan pada server.",
    });
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Yuka-Store API berjalan di http://127.0.0.1:${port}`);
});
