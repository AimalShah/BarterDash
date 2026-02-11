import { useState, useCallback, useEffect } from "react";
import { productsService } from "../lib/api/services/products";

interface Product {
  id: string;
  title: string;
  buyNowPrice?: string;
  startingBid?: string;
  price?: string;
}

interface UseProductSelectionReturn {
  products: Product[];
  selectedProductIds: string[];
  fetchingProducts: boolean;
  toggleProduct: (productId: string) => void;
  refreshProducts: () => Promise<void>;
}

export function useProductSelection(): UseProductSelectionReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setFetchingProducts(true);
      const data = await productsService.getMyProducts();
      const productList = data || [];
      setProducts(productList);
      setSelectedProductIds((prev) =>
        prev.filter((id) => productList.some((product: any) => product.id === id))
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setFetchingProducts(false);
    }
  }, []);

  const toggleProduct = useCallback((productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    selectedProductIds,
    fetchingProducts,
    toggleProduct,
    refreshProducts: fetchProducts,
  };
}
