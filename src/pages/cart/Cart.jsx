import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import CustomFooter from "../../components/footer/Footer";
import { useCart } from "../products/CartContext";
import { Card, Button, message, Divider } from "antd";
import { DeleteOutlined } from '@ant-design/icons'; // Icono de la papelera (basura)
import BotonWhatsapp from "../../components/botonWhatsapp/BotonWhatsapp";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

const Cart = () => {
  const { cart, removeFromCart, removeOneFromCart, addToCart } = useCart();
  const [cartDetails, setCartDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippingCost, setShippingCost] = useState(5000);
  const [shippingCosts, setShippingCosts] = useState({});
  const [isShippingCostsLoaded, setIsShippingCostsLoaded] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchShippingCosts = async () => {
      try {
        if (!isShippingCostsLoaded) {
          const response = await axios.get("http://localhost:8080/api/customer-types");
          const costs = response.data.reduce((acc, type) => {
            acc[type.type_name.toLowerCase()] = parseFloat(type.shipping_percentage) / 100; // Asumimos que shipping_percentage es un porcentaje en formato entero
            return acc;
          }, {});
          setShippingCosts(costs);
          setIsShippingCostsLoaded(true);
        }
      } catch (error) {
        message.error("Error al cargar los costos de envío.");
        console.error(error);
      }
    };
    
    const setUserShippingCost = () => {
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      if (loginData?.user && Object.keys(shippingCosts).length > 0) {
        const userType = loginData.user.user_type.toLowerCase();
        const shippingPercentage = shippingCosts[userType] || 0;
        const subtotal = calculateSubtotal();
        setShippingCost(subtotal * shippingPercentage); // Se calcula el costo de envío como un porcentaje del subtotal
      }
    };
    
    fetchShippingCosts().then(setUserShippingCost);
    
  }, [isShippingCostsLoaded]);

  useEffect(() => {
    const fetchCartDetails = async () => {
      setLoading(true);
      try {
        const productDetails = await Promise.all(
          Object.entries(cart).map(async ([key, item]) => {
            const [productId] = key.split('-');
            
            const response = await axios.get(
              `http://localhost:8080/api/getproduct/${productId}`
            );

            return {
              ...response.data,
              quantity: item.quantity,
              selectedVariation: item.selectedVariation
            };
          })
        );

        setCartDetails(productDetails.filter(item => item !== null));
      } catch (error) {
        message.error("Error al cargar los detalles del carrito.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartDetails();
  }, [cart]);

  const getPriceByUserType = (product, selectedVariation) => {
    if (!selectedVariation) return 0;

    const userType = JSON.parse(localStorage.getItem("loginData"))?.user?.user_type;
    switch (userType) {
      case "hogar":
        return parseFloat(selectedVariation.price_home) || 0;
      case "supermercado":
        return parseFloat(selectedVariation.price_supermarket) || 0;
      case "restaurante":
        return parseFloat(selectedVariation.price_restaurant) || 0;
      case "fruver":
        return parseFloat(selectedVariation.price_fruver) || 0;
      default:
        return parseFloat(selectedVariation.price_home) || 0;
    }
  };

  const calculateSubtotal = () => {
    return cartDetails.reduce((total, product) => {
      const price = getPriceByUserType(product, product.selectedVariation);
      return total + (price * product.quantity);
    }, 0);
  };

  const handleAddToCart = (product) => {
    if (!product.selectedVariation) {
      message.error("Por favor selecciona una variación antes de añadir al carrito.");
      return;
    }
  
    addToCart(product);
  };

  // Función para reducir la cantidad de un producto
  const handleRemoveOneFromCart = (product) => {
    if (!product.selectedVariation) {
      console.error("La variación seleccionada no está definida.");
      return;
    }

    removeOneFromCart(product); // Reducir cantidad de un producto
  };

  // Esta función ahora elimina la card completa del carrito
  const handleRemoveFromCart = (product) => {
    if (!product.selectedVariation) {
      console.error("La variación seleccionada no está definida.");
      return;
    }

    // Eliminar todo el producto (toda la card)
    removeFromCart(product); // Esto actualizará el estado del carrito en el contexto y renderizará la UI
  };

  const handleCheckout = () => {
    if (cartDetails.length > 0) {
      navigate("/checkout");
    } else {
      message.warning("No tienes productos en el carrito.");
    }
  };

  const total = calculateSubtotal() + shippingCost;

  return (
    <>
      <Navbar />
      <div className="cart-container">
        <h2 className="cart-title">Resumen del Carrito</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : cartDetails.length === 0 ? (
          <p className="empty-cart-message">El carrito está vacío.</p>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cartDetails.map((product) => (
                <Card
                  key={`${product.product_id}-${product.selectedVariation.variation_id}`}
                  className="cart-item"
                >
                  <div className="cart-item-layout">
                    <div className="cart-item-details">
                      <img
                        alt={product.name}
                        src={product.photo_url}
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <h4>{product.name}</h4>
                        <p>Categoría: {product.category}</p>
                        <p>Calidad: {product.selectedVariation?.quality}</p>
                        <p>Cantidad: {product.selectedVariation?.quantity}</p>
                        <p>
                          Precio: $
                          {getPriceByUserType(
                            product,
                            product.selectedVariation
                          ).toLocaleString()}
                        </p>
                        <p>
                          Subtotal: $ 
                          {(
                            getPriceByUserType(
                              product,
                              product.selectedVariation
                            ) * product.quantity
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="cart-item-quantity">
                      <Button onClick={() => handleRemoveOneFromCart(product)}>-</Button>
                      <span>{product.quantity}</span>
                      <Button
                        onClick={() =>
                          handleAddToCart(product, product.selectedVariation)
                        }
                      >
                        +
                      </Button>
                    </div>
                    <div className="cart-item-delete">
                      {/* Botón de eliminar (basura) */}
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveFromCart(product)} // Elimina toda la card (producto completo)
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="cart-summary">
              <h3>Total del Carrito</h3>
              <Divider />
              <p>Subtotal: ${calculateSubtotal().toLocaleString()}</p>
              <p>Envío: ${shippingCost.toLocaleString()}</p>
              <p>
                <strong>Total: ${total.toLocaleString()}</strong>
              </p>
              <Button
                type="primary"
                className="checkout-button"
                onClick={handleCheckout}
              >
                Finalizar Compra
              </Button>
            </div>
          </div>
        )}
      </div>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default Cart;
