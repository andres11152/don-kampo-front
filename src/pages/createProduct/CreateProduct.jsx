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

  const handleImageUpload = ({ file }) => file && setImageFile(file);

  const processExcelFile = (file) => {
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
  
      const sheetNames = workbook.SheetNames;
  
      // Validar existencia de la hoja Main Data
      if (!sheetNames.includes('Main Data')) {
        console.error("El archivo debe tener una hoja llamada 'Main Data'");
        return;
      }
  
      // Procesar Main Data
      const mainSheet = workbook.Sheets['Main Data'];
      const mainTable = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });
  
      if (mainTable.length < 2) {
        console.error("La hoja 'Main Data' debe contener al menos los encabezados y una fila de datos");
        return;
      }
  
      const headers = mainTable[0];
      const requiredHeaders = ['Nombre', 'Descripcion', 'Categoria', 'Stock'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
      if (missingHeaders.length > 0) {
        console.error(`Faltan los siguientes encabezados: ${missingHeaders.join(', ')}`);
        return;
      }
  
      const products = mainTable.slice(1).map(row => {
        const product = {};
        headers.forEach((header, index) => {
          product[header] = row[index];
        });
        product.variations = []; // Inicializar las variaciones
        return product;
      });
  
      // Validar y procesar hojas Variation
      const variationSheets = sheetNames.filter(name => name.startsWith('Variation'));
  
      if (!variationSheets.includes('Variation 1')) {
        console.error("Debe existir al menos una hoja llamada 'Variation 1'");
        return;
      }
  
      variationSheets.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
  
        // Obtener Variation_Data
        const variationDataTable = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 'A1:C100' }); // Asume que Variation_Data está en el rango A1:C100
        const variationDataHeaders = variationDataTable[0] || [];
  
        if (!['Calidad', 'Cantidad', 'Medida'].every(h => variationDataHeaders.includes(h))) {
          console.error(`La hoja ${sheetName} debe contener una tabla 'Variation_Data' con los encabezados Calidad, Cantidad y Medida`);
          return;
        }
  
        const variationData = variationDataTable.slice(1).map(row => ({
          calidad: row[0],
          cantidad: `${row[1]}${row[2]}` // Concatenar Cantidad y Medida
        }));
  
        // Obtener Variation_Price
        const variationPriceTable = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 'E1:H100' }); // Asume que Variation_Price está en el rango E1:H100
        const variationPriceHeaders = variationPriceTable[0] || [];
  
        if (!['Hogar', 'Supermercado', 'Restaurante', 'Fruver'].every(h => variationPriceHeaders.includes(h))) {
          console.error(`La hoja ${sheetName} debe contener una tabla 'Variation_Price' con los encabezados Hogar, Supermercado, Restaurante y Fruver`);
          return;
        }
  
        const variationPrices = variationPriceTable.slice(1).map(row => ({
          precios: {
            hogar: row[0],
            supermercado: row[1],
            restaurante: row[2],
            fruver: row[3]
          }
        }));
  
        // Combinar datos y precios
        variationData.forEach((data, index) => {
          const prices = variationPrices[index] ? variationPrices[index].precios : {};
          products[index].variations.push({
            calidad: data.calidad,
            cantidad: data.cantidad,
            precios: prices
          });
        });
      });
  
      console.log('Datos procesados:', products);
      // Ahora `products` contiene toda la información con las variaciones
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
