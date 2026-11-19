import CartContent from "./CartContent";
import { getShopProducts } from "@/lib/get-shop-products";

export default async function CartPage() {
  return <CartContent products={await getShopProducts()} />;
}
