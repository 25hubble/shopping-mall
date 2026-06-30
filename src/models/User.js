import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// 회원 스키마
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "이름은 필수입니다."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "이메일은 필수입니다."],
      unique: true, // 중복 가입 방지
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "비밀번호는 필수입니다."],
      minlength: [6, "비밀번호는 6자 이상이어야 합니다."],
    },
  },
  { timestamps: true }
);

// 저장 직전(pre save)에 비밀번호를 자동으로 암호화(해싱)
userSchema.pre("save", async function (next) {
  // 비밀번호가 바뀌지 않았으면 다시 해싱하지 않음
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 로그인 시 입력한 비밀번호가 맞는지 비교하는 메서드
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
