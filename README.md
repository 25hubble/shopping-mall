# 🛒 TK 쇼핑몰

Node.js + Express + MongoDB로 만든 쇼핑몰 (REST API + 프론트엔드 포함).

## 기능
- 상품 CRUD (조회는 공개, 등록/수정/삭제는 로그인 필요)
- 회원가입 / 로그인 (bcrypt 암호화 + JWT 토큰)
- 장바구니 (사용자별)
- 주문/결제 (재고 자동 차감) + 주문 상태 관리
- 바닐라 JS 프론트엔드 (`public/`)

## 로컬 실행
```bash
npm install
cp .env.example .env   # 값 채우기 (MONGO_URI, JWT_SECRET)
npm run seed           # 샘플 상품 5개 넣기 (선택)
npm run dev            # http://localhost:4000
```

## 환경변수 (.env)
| 키 | 설명 |
|----|------|
| `PORT` | 서버 포트 (기본 4000) |
| `MONGO_URI` | MongoDB 연결 문자열 (Atlas) |
| `JWT_SECRET` | 토큰 서명용 비밀키 |

## API 요약
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/products` | - | 상품 목록 |
| GET | `/api/products/:id` | - | 상품 상세 |
| POST | `/api/products` | 🔒 | 상품 등록 |
| PUT | `/api/products/:id` | 🔒 | 상품 수정 |
| DELETE | `/api/products/:id` | 🔒 | 상품 삭제 |
| POST | `/api/auth/register` | - | 회원가입 |
| POST | `/api/auth/login` | - | 로그인 |
| GET | `/api/cart` | 🔒 | 장바구니 조회 |
| POST | `/api/cart` | 🔒 | 장바구니 담기 |
| DELETE | `/api/cart/:productId` | 🔒 | 장바구니에서 빼기 |
| POST | `/api/orders` | 🔒 | 주문하기 |
| GET | `/api/orders` | 🔒 | 내 주문 내역 |
| PATCH | `/api/orders/:id/status` | 🔒 | 주문 상태 변경 |

🔒 = `Authorization: Bearer <토큰>` 헤더 필요

## 배포 (Render)
1. 이 프로젝트를 GitHub에 push
2. [Render](https://render.com) → New → Blueprint → 레포 선택 (`render.yaml` 자동 인식)
3. 환경변수 `MONGO_URI`, `JWT_SECRET` 입력
4. Atlas → Network Access 에서 `0.0.0.0/0` 허용 확인
