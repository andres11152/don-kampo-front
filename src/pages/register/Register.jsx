import React, { useState } from "react";
import { Form, Input, Button, message, Select, Row, Col } from "antd";
import axios from "axios";
import Navbar from "../../components/navbar/Navbar";
import CustomFooter from "../../components/footer/Footer";
import BotonWhatsapp from "../../components/botonWhatsapp/BotonWhatsapp";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const redirectTo = localStorage.getItem("redirectTo") || "/";
  console.log("traigo el estado de redirect",redirectTo);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const {
      user_name,
      lastname,
      email,
      phone,
      city,
      user_password,
      user_type,
    } = values;
  
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8080/api/createusers", {
        user_name,
        lastname,
        email,
        phone,
        city,
        address: " ",
        neighborhood: " ",
        user_password,
        user_type,
      });
  
      message.success(response.data.msg);
  
      const redirectTo = localStorage.getItem("redirectTo") || "/";
      if (redirectTo === "/cart" ) {
        const reenviar = "/login";
        console.log(redirectTo);
      navigate(reenviar, { replace: true });
      }else{
        navigate("/login", { replace: true });
      }
     
    } catch (error) {
      message.error(
        error.response?.data?.msg || "Error al registrar el usuario. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };
  
  
  

  return (
    <>
      <Navbar />
      <div className="register-container">
        <h2>Registro de Usuario</h2>
        <Form name="register_form" onFinish={onFinish} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Nombre"
                name="user_name"
                rules={[
                  { required: true, message: "Por favor ingresa tu nombre" },
                ]}
              >
                <Input placeholder="Nombre" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Apellido"
                name="lastname"
                rules={[
                  { required: true, message: "Por favor ingresa tu apellido" },
                ]}
              >
                <Input placeholder="Apellido" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Correo Electrónico"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu correo electrónico",
                  },
                  {
                    type: "email",
                    message: "Ingresa un correo electrónico válido",
                  },
                ]}
              >
                <Input placeholder="Correo Electrónico" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Teléfono"
                name="phone"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa tu número de teléfono",
                  },
                ]}
              >
                <Input placeholder="Teléfono" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ciudad"
                name="city"
                rules={[
                  { required: true, message: "Por favor selecciona tu ciudad" },
                ]}
              >
                <Select placeholder="Selecciona una ciudad">
                  <Option value="Chía">Chía</Option>
                  <Option value="Cajicá">Cajicá</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Contraseña"
                name="user_password"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingresa una contraseña",
                  },
                  {
                    min: 6,
                    message: "La contraseña debe tener al menos 6 caracteres",
                  },
                ]}
              >
                <Input.Password placeholder="Contraseña" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12} className="select_register">
              <Form.Item
                label="Tipo de Usuario"
                name="user_type"
                
                rules={[
                  {
                    required: true,
                    message: "Por favor selecciona el tipo de usuario",
                  },
                ]}
              >
                <Select placeholder="Selecciona un tipo de usuario">
                  
                  <option value="hogar">Hogar</option>
                  <option value="restaurante">Restaurante</option>
                  <option value="supermercado">Supermercado</option>
                  <option value="fruver">Fruver</option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row justify="center">
            <Col span={8}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                 
                  loading={loading}
                  block
                >
                  Registrar
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default Register;
