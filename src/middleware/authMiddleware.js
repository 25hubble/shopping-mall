import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 로그인한 사용자만 통과시키는 미들웨어
// 요청 헤더: Authorization: Bearer <토큰>
export async function protect(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // 토큰 검증 → 안에 들어있던 사용자 id 꺼내기
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 해당 사용자를 DB에서 찾아 req.user에 담아둠 (비밀번호 제외)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "유효하지 않은 사용자입니다." });
    }

    req.user = user; // 이후 컨트롤러에서 req.user로 접근 가능
    next();
  } catch (err) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
}

// 관리자만 통과시키는 미들웨어 (반드시 protect 다음에 사용)
export function admin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "관리자 권한이 필요합니다." });
}
