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
    const adminMark = user.role === "admin" ? " (관리자)" : "";
    area.innerHTML = `<span>👤 ${user.name}님${adminMark}</span>
      <button class="ghost" id="logout-btn">로그아웃</button>`;
    document.getElementById("logout-btn").onclick = logout;
  } else {
    area.innerHTML = `<button class="primary" id="login-open">로그인 / 회원가입</button>`;
    document.getElementById("login-open").onclick = openModal;
  }
  // 관리자 탭은 admin 역할일 때만 표시
  const adminTab = document.getElementById("admin-tab");
  adminTab.classList.toggle("hidden", !(user && user.role === "admin"));
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
        <img class="product-img" src="${p.imageUrl || ""}" alt="${p.name}"
             onerror="this.style.visibility='hidden'" />
        <span class="category">${p.category}</span>
        <span class="name">${p.name}</span>
        <span class="desc">${p.description || ""}</span>
        <span class="price">${p.price.toLocaleString()}원</span>
        <span class="stock">재고 ${p.stock}개</span>
        ${
          p.stock === 0
            ? `<button class="primary" disabled>품절</button>`
            : `<div class="qty-row">
                 <input type="number" class="qty-input" data-qty="${p._id}"
                        value="1" min="1" max="${p.stock}" />
                 <button class="primary" data-id="${p._id}">담기</button>
               </div>`
        }
      </div>`
      )
      .join("");

    // 담기 버튼 이벤트: 입력한 수량만큼 담기
    list.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.onclick = () => {
        const input = list.querySelector(`input[data-qty="${btn.dataset.id}"]`);
        let qty = parseInt(input.value, 10);
        if (!qty || qty < 1) qty = 1;
        addToCart(btn.dataset.id, qty);
      };
    });
  } catch (err) {
    list.innerHTML = `<p class="empty">상품을 불러오지 못했습니다: ${err.message}</p>`;
  }
}

// ===== 장바구니 =====
async function addToCart(productId, quantity = 1) {
  if (!user) {
    toast("로그인이 필요합니다.");
    openModal();
    return;
  }
  try {
    await api("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
    toast(`장바구니에 ${quantity}개 담았습니다.`);
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
            <small>${p.price.toLocaleString()}원 · 합계 ${(p.price * item.quantity).toLocaleString()}원</small>
          </div>
          <div class="cart-qty">
            <input type="number" class="qty-input" data-cartqty="${p._id}"
                   value="${item.quantity}" min="1" max="${p.stock}" />
            <button class="ghost" data-remove="${p._id}">삭제</button>
          </div>
        </div>`;
      })
      .join("");

    document.getElementById("cart-total").textContent = total.toLocaleString();
    footer.classList.remove("hidden");

    box.querySelectorAll("button[data-remove]").forEach((btn) => {
      btn.onclick = () => removeFromCart(btn.dataset.remove);
    });
    // 수량 입력 변경 → 정확한 개수로 지정
    box.querySelectorAll("input[data-cartqty]").forEach((input) => {
      input.onchange = () => {
        let qty = parseInt(input.value, 10);
        if (!qty || qty < 1) qty = 1;
        updateCartQty(input.dataset.cartqty, qty);
      };
    });
  } catch (err) {
    box.innerHTML = `<p class="empty">${err.message}</p>`;
  }
}

// 장바구니 상품 수량을 정확한 개수로 지정
async function updateCartQty(productId, quantity) {
  try {
    await api(`/cart/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
    loadCart(); // 총액/표시 갱신
  } catch (err) {
    toast(err.message);
    loadCart();
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

// 주문하기 버튼 → 체크아웃(주문요약 + 배송지 + 결제) 모달 열기
async function openCheckout() {
  if (!user) {
    toast("로그인이 필요합니다.");
    openModal();
    return;
  }
  // 현재 장바구니를 불러와 주문 요약 표시
  const cart = await api("/cart").catch(() => null);
  const items = (cart && cart.items) || [];
  if (items.length === 0) {
    toast("장바구니가 비어 있습니다.");
    return;
  }

  let total = 0;
  document.getElementById("checkout-summary").innerHTML = items
    .map((it) => {
      const p = it.product;
      const lineTotal = p.price * it.quantity;
      total += lineTotal;
      return `<div class="sum-line"><span>${p.name} × ${it.quantity}</span><span>${lineTotal.toLocaleString()}원</span></div>`;
    })
    .join("");
  document.getElementById("checkout-total").textContent =
    total.toLocaleString() + "원";

  const btn = document.getElementById("pay-submit");
  btn.textContent = `${total.toLocaleString()}원 결제하기`;

  // 받는 사람 기본값을 로그인한 이름으로 채워줌
  const form = document.getElementById("checkout-form");
  if (user && !form.recipient.value) form.recipient.value = user.name;

  toggleCardFields();
  document.getElementById("checkout-modal").classList.remove("hidden");
}

// 결제 수단에 따라 카드 입력란 표시/숨김
function toggleCardFields() {
  const method = document.querySelector('input[name="payment"]:checked').value;
  document
    .getElementById("card-fields")
    .classList.toggle("hidden", method !== "card");
}

// 장바구니 전체를 주문 1건으로 만들고 곧바로 결제까지 처리하는 통합 흐름
async function placeOrderAndPay(shippingInfo, paymentMethod) {
  const btn = document.getElementById("pay-submit");
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "결제 처리 중...";
  try {
    // 1) 주문 생성 (장바구니의 모든 상품 → 주문 1건)
    const order = await api("/orders", {
      method: "POST",
      body: JSON.stringify({ shippingInfo }),
    });
    // 2) 곧바로 결제 처리 (모의 결제)
    await api(`/orders/${order._id}/pay`, {
      method: "POST",
      body: JSON.stringify({ paymentMethod }),
    });

    document.getElementById("checkout-modal").classList.add("hidden");
    document.getElementById("checkout-form").reset();
    toast("결제가 완료되어 주문이 접수되었습니다! 🎉");
    loadCart();
    loadProducts(); // 재고 갱신
    switchTab("orders");
    loadOrders();
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = label;
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
        // 결제 대기 상태면 결제 버튼, 아니면 상태 변경 드롭다운
        const action =
          o.status === "pending"
            ? `<button class="pay-btn" data-pay="${o._id}">결제하기</button>`
            : `<select data-order="${o._id}">${options}</select>`;
        return `
        <div class="order">
          <div class="order-head">
            <span>${date}</span>
            <span class="badge ${o.status}">${STATUS_LABEL[o.status]}</span>
          </div>
          <div>${itemsText}</div>
          <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
            <strong>${o.totalPrice.toLocaleString()}원</strong>
            ${action}
          </div>
        </div>`;
      })
      .join("");

    box.querySelectorAll("select[data-order]").forEach((sel) => {
      sel.onchange = () => updateOrderStatus(sel.dataset.order, sel.value);
    });
    box.querySelectorAll("button[data-pay]").forEach((btn) => {
      btn.onclick = () => payOrder(btn.dataset.pay);
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
    // 현재 보고 있는 탭을 새로고침
    if (document.getElementById("tab-admin").classList.contains("active")) {
      loadAdminOrders();
    } else {
      loadOrders();
    }
  } catch (err) {
    toast(err.message);
  }
}

// 결제하기 (모의 결제)
async function payOrder(orderId) {
  try {
    await api(`/orders/${orderId}/pay`, {
      method: "POST",
      body: JSON.stringify({ paymentMethod: "card" }),
    });
    toast("결제가 완료되었습니다! 💳");
    loadOrders();
  } catch (err) {
    toast(err.message);
  }
}

// ===== 관리자: 전체 주문 처리 =====
async function loadAdminOrders() {
  const box = document.getElementById("admin-list");
  try {
    const orders = await api("/orders/all");
    if (orders.length === 0) {
      box.innerHTML = `<p class="empty">주문이 없습니다.</p>`;
      return;
    }

    // 유저별로 주문을 묶는다
    const groups = {};
    orders.forEach((o) => {
      const key = o.user ? o.user._id : "unknown";
      if (!groups[key]) {
        groups[key] = {
          name: o.user ? o.user.name : "(탈퇴/알수없음)",
          email: o.user ? o.user.email : "",
          orders: [],
        };
      }
      groups[key].orders.push(o);
    });

    box.innerHTML = Object.values(groups)
      .map((g) => {
        const orderHtml = g.orders
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
            // 배송지(고객) 정보
            const s = o.shippingInfo || {};
            const shipping = s.recipient
              ? `<div class="ship-info">
                   📦 <strong>${s.recipient}</strong> · ${s.phone || "-"}<br />
                   ${s.address || "-"}${s.memo ? ` <span class="memo">(${s.memo})</span>` : ""}
                 </div>`
              : `<div class="ship-info no-info">배송지 정보 없음 (이전 주문)</div>`;
            // 결제완료(paid) 상태면 "배송 시작" 버튼 강조
            const shipBtn =
              o.status === "paid"
                ? `<button class="pay-btn" data-ship="${o._id}">📦 배송 시작</button>`
                : "";
            return `
            <div class="order">
              <div class="order-head">
                <span>${date}</span>
                <span class="badge ${o.status}">${STATUS_LABEL[o.status]}</span>
              </div>
              <div>${itemsText}</div>
              ${shipping}
              <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <strong>${o.totalPrice.toLocaleString()}원</strong>
                <div style="display:flex;gap:8px;align-items:center;">
                  ${shipBtn}
                  <select data-order="${o._id}">${options}</select>
                </div>
              </div>
            </div>`;
          })
          .join("");
        return `
        <div class="user-group">
          <h3>${g.name} <span class="user-email">${g.email}</span></h3>
          ${orderHtml}
        </div>`;
      })
      .join("");

    box.querySelectorAll("select[data-order]").forEach((sel) => {
      sel.onchange = () => updateOrderStatus(sel.dataset.order, sel.value);
    });
    box.querySelectorAll("button[data-ship]").forEach((btn) => {
      btn.onclick = () => updateOrderStatus(btn.dataset.ship, "shipped");
    });
  } catch (err) {
    box.innerHTML = `<p class="empty">${err.message}</p>`;
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
  if (name === "admin") loadAdminOrders();
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

  // 주문 버튼 → 체크아웃 모달
  document.getElementById("checkout-btn").onclick = openCheckout;
  document.getElementById("checkout-close").onclick = () =>
    document.getElementById("checkout-modal").classList.add("hidden");

  // 결제 수단 선택 시 카드 입력란 토글
  document.querySelectorAll('input[name="payment"]').forEach((r) => {
    r.onchange = toggleCardFields;
  });

  // 체크아웃 폼 제출 → 주문 생성 + 결제 (한 번에)
  document.getElementById("checkout-form").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    const paymentMethod = f.payment.value;
    placeOrderAndPay(
      {
        recipient: f.recipient.value,
        phone: f.phone.value,
        address: f.address.value,
        memo: f.memo.value,
      },
      paymentMethod
    );
  };

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
