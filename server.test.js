import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

let api;
let apiProcess;
let temporaryDirectory;
let port;

async function unusedPort() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const { port: availablePort } = probe.address();
  await new Promise((resolve, reject) =>
    probe.close((error) => (error ? reject(error) : resolve())),
  );
  return availablePort;
}

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}

before(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "yuka-store-test-"));
  port = await unusedPort();
  api = `http://127.0.0.1:${port}/api`;
  apiProcess = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_PORT: String(port),
      STORE_DB_PATH: join(temporaryDirectory, "store.json"),
    },
    stdio: "ignore",
  });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null) {
      throw new Error(`Test API exited with code ${apiProcess.exitCode}.`);
    }
    try {
      const health = await fetch(`${api}/health`);
      if (health.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Test API did not become ready.");
});

after(async () => {
  if (apiProcess && apiProcess.exitCode === null) {
    const exited = once(apiProcess, "exit");
    apiProcess.kill();
    await exited;
  }
  if (temporaryDirectory) {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("admin authorization, inventory, and buyer order flow", async () => {
  const adminLogin = await request("/auth/login", {
    method: "POST",
    body: { username: "admin", password: "admin123" },
  });
  const buyerLogin = await request("/auth/login", {
    method: "POST",
    body: { username: "Andika", password: "yuka99" },
  });
  assert.equal(adminLogin.status, 200);
  assert.equal(buyerLogin.status, 200);

  const publicCoupons = await request("/coupons", {
    token: buyerLogin.data.token,
  });
  assert.equal(publicCoupons.status, 200);
  assert.ok(publicCoupons.data.some((coupon) => coupon.code === "YUKA10"));

  const forbiddenDashboard = await request("/admin/summary", {
    token: buyerLogin.data.token,
  });
  assert.equal(forbiddenDashboard.status, 403);

  const forbiddenMutation = await request("/products", {
    method: "POST",
    token: buyerLogin.data.token,
    body: {
      title: "Not allowed",
      description: "Customer must not manage the catalog.",
      category: "Tas",
      price: 10000,
      stock: 1,
      image: "https://example.com/product.jpg",
    },
  });
  assert.equal(forbiddenMutation.status, 403);

  const productResult = await request("/products", {
    method: "POST",
    token: adminLogin.data.token,
    body: {
      title: "Produk Uji",
      description: "Produk untuk pengujian inventaris.",
      category: "Tas",
      price: 100000,
      stock: 2,
      image: "https://example.com/product.jpg",
    },
  });
  assert.equal(productResult.status, 201);

  const orderResult = await request("/orders", {
    method: "POST",
    token: buyerLogin.data.token,
    body: {
      items: [{ productId: productResult.data.id, quantity: 2 }],
      couponCode: "YUKA10",
      address: "Jalan Uji 1, Yogyakarta",
    },
  });
  assert.equal(orderResult.status, 201);
  assert.equal(orderResult.data.total, 180000);

  const outOfStock = await request("/orders", {
    method: "POST",
    token: buyerLogin.data.token,
    body: {
      items: [{ productId: productResult.data.id, quantity: 1 }],
      address: "Jalan Uji 1, Yogyakarta",
    },
  });
  assert.equal(outOfStock.status, 409);

  const payment = await request(`/orders/${orderResult.data.id}/pay`, {
    method: "POST",
    token: buyerLogin.data.token,
  });
  assert.equal(payment.data.paymentStatus, "Menunggu verifikasi");

  const verification = await request(`/orders/${orderResult.data.id}/verify`, {
    method: "POST",
    token: adminLogin.data.token,
  });
  assert.equal(verification.data.paymentStatus, "Terverifikasi");
});
