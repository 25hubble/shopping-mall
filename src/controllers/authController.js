import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 로그인 토큰(JWT) 생성 헬퍼
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // 7일간 유효
  });
}

// [POST] /api/auth/register - 회원가입
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // 이미 가입된 이메일인지 확인
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "이미 가입된 이메일입니다." });
    }

    // 생성 (비밀번호는 User 모델에서 자동 암호화됨)
    const user = await User.create({ name, email, password });

    // 비밀번호는 응답에서 제외하고 반환
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
}

// [POST] /api/auth/login - 로그인
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    // 이메일이 없거나 비밀번호가 틀린 경우 (보안상 동일한 메시지)
    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
}
