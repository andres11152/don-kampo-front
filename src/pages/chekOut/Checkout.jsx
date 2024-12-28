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
  const [shippingCost, setShippingCost] = useState(5000);

  const { cart, clearCart, addToCart, removeOneFromCart } = useCart();
  
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  const loginData = JSON.parse(localStorage.getItem('loginData'))
  const userType = loginData?.user?.user_type;

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
  }

  useEffect(() => {
    // Definir una función asíncrona dentro de useEffect
    const initialize = async () => {
      const loginData = JSON.parse(localStorage.getItem('loginData'));
      
      if (loginData !== null) {
        const userType = localStorage.getItem('userType').toLowerCase();
        
        if (userType === 'restaurante') {
          setShippingCost(shippingCost / 2); // Usar función de actualización para evitar dependencias
        } else if (userType === 'hogar') {
          try {
            const purchaseOrders = await fetchOrders(loginData.user.email);
            if (purchaseOrders.length === 0) {
              setShippingCost(0);
            }
          } catch (error) {
            console.error('Error al obtener los pedidos filtrados:', error);
          }
        }
      }

      if (loginData && loginData.user) {
        try {
          const response = await axios.get(
            `https://don-kampo-api.onrender.com/api/users/${loginData.user.id}`
          );
          const user = response.data.user;
          setUserData(user);

          const hasOrders = response.data.orders && response.data.orders.length > 0;
          setIsFirstOrder(!hasOrders); // Marcamos que es el primer pedido
        } catch (error) {
          message.error("Error al cargar los datos del usuario.");
          console.error(error);
        }
      } else if (localStorage.getItem('userType')?.toLowerCase() === 'hogar') { 
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

    // Llamar a la función asíncrona
    initialize();
  }, []); // Dependencias: navigate y shippingCost si son necesarios

  useEffect(() => {
    const fetchCartDetails = async () => {
      try {
        const productDetails = await Promise.all(
          Object.entries(cart).map(async ([key, item]) => {
            const [productId] = key.split('-');
            
            const response = await axios.get(
              `https://don-kampo-api.onrender.com/api/getproduct/${productId}`
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
          `https://don-kampo-api.onrender.com/api/updateusers/${loginData.user.id}`,
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
    if (!product.selectedVariation) {
      message.error("Por favor selecciona una variaci��n antes de añadir al carrito.");
      return;
    }
    addToCart(product);
  };

  const handleRemoveFromCart = (product) => {
    if (!product.selectedVariation) {
      console.error("La variación seleccionada no está definida.");
      return;
    }
    removeOneFromCart(product);
  };

  const handlePlaceOrder = async () => {
    if (validateForm()) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 1);
      const estimatedDelivery = currentDate.toISOString();

      const orderData = {
        userId: loginData?.user?.id || '8739e2f0-5674-4b00-bee7-d83b47035573',
        cartDetails: cartDetails.map((product) => ({
          productId: product.product_id,
          quantity: product.quantity,
          variationId: product.selectedVariation.variation_id, // ID de la variación
          price: getPriceByUserType(product, product.selectedVariation),
        })),
        total: calculateSubtotal() + shippingCost,
        shippingCost: shippingCost,
        shippingMethod: "Overnight",
        estimatedDelivery: estimatedDelivery,
        actual_delivery: currentDate,
        userData: {
          user_name: userData.user_name,
          lastname: userData.lastname,
          email: userData.email,
          phone: userData.phone,
          city: userData.city,
          address: userData.address,
          neighborhood: userData.neighborhood,
        },
        needsElectronicInvoice,
        companyName: needsElectronicInvoice ? companyName : "",
        companyNit: needsElectronicInvoice ? companyNit : "",
      };     
      console.log(orderData);
       

      try {
        const response = await axios.post(
          "https://don-kampo-api.onrender.com/api/orders/placeOrder",
          orderData
        );
        if (response.status === 201) {
          setOrderId(response.data.orderId);
          setIsModalVisible(true);
        } else {
          message.error("Error al realizar el pedido. Inténtalo nuevamente.");
          
        }
      } catch (error) {
        message.error("Error al realizar el pedido.");

        console.error(error);
      }
    } else {
      message.error(
        "Por favor, complete todos los campos antes de realizar el pedido."
      );
    }
  };

  const total = calculateSubtotal() + shippingCost;

  const generateOrderPDF = () => {
    const input = document.getElementById("order-summary-pdf");
    if (!input) {
      message.error("No se pudo generar el PDF. Intenta nuevamente.");
      return;
    }

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();

      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      pdf.save(`Resumen_Pedido_${orderId}.pdf`);

      clearCart();
      message.success("El carrito ha sido vaciado después de generar el PDF.");
      navigate("/products");
    });
  };

  return (
    <div>
      <img id="fruits" src={fruits} alt="" />
      <Header />
      <div className="checkout-container">
        <h2>Finalizar Compra</h2>
        <div className="checkout-content">
          {userData ? (
            <Form layout="vertical" className="checkout-form">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Nombre">
                    <Input
                      name="user_name"
                      value={userData.user_name}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Apellido">
                    <Input
                      name="lastname"
                      value={userData.lastname}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Email">
                    <Input
                      name="email"
                      value={userData.email}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Teléfono">
                    <Input
                      name="phone"
                      value={userData.phone}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Ciudad">
                    <Input
                      name="city"
                      value={userData.city}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Dirección">
                    <Input
                      name="address"
                      value={userData.address}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Barrio">
                    <Input
                      name="neighborhood"
                      value={userData.neighborhood}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Button
                    type="primary"
                    className="confirm-data-button"
                    onClick={handleUpdateUser}
                  >
                    Confirmar Datos
                  </Button>
                </Col>
              </Row>
            </Form>
          ) : (
            <p>Cargando datos del usuario...</p>
          )}
          <div className="order-summary">
            <h3>Resumen del Pedido</h3>
            <Divider />
            {cartDetails.map((product) => (
              <div key={product.product_id} className="order-summary-item">
                <span>
                  {product.name} ({product.selectedVariation.quality} -{" "}
                  {product.selectedVariation.quantity}) x {product.quantity}
                </span>
                <div className="quantity-controls">
                  <Button onClick={() => handleRemoveFromCart(product, product.selectedVariation)}>
                    -
                  </Button>
                  <span className="quantity-text">{product.quantity}</span>
                  <Button
                    onClick={() =>
                      handleAddToCart(product, product.selectedVariation)
                    }
                  >
                    +
                  </Button>
                </div>
                <span>
                  $
                  {(
                    getPriceByUserType(product, product.selectedVariation) *
                    product.quantity
                  ).toLocaleString()}
                </span>
              </div>
            ))}

            <Divider />
            <p>
              Subtotal: <span>${calculateSubtotal().toLocaleString()}</span>
            </p>
            <p>
              Envío:{" "}
              <span>
                $
                {shippingCost.toLocaleString()}
              </span>
            </p>
            {isFirstOrder && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#FF914D",
                  marginTop: "5px",
                }}
              >
                ¡Descuento aplicado al costo de envío por ser tu primer pedido!
              </p>
            )}
            {userType === "restaurante" && (
              <>
                <Form.Item label="¿Necesita factura electrónica?">
                  <Input
                    type="checkbox"
                    checked={needsElectronicInvoice}
                    onChange={(e) =>
                      setNeedsElectronicInvoice(e.target.checked)
                    }
                  />
                </Form.Item>
                {needsElectronicInvoice && (
                  <>
                    <Form.Item label="Nombre de la empresa">
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </Form.Item>
                    <Form.Item label="NIT de la empresa">
                      <Input
                        value={companyNit}
                        onChange={(e) => setCompanyNit(e.target.value)}
                      />
                    </Form.Item>
                  </>
                )}
              </>
            )}

            <Divider />
            <h4>
              Total: <span>${total.toLocaleString()}</span>
            </h4>

            <Button
              type="primary"
              className="place-order-button"
              onClick={handlePlaceOrder}
              disabled={!validateForm()}
            >
              REALIZAR EL PEDIDO
            </Button>

            <Modal
              title="Pedido Confirmado"
              visible={isModalVisible}
              onOk={() => {
                setIsModalVisible(false);
                navigate("/products");
              }}
              onCancel={() => setIsModalVisible(false)}
              footer={[
                <Button
                  key="pdf"
                  type="default"
                  onClick={generateOrderPDF}
                  style={{ backgroundColor: "#FF914D", color: "#fff" }}
                >
                  Descargar PDF
                </Button>,
              ]}
            >
              <div id="order-summary-pdf">
                <p>
                  ¡{userData?.user_name}, tu pedido ha sido realizado
                  exitosamente!<br />Sera despachado {new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p>
                  ID de la orden: <strong>{orderId}</strong>
                </p>
                <Divider />
                <h4>Resumen del Pedido</h4>
                {cartDetails.map((product) => (
                  <div key={product.product_id} className="order-summary-item">
                    <span>
                      {product.name} ({product.selectedVariation.quality} -{" "}
                      {product.selectedVariation.quantity}) x {product.quantity}
                    </span>
                    <span>
                      $
                      {(
                        getPriceByUserType(product, product.selectedVariation) *
                        product.quantity
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}
                <Divider />
                <p>Subtotal: ${calculateSubtotal().toLocaleString()}</p>
                <p>Envío: ${shippingCost}</p>
                <h4>Total: ${total.toLocaleString()}</h4>
              </div>
            </Modal>
          </div>
        </div>
      </div>
      <BotonWhatsapp />
      <CustomFooter />
    </div>
  );
};

export default Checkout;
