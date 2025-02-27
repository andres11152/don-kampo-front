import React, { useState, useEffect } from "react";
import { DatePicker, Select, Button, Row, Col, Card } from "antd";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import axios from "axios";
import * as XLSX from "xlsx"; // Importar la librería xlsx
import "css/SalesReport.css";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Option } = Select;

const SalesReport = () => {
  const [orders, setOrders] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [viewBy, setViewBy] = useState("daily");
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/orders");
        setOrders(response.data);
      } catch (error) {
        console.error("Error al obtener los datos de las órdenes:", error);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const orderDate = dayjs(order.order.order_date);
      return orderDate.isBetween(dateRange[0], dateRange[1], "day", "[]");
    });

    const aggregatedData = aggregateData(filtered, viewBy);
    setFilteredData(filtered);

    console.log(aggregatedData);
    
    
    setChartData(aggregatedData);
    
  }, [orders, dateRange, viewBy]);

  const aggregateData = (data, viewBy) => {
    const groupedData = {};
      
    data.forEach((order) => {
      const year = dayjs(order.order.order_date).year();
      const month = dayjs(order.order.order_date).month() + 1;
      const week = Math.ceil(dayjs(order.order.order_date).date() / 7);
      const day = dayjs(order.order.order_date).date(); 
  
      const dateKey =
        viewBy === "daily" ? `${year}-${month}-${day}` : viewBy === "weekly"
          ? `${year}-${month}-W${week}` : viewBy === "monthly"
            ? `${year}-${month}` : `${year}`
  
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = [];
      }
  
      const userName = order.userData.user_name || "Desconocido";
  
      order.items.forEach((item) => {
        groupedData[dateKey].push({
          date: dateKey,
          user: userName,
          product: `${item.product_name} (${item.variation.quality} ${item.variation.quantity})`,
          quantity: item.quantity,
          total: order.order.total,
        });
      });
    });
  
    return Object.values(groupedData).flat();
  };
  
  // Función para exportar a Excel con más detalles
  const exportToExcel = () => {
    const worksheetData = chartData.map((item) => ({
      Fecha: item.date,
      Usuario: item.user,
      Producto: item.product,
      Cantidad: item.quantity,
      Total: item.total,
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Ventas");
  
    // Generar el archivo Excel
    XLSX.writeFile(workbook, `Reporte_Ventas_${viewBy}.xlsx`);
  
  };
  

  return (
    <div style={{ padding: "20px" }}>
      <h2>Reporte de Ventas</h2>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={6}>
          <Select value={viewBy} onChange={setViewBy} style={{ width: "100%" }}>
            <Option value="daily">Por día</Option>
            <Option value="weekly">Por semana</Option>
            <Option value="monthly">Por mes</Option>
            <Option value="yearly">Por año</Option>
          </Select>
        </Col>
        <Col span={6}>
          <Button type="primary" onClick={exportToExcel}>
            Exportar a Excel
          </Button>
        </Col>
      </Row>
      <Card style={{ marginTop: "20px" }}>
        <h3>
          Ventas Totales: $
          {filteredData.reduce((sum, order) => sum + order.order.total, 0).toLocaleString()}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default SalesReport;