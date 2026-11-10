"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CoffeeWeight, GrindSize } from "@/lib/coffee";

export interface CartItemStorage {
  productId: number;
  weight: CoffeeWeight;
  grindSize: GrindSize;
  quantity: number;
  selected: boolean;
}

export interface CustomerInfo {
  customerName: string;
  phoneNumber: string;
  address: string;
}

interface CartContextType {
  cart: CartItemStorage[];
  addToCart: (
    productId: number,
    weight?: CoffeeWeight,
    grindSize?: GrindSize,
    quantity?: number
  ) => void;
  removeFromCart: (
    productId: number,
    weight: CoffeeWeight,
    grindSize: GrindSize
  ) => void;
  updateVariant: (
    productId: number,
    currentWeight: CoffeeWeight,
    currentGrindSize: GrindSize,
    weight: CoffeeWeight,
    grindSize: GrindSize
  ) => void;
  setSelected: (
    productId: number,
    weight: CoffeeWeight,
    grindSize: GrindSize,
    selected: boolean
  ) => void;
  setAllSelected: (selected: boolean) => void;
  updateQuantity: (
    productId: number,
    weight: CoffeeWeight,
    grindSize: GrindSize,
    quantity: number
  ) => void;
  removeItems: (items: CartItemStorage[]) => void;
  clearCart: () => void;
  totalItemsCount: number;
  customerInfo: CustomerInfo;
  saveCustomerInfo: (info: CustomerInfo) => void;
  isLoaded: boolean;
}

const CART_KEY = "kopi_cart_items_v2";
const CUSTOMER_KEY = "kopi_customer_info";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItemStorage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    customerName: "",
    phoneNumber: "",
    address: "",
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        // Normalize items for backward compatibility
        const normalized: CartItemStorage[] = parsed.map((item: any) => ({
          productId: item.productId,
          weight: item.weight || 1000,
          grindSize: item.grindSize || "biji",
          quantity: item.quantity || 1,
          selected: item.selected !== false,
        }));
        setCart(normalized);
      }
      const storedCustomer = localStorage.getItem(CUSTOMER_KEY);
      if (storedCustomer) {
        setCustomerInfo(JSON.parse(storedCustomer));
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveCartToStorage = (newCart: CartItemStorage[]) => {
    setCart(newCart);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    } catch (e) {
      console.error("Error saving cart:", e);
    }
  };

  const addToCart = (
    productId: number,
    weight: CoffeeWeight = 1000,
    grindSize: GrindSize = "biji",
    quantity = 1
  ) => {
    const existingIndex = cart.findIndex(
      (i) =>
        i.productId === productId &&
        i.weight === weight &&
        i.grindSize === grindSize
    );

    let updated: CartItemStorage[];
    if (existingIndex > -1) {
      updated = cart.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updated = [
        ...cart,
        { productId, weight, grindSize, quantity, selected: true },
      ];
    }
    saveCartToStorage(updated);
  };

  const removeFromCart = (
    productId: number,
    weight: CoffeeWeight,
    grindSize: GrindSize
  ) => {
    const updated = cart.filter(
      (i) =>
        !(
          i.productId === productId &&
          i.weight === weight &&
          i.grindSize === grindSize
        )
    );
    saveCartToStorage(updated);
  };

  const updateVariant = (
    productId: number,
    currentWeight: CoffeeWeight,
    currentGrindSize: GrindSize,
    weight: CoffeeWeight,
    grindSize: GrindSize
  ) => {
    if (currentWeight === weight && currentGrindSize === grindSize) return;

    const sourceIndex = cart.findIndex(
      (item) =>
        item.productId === productId &&
        item.weight === currentWeight &&
        item.grindSize === currentGrindSize
    );
    if (sourceIndex === -1) return;

    const targetIndex = cart.findIndex(
      (item) =>
        item.productId === productId &&
        item.weight === weight &&
        item.grindSize === grindSize
    );
    const source = cart[sourceIndex];
    let updated: CartItemStorage[];

    if (targetIndex !== -1) {
      updated = cart
        .map((item, index) =>
          index === targetIndex
            ? {
                ...item,
                quantity: item.quantity + source.quantity,
                selected: item.selected || source.selected,
              }
            : item
        )
        .filter((_, index) => index !== sourceIndex);
    } else {
      updated = cart.map((item, index) =>
        index === sourceIndex ? { ...item, weight, grindSize } : item
      );
    }

    saveCartToStorage(updated);
  };

  const setSelected = (
    productId: number,
    weight: CoffeeWeight,
    grindSize: GrindSize,
    selected: boolean
  ) => {
    saveCartToStorage(
      cart.map((item) =>
        item.productId === productId &&
        item.weight === weight &&
        item.grindSize === grindSize
          ? { ...item, selected }
          : item
      )
    );
  };

  const setAllSelected = (selected: boolean) => {
    saveCartToStorage(cart.map((item) => ({ ...item, selected })));
  };

  const updateQuantity = (
    productId: number,
    weight: CoffeeWeight,
    grindSize: GrindSize,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, weight, grindSize);
      return;
    }
    const updated = cart.map((item) =>
      item.productId === productId &&
      item.weight === weight &&
      item.grindSize === grindSize
        ? { ...item, quantity }
        : item
    );
    saveCartToStorage(updated);
  };

  const removeItems = (items: CartItemStorage[]) => {
    const purchasedKeys = new Set(
      items.map(
        (item) => `${item.productId}-${item.weight}-${item.grindSize}`
      )
    );
    saveCartToStorage(
      cart.filter(
        (item) =>
          !purchasedKeys.has(
            `${item.productId}-${item.weight}-${item.grindSize}`
          )
      )
    );
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const saveCustomerInfo = (info: CustomerInfo) => {
    setCustomerInfo(info);
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(info));
    } catch (e) {
      console.error("Error saving customer info:", e);
    }
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateVariant,
        setSelected,
        setAllSelected,
        updateQuantity,
        removeItems,
        clearCart,
        totalItemsCount,
        customerInfo,
        saveCustomerInfo,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
