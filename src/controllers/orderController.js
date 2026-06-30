import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// [POST] /api/orders - 주문하기(결제). 내 장바구니를 주문으로 변환한다.
export async function createOrder(req, res, next) {
  try {
    // 0) 배송지 정보 검증 (받는 사람/연락처/주소는 필수)
    const { recipient, phone, address, memo = "" } = req.body.shippingInfo || {};
    if (!recipient || !phone || !address) {
      return res.status(400).json({
        message: "배송지 정보(받는 사람, 연락처, 주소)를 모두 입력해주세요.",
      });
    }

    // 1) 장바구니를 상품 정보까지 채워서 가져오기
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "장바구니가 비어 있습니다." });
    }

    // 2) 재고 확인 + 주문 항목 만들기 + 총액 계산
    const orderItems = [];
    let totalPrice = 0;

    for (const item of cart.items) {
      const product = item.product;
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `재고 부족: ${product.name} (남은 수량 ${product.stock}개)`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
      totalPrice += product.price * item.quantity;
    }

    // 3) 재고 차감
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // 4) 주문 생성 (배송지 정보 포함)
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice,
      shippingInfo: { recipient, phone, address, memo },
    });

    // 5) 장바구니 비우기
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

// [GET] /api/orders - 내 주문 내역 조회
export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// [POST] /api/orders/:id/pay - 결제 처리 (모의 결제)
// 실제 결제 연동(토스/카카오페이 등) 대신, 결제 성공을 흉내내어 상태를 paid로 바꾼다.
export async function payOrder(req, res, next) {
  try {
    const { paymentMethod = "card" } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    // 본인 주문만 결제 가능
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    // 이미 결제(또는 그 이후 단계)된 주문은 다시 결제 불가
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "결제할 수 없는 주문 상태입니다." });
    }

    // --- 여기서 실제로는 결제 게이트웨이(PG)를 호출 ---
    // 학습용이므로 항상 성공 처리
    order.status = "paid";
    order.paidAt = new Date();
    order.paymentMethod = paymentMethod;
    await order.save();

    res.json({ message: "결제가 완료되었습니다.", order });
  } catch (err) {
    next(err);
  }
}

// [PATCH] /api/orders/:id/status - 주문 상태 변경  { status }
// 본인 주문이거나 관리자(admin)인 경우에만 변경할 수 있다.
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `상태는 다음 중 하나여야 합니다: ${allowed.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    // 본인 주문이거나 관리자만 허용
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}

// [GET] /api/orders/all - (관리자) 모든 유저의 주문 조회
export async function getAllOrders(req, res, next) {
  try {
    // user 정보(이름/이메일)도 함께 채워서 반환
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}
