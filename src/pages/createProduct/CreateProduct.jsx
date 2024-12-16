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
import fruits from '../../assets/fruits.jpg'

const { Option } = Select;

const CreateProduct = () => {
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [processExcel, setProcessExcel] = useState({message: '', status: ''})
  const [messageButton, setMessageButton] = useState('Continuar')
  const [updateProducts, setUpdateProducts] = useState([])
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
  const [values, setValues] = useState({'name': '', 'category': '', 'description': ''})


  const processingExcel = async (file) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    setIsLoading(true)
    setProcessExcel({message: 'Procesando archivo Excel', status: ''})
    await sleep(2000)
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
  
        // Leer la hoja Products
        const productSheet = workbook.Sheets['Products'];
        if (!productSheet) {
          setProcessExcel({message: 'La hoja Products no existe.', status: 'error'})
          throw new Error('La hoja Products no existe en el archivo Excel.');
        }
  
        const productData = XLSX.utils.sheet_to_json(productSheet, { header: 1 });
        if (productData.length < 2) {
          setProcessExcel({message: 'La hoja Products no contiene datos.', status: 'error'})
          throw new Error('La hoja Products no contiene datos suficientes.');
        }
        
        const headers = productData[0];
        const productRows = productData.slice(1).filter(row => row.length > 0);
        
        // Convertir filas a objetos
        const excelProducts = productRows.map((row) => {
          const product = {};
          headers.forEach((header, index) => {
            product[header] = row[index];
          });
          return {
            product_id: product['Id'],
            name: product['Nombre'],
            description: product['Descripcion'],
            category: product['Categoria'],
            photo_url: null,
            stock: product['Stock'],
            variations: [], // Inicialmente vacío, se llenará más adelante
          };
        });
  
        setProcessExcel({message: 'Productos obtenidos de excel.', status: ''})
        await sleep(2000)

        // obtengo todos los productos
        const response = await axios.get("http://localhost:8080/api/products", { withCredentials: true });
        const products = response.data
        // Filtro los productos cuyo id sea igual a los de la base de datos
        const totalExcelProducts = excelProducts.filter(excelProduct => products.some(product => product.product_id === excelProduct.product_id));
                
        // Leer hojas de Variation
        const variationSheets = Object.keys(workbook.Sheets).filter((sheetName) =>
          /^Variation \d+$/.test(sheetName)
        );
  
        variationSheets.forEach((sheetName) => {
          const variationSheet = workbook.Sheets[sheetName];
          const variationData = XLSX.utils.sheet_to_json(variationSheet, { header: 1 });
  
          if (variationData.length < 2) {
            console.warn(`La hoja ${sheetName} no contiene datos suficientes.`);
            setProcessExcel({message: 'La hoja ${sheetName} no contiene datos suficientes.', status: 'warning'})
            return;
          }
  
          const variationHeaders = variationData[0];
          const variationRows = variationData.slice(1);
  
          variationRows.forEach((row) => {
            const variation = {};
            variationHeaders.forEach((header, index) => {
              variation[header] = row[index];
            });
  
            const product = totalExcelProducts.find((p) => p.product_id === variation['Id Product']);
            if (product) {
              product.variations.push({
                variation_id: variation['Id Variation'],
                quality: variation['Calidad'],
                quantity: variation['Cantidad'],
                price_home: variation['Hogar'],
                price_supermarket: variation['Supermercado'],
                price_restaurant: variation['Restaurant'],
                price_fruver: variation['Fruver'],
              });
            }
          });
        });

        setProcessExcel({message: 'Variaciones obtenidas de excel.', status: ''})
        await sleep(1000)
        setProcessExcel({message: `${totalExcelProducts.length} de ${excelProducts.length} productos por actualizar `, status:'info'})
        setMessageButton(`Actualizar Productos`)
        setUpdateProducts(totalExcelProducts)
      } catch (error) { 
        console.error('Error procesando el archivo Excel:', error); 
        setProcessExcel({message: 'Error procesando el archivo Excel' + error, status: 'error'})
        setMessageButton('Cancelar')
      }
    };
  
    reader.readAsArrayBuffer(file);
  };
  
  const uploadProps = {
    accept: ".xlsx, .xls",
    beforeUpload: (file) => {
      processingExcel(file);
      return false;
    }
  };

  const updatingProducts = (event) => {   
    event.preventDefault()
    console.log(updateProducts);
    
    setProcessExcel({message: 'Actualizando productos', status: ''})
    axios.put("http://localhost:8080/api/updatemultipleproducts", updateProducts, {
      headers: { 'Content-Type': 'application/json' },
    })
    .then((response) => {
      setProcessExcel({message: 'Productos actualizados exitosamente', status: 'success'})
      setMessageButton('Continuar')
    })
    .catch((error) => {
      console.error("Error procesando el archivo Excel:", error);
      setProcessExcel({message: 'Error procesando el archivo Excel', status: 'error'})
      setMessageButton('Cancelar')
    });
  }

  const closeModal = () => {
    setIsLoading(false);
    processExcel.status === 'success' && window.location.reload();
  }

  const handleImageUpload = ({ file }) => {
    file && setImageFile(file)    
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

  const handleValues = (key, value) => {
    setValues(prev => ({...prev, [key]: value}))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isVariations = variations.every(variation => 
      Object.keys(variation).every(key => 
        variation[key] !== null && variation[key] !== undefined
    ))
    
    const isValues = Object.keys(values).every(key => values[key] !== null && values[key] !== undefined && values[key] !== '')
    
    if (!isValues) {
      message.error('No se ingresaron los datos')
      return
    }
    else if (!isVariations) {
      message.error('Faltan datos en las variaciones')
      return
    }
    
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
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      await sleep(1500)
      window.location.reload()
    } catch (error) {
      message.error("Error al crear el producto.");
      console.error(error);
    }
  };

  return (
    <>
      <img id="fruits" src={fruits} alt="" />
      <Header />
      <form onSubmit={(e) => handleSubmit(e)} className="create-product">

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
              <Input onChange={(e) => handleValues('name', e.target.value)} placeholder="Nombre del producto" />
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
              <Select onChange={(value) => handleValues('category', value)} placeholder="Selecciona una categoría">
                <Option value="Frutas importadas">Frutas importadas</Option>
                <Option value="Verdura">Verdura</Option>
                <Option value="Frutas nacionales">Frutas nacionales</Option>
                <Option value="Cosecha">Cosecha</Option>
                <Option value="Hortalizas">Hortalizas</Option>
                <Option value="Promociones">Promociones</Option>
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
            <Input.TextArea onChange={(e) => handleValues('description', e.target.value)} placeholder="Descripción del producto" />
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
              <h4>{index + 1}</h4>
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
              {index > 0 &&
                <Button
                  onClick={() => removeVariation(index)}
                  type="danger"
                  style={{ marginTop: 10 }}
                >
                  Eliminar Variación
                </Button>
              }
            </div>
          ))}
        </section>

        <section className="submit">
          <Button onClick={addVariation} className="variation"> Añadir Variación </Button>

          <Form.Item className="create">
            <Button type="primary" htmlType="submit" block> Crear Producto </Button>
          </Form.Item>

          <Upload {...uploadProps}> 
            <Button className="excel" icon={<UploadOutlined />}> Actualicer multiples productos (EXCEL) </Button> 
          </Upload>
        </section>

        {isLoading &&
          <div className='isLoading'> 
              <div className={processExcel.status}>
                <i className={`fa-solid fa-${processExcel.status == 'success' ? 'circle-check' : processExcel.status == 'error' ? 'circle-xmark' : processExcel.status == 'info' ? 'circle-info' : 'spinner'}
                  ${processExcel.status == '' && 'spin'}`} 
                />
                <span>{processExcel.message}</span>
                
                { processExcel.status === 'info' && <button onClick={updatingProducts}> {messageButton} </button> }
                {(processExcel.status === 'success' || processExcel.status === 'error' ) &&
                  <button onClick={closeModal}> {messageButton} </button>
                }
              </div>
          </div>
        }
      </form>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default CreateProduct;
