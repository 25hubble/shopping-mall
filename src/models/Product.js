import mongoose from "mongoose";

// 상품 스키마: 쇼핑몰에서 판매할 상품의 형태를 정의
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "상품명은 필수입니다."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "가격은 필수입니다."],
      min: [0, "가격은 0원 이상이어야 합니다."],
    },
    // 재고 수량
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    // 카테고리 (예: "전자기기", "의류")
    category: {
      type: String,
      default: "기타",
    },
    // 대표 이미지 URL
    imageUrl: {
      type: String,
      default: "",
    },
  },
  {
    // createdAt, updatedAt 자동 생성
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
