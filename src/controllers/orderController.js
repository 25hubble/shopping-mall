import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// [POST] /api/orders - 주문하기(결제). 내 장바구니를 주문으로 변환한다.
export async function createOrder(req, res, next) {
  try {
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

    // 4) 주문 생성
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalPrice,
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

// [PATCH] /api/orders/:id/status - 주문 상태 변경  { status }
// 실무에선 보통 관리자(admin)만 배송 상태를 바꾸지만, 여기선 학습용으로
// 본인 주문에 한해 상태를 변경할 수 있게 한다.
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

    // 본인 주문인지 확인
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}
