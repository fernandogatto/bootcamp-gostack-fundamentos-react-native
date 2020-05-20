import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsInStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsInStorage) {
        setProducts(JSON.parse(productsInStorage));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productId = products.findIndex(product => product.id === id);

      if (productId < 0) {
        throw new Error('This product has not been added to the cart yet');
      }

      const updatedProducts = [...products];

      updatedProducts[productId].quantity += 1;
      setProducts(updatedProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productId = products.findIndex(product => product.id === id);

      if (productId < 0) {
        throw new Error('This product has not been added to the cart yet');
      }

      const updatedProducts = [...products];

      updatedProducts[productId].quantity -= 1;

      if (updatedProducts[productId].quantity <= 0) {
        updatedProducts.splice(productId, 1);
      }

      setProducts(updatedProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productId = products.findIndex(item => item.id === product.id);

      if (productId < 0) {
        const newProduct = { ...product, quantity: 1 };

        setProducts(oldProducts => [...oldProducts, newProduct]);
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
