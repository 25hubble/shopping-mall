import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 조회(GET)는 누구나 가능, 생성/수정/삭제는 로그인 필요(protect)
// /api/products
router.route("/").get(getProducts).post(protect, createProduct);

// /api/products/:id
router
  .route("/:id")
  .get(getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

export default router;
