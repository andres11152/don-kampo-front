import React, { useEffect, useState } from "react";
import { Select, Form, Input, Button, message, Divider, Modal, Row, Col } from "antd";
import BotonWhatsapp from "../../components/General/BotonWhatsapp";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import Header from "../../components/General/Header";
import CustomFooter from "../../components/General/Footer";
import { useNavigate } from "react-router-dom";
import { useCart } from "../products/CartContext";
import useWindowSize from "react-use/lib/useWindowSize";
import "./Checkout.css";
import fruits from '../../assets/fruits.jpg'
import { useRef } from "react";

const Checkout = () => {
  const [userData, setUserData] = useState({
    user_name: "",
    lastname: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    neighborhood: "",
    companyName: "",
    companyNit: "",
  });
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
        // Obtener costos de envío
        const response = await axios.get("http://localhost:8080/api/customer-types");
        const costs = response.data.reduce((acc, type) => {
          acc[type.type_name.toLowerCase()] = parseFloat(type.shipping_cost); // Convertir a decimal
          return acc;
        }, {});
        setShippingCosts(costs);
  
        if (loginData?.user) {
          // Obtener datos del usuario
          const userResponse = await axios.get(
            `http://localhost:8080/api/users/${loginData.user.id}`
          );
          const user = userResponse.data.user;
          setUserData(user);
  
          const hasOrders =
            userResponse.data.orders && userResponse.data.orders.length > 0;
  
          // Determinar tipo de usuario y porcentaje de envío
          const userTypeKey = loginData?.user?.user_type?.toLowerCase() || "hogar";
          const shippingPercentage = costs[userTypeKey] || 0;
  
          // Calcular subtotal dinámicamente
          const subtotal = calculateSubtotal();
  
          // Calcular costo de envío
          let calculatedShippingCost = (subtotal * shippingPercentage) / 100;
  
          // Aplicar descuento del 50% si es el primer pedido
          if (!hasOrders) {
            setIsFirstOrder(true);
            calculatedShippingCost /= 2;
          }
  
          // Actualizar costo de envío
          setDiscountedShippingCost(calculatedShippingCost); // Para fines de visualización
          setShippingCost(calculatedShippingCost); // Valor dinámico del costo
        }
      } catch (error) {
        message.error("Error al cargar los datos de usuario o costos de envío.");
        console.error(error);
      }
    };
  
    fetchShippingCostsAndUser();
  }, [cartDetails]); // Escuchar cambios en el carrito
  
  

  const { cart, clearCart, addToCart, removeOneFromCart } = useCart();

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
            acc[type.type_name.toLowerCase()] = parseInt(type.shipping_cost);
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
        const newDetails = productDetails.filter(item => item !== null);
        if (JSON.stringify(newDetails) !== JSON.stringify(cartDetails)) {
          setCartDetails(newDetails);
        }
      } catch (error) {
        message.error("Error al cargar los detalles del carrito.");
        console.error(error);
      }
    };

    fetchCartDetails();
  }, [cart])



  const getPriceByUserType = (product, selectedVariation) => {
  if (!selectedVariation) return 0; // Asegúrate de devolver 0 si no hay variación
  const userType = loginData?.user?.user_type || "hogar";
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

  const getUserType = () => {

    const user = JSON.parse(localStorage.getItem("user"));

    if (user && user.user_type) {
      return user.user_type;
    }

    return "hogar";
  };

  const handlePlaceOrder = async () => {
    if (validateForm()) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 1);
      const estimatedDelivery = currentDate.toISOString();

      // Asegúrate de que el campo 'user_type' tenga un valor válido.
      const userType = loginData?.user?.user_type || getUserType() || "hogar";  // "hogar" es el valor predeterminado

      const orderData = {
        userId: loginData?.user?.id || '8739e2f0-5674-4b00-bee7-d83b47035573',
        cartDetails: cartDetails.map((product) => ({
          productId: product.product_id,
          quantity: product.quantity,
          variationId: product.selectedVariation.variation_id,
          price: getPriceByUserType(product, product.selectedVariation),
        })),
        total: calculateSubtotal() + (discountedShippingCost),
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
          user_type: userType,  // Aquí aseguramos que el 'user_type' sea válido
          neighborhood: userData.neighborhood,
        },
        needsElectronicInvoice,
        companyName: needsElectronicInvoice ? companyName : "",
        companyNit: needsElectronicInvoice ? companyNit : "",
      };

      console.log(orderData); // Para depuración

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
        }
      } catch (error) {
        message.error("Error al realizar el pedido.");
        console.error(error);
      }
    } else {
      message.error("Por favor, complete todos los campos antes de realizar el pedido.");
    }
  };


  const total = calculateSubtotal() + (discountedShippingCost ?? shippingCost);

  const generateOrderPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(10);

    // **Insertar el logo de la empresa**
    const logoUrl = '/images/1.png';
    doc.addImage(logoUrl, 'PNG', 10, 5, 50, 30);

    // **Información del remitente**
    const senderInfo = ['Don Kampo S.A.S', 'Nit 901.865.742', 'Chía - Cundinamarca', '3117366666'];
    const pageWidth = doc.internal.pageSize.width;
    const senderX = pageWidth - 50;

    doc.setFont('helvetica', 'bold');
    senderInfo.forEach((line, index) => {
        doc.text(line, senderX, 10 + (index * 5));
    });

    // **Título del documento y fecha**
    doc.setFontSize(14);
    doc.text("Detalles de la Orden", 10, 35);
    const orderDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const deliveryDate = new Date(new Date().setDate(new Date().getDate() + 1))
        .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Fecha de la orden:", 10, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(orderDate, 55, 40);

    doc.setFont('helvetica', 'bold');
    doc.text("Fecha de entrega:", 10, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(deliveryDate, 55, 45);

    doc.setFont('helvetica', 'bold');
    doc.text("ID de la orden:", 10, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${orderId}`, 55, 50);

    doc.setFont('helvetica', 'bold');
    doc.text("Cliente:", 10, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`${userData.user_name} ${userData.lastname}`, 55, 55);

    doc.setFont('helvetica', 'bold');
    doc.text("Correo:", 10, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(userData.email, 55, 60);

    doc.setFont('helvetica', 'bold');
    doc.text("Teléfono:", 10, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(userData.phone, 55, 65);

    doc.setFont('helvetica', 'bold');
    doc.text("Dirección:", 10, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(`${userData.address}, ${userData.neighborhood}, ${userData.city}`, 55, 70);

    // **Configuración de la tabla con los productos**
    const tableColumns = [
        { header: 'Producto', dataKey: 'description' },
        { header: 'Precio Unitario', dataKey: 'unitPrice' },
        { header: 'Cantidad', dataKey: 'quantity' },
        { header: 'Subtotal', dataKey: 'subtotal' },
    ];

    const tableData = cartDetails.map((product) => ({
        description: `${product.name} (${product.selectedVariation.quality} - ${product.selectedVariation.quantity})`,
        unitPrice: `$${getPriceByUserType(product, product.selectedVariation).toLocaleString()}`,
        quantity: product.quantity,
        subtotal: `$${(getPriceByUserType(product, product.selectedVariation) * product.quantity).toLocaleString()}`,
    }));

    // **Renderizar la tabla**
    doc.autoTable({
        columns: tableColumns,
        body: tableData,
        startY: 75, // Comienza justo después de la dirección
        styles: { fontSize: 10 },
        columnStyles: {
            description: { cellWidth: 'auto' },
            unitPrice: { halign: 'right' },
            quantity: { halign: 'center' },
            subtotal: { halign: 'right' },
        },
    });

    // **Calcular posición final para totales**
    const finalY = doc.lastAutoTable.finalY + 10;

    // **Agregar subtotales, envío y total al final**
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: $${calculateSubtotal().toLocaleString()}`, 10, finalY);
    doc.text(`Envío: $${shippingCost.toLocaleString()}`, 10, finalY + 5);
    doc.setFontSize(14);
    doc.text(`Total: $${(calculateSubtotal() + shippingCost).toLocaleString()}`, 10, finalY + 10);

    // **Guardar el PDF**
    doc.save(`Resumen_Pedido_${orderId}.pdf`);

    // **Limpiar el carrito y redirigir**
    clearCart();
    message.success("El carrito ha sido vaciado después de generar el PDF.");
    navigate("/products");
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
                    <Select
                      name="city"
                      value={userData.city}
                      onChange={(value) => handleInputChange({ target: { name: 'city', value } })}
                    >
                      <Select.Option value="Chía">Chía</Select.Option>
                      <Select.Option value="Cajicá">Cajicá</Select.Option>
                    </Select>
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
                </Button>

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
                <p>Envío: ${shippingCost.toLocaleString()}</p>
                <h4>Total: ${(calculateSubtotal() + shippingCost).toLocaleString()}</h4>
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