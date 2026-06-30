import mongoose from "mongoose";

// MongoDB 연결 함수
export async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB 연결 성공");
  } catch (err) {
    console.error("❌ MongoDB 연결 실패:", err.message);
    // 연결에 실패하면 서버를 띄울 이유가 없으므로 프로세스 종료
    process.exit(1);
  }
}
