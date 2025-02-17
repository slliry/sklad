export interface Product {
  id: string;
  name: string;
  code: string;
  color: string;
  quantity: number;
  priceYuan: number;
  priceTenge: number;
  createdAt: Date;
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  priceYuan: number;
  priceTenge: number;
  saleDate: Date;
}

export default {}; 