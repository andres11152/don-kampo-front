import React, { useState } from "react";
import * as XLSX from 'xlsx';
import Header from "../../components/General/Header";
import CustomFooter from "../../components/General/Footer";
import {
  Form,
  Input,
  Button,
  Upload,
  InputNumber,
  Select,
  Row,
  Col,
  message,
} from "antd";
import axios from "axios";
import BotonWhatsapp from "../../components/General/BotonWhatsapp";
import { UploadOutlined } from "@ant-design/icons";
import "./CreateProduct.css";

const { Option } = Select;

const CreateProduct = () => {
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [variations, setVariations] = useState([
    {
      quality: "",
      quantity: "",
      price_home: "",
      price_supermarket: "",
      price_restaurant: "",
      price_fruver: "",
    },
  ]);
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/products", {
        withCredentials: true,
      });

      if (response.data && Array.isArray(response.data)) {
        const updatedProducts = response.data.map((product) => ({
          ...product,
          variations: Array.isArray(product.variations)
            ? product.variations.map((variation, index) => ({
                ...variation,
                variation_id: `${product.product_id}-${index}`,
              }))
            : [],
        }));

        setProducts(updatedProducts);
      } else {
        throw new Error("Datos de productos incorrectos o vacíos");
      }
    } catch (error) {
      message.error("Error al cargar los productos.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const processExcelFile = (file) => {
    fetchProducts(); // Carga los productos de la base de datos
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
  
      const sheetNames = workbook.SheetNames;
  
      // Validar que exista la hoja Products
      if (!sheetNames.includes('Products')) {
        console.error('El archivo debe tener una hoja llamada "Products".');
        return;
      }
  
      // Leer hoja Products
      const productsSheet = workbook.Sheets['Products'];
      const productsTable = XLSX.utils.sheet_to_json(productsSheet, { header: 1 });
  
      const excelProducts = [];
      const headers = productsTable[0];
      const requiredHeaders = ['Id', 'Nombre', 'Descripcion', 'Categoria', 'Stock'];
  
      if (!requiredHeaders.every((header) => headers.includes(header))) {
        console.error('La hoja "Products" no tiene los encabezados requeridos.');
        return;
      }
  
      // Convertir la tabla Products a objetos
      productsTable.slice(1).forEach((row) => {
        const product = {
          product_id: row[headers.indexOf('Id')],
          name: row[headers.indexOf('Nombre')],
          description: row[headers.indexOf('Descripcion')],
          category: row[headers.indexOf('Categoria')],
          stock: row[headers.indexOf('Stock')],
          variations: [], // Inicializar la lista de variaciones vacía
        };
        excelProducts.push(product);
      });
  
      console.log('Productos de Excel:', excelProducts);
  
      // Procesar hojas Variation
      const variationSheets = sheetNames.filter((name) => name.startsWith('Variation'));
  
      variationSheets.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const table = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = table[0];
  
        if (
          ![
            'Id Product',
            'Id Variation',
            'Calidad',
            'Cantidad',
            'Hogar',
            'Supermercado',
            'Restaurant',
            'Fruver',
          ].every((header) => headers.includes(header))
        ) {
          console.error(`La hoja "${sheetName}" no tiene los encabezados requeridos.`);
          return;
        }
  
        // Convertir las variaciones y asociarlas directamente al producto
        table.slice(1).forEach((row) => {
          const productId = row[headers.indexOf('Id Product')];
          const variation = {
            variation_id: row[headers.indexOf('Id Variation')],
            quality: row[headers.indexOf('Calidad')],
            quantity: row[headers.indexOf('Cantidad')],
            price_home: row[headers.indexOf('Hogar')],
            price_supermarket: row[headers.indexOf('Supermercado')],
            price_restaurant: row[headers.indexOf('Restaurant')],
            price_fruver: row[headers.indexOf('Fruver')],
          };
  
          // Buscar el producto correspondiente en excelProducts
          const product = excelProducts.find((p) => p.product_id === productId);
          if (product) {
            product.variations.push(variation); // Añadir la variación al producto
          } else {
            console.warn(`No se encontró un producto con Id ${productId} para asociar la variación.`);
          }
        });
      });
  
      console.log('Productos con variaciones:', excelProducts);
  
      // // Aquí puedes comparar excelProducts con products (los datos de la API) y detectar cambios
      // excelProducts.forEach((product) => {
      //   const existingProduct = products.find((p) => p.product_id === product.product_id);
      //   if (existingProduct) {
      //     // Comparar propiedades del producto y sus variaciones
      //     // ...
      //   }
      // });
    };
  
    reader.readAsArrayBuffer(file);
  };
  
  const uploadProps = {
    accept: ".xlsx, .xls",
    beforeUpload: (file) => {
      processExcelFile(file);
      return false;
    }
  };

  const handleImageUpload = ({ file }) => file && setImageFile(file);

  const handleVariationChange = (index, field, value) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setVariations(updatedVariations);
  };

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
    const updatedVariations = [...variations];
    updatedVariations.splice(index, 1);
    setVariations(updatedVariations);
  };

  const handleSubmit = async (values) => {
    // Crear el objeto de datos del producto
    const productData = {
      name: values.name,
      description: values.description,
      category: values.category,
      stock: 100, // Ajusta el stock según sea necesario
      variations: variations.map((variation) =>({        
        quality: variation.quality,
        quantity: variation.quantity,
        price_home: parseFloat(variation.price_home),
        price_supermarket: parseFloat(variation.price_supermarket),
        price_restaurant: parseFloat(variation.price_restaurant),
        price_fruver: parseFloat(variation.price_fruver),
      })),
    };  
    
    // Crear un FormData para incluir la imagen y el JSON completo
    const formData = new FormData();
    
    // Adjuntar la imagen como binary
    imageFile && formData.append("photo_url", imageFile);
  
    // Convertir el objeto `productData` a JSON y adjuntarlo al FormData
    Object.keys(productData).forEach(key => {
      key === "variations" ? formData.append(key, JSON.stringify(productData[key]))
      : formData.append(key, productData[key]);
    });
  
    try {
      const response = await axios.post(
        "http://localhost:8080/api/createproduct",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
  
      message.success(
        `Producto creado exitosamente con ID: ${response.data.product_id}`
      );
      form.resetFields();
      setImageFile(null);
      setVariations([
        {
          quality: "",
          quantity: "",
          price_home: "",
          price_supermarket: "",
          price_restaurant: "",
          price_fruver: "",
        },
      ]);
    } catch (error) {
      message.error("Error al crear el producto.");
      console.error(error);
    }
  };

  return (
    <>
      <Header />
      <form onSubmit={handleSubmit} className="create-product">
        <section className="main-data">
          <h2>Crear Producto</h2>
          
          <div>
            <Form.Item
              name="name"
              label="Nombre del Producto"
              rules={[
                { required: true, message: "Por favor ingresa el nombre" },
              ]}
            >
              <Input placeholder="Nombre del producto" />
            </Form.Item>
            <Form.Item
              name="category"
              label="Categoría"
              rules={[
                {
                  required: true,
                  message: "Por favor selecciona una categoría",
                },
              ]}
            >
              <Select placeholder="Selecciona una categoría">
                <Option value="Frutas importadas">Frutas importadas</Option>
                <Option value="Verdura">Verdura</Option>
                <Option value="Frutas nacionales">Frutas nacionales</Option>
                <Option value="Cosecha">Cosecha</Option>
                <Option value="Hortalizas">Hortalizas</Option>
                <Option value="Otros">Otros</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[
              {
                required: true,
                message: "Por favor ingresa una descripción",
              },
            ]}
          >
            <Input.TextArea placeholder="Descripción del producto" />
          </Form.Item>
          
          <Form.Item label="Foto del Producto">
            <Upload
              beforeUpload={() => false} // Evitar la subida automática
              onChange={handleImageUpload} // Manejar el archivo seleccionado
              accept="image/*" // Solo permitir imágenes
              maxCount={1} // Solo permitir una imagen
            >
              <Button icon={<UploadOutlined />}>Subir Imagen</Button>
            </Upload>
            {imageFile && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={URL.createObjectURL(imageFile)} // Mostrar una vista previa del archivo seleccionado
                  alt="Vista previa"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </div>
            )}
          </Form.Item>
        </section>

        <section className="variation-data">
          <h3>Variaciones del Producto</h3>
          {variations.map((variation, index) => (
            <div key={index} className="variation-fields">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Input
                    placeholder="Calidad (Ej: Primera, Segunda)"
                    value={variation.quality}
                    onChange={(e) =>
                      handleVariationChange(index, "quality", e.target.value)
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="Cantidad (Ej: 1kg, 2kg)"
                    value={variation.quantity}
                    onChange={(e) =>
                      handleVariationChange(index, "quantity", e.target.value)
                    }
                  />
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <InputNumber
                    min={0}
                    placeholder="Precio Hogar"
                    value={variation.price_home}
                    onChange={(value) =>
                      handleVariationChange(index, "price_home", value)
                    }
                    style={{ width: "100%" }}
                  />
                </Col>
                <Col span={12}>
                  <InputNumber
                    min={0}
                    placeholder="Precio Supermercado"
                    value={variation.price_supermarket}
                    onChange={(value) =>
                      handleVariationChange(index, "price_supermarket", value)
                    }
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <InputNumber
                    min={0}
                    placeholder="Precio Restaurante"
                    value={variation.price_restaurant}
                    onChange={(value) =>
                      handleVariationChange(index, "price_restaurant", value)
                    }
                    style={{ width: "100%" }}
                  />
                </Col>
                <Col span={12}>
                  <InputNumber
                    min={0}
                    placeholder="Precio Fruver"
                    value={variation.price_fruver}
                    onChange={(value) =>
                      handleVariationChange(index, "price_fruver", value)
                    }
                    style={{ width: "100%" }}
                  />
                </Col>
              </Row>
              <Button
                onClick={() => removeVariation(index)}
                type="danger"
                style={{ marginTop: 10 }}
              >
                Eliminar Variación
              </Button>
            </div>
          ))}
        </section>

        <section className="submit">
          <Button onClick={addVariation}> Añadir Variación </Button>

          <Form.Item className="create">
            <Button type="primary" htmlType="submit" block> Crear Producto </Button>
          </Form.Item>

          <Upload {...uploadProps} > 
            <Button icon={<UploadOutlined />}> Añadir multiples productos (EXCEL) </Button> 
          </Upload>
        </section>
      </form>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default CreateProduct;
