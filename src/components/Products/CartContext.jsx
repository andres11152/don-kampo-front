import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart"));
    return storedCart || {};
  });

  const [quantities, setQuantities] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const getPriceByUserType = (item) => {
    const userType = JSON.parse(localStorage.getItem("loginData"))?.user?.user_type;
    if (!item) return 0;
    switch (userType) {
      case "hogar":
        return parseInt(item.price_home);
      case "supermercado":
        return parseInt(item.price_supermarket);
      case "restaurante":
        return parseInt(item.price_restaurant);
      case "fruver":
        return parseInt(item.price_fruver);
      default:
        return parseInt(item.price_home);
    }
  };

  const cartValue = Object.values(cart).reduce(
    (total, item) => total + item.quantity * (item.price || 0),
    0
  );

  // Validar si la variación tiene un precio válido antes de agregar al carrito
  const isValidVariation = (product) => {
    if (!product?.selectedVariation) {
      return false;
    }
    
    const price = getPriceByUserType(product.selectedVariation);
    return price > 0 && price !== null;
  };

  const addToCart = (products) => {
    if (!Array.isArray(products)) {
      console.error("Error: 'products' debe ser un array.");
      products = [products];  // Si no es un array, lo convertimos en uno
    }

    setCart((prevCart) => {
      const newCart = { ...prevCart };

      products.forEach((product) => {
        // Validar si la variación es válida antes de añadir al carrito
        if (!isValidVariation(product)) {
          setErrorMessage("Una de las variaciones seleccionadas no está disponible.");
          return;  // No añadir el producto al carrito
        }

        const cartKey = `${product.product_id}-${product.selectedVariation.variation_id}`;
        const quantitySelected = quantities[product.product_id] || 1;
        const pricePerUnit = getPriceByUserType(product.selectedVariation);
        const totalPrice = pricePerUnit * quantitySelected;

        if (newCart[cartKey]) {
          newCart[cartKey] = {
            ...newCart[cartKey],
            quantity: newCart[cartKey].quantity + quantitySelected,
            totalPrice: newCart[cartKey].totalPrice + totalPrice,
          };
        } else {
          newCart[cartKey] = {
            product_id: product.product_id,
            selectedVariation: product.selectedVariation,
            quantity: quantitySelected,
            price: pricePerUnit,
            totalPrice,
          };
        }
      });

      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const removeFromCart = ({ product, deleteAll=false }) =>
    product.selectedVariation 
      ? setCart(prevCart => {
        const newCart = { ...prevCart };
        const cartKey = `${product.product_id}-${product.selectedVariation.variation_id}`;
        
        if (newCart[cartKey]) {
          if ( deleteAll || newCart[cartKey].quantity === 1) {
            delete newCart[cartKey];
          } else {   
            newCart[cartKey] = {
              ...newCart[cartKey],
              quantity: newCart[cartKey].quantity - 1,
            } 
          }
        }
  
        return newCart;
      })
      : console.error("La variación seleccionada no está definida.")

  const updateQuantity = (productId, quantity) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      const cartKey = `${productId}`;

      if (newCart[cartKey]) {
        newCart[cartKey].quantity = quantity;
      }
      return newCart;
    });
  };

  const cartCount = Object.values(cart).reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartValue,
        cartCount,
        quantities,
        updateQuantity,
        errorMessage, // Pasar el mensaje de error
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
