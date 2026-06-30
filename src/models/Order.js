import mongoose from "mongoose";

// 주문: 주문하는 순간의 상품 정보(이름/가격)를 그대로 복사해 보관한다.
// (나중에 상품 가격이 바뀌어도 과거 주문 기록은 그대로 유지되도록)
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true }, // 주문 당시 상품명
        price: { type: Number, required: true }, // 주문 당시 가격
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    // 배송지 정보 (주문 시 입력받음). 관리자가 이 정보를 보고 배송한다.
    // 기존 주문 호환을 위해 스키마에서는 required로 강제하지 않고,
    // 실제 필수 검증은 주문 생성 컨트롤러에서 한다.
    shippingInfo: {
      recipient: { type: String }, // 받는 사람
      phone: { type: String }, // 연락처
      address: { type: String }, // 주소
      memo: { type: String, default: "" }, // 배송 메모
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending", // 결제 대기
    },
    // 결제 정보 (모의 결제)
    paidAt: { type: Date }, // 결제 완료 시각
    paymentMethod: { type: String }, // 결제 수단 (예: card)
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
