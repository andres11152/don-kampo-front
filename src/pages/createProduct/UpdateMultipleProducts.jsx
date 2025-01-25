import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Button, message, Alert } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import "./UpdateMultipleProducts.css";

const UpdateMultipleProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [processExcel, setProcessExcel] = useState({ message: "", status: "" });
  const [messageButton, setMessageButton] = useState("Continuar");
  const [updateProducts, setUpdateProducts] = useState([]);

  const processingExcel = async (file) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    setIsLoading(true);
    setProcessExcel({ message: "Procesando archivo Excel", status: "" });
    await sleep(2000);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Leer la hoja Products
        const productSheet = workbook.Sheets["Products"];
        if (!productSheet) {
          setProcessExcel({ message: "La hoja Products no existe.", status: "error" });
          throw new Error("La hoja Products no existe en el archivo Excel.");
        }

        const productData = XLSX.utils.sheet_to_json(productSheet, { header: 1 });
        if (productData.length < 2) {
          setProcessExcel({ message: "La hoja Products no contiene datos.", status: "error" });
          throw new Error("La hoja Products no contiene datos suficientes.");
        }

        const headers = productData[0];
        const productRows = productData.slice(1).filter((row) => row.length > 0);

        // Convertir filas a objetos
        const excelProducts = productRows.map((row) => {
          const product = {};
          headers.forEach((header, index) => {
            product[header] = row[index];
          });
          return {
            product_id: product["Id"],
            name: product["Nombre"],
            description: product["Descripcion"],
            category: product["Categoria"],
            photo_url: null,
            stock: product["Stock"],
            variations: [], // Inicialmente vacío, se llenará más adelante
          };
        });

        setProcessExcel({ message: "Productos obtenidos de excel.", status: "" });
        await sleep(2000);

        // obtengo todos los productos
        const response = await axios.get("https://don-kampo-api.onrender.com/api/products", { withCredentials: true });
        const products = response.data;
        // Filtro los productos cuyo id sea igual a los de la base de datos
        const totalExcelProducts = excelProducts.filter((excelProduct) =>
          products.some((product) => product.product_id === excelProduct.product_id)
        );

        // Leer hojas de Variation
        const variationSheets = Object.keys(workbook.Sheets).filter((sheetName) =>
          /^Variation \d+$/.test(sheetName)
        );

        variationSheets.forEach((sheetName) => {
          const variationSheet = workbook.Sheets[sheetName];
          const variationData = XLSX.utils.sheet_to_json(variationSheet, { header: 1 });

          if (variationData.length < 2) {
            console.warn(`La hoja ${sheetName} no contiene datos suficientes.`);
            setProcessExcel({ message: `La hoja ${sheetName} no contiene datos suficientes.`, status: "warning" });
            return;
          }

          const variationHeaders = variationData[0];
          const variationRows = variationData.slice(1);

          variationRows.forEach((row) => {
            const variation = {};
            variationHeaders.forEach((header, index) => {
              variation[header] = row[index];
            });

            const product = totalExcelProducts.find((p) => p.product_id === variation["Id Product"]);
            if (product) {
              product.variations.push({
                variation_id: variation["Id Variation"],
                quality: variation["Calidad"],
                quantity: variation["Cantidad"],
                price_home: variation["Hogar"],
                price_supermarket: variation["Supermercado"],
                price_restaurant: variation["Restaurant"],
                price_fruver: variation["Fruver"],
              });
            }
          });
        });

        setProcessExcel({ message: "Variaciones obtenidas de excel.", status: "" });
        await sleep(1000);
        setProcessExcel({ message: `${totalExcelProducts.length} de ${excelProducts.length} productos por actualizar `, status: "info" });
        setMessageButton("Actualizar Productos");
        setUpdateProducts(totalExcelProducts);
      } catch (error) {
        console.error("Error procesando el archivo Excel:", error);
        setProcessExcel({ message: "Error procesando el archivo Excel" + error, status: "error" });
        setMessageButton("Cancelar");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const uploadProps = {
    accept: ".xlsx, .xls",
    beforeUpload: (file) => {
      processingExcel(file);
      return false;
    },
  };

  const updatingProducts = (event) => {
    event.preventDefault();

    setProcessExcel({ message: "Actualizando productos", status: "" });
    axios
      .put("https://don-kampo-api.onrender.com/api/updatemultipleproducts", updateProducts, {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        setProcessExcel({ message: " Productos actualizados exitosamente ", status: "success" });
        setMessageButton("Continuar");
      })
      .catch((error) => {
        console.error("Error procesando la actualización de productos:", error);
        setProcessExcel({ message: "Error procesando la actualización de productos", status: "error" });
        setMessageButton("Cancelar");
      });
  };

  const closeModal = () => {
    setIsLoading(false);
    processExcel.status === "success" && window.location.reload();
  };

  return (
    
    <div className="update-multiple-products">
      <h2>Actualización Múltiple de Productos</h2>
        <Alert
          message="El archivo Excel de actualización es el que se genera en Gestión de Productos."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <Upload {...uploadProps}>
          <Button className="excel" icon={<UploadOutlined />}>
            Actualizar múltiples productos (EXCEL)
          </Button>
        </Upload>
      {isLoading && (
        <div className="isLoading">
          <div className={processExcel.status}>
            <i
              className={`fa-solid fa-${
                processExcel.status === "success"
                  ? "circle-check"
                  : processExcel.status === "error"
                  ? "circle-xmark"
                  : processExcel.status === "info"
                  ? "circle-info"
                  : "spinner"
              } ${processExcel.status === "" && "spin"}`}
            />
            <span>{processExcel.message}</span>

            {processExcel.status === "info" && <button onClick={updatingProducts}>{messageButton}</button>}
            {(processExcel.status === "success" || processExcel.status === "error") && (
              <button onClick={closeModal}>{messageButton}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateMultipleProducts;
