import React, { useState, useEffect } from "react";
import Header from "components/General/Header";
import FloatingButtons from "components/General/FloatingButtons";
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
  Switch,
} from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CreateProduct from "components/Products/CreateProduct";
import UpdateMultipleProducts from "components/Products/UpdateMultipleProducts";

import validatePriceVariations from "utils/validatePriceVariations"
import getFetch from "utils/getFetch"

import "css/ManageData.css";
import { Orders, UpdateOrderPrices } from "components/Orders";
import SalesReport from "components/SalesReport";
import { Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';


const ManageData = () => {
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);

  const fetchProducts = (msg = { success: "Productos cargados correctamente.", error: "Error al cargar los productos." }) => {
    setLoading(true);
    getFetch('products', '')
      .then(fetchedProducts => {
        setProducts(fetchedProducts);
        message.success(msg.success);
      })
      .catch(error => {
        message.error(msg.error);
        console.error(error);
      })
      .finally(setLoading(false))
  };

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
        active: false,
      },
    ]);
  };

  const removeVariation = (index) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    setVariations(updatedVariations);
  };

  const deleteProduct = async (productId) => {
    try {
      await axios.delete(`https://don-kampo-api-5vf3.onrender.com/api/deleteproduct/${productId.toLocaleString()}`);
      fetchProducts({ success: "Producto eliminado correctamente.", error: "Error al eliminar el producto." });
    } catch (error) {
      console.error(error);
    }
  };

  const showEditModal = (product) => {
    setSelectedProduct(product);
    form.setFieldsValue(product); // Inicializa los valores del formulario
    setVariations(product.variations || []);
    setImageFile(null); // Reinicia el estado de la imagen
    setIsModalVisible(true);
  };

  const handleUpdateProduct = async (product) => {
    const isValidPriceVariations = validatePriceVariations(product.variations);

    if (isValidPriceVariations) {
      try {
        const formData = new FormData();

        // Agrega la nueva imagen si se seleccionó una
        if (imageFile) {
          formData.append("photo_url", imageFile);
        }

        // Agrega los demás campos del producto
        Object.keys(product).forEach((key) => {
          if (key === "variations") {
            formData.append(key, JSON.stringify(product[key]));
          } else {
            formData.append(key, product[key]);
          }
        });

        // Envía la solicitud al servidor
        await axios.put(
          `https://don-kampo-api-5vf3.onrender.com/api/updateproduct/${selectedProduct.product_id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        setIsModalVisible(false);
        fetchProducts({ success: "Producto actualizado correctamente.", error: "Error al actualizar el producto." });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const updateActive = async (checked, product) => {
    const updatedProduct = {
      ...product,
      active: checked
    }

    try {
      await axios.put(
        `https://don-kampo-api-5vf3.onrender.com/api/updateproduct/${updatedProduct.product_id}`,
        updatedProduct
      );
      setIsModalVisible(false);
      fetchProducts({ success: `Producto ${checked ? '' : 'des'}activado correctamente.`, error: "Error al actualizar el producto." });
    } catch (error) {
      console.error(error);
    }
  }

  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchText.toLowerCase()));

  const generateExcelFromProducts = async () => {
    try {
      const response = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/products", {
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

  const ManageProducts = () => {
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
            <Switch
              checked={record.active}
              onChange={e => updateActive(e, record)}
              checkedChildren="Activo"
              unCheckedChildren="Inactivo"
            />

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
        <h2>Gestionar Productos</h2>

        <div className="manage-search">
          <Input
            placeholder="Buscar producto por nombre"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
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
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setImageFile(null); // Reinicia el estado de la imagen
          }}
          footer={null}
          width={800}
        >
          <Form.Item label="Foto del Producto">
            <Upload
              beforeUpload={() => false} // Evita la subida automática
              onChange={({ file }) => setImageFile(file)} // Guarda el archivo seleccionado
              accept="image/*" // Acepta solo imágenes
              maxCount={1} // Permite solo una imagen
            >
              <Button icon={<UploadOutlined />}>Subir Imagen</Button>
            </Upload>
            {imageFile ? (
              <div style={{ marginTop: 10 }}>
                <img
                  src={URL.createObjectURL(imageFile)} // Muestra la vista previa de la nueva imagen
                  alt="Vista previa"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </div>
            ) : selectedProduct?.photo_url ? (
              <div style={{ marginTop: 10 }}>
                <img
                  src={selectedProduct.photo_url} // Muestra la imagen actual del producto
                  alt="Vista previa"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </div>
            ) : null}
          </Form.Item>
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
              <Col span={12}>
                <Form.Item
                  label="Activar"
                  name="active"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Promocionar"
                  name="promocionar"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Promocionar" unCheckedChildren="No Promocionar" />
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
                      <Form.Item
                        label="Activar/Inactivo"
                        name={["variations", index, "active"]}
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label={`Calidad (Var ${index + 1})`}
                        name={["variations", index, "quality"]}
                        rules={[{ required: true, message: `Por favor ingresa la calidad de la variacion ${index + 1}` }]}
                      >
                        <Input placeholder="Calidad" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={`Cantidad (Var ${index + 1})`}
                        name={["variations", index, "quantity"]}
                        rules={[{ required: true, message: `Por favor ingresa la cantidad de la variacion ${index + 1}` }]}
                      >
                        <Input placeholder="Cantidad" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label={`Precio Hogar (Var ${index + 1})`}
                        name={["variations", index, "price_home"]}
                      >
                        <InputNumber placeholder="Precio Hogar" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={`Precio Supermercado (Var ${index + 1})`}
                        name={["variations", index, "price_supermarket"]}
                      >
                        <InputNumber placeholder="Precio Supermercado" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label={`Precio Restaurante (Var ${index + 1})`}
                        name={["variations", index, "price_restaurant"]}
                      >
                        <InputNumber placeholder="Precio Restaurante" style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={`Precio Fruver (Var ${index + 1})`}
                        name={["variations", index, "price_fruver"]}
                      >
                        <InputNumber placeholder="Precio Fruver" style={{ width: "100%" }} />
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
      </>
    )
  }

  return (
    <>
      <Header />
      <section className="manage-products-container">
        <Tabs defaultActiveKey="1" items={[
          // Manage Products
          {
            key: "1",
            label: "Gestión Productos",
            children: <ManageProducts />,
          },
          // Create Product
          {
            key: "2",
            label: "Creación Productos",
            children: <CreateProduct />,
          },
          // Update Multiple Products
          {
            key: "3",
            label: "Actualización Productos",
            children: <UpdateMultipleProducts />,
          },
          // Update Order Prices
          {
            key: "4",
            label: "Actualización Ordenes",
            children: <UpdateOrderPrices />,
          },
          // Orders
          {
            key: "5",
            label: "Ordenes",
            children: <Orders />,
          },
          // Sales Report
          {
            key: "6",
            label: "Ventas",
            children: <SalesReport />,
          }
        ]} />
      </section>
      <FloatingButtons />
      <CustomFooter />
    </>
  );
};

export default ManageData;
