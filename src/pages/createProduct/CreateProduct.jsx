import React, { useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import CustomFooter from "../../components/footer/Footer";
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
import BotonWhatsapp from "../../components/botonWhatsapp/BotonWhatsapp";
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

  const handleImageUpload = ({ file }) => {
    if (file) {
      setImageFile(file); // Guardar el archivo seleccionado
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
      variations: variations.map((variation) => ({
        quality: variation.quality,
        quantity: parseFloat(variation.quantity),
        price_home: parseFloat(variation.price_home),
        price_supermarket: parseFloat(variation.price_supermarket),
        price_restaurant: parseFloat(variation.price_restaurant),
        price_fruver: parseFloat(variation.price_fruver),
      })),
    };
  
    // Crear un FormData para incluir la imagen y el JSON completo
    const formData = new FormData();
    
    // Adjuntar la imagen como binary
    if (imageFile) {
      formData.append("photo_url", imageFile); // Archivo binario
    }
  
    // Convertir el objeto `productData` a JSON y adjuntarlo al FormData
    Object.keys(productData).forEach((key) => {
      if (key === "variations") {
        formData.append(key, JSON.stringify(productData[key])); // Convertir variaciones a string JSON
      } else {
        formData.append(key, productData[key]);
      }
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
      <Navbar />
      <div className="create-product-container">
        <h2>Crear Producto</h2>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Nombre del Producto"
                rules={[
                  { required: true, message: "Por favor ingresa el nombre" },
                ]}
              >
                <Input placeholder="Nombre del producto" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
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
            </Col>
            {/* <Col span={12}>
              <Form.Item
                name="stock"
                label="Cantidad en stock"
                rules={[
                  { required: true, message: "Por favor ingresa el stock" },
                ]}
              >
                <InputNumber
                  min={1}
                  placeholder="Cantidad en stock"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col> */}
          </Row>

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

          <Button
            onClick={addVariation}
            type="dashed"
            style={{ marginTop: 20, width: "100%" }}
          >
            Añadir Variación
          </Button>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Crear Producto
            </Button>
          </Form.Item>
        </Form>
      </div>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default CreateProduct;
