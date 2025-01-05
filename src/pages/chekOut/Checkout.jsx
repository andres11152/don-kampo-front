import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Divider, Modal, Row, Col } from "antd";
import BotonWhatsapp from "../../components/General/BotonWhatsapp";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import axios from "axios";
import Header from "../../components/General/Header";
import CustomFooter from "../../components/General/Footer";
import { useNavigate } from "react-router-dom";
import { useCart } from "../products/CartContext";
import useWindowSize from "react-use/lib/useWindowSize";
import "./Checkout.css";
import fruits from '../../assets/fruits.jpg'

const Checkout = () => {
  const [userData, setUserData] = useState(null);
  const [cartDetails, setCartDetails] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [needsElectronicInvoice, setNeedsElectronicInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyNit, setCompanyNit] = useState("");
  const [shippingCosts, setShippingCosts] = useState({});
  const [discountedShippingCost, setDiscountedShippingCost] = useState(null);
  const loginData = JSON.parse(localStorage.getItem("loginData")) || null;

  useEffect(() => {
    const fetchShippingCostsAndUser = async () => {
      try {
        // Fetch shipping costs
        const response = await axios.get(
          "http://localhost:8080/api/customer-types"
        );
        const costs = response.data.reduce((acc, type) => {
          acc[type.type_name.toLowerCase()] = parseInt(type.shipping_cost);
          return acc;
        }, {});
        setShippingCosts(costs);

        // Fetch user data solo si no se ha cargado antes
        if (!userData && loginData?.user) {
          const userResponse = await axios.get(
            `http://localhost:8080/api/users/${loginData.user.id}`
          );
          const user = userResponse.data.user;
          setUserData(user);

          const hasOrders =
            userResponse.data.orders && userResponse.data.orders.length > 0;
          const shippingPercentage = costs[userType] || 0;

          const totalValue = userResponse.data.cartTotal || 0;
          const calculatedShippingCost =
            (totalValue * shippingPercentage) / 100;

          if (!hasOrders) {
            setIsFirstOrder(true);
            setDiscountedShippingCost(calculatedShippingCost / 2);
          } else {
            setDiscountedShippingCost(calculatedShippingCost);
          }

          setShippingCost(calculatedShippingCost);
        }
      } catch (error) {
        message.error(
          "Error al cargar los datos de usuario o costos de envío."
        );
        console.error(error);
      }
    };

    fetchShippingCostsAndUser();
  }, []); // Se ejecuta solo una vez

  const { cart, clearCart, addToCart, removeOneFromCart } = useCart();
  
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  const userType = loginData?.user?.user_type;

  const [shippingCost, setShippingCost] = useState(5000);

  const [isFirstOrder, setIsFirstOrder] = useState(false);

  // Función asíncrona para obtener y filtrar los pedidos
  const fetchOrders = async (userEmail) => {
    try {
        // Realiza la solicitud fetch a la API de pedidos
        const response = await axios.get('http://localhost:8080/api/orders');

        // Convierte la respuesta a formato JSON
        const orders = response.data;        

        // Filtra los pedidos donde 'items' no esté vacío
        const purchaseOrders = orders.filter(order => {
          const haveItems = order.items.length > 0
          const sameEmail = order.userData.email === userEmail
            
          return haveItems && sameEmail;
        });

        return purchaseOrders;
    } catch (error) {
        console.error('Error al obtener o procesar los pedidos:', error);
        // Dependiendo de tu caso de uso, podrías re-lanzar el error o manejarlo de otra manera
        throw error;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      
      if (loginData && loginData.user) {
        try {
          const response = await axios.get(
            `http://localhost:8080/api/users/${loginData.user.id}`
          );
          const user = response.data.user;
          setUserData(user);

          const hasOrders =
            response.data.orders && response.data.orders.length > 0;
          if (!hasOrders) {
            setIsFirstOrder(true); // Marcamos que es el primer pedido
            const userType = loginData.user.user_type.toLowerCase();
            if (shippingCosts[userType] !== undefined) {
              setShippingCost(shippingCosts[userType] / 2); // Aplica el descuento del 50%
            } else {
              setShippingCost(shippingCosts[userType]); // En caso de no encontrar el tipo de usuario, el costo es 0
            }
          } else {
            // Si no es el primer pedido, aplicamos el costo regular
            const userType = loginData.user.user_type.toLowerCase();
            setShippingCost(shippingCosts[userType] || 0);
          }
        } catch (error) {
          message.error("Error al cargar los datos del usuario.");
          console.error(error);
        }
      } else if (localStorage.getItem('userType') === 'Hogar') { 
        setUserData({
          user_name: 'anonimo',
          lastname: 'anonimo',
          email: 'anonimo',
          phone: 'anonimo',
          city: 'anonimo',
          address: 'anonimo',
          neighborhood: 'anonimo'
        });
      }
      else {
        message.error("Restaurante, Fruver y Supermercado deben iniciar sesión para realizar la compra.");
        navigate("/login");
      }
    };

    if (Object.keys(shippingCosts).length) {
      fetchUserData();
    }
  }, [shippingCosts, navigate]);

  useEffect(() => {
    const fetchCartDetails = async () => {
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
      }
    };

    fetchCartDetails();
  }, [cart]);

  const getPriceByUserType = (product, selectedVariation) => {
    if (!selectedVariation) return 0;

    const userType = loginData?.user?.user_type;
    switch (userType) {
      case "hogar":
        return parseInt(selectedVariation.price_home) || 0;
      case "supermercado":
        return parseInt(selectedVariation.price_supermarket) || 0;
      case "restaurante":
        return parseInt(selectedVariation.price_restaurant) || 0;
      case "fruver":
        return parseInt(selectedVariation.price_fruver) || 0;
      default:
        return parseInt(selectedVariation.price_home) || 0;
    }
  };

  const calculateSubtotal = () => {
    return cartDetails.reduce((total, product) => {
      const price = getPriceByUserType(product, product.selectedVariation);
      return total + price * product.quantity;
    }, 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleUpdateUser = async () => {
    if (loginData && loginData.user) {
      try {
        const updatedData = {
          user_name: userData.user_name,
          lastname: userData.lastname,
          email: userData.email,
          phone: userData.phone,
          city: userData.city,
          address: userData.address,
          neighborhood: userData.neighborhood,
        };

        await axios.put(
          `http://localhost:8080/api/updateusers/${loginData.user.id}`,
          updatedData
        );
        message.success("Datos actualizados exitosamente.");
      } catch (error) {
        message.error("Error al actualizar los datos del usuario.");
        console.error(error);
      }
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "user_name",
      "lastname",
      "email",
      "phone",
      "city",
      "address",
      "neighborhood",
    ];

    if (needsElectronicInvoice) {
      requiredFields.push("companyName", "companyNit");
    }

    const isValid = requiredFields.every((field) =>
      field === "companyName" || field === "companyNit"
        ? needsElectronicInvoice
          ? !!eval(field)
          : true
        : userData?.[field]?.trim()
    );

    return isValid;
  };

  const handleAddToCart = (product) => {
    if (!validateForm()) {
      message.error("Por favor complete todos los campos del formulario.");
      return;
    }
    addToCart(product);
  };

  const handleFormSubmit = () => {
    const subtotal = calculateSubtotal();
    const totalAmount = subtotal + shippingCost;

    // Simulate order processing logic here

    Modal.confirm({
      title: "Confirmación de Pedido",
      content: (
        <div>
          <p>Subtotal: ${subtotal}</p>
          <p>Envío: ${shippingCost}</p>
          <p>Total: ${totalAmount}</p>
        </div>
      ),
      onOk: async () => {
        // Logic to process order
        try {
          await axios.post("http://localhost:8080/api/orders", {
            user: userData,
            items: cartDetails,
            totalAmount,
          });
          clearCart();
          message.success("Pedido realizado con éxito.");
          setOrderId(Math.random().toString(36).substr(2, 9)); // Set order ID
        } catch (error) {
          message.error("Error al realizar el pedido.");
          console.error(error);
        }
      },
    });
  };

  return (
    <div>
      <Header />
      <div className="checkout-container">
        <h2>Finalizar Compra</h2>

        {/* Display Cart Details */}
        <div className="cart-details">
          {cartDetails.map((item) => (
            <div key={item.id}>
              <h4>{item.name}</h4>
              <p>{item.quantity} x {item.selectedVariation.name}</p>
              <p>${getPriceByUserType(item, item.selectedVariation)}</p>
            </div>
          ))}
        </div>

        {/* Display Shipping Cost and Total */}
        <div className="summary">
          <p>Costo de Envío: ${shippingCost}</p>
          <p>Total: ${calculateSubtotal() + shippingCost}</p>
        </div>

        {/* Form to Complete Order */}
        <Form onFinish={handleFormSubmit}>
          <Form.Item label="Nombre" name="user_name">
            <Input
              value={userData?.user_name || ""}
              name="user_name"
              onChange={handleInputChange}
              placeholder="Nombre"
            />
          </Form.Item>

          <Form.Item label="Apellido" name="lastname">
            <Input
              value={userData?.lastname || ""}
              name="lastname"
              onChange={handleInputChange}
              placeholder="Apellido"
            />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input
              value={userData?.email || ""}
              name="email"
              onChange={handleInputChange}
              placeholder="Email"
            />
          </Form.Item>

          <Form.Item label="Teléfono" name="phone">
            <Input
              value={userData?.phone || ""}
              name="phone"
              onChange={handleInputChange}
              placeholder="Teléfono"
            />
          </Form.Item>

          <Form.Item label="Dirección" name="address">
            <Input
              value={userData?.address || ""}
              name="address"
              onChange={handleInputChange}
              placeholder="Dirección"
            />
          </Form.Item>

          <Form.Item label="Barrio" name="neighborhood">
            <Input
              value={userData?.neighborhood || ""}
              name="neighborhood"
              onChange={handleInputChange}
              placeholder="Barrio"
            />
          </Form.Item>

          <Form.Item label="Ciudad" name="city">
            <Input
              value={userData?.city || ""}
              name="city"
              onChange={handleInputChange}
              placeholder="Ciudad"
            />
          </Form.Item>

          {needsElectronicInvoice && (
            <>
              <Form.Item label="Nombre de la Empresa" name="companyName">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nombre de la Empresa"
                />
              </Form.Item>
              <Form.Item label="NIT" name="companyNit">
                <Input
                  value={companyNit}
                  onChange={(e) => setCompanyNit(e.target.value)}
                  placeholder="NIT"
                />
              </Form.Item>
            </>
          )}

          <Button type="primary" htmlType="submit" disabled={!validateForm()}>
            Finalizar Compra
          </Button>
        </Form>

      </div>
      <CustomFooter />
    </div>
  );
};

export default Checkout;
