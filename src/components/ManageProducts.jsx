import React, { useState, useEffect } from "react";
import Header from "components/General/Header";
import BotonWhatsapp from "components/General/BotonWhatsapp";
import CustomFooter from "components/General/Footer";
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
  Tabs,
  Select,
} from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CreateProduct from "components/CreateProduct/CreateProduct";
import UpdateMultipleProducts from "components/CreateProduct/UpdateMultipleProducts";
import "css/ManageProducts.css";
import UpdateOrderPrices from "components/Orders/UpdateOrdersPending";
import OrderManagement from "components/Orders/Orders";
import SalesReport from "components/SalesReport";

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

  const removeVariation = (index) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    setVariations(updatedVariations);
  };

  const updateVariation = (index, field, value) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setVariations(updatedVariations);
  };

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

  const deleteProduct = async (productId) => {
    try {
      await axios.delete(`http://localhost:8080/api/deleteproduct/${productId}`);
      message.success("Producto eliminado correctamente.");
      fetchProducts();
    } catch (error) {
      message.error("Error al eliminar el producto.");
      console.error(error);
    }
  };

  const showEditModal = (product) => {
    setSelectedProduct(product);
    form.setFieldsValue(product);
    setVariations(product.variations || []);
    setIsModalVisible(true);
  };

  const handleUpdateProduct = async (values) => {
    try {
      const updatedProduct = {
        ...values,
        variations,
      };
      await axios.put(
        `http://localhost:8080/api/updateproduct/${selectedProduct.product_id}`,
        updatedProduct
      );
      message.success("Producto actualizado correctamente.");
      setIsModalVisible(false);
      fetchProducts();
    } catch (error) {
      message.error("Error al actualizar el producto.");
      console.error(error);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

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
        <div style={{ display: "flex", justifyContent: 'space-evenly' }}>
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

  const generateExcelFromProducts = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/products", {
        withCredentials: true,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('No se pudieron obtener los productos correctamente.');
      }

      const products = response.data;

      const productSheetData = [['Id', 'Nombre', 'Descripcion', 'Categoria', 'Stock']];
      products.forEach((product) => {
        productSheetData.push([
          product.product_id,
          product.name,
          product.description,
          product.category,
          product.stock,
        ]);
      });

      const productSheet = XLSX.utils.aoa_to_sheet(productSheetData);
      productSheet['!ref'] = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: productSheetData[0].length - 1, r: productSheetData.length - 1 },
      });
      productSheet['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: productSheetData[0].length - 1, r: 0 },
        }),
      };

      const variations = [];
      products.forEach((product) => {
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach((variation, index) => {
            if (!variations[index]) {
              variations[index] = [];
            }

            variations[index].push({
              product_id: product.product_id,
              product_name: product.name,
              variation_id: variation.variation_id,
              quality: variation.quality,
              quantity: variation.quantity,
              price_home: variation.price_home,
              price_supermarket: variation.price_supermarket,
              price_restaurant: variation.price_restaurant,
              price_fruver: variation.price_fruver,
            });
          });
        }
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, productSheet, 'Products');

      variations.forEach((variationGroup, index) => {
        const variationSheetName = `Variation ${index + 1}`;
        const variationSheetData = [
          ['Id Product', 'Producto', 'Id Variation', 'Calidad', 'Cantidad', 'Hogar', 'Supermercado', 'Restaurant', 'Fruver'],
        ];

        variationGroup.forEach((variation) => {
          variationSheetData.push([
            variation.product_id,
            variation.product_name,
            variation.variation_id,
            variation.quality,
            variation.quantity,
            variation.price_home,
            variation.price_supermarket,
            variation.price_restaurant,
            variation.price_fruver,
          ]);
        });

        const variationSheet = XLSX.utils.aoa_to_sheet(variationSheetData);
        variationSheet['!ref'] = XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: variationSheetData[0].length - 1, r: variationSheetData.length - 1 },
        });
        variationSheet['!autofilter'] = {
          ref: XLSX.utils.encode_range({
            s: { c: 0, r: 0 },
            e: { c: variationSheetData[0].length - 1, r: 0 },
          }),
        };

        XLSX.utils.book_append_sheet(workbook, variationSheet, variationSheetName);
      });

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'Products.xlsx');

    } catch (error) {
      console.error('Error generando el archivo Excel:', error);
    }
  };

  return (
    <>
      <Header />
      <section className="manage-products-container">
        <Tabs defaultActiveKey="1" >
          <Tabs.TabPane tab="Gestión Productos" key="1" >
          <h2>Gestionar Productos</h2>

            <div className="manage-search">
              <Input
                placeholder="Buscar producto por nombre"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ marginBottom: "16px", width: "300px" }}
              />
              <button onClick={generateExcelFromProducts}>Generar Excel</button>
              <i onClick={fetchProducts} className="fa-solid fa-rotate-right" />
            </div>
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
              width={800}
            >
              <Form
                form={form}
                onFinish={handleUpdateProduct}
                layout="horizontal"
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      label="Nombre"
                      name="name"
                      rules={[{ required: true, message: "Por favor ingresa el nombre del producto" }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Categoría"
                      name="category"
                      rules={[{ required: true, message: "Por favor selecciona una categoría" }]}
                    >
                      <Select placeholder="Selecciona una categoría">
                        <Select.Option value="Frutas importadas">Frutas importadas</Select.Option>
                        <Select.Option value="Verduras">Verduras</Select.Option>
                        <Select.Option value="Frutas nacionales">Frutas nacionales</Select.Option>
                        <Select.Option value="Cosechas">Cosechas</Select.Option>
                        <Select.Option value="Hortalizas">Hortalizas</Select.Option>
                        <Select.Option value="Promociones">Promociones</Select.Option>
                        <Select.Option value="Otros">Otros</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item
                      label="Descripción"
                      name="description"
                      rules={[{ required: true, message: "Por favor ingresa una descripción" }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <div>
                  <h3>Variaciones</h3>
                  {variations.map((variation, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "16px",
                        padding: "16px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Form.Item label={`Calidad (Var ${index + 1})`}>
                            <Input
                              placeholder="Calidad"
                              value={variation.quality}
                              onChange={(e) => updateVariation(index, "quality", e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={`Cantidad (Var ${index + 1})`}>
                            <Input
                              placeholder="Cantidad"
                              value={variation.quantity}
                              onChange={(e) => updateVariation(index, "quantity", e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Form.Item label={`Precio Hogar (Var ${index + 1})`}>
                            <InputNumber
                              placeholder="Precio Hogar"
                              value={variation.price_home}
                              onChange={(value) => updateVariation(index, "price_home", value)}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={`Precio Supermercado (Var ${index + 1})`}>
                            <InputNumber
                              placeholder="Precio Supermercado"
                              value={variation.price_supermarket}
                              onChange={(value) => updateVariation(index, "price_supermarket", value)}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Form.Item label={`Precio Restaurante (Var ${index + 1})`}>
                            <InputNumber
                              placeholder="Precio Restaurante"
                              value={variation.price_restaurant}
                              onChange={(value) => updateVariation(index, "price_restaurant", value)}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={`Precio Fruver (Var ${index + 1})`}>
                            <InputNumber
                              placeholder="Precio Fruver"
                              value={variation.price_fruver}
                              onChange={(value) => updateVariation(index, "price_fruver", value)}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Button
                        type="danger"
                        onClick={() => removeVariation(index)}
                        style={{
                          marginTop: "8px",
                          backgroundColor: "#ff4d4f", // Color rojo
                          color: "#fff", // Texto blanco
                          border: "none", // Elimina el borde
                        }}
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
          </Tabs.TabPane>
          <Tabs.TabPane tab="Creación Productos" key="2">
            <CreateProduct />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Actualización Productos" key="3">
            <UpdateMultipleProducts />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Actualización Ordenes" key="4">
            <UpdateOrderPrices />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Ordenes" key="5">
            <OrderManagement />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Ventas" key="6">
           <SalesReport />
          </Tabs.TabPane>
        </Tabs>
      </section>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default ManageProducts;
