import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  payOrder,
  getAllOrders,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 주문은 모두 로그인 필요
router.use(protect);

// 관리자: 모든 주문 조회 (구체적인 경로를 :id 패턴보다 먼저 선언)
router.get("/all", admin, getAllOrders);

router.route("/").post(createOrder).get(getMyOrders);
router.post("/:id/pay", payOrder); // 결제
router.patch("/:id/status", updateOrderStatus); // 상태 변경(본인/관리자)
router.get("/:id", getOrderById); // 주문서(인보이스) 단건 조회

export default router;
