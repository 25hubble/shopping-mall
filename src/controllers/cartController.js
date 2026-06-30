import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// [GET] /api/cart - 내 장바구니 조회
export async function getCart(req, res, next) {
  try {
    // populate: items 안의 product id를 실제 상품 정보로 채워줌
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );
    // 장바구니가 아직 없으면 빈 형태로 반환
    res.json(cart || { user: req.user._id, items: [] });
  } catch (err) {
    next(err);
  }
}

// [POST] /api/cart - 장바구니에 상품 담기  { productId, quantity }
export async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;

    // 상품이 실제로 존재하는지 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    // 내 장바구니 가져오거나 없으면 새로 만들기
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // 이미 담긴 상품이면 수량만 증가, 아니면 새로 추가
    const existing = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate("items.product");
    res.status(201).json(cart);
  } catch (err) {
    next(err);
  }
}

// [DELETE] /api/cart/:productId - 장바구니에서 특정 상품 빼기
export async function removeFromCart(req, res, next) {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "장바구니가 비어 있습니다." });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (err) {
    next(err);
  }
}
