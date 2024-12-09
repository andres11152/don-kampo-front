import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import BotonWhatsapp from "../../components/botonWhatsapp/BotonWhatsapp";
import CustomFooter from "../../components/footer/Footer";
import {
  Table,
  Input,
  Button,
  message,
  Popconfirm,
  Modal,
  Form,
  Row,
  Col,
  InputNumber,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "./ManageProducts.css";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  const addVariation = () => {
    setVariations([
      ...variations,
      {
        quality: "",
        quantity: "",
        price_home: "",
        price_supermarket: "",
        price_restaurant: "",
        price_fruver: "",
      },
    ]);
  };
  

  // Función para eliminar una variación
  const removeVariation = (index) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    setVariations(updatedVariations);
  };

  const updateVariation = (index, field, value) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setVariations(updatedVariations);
  };

  // Función para obtener los productos
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8080/api/products");
      setProducts(response.data);
      message.success("Productos cargados correctamente.");
    } catch (error) {
      message.error("Error al cargar los productos.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un producto
  const deleteProduct = async (productId) => {
    try {
      await axios.delete(`http://localhost:8080/api/deleteproduct/${productId}`);
      message.success("Producto eliminado correctamente.");
      fetchProducts(); // Actualizar lista después de eliminar
    } catch (error) {
      message.error("Error al eliminar el producto.");
      console.error(error);
    }
  };

  // Mostrar modal para editar un producto
  const showEditModal = (product) => {
    setSelectedProduct(product);
    form.setFieldsValue(product); // Setear datos básicos del producto
    setVariations(product.variations || []); // Cargar las variaciones existentes
    setIsModalVisible(true);
  };
  

  // Función para manejar la actualización de productos
  const handleUpdateProduct = async (values) => {
    try {
      const updatedProduct = {
        ...values,
        variations, // Incluir variaciones
      };

      await axios.put(
        `http://localhost:8080/api/updateproduct/${selectedProduct.product_id}`,
        updatedProduct
      );
      message.success("Producto actualizado correctamente.");
      setIsModalVisible(false);
      fetchProducts(); // Refrescar lista después de actualizar
    } catch (error) {
      message.error("Error al actualizar el producto.");
      console.error(error);
    }
  };

  // Filtrar productos por texto
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Columnas para la tabla
  const columns = [
    {
      title: "ID",
      dataIndex: "product_id",
      key: "product_id",
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Categoría",
      dataIndex: "category",
      key: "category",
    },

    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title={`¿Eliminar el producto "${record.name}"?`}
            onConfirm={() => deleteProduct(record.product_id)}
            okText="Sí"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <h2>Gestión de Productos</h2>
        <Input
          placeholder="Buscar producto por nombre"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ marginBottom: "16px", width: "300px" }}
        />
        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey="product_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
        <Modal
          title="Editar Producto"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form form={form} onFinish={handleUpdateProduct} layout="vertical">
            <Form.Item
              label="Nombre"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Por favor ingresa el nombre del producto",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Descripción"
              name="description"
              rules={[
                {
                  required: true,
                  message: "Por favor ingresa una descripción",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Categoría"
              name="category"
              rules={[
                { required: true, message: "Por favor ingresa una categoría" },
              ]}
            >
              <Input />
            </Form.Item>
            {/* <Form.Item
              label="Stock"
              name="stock"
              rules={[
                { required: true, message: "Por favor ingresa el stock" },
              ]}
            >
              <Input type="number" />
            </Form.Item> */}

            <div>
              <h3>Variaciones</h3>
              {variations.map((variation, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "16px",
                    padding: "16px",
                    border: "1px solid #ddd",
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item label={`Calidad (Variación ${index + 1})`}>
                        <Input
                          placeholder="Calidad"
                          value={variation.quality}
                          onChange={(e) =>
                            updateVariation(index, "quality", e.target.value)
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={`Cantidad (Variación ${index + 1})`}>
                        <Input
                          placeholder="Cantidad"
                          value={variation.quantity}
                          onChange={(e) =>
                            updateVariation(index, "quantity", e.target.value)
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label={`Precio Hogar (Variación ${index + 1})`}
                      >
                        <InputNumber
                          placeholder="Precio Hogar"
                          value={variation.price_home}
                          onChange={(value) =>
                            updateVariation(index, "price_home", value)
                          }
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={`Precio Supermercado (Variación ${index + 1})`}
                      >
                        <InputNumber
                          placeholder="Precio Supermercado"
                          value={variation.price_supermarket}
                          onChange={(value) =>
                            updateVariation(index, "price_supermarket", value)
                          }
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label={`Precio Restaurante (Variación ${index + 1})`}
                      >
                        <InputNumber
                          placeholder="Precio Restaurante"
                          value={variation.price_restaurant}
                          onChange={(value) =>
                            updateVariation(index, "price_restaurant", value)
                          }
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={`Precio Fruver (Variación ${index + 1})`}
                      >
                        <InputNumber
                          placeholder="Precio Fruver"
                          value={variation.price_fruver}
                          onChange={(value) =>
                            updateVariation(index, "price_fruver", value)
                          }
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button
                    type="danger"
                    onClick={() => removeVariation(index)}
                    style={{ marginTop: "8px" }}
                  >
                    Eliminar Variación
                  </Button>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={addVariation}
                style={{ marginTop: "16px", width: "100%" }}
              >
                Agregar Variación
              </Button>
            </div>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Guardar Cambios
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default ManageProducts;
