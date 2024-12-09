import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  message,
  Form,
  Input,
  Select,
  Divider,
  Row,
  Col,
  Table,
  Modal,
  DatePicker,
  Badge,
} from "antd";
import Navbar from "../../components/navbar/Navbar";
import CustomFooter from "../../components/footer/Footer";
import BotonWhatsapp from "../../components/botonWhatsapp/BotonWhatsapp";
import axios from "axios";
import * as XLSX from "xlsx";
import "./UserProfile.css";

const { Option } = Select;
const { RangePicker } = DatePicker;

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState("welcome"); // 'welcome', 'profile', 'orders'
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      if (loginData && loginData.user) {
        try {
          const response = await axios.get(`http://localhost:8080/api/users/${loginData.user.id}`);
          const user = response.data.user;
          setUserData(user);
          form.setFieldsValue(user);
  
          // Cargar pedidos
          const ordersResponse = await axios.get("http://localhost:8080/api/orders");
          const userOrders = ordersResponse.data.filter(
            (order) => order.customer_id === loginData.user.id
          );
          console.log("Pedidos del usuario:", userOrders); // LOG PARA VERIFICAR LOS DATOS
          setOrders(userOrders);
          setFilteredOrders(userOrders);
        } catch (error) {
          message.error("Error al cargar los datos.");
          console.error(error);
        }
      } else {
        message.error("Debe iniciar sesión para ver su perfil.");
      }
    };
  
    fetchUserData();
  }, [form]);  

  const handleSaveChanges = async () => {
    try {
      const values = form.getFieldsValue();
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      await axios.put(`http://localhost:8080/api/updateusers/${loginData.user.id}`, values);
      setUserData(values);
      message.success("Datos actualizados exitosamente.");
    } catch (error) {
      message.error("Error al actualizar los datos.");
      console.error(error);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/orders/${orderId}`);
      setSelectedOrder(response.data);
      setIsModalVisible(true);
    } catch (error) {
      message.error("Error al cargar los detalles del pedido.");
      console.error(error);
    }
  };

  // Función para renderizar el estado con color
  const renderStatus = (statusId) => {
    let statusText = "";
    let color = "";

    switch (statusId) {
      case 1:
        statusText = "Pendiente";
        color = "orange";
        break;
      case 2:
        statusText = "Enviado";
        color = "blue";
        break;
      case 3:
        statusText = "Entregado";
        color = "green";
        break;
      case 4:
        statusText = "Cancelado";
        color = "red";
        break;
      default:
        statusText = "Desconocido";
        color = "grey";
    }

    return <Badge color={color} text={statusText} />;
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    filterOrders(value, dateRange);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    filterOrders(searchTerm, dates);
  };

  const filterOrders = (term, range) => {
    const filtered = orders.filter((order) => {
      const matchTerm =
        order.id.toString().includes(term) ||
        renderStatus(order.status_id).props.text.toLowerCase().includes(term);
  
      const matchDate =
        !range ||
        range.length === 0 ||
        (new Date(order.order_date) >= range[0].startOf("day").toDate() &&
          new Date(order.order_date) <= range[1].endOf("day").toDate());
  
      return matchTerm && matchDate;
    });
    console.log("Pedidos filtrados:", filtered); 
    setFilteredOrders(filtered);
  };
  

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");
    XLSX.writeFile(workbook, "Historial_Pedidos.xlsx");
  };

  const renderWelcome = () => (
    <div className="welcome-section">
      <h2 className="welcome-message" style={{ marginBottom: "4%" }}>
        Bienvenido a tu perfil, {userData?.user_name}!
      </h2>
      <p className="profile-description">
        Selecciona una de las opciones a continuación para ver o editar tu
        información personal o revisar tu historial de pedidos.
      </p>
      <Button
        type="primary"
        onClick={() => setView("profile")}
        className="profile-button"
      >
        Editar Perfil
      </Button>
      <Button
        type="default"
        onClick={() => setView("orders")}
        className="orders-button"
      >
        Ver Pedidos
      </Button>
    </div>
  );

  const renderProfile = () => (
    <Card title="Perfil de Usuario" className="user-profile-card">
      <Form form={form} layout="vertical" onFinish={handleSaveChanges}>
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label="Nombre" name="user_name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Apellido" name="lastname">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Email" name="email">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Teléfono" name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Ciudad" name="city">
              <Select>
                <Option value="Chía">Chía</Option>
                <Option value="Cajicá">Cajicá</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Dirección" name="address">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Barrio" name="neighborhood">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <div className="buttons-container">
          <Button type="primary" htmlType="submit" className="save-button">
            Guardar Cambios
          </Button>
          <Button
            type="default"
            onClick={() => setView("welcome")}
            className="back-button"
          >
            Volver
          </Button>
        </div>
      </Form>
    </Card>
  );

  const renderOrders = () => {
    const columns = [
      {
        title: "ID de Orden",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "Fecha",
        dataIndex: "order_date",
        key: "order_date",
        render: (date) => new Date(date).toLocaleDateString(),
      },
      {
        title: "Estado",
        dataIndex: "status_id",
        key: "status_id",
        render: renderStatus,
      },
      {
        title: "Total",
        dataIndex: "total",
        key: "total",
        render: (total) => `$${parseFloat(total).toLocaleString()}`,
      },
      {
        title: "Acciones",
        key: "actions",
        render: (_, record) => (
          <Button onClick={() => fetchOrderDetails(record.id)}>Detalles</Button>
        ),
      },
    ];

    return (
      <Card title="Historial de Pedidos" className="user-orders-card">
        <div className="table-controls">
          <Input
            placeholder="Buscar por ID o Estado"
            value={searchTerm}
            onChange={handleSearch}
            style={{ width: 200, marginRight: "10px" }}
          />
          <RangePicker
            onChange={handleDateRangeChange}
            style={{ marginRight: "10px" }}
          />
          <Button onClick={handleExportToExcel}>Exportar a Excel</Button>
        </div>
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          className="orders-table"
        />
        <Button
          type="default"
          onClick={() => setView("welcome")}
          className="back-button"
        >
          Volver
        </Button>
      </Card>
    );
  };

  const renderOrderDetailsModal = () => (
    <Modal
      title={`Detalles de Orden #${selectedOrder?.order?.id}`}
      visible={isModalVisible}
      onCancel={() => setIsModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setIsModalVisible(false)}>
          Cerrar
        </Button>,
      ]}
    >
      {selectedOrder && (
        <div className="modal-content-horizontal">
          <div className="modal-section-horizontal">
            <p>
              <strong>Cliente:</strong> {selectedOrder.order.customer_name}
            </p>
            <p>
              <strong>Email:</strong> {selectedOrder.order.customer_email}
            </p>
            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(selectedOrder.order.order_date).toLocaleDateString()}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              {renderStatus(selectedOrder.order.status_id)}
            </p>
            <p className="modal-total-horizontal">
              <strong>Total:</strong> $
              {parseFloat(selectedOrder.order.total).toLocaleString()}
            </p>
          </div>
          <div className="modal-section-horizontal">
            <h4>Productos:</h4>
            <div className="modal-product-list-horizontal">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.product_id}
                  className="modal-product-item-horizontal"
                >
                  <p>
                    <strong>Producto:</strong> {item.product_name}
                  </p>
                  <p>
                    <strong>Descripción:</strong> {item.product_description}
                  </p>
                  <p>
                    <strong>Cantidad:</strong> {item.quantity}
                  </p>
                  <p>
                    <strong>Precio:</strong> $
                    {parseFloat(item.price).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-shipping-info-horizontal">
            <h4>Información de Envío:</h4>
            <p>
              <strong>Método de Envío:</strong>{" "}
              {selectedOrder.shippingInfo.shipping_method}
            </p>
            <p>
              <strong>Número de Rastreo:</strong>{" "}
              {selectedOrder.shippingInfo.tracking_number}
            </p>
            <p>
              <strong>Fecha Estimada de Entrega:</strong>{" "}
              {new Date(
                selectedOrder.shippingInfo.estimated_delivery
              ).toLocaleDateString()}
            </p>
            <p>
              <strong>Fecha de Entrega:</strong>{" "}
              {new Date(
                selectedOrder.shippingInfo.actual_delivery
              ).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );

  return (
    <>
      <Navbar />
      <div className="user-profile-container">
        {view === "welcome" && renderWelcome()}
        {view === "profile" && renderProfile()}
        {view === "orders" && renderOrders()}
        {renderOrderDetailsModal()}
      </div>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default Profile;
