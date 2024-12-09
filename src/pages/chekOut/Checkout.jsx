import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Divider, Modal, Row, Col } from "antd";
import BotonWhatsapp from "../../components/botonWhatsapp/BotonWhatsapp";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import axios from "axios";
import Navbar from "../../components/navbar/Navbar";
import CustomFooter from "../../components/footer/Footer";
import { useNavigate } from "react-router-dom";
import { useCart } from "../products/CartContext";
import useWindowSize from "react-use/lib/useWindowSize";
import "./Checkout.css";

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
          acc[type.type_name.toLowerCase()] = parseFloat(type.shipping_cost);
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

  const { cart, clearCart, addToCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  const userType = loginData?.user?.user_type;

  const [shippingCost, setShippingCost] = useState(5000);

  const [isFirstOrder, setIsFirstOrder] = useState(false);

  useEffect(() => {
    if (!Object.keys(shippingCosts).length) {
      const fetchShippingCosts = async () => {
        try {
          const response = await axios.get(
            "http://localhost:8080/api/customer-types"
          );
          const costs = response.data.reduce((acc, type) => {
            acc[type.type_name.toLowerCase()] = parseFloat(type.shipping_cost);
            return acc;
          }, {});
          setShippingCosts(costs);
        } catch (error) {
          message.error("Error al cargar los costos de envío.");
          console.error(error);
        }
      };

      fetchShippingCosts();
    }
  }, []); // Solo una vez

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
      } else {
        message.error("Debe iniciar sesión para realizar la compra.");
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

    console.log("Validación de formulario:", {
      requiredFields,
      userData,
      isValid,
    });

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
    removeFromCart(product);
  };

  const handlePlaceOrder = async () => {
    if (validateForm()) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 1);
      const estimatedDelivery = currentDate.toISOString();

      const orderData = {
        userId: loginData?.user?.id,
        cartDetails: cartDetails.map((product) => ({
          productId: product.product_id,
          quantity: product.quantity,
          variationId: product.selectedVariation.variation_id, // ID de la variación
          price: getPriceByUserType(product, product.selectedVariation),
        })),
        total: calculateSubtotal() + (discountedShippingCost ?? shippingCost),
        shippingCost: discountedShippingCost ?? shippingCost,
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

      try {
        const response = await axios.post(
          "http://localhost:8080/api/orders/placeOrder",
          orderData
        );
        if (response.status === 201) {
          setOrderId(response.data.orderId);
          setIsModalVisible(true);
        } else {
          message.error("Error al realizar el pedido. Inténtalo nuevamente.");
          console.log("Datos enviados al backend:", orderData);
        }
      } catch (error) {
        message.error("Error al realizar el pedido.");
        console.log("Datos enviados al backend:", orderData);

        console.error(error);
      }
    } else {
      message.error(
        "Por favor, complete todos los campos antes de realizar el pedido."
      );
    }
  };

  const total = calculateSubtotal() + (discountedShippingCost ?? shippingCost);

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
      <Navbar />
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
                  <Button onClick={() => handleRemoveFromCart(product)}>
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
                {(discountedShippingCost !== null
                  ? discountedShippingCost
                  : shippingCost
                ).toLocaleString()}
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
                  exitosamente!
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
