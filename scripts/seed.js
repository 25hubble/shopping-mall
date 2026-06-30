// 테스트용 샘플 상품 데이터를 DB에 넣는 스크립트
// 실행: npm run seed
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import Product from "../src/models/Product.js";

// 이미지는 loremflickr에서 키워드에 맞는 사진을 가져온다.
// ?lock=<숫자> 를 붙이면 상품마다 항상 같은 이미지가 나온다(매번 안 바뀜).
const sampleProducts = [
  {
    name: "무선 블루투스 이어폰",
    description: "노이즈 캔슬링과 30시간 재생 시간을 지원합니다.",
    price: 89000,
    stock: 50,
    category: "전자기기",
    imageUrl: "https://loremflickr.com/400/400/earphones?lock=11",
  },
  {
    name: "기계식 키보드",
    description: "적축 스위치, RGB 백라이트 게이밍 키보드.",
    price: 120000,
    stock: 30,
    category: "전자기기",
    imageUrl: "https://loremflickr.com/400/400/keyboard?lock=22",
  },
  {
    name: "면 100% 반팔 티셔츠",
    description: "부드럽고 통기성 좋은 데일리 티셔츠.",
    price: 19900,
    stock: 200,
    category: "의류",
    imageUrl: "https://loremflickr.com/400/400/tshirt?lock=33",
  },
  {
    name: "스테인리스 텀블러 500ml",
    description: "12시간 보온/보냉 가능한 진공 텀블러.",
    price: 25000,
    stock: 80,
    category: "주방용품",
    imageUrl: "https://loremflickr.com/400/400/tumbler?lock=44",
  },
  {
    name: "아로마 디퓨저",
    description: "은은한 무드등 기능이 있는 초음파 가습 디퓨저.",
    price: 34000,
    stock: 45,
    category: "생활용품",
    imageUrl: "https://loremflickr.com/400/400/diffuser?lock=55",
  },
];

async function seed() {
  await connectDB(process.env.MONGO_URI);

  // 기존 상품을 모두 지우고 새로 넣음 (깨끗한 상태로 시작)
  await Product.deleteMany({});
  console.log("🧹 기존 상품 삭제 완료");

  const created = await Product.insertMany(sampleProducts);
  console.log(`✅ 샘플 상품 ${created.length}개 추가 완료`);

  await mongoose.connection.close();
  console.log("👋 연결 종료");
  process.exit(0);
}

seed();
