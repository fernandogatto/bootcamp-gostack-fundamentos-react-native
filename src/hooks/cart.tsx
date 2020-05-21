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
      const newProduct = products.find(product => product.id === id);

      if (!newProduct) {
        throw new Error('This product has not been added to the cart yet');
      }

      const filteredProducts = products.filter(product => product.id !== id);

      newProduct.quantity += 1;
      setProducts([...filteredProducts, newProduct]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productDecremented = products.find(product => product.id === id);

      if (!productDecremented) {
        throw new Error('This product has not been added to the cart yet');
      }

      productDecremented.quantity -= 1;

      const filteredProducts = products.filter(product => product.id !== id);

      if (productDecremented.quantity === 0) {
        setProducts(filteredProducts);
      } else {
        setProducts([productDecremented, ...filteredProducts]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
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

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
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
