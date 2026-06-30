import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 장바구니는 모두 로그인 필요
router.use(protect);

router.route("/").get(getCart).post(addToCart);
router.patch("/:productId", updateCartItem); // 수량 지정
router.delete("/:productId", removeFromCart);

export default router;
