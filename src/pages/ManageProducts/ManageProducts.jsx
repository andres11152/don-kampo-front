import React, { useState, useEffect } from "react";
import Header from "../../components/General/Header";
import BotonWhatsapp from "../../components/General/BotonWhatsapp";
import CustomFooter from "../../components/General/Footer";
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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import fruits from '../../assets/fruits.jpg'

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
      const response = await axios.get("https://don-kampo-api.onrender.com/api/products");
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
      await axios.delete(`https://don-kampo-api.onrender.com/api/deleteproduct/${productId}`);
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
        `https://don-kampo-api.onrender.com/api/updateproduct/${selectedProduct.product_id}`,
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
      // Fetch products from the database
      const response = await axios.get("https://don-kampo-api.onrender.com/api/products", {
        withCredentials: true,
      });
  
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('No se pudieron obtener los productos correctamente.');
      }
  
      const products = response.data;
  
      // Crear datos para la hoja Products
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
  
      // Crear tabla para la hoja Products
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
  
      // Crear arreglo de variaciones agrupadas por índice
      const variations = [];
  
      products.forEach((product) => {
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach((variation, index) => {
            // Asegurarse de que el array `variations` tenga el tamaño suficiente
            if (!variations[index]) {
              variations[index] = [];
            }
  
            // Agregar la variación al índice correspondiente
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
  
      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();
  
      // Añadir hoja Products
      XLSX.utils.book_append_sheet(workbook, productSheet, 'Products');
  
      // Crear hojas de Variation
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
  
      // Generar archivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
      // Descargar archivo Excel
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'Products.xlsx');
  
    } catch (error) {
      console.error('Error generando el archivo Excel:', error);
    }
  };
  
  return (
    <>
      <img id="fruits" src={fruits} alt="" />
      <Header />
      <section className="manage-products-container">
        <h2>Gestión de Productos</h2>

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
      </section>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default ManageProducts;
