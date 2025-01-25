import React, { useState } from "react";
import { Button, notification, Spin, Alert } from "antd";
import axios from "axios";


const UpdateOrderPrices = () => {
  const [loading, setLoading] = useState(false);

  const handleUpdatePrices = async () => {
    setLoading(true);

    try {
      const response = await axios.put("https://don-kampo-api.onrender.com/api/orders/updatePrices");
      notification.success({
        message: "Éxito",
        description: response.data.msg || "Los precios se han actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error al actualizar los precios:", error);
      notification.error({
        message: "Error",
        description: error.response?.data?.msg || "Hubo un problema al actualizar los precios.",
      });
    } finally {
      setLoading(false);
    }
  };

  
  return (
    
    <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <h2>Actualización de Órdenes en estado pendiente </h2>
      <span style={{ fontSize: "20px", color: "#333" }}>
      Este proceso actualizará los precios de las órdenes en estado <strong>pendiente </strong> 
      con los precios más recientes registrados en el sistema. 
      </span>
      <Alert
        message="Atención"
        description={
          <span style={{ fontSize: "14px", lineHeight: "1.6", color: "#555"  }}>
            Este proceso es delicado y afectará las órdenes <strong style={{ fontSize: "18px" }}>pendientes</strong>.
            Asegúrate de que los precios actuales en el sistema sean correctos antes de continuar.
          </span>
        }
        type="warning"
        showIcon
        style={{ marginBottom: "24px", textAlign: "left" }}
      />
      <Button
        type="primary"
        onClick={handleUpdatePrices}
        disabled={loading}
        style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "bold" }}
      >
        {loading ? <Spin /> : "Actualizar Órdenes Pendientes"}
      </Button>
    </div>
  );
};

export default UpdateOrderPrices;
