"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import type { Product } from "@/types/shop";

export default function AddToCartButton({ product }: { product: Product }) {
  const { items, addItem } = useCart();
  const [added, setAdded] = useState(false);

  const unitPrice = product.salePrice ?? product.price;
  const hasPrice = unitPrice != null;

  if (!hasPrice) {
    return <p className="text-sm text-gray-500 italic">Cena na upit — kontaktirajte nas</p>;
  }

  if (!product.inStock) {
    return (
      <button
        disabled
        className="w-full py-3 border border-gray-300 rounded text-gray-400 cursor-not-allowed"
      >
        Nije na stanju
      </button>
    );
  }

  const inCart = items.some((i) => i._id === product._id);

  function handleAdd() {
    if (inCart) return;
    addItem({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      image: product.images?.[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleAdd}
        disabled={inCart}
        className="w-full py-3 bg-brand text-white rounded hover:bg-brand-dark transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {inCart ? "Već je u korpi ✓" : added ? "Dodato u korpu ✓" : "Dodaj u korpu"}
      </button>
    </div>
  );
}
