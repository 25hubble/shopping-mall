// ===== 공통 상태 =====
// 토큰과 사용자 정보는 localStorage에 저장해 새로고침해도 로그인 유지
let token = localStorage.getItem("token") || null;
let user = JSON.parse(localStorage.getItem("user") || "null");

const STATUS_LABEL = {
  pending: "결제대기",
  paid: "결제완료",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "취소됨",
};

// ===== API 호출 헬퍼 =====
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "요청 실패");
  }
  return data;
}

// ===== 토스트 알림 =====
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2000);
}

// ===== 로그인 영역 렌더 =====
function renderAuthArea() {
  const area = document.getElementById("auth-area");
  if (user) {
    area.innerHTML = `<span>👤 ${user.name}님</span>
      <button class="ghost" id="logout-btn">로그아웃</button>`;
    document.getElementById("logout-btn").onclick = logout;
  } else {
    area.innerHTML = `<button class="primary" id="login-open">로그인 / 회원가입</button>`;
    document.getElementById("login-open").onclick = openModal;
  }
}

function logout() {
  token = null;
  user = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  renderAuthArea();
  document.getElementById("cart-count").textContent = "0";
  toast("로그아웃되었습니다.");
  switchTab("products");
}

// ===== 상품 목록 =====
async function loadProducts() {
  const list = document.getElementById("product-list");
  try {
    const products = await api("/products");
    if (products.length === 0) {
      list.innerHTML = `<p class="empty">등록된 상품이 없습니다.</p>`;
      return;
    }
    list.innerHTML = products
      .map(
        (p) => `
      <div class="card">
        <span class="category">${p.category}</span>
        <span class="name">${p.name}</span>
        <span class="desc">${p.description || ""}</span>
        <span class="price">${p.price.toLocaleString()}원</span>
        <span class="stock">재고 ${p.stock}개</span>
        <button class="primary" data-id="${p._id}" ${p.stock === 0 ? "disabled" : ""}>
          ${p.stock === 0 ? "품절" : "장바구니 담기"}
        </button>
      </div>`
      )
      .join("");

    // 담기 버튼 이벤트
    list.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.onclick = () => addToCart(btn.dataset.id);
    });
  } catch (err) {
    list.innerHTML = `<p class="empty">상품을 불러오지 못했습니다: ${err.message}</p>`;
  }
}

// ===== 장바구니 =====
async function addToCart(productId) {
  if (!user) {
    toast("로그인이 필요합니다.");
    openModal();
    return;
  }
  try {
    await api("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    toast("장바구니에 담았습니다.");
    loadCart();
  } catch (err) {
    toast(err.message);
  }
}

async function loadCart() {
  const box = document.getElementById("cart-items");
  const footer = document.getElementById("cart-footer");
  if (!user) {
    box.innerHTML = `<p class="empty">로그인 후 이용할 수 있습니다.</p>`;
    footer.classList.add("hidden");
    return;
  }
  try {
    const cart = await api("/cart");
    const items = cart.items || [];
    document.getElementById("cart-count").textContent = items.length;

    if (items.length === 0) {
      box.innerHTML = `<p class="empty">장바구니가 비어 있습니다.</p>`;
      footer.classList.add("hidden");
      return;
    }

    let total = 0;
    box.innerHTML = items
      .map((item) => {
        const p = item.product;
        total += p.price * item.quantity;
        return `
        <div class="line-item">
          <div>
            <strong>${p.name}</strong><br />
            <small>${p.price.toLocaleString()}원 × ${item.quantity}개</small>
          </div>
          <button class="ghost" data-remove="${p._id}">삭제</button>
        </div>`;
      })
      .join("");

    document.getElementById("cart-total").textContent = total.toLocaleString();
    footer.classList.remove("hidden");

    box.querySelectorAll("button[data-remove]").forEach((btn) => {
      btn.onclick = () => removeFromCart(btn.dataset.remove);
    });
  } catch (err) {
    box.innerHTML = `<p class="empty">${err.message}</p>`;
  }
}

async function removeFromCart(productId) {
  try {
    await api(`/cart/${productId}`, { method: "DELETE" });
    toast("삭제했습니다.");
    loadCart();
  } catch (err) {
    toast(err.message);
  }
}

async function checkout() {
  try {
    await api("/orders", { method: "POST" });
    toast("주문이 완료되었습니다! 🎉");
    loadCart();
    loadProducts(); // 재고 갱신
    switchTab("orders");
    loadOrders();
  } catch (err) {
    toast(err.message);
  }
}

// ===== 주문 내역 =====
async function loadOrders() {
  const box = document.getElementById("order-list");
  if (!user) {
    box.innerHTML = `<p class="empty">로그인 후 이용할 수 있습니다.</p>`;
    return;
  }
  try {
    const orders = await api("/orders");
    if (orders.length === 0) {
      box.innerHTML = `<p class="empty">주문 내역이 없습니다.</p>`;
      return;
    }
    box.innerHTML = orders
      .map((o) => {
        const date = new Date(o.createdAt).toLocaleString("ko-KR");
        const itemsText = o.items
          .map((i) => `${i.name} × ${i.quantity}`)
          .join(", ");
        const options = Object.keys(STATUS_LABEL)
          .map(
            (s) =>
              `<option value="${s}" ${s === o.status ? "selected" : ""}>${STATUS_LABEL[s]}</option>`
          )
          .join("");
        return `
        <div class="order">
          <div class="order-head">
            <span>${date}</span>
            <span class="badge ${o.status}">${STATUS_LABEL[o.status]}</span>
          </div>
          <div>${itemsText}</div>
          <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
            <strong>${o.totalPrice.toLocaleString()}원</strong>
            <select data-order="${o._id}">${options}</select>
          </div>
        </div>`;
      })
      .join("");

    box.querySelectorAll("select[data-order]").forEach((sel) => {
      sel.onchange = () => updateOrderStatus(sel.dataset.order, sel.value);
    });
  } catch (err) {
    box.innerHTML = `<p class="empty">${err.message}</p>`;
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await api(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    toast("주문 상태를 변경했습니다.");
    loadOrders();
  } catch (err) {
    toast(err.message);
    loadOrders();
  }
}

// ===== 탭 전환 =====
function switchTab(name) {
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `tab-${name}`);
  });
  if (name === "cart") loadCart();
  if (name === "orders") loadOrders();
  if (name === "products") loadProducts();
}

// ===== 로그인 모달 =====
function openModal() {
  document.getElementById("auth-modal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("auth-modal").classList.add("hidden");
}

function switchAuthForm(form) {
  document.querySelectorAll(".modal-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.form === form);
  });
  document.querySelectorAll(".auth-form").forEach((f) => {
    f.classList.toggle("active", f.id === `${form}-form`);
  });
}

function saveAuth(data) {
  token = data.token;
  user = { _id: data._id, name: data.name, email: data.email };
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  renderAuthArea();
  closeModal();
  loadCart();
}

// ===== 초기화 (이벤트 연결) =====
function init() {
  renderAuthArea();
  loadProducts();
  loadCart();

  // 탭
  document.querySelectorAll(".tab").forEach((t) => {
    t.onclick = () => switchTab(t.dataset.tab);
  });

  // 모달
  document.getElementById("modal-close").onclick = closeModal;
  document.querySelectorAll(".modal-tab").forEach((t) => {
    t.onclick = () => switchAuthForm(t.dataset.form);
  });

  // 주문 버튼
  document.getElementById("checkout-btn").onclick = checkout;

  // 로그인 폼
  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: f.email.value,
          password: f.password.value,
        }),
      });
      saveAuth(data);
      toast(`${data.name}님, 환영합니다!`);
    } catch (err) {
      toast(err.message);
    }
  };

  // 회원가입 폼
  document.getElementById("register-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: f.name.value,
          email: f.email.value,
          password: f.password.value,
        }),
      });
      saveAuth(data);
      toast("회원가입 완료!");
    } catch (err) {
      toast(err.message);
    }
  };
}

init();
