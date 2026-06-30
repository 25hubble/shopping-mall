import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register); // 회원가입
router.post("/login", login); // 로그인

export default router;
