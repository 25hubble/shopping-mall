import express from "express";
import {
  createOrder,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 주문은 모두 로그인 필요
router.use(protect);

router.route("/").post(createOrder).get(getMyOrders);
router.patch("/:id/status", updateOrderStatus); // 주문 상태 변경

export default router;
