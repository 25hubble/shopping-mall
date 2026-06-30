import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

// ESM에서는 __dirname이 기본 제공되지 않아 직접 계산한다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 미들웨어
app.use(cors()); // 다른 출처(개발 중 다른 포트 등)에서의 요청 허용
app.use(express.json()); // JSON 요청 본문 파싱

// 프론트엔드(정적 파일) 서빙: public/ 폴더의 index.html 등을 제공
app.use(express.static(path.join(__dirname, "../public")));

// 서버 동작 확인용 (프론트와 충돌하지 않게 /api/health 로 분리)
app.get("/api/health", (req, res) => {
  res.json({ message: "쇼핑몰 API 서버가 동작 중입니다 🛒" });
});

// API 라우트
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// 에러 처리 (라우트들보다 반드시 아래에 위치)
app.use(notFound);
app.use(errorHandler);

export default app;
