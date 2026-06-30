import Product from "../models/Product.js";

// [GET] /api/products - 상품 전체 조회
export async function getProducts(req, res, next) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

// [GET] /api/products/:id - 상품 1개 조회
export async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// [POST] /api/products - 상품 생성
export async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

// [PUT] /api/products/:id - 상품 수정
export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // 수정된 문서를 반환
      runValidators: true, // 스키마 검증 다시 실행
    });
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// [DELETE] /api/products/:id - 상품 삭제
export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }
    res.json({ message: "삭제되었습니다.", id: req.params.id });
  } catch (err) {
    next(err);
  }
}
