// 특정 사용자를 관리자(admin)로 승격하는 스크립트
// 실행: npm run make-admin -- 이메일주소
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";

const email = process.argv[2];

async function run() {
  if (!email) {
    console.error("❌ 이메일을 입력하세요. 예: npm run make-admin -- tlee@spigen.com");
    process.exit(1);
  }

  await connectDB(process.env.MONGO_URI);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: "admin" },
    { new: true }
  );

  if (!user) {
    console.error(`❌ 해당 이메일의 사용자를 찾을 수 없습니다: ${email}`);
  } else {
    console.log(`✅ ${user.name}(${user.email}) → 관리자(admin)로 변경됨`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run();
