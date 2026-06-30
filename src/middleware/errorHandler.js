// 존재하지 않는 경로 처리
export function notFound(req, res, next) {
  res.status(404).json({ message: `경로를 찾을 수 없습니다: ${req.originalUrl}` });
}

// 공통 에러 핸들러: 컨트롤러에서 next(err)로 넘어온 에러를 한 곳에서 처리
export function errorHandler(err, req, res, next) {
  console.error("🚨 에러:", err.message);

  // Mongoose의 잘못된 ObjectId 형식 처리
  if (err.name === "CastError") {
    return res.status(400).json({ message: "잘못된 ID 형식입니다." });
  }

  // 스키마 검증 실패 처리
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  res.status(err.status || 500).json({ message: err.message || "서버 오류" });
}
