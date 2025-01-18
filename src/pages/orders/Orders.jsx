import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Select, Popconfirm, Spin, message, Card } from 'antd';
import { Option } from 'antd/es/mentions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import "./Orders.css";

const OrderManagement = () => {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    useEffect(() => {

        fetchOrders();
    }, []);
    const fetchOrders = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/orders");

            // Procesar datos de órdenes
            const dataOrders = response.data.map(item => ({
                ...item.order,
                email: item.userData?.email || ''
            }));

            // Procesar datos de productos de la orden
            const dataPurchaseOrders = response.data.flatMap(item => item.items);

            // Agrupamos y consolidamos las cantidades
            const consolidatedProducts = dataPurchaseOrders.reduce((acc, product) => {
                const key = `${product.product_id}-${product.product_variation_id}`;

                // Si no existe el producto, lo agregamos
                if (!acc[key]) acc[key] = { ...product, totalQuantity: product.quantity };
                // Si ya existe, sumamos la cantidad
                else acc[key].totalQuantity += product.quantity;

                return acc;
            }, {});

            // Convertimos el objeto de agrupación en un array
            const uniquePurchaseProducts = Object.values(consolidatedProducts).map(product => {
                const { variation } = product; // Extraemos el objeto variation
                return {
                    id_producto: product.product_id,
                    id_variacion: product.product_variation_id,
                    nombre_producto: product.product_name,
                    calidad: variation?.quality || 'N/A', // Manejo seguro de calidad
                    cantidad: variation?.quantity || 0, // Cantidad del producto
                    total: product.totalQuantity // Cantidad acumulada
                };
            });

            setOrders(dataOrders); // Establecer órdenes procesadas
            setFilteredOrders(dataOrders); // Inicialmente, mostrar todas las órdenes
        } catch (error) {
            message.error("Error al cargar los pedidos.");
            console.error(error);
        }
    };
    
    const handleStatusFilterChange = (value) => {
        setStatusFilter(value);
        if (value === null) {
            setFilteredOrders(orders); // Mostrar todos los pedidos si no hay filtro
        } else {
            const filtered = orders.filter((order) => order.status_id === value);
            setFilteredOrders(filtered); // Filtrar por el estado seleccionado
        }
    };

    const exportFilteredOrdersToExcel = async () => {
        const failedOrders = []; // Lista para almacenar los detalles de órdenes fallidas
        const detailedOrders = []; // Lista para almacenar los detalles exitosos

        setLoading(true); // Activamos la rueda de carga

        try {
            // Realizar todas las solicitudes en paralelo
            const responses = await Promise.all(
                filteredOrders.map(async (order) => {
                    try {
                        const response = await axios.get(`http://localhost:8080/api/orders/${order.id}`);
                        console.log(response);

                        const { order: orderDetails, items, userData: { city, phone, address } } = response.data;
                        // Crear filas por cada ítem y variación
                        items.forEach((item) => {
                            detailedOrders.push({
                                "ID de Orden": orderDetails.id,
                                Cliente: orderDetails.customer_name,
                                Ciudad: city,
                                Teléfono: phone,
                                Dirección: address,
                                "Correo Cliente": orderDetails.customer_email,
                                "Fecha de Pedido": new Date(orderDetails.order_date).toLocaleDateString(),
                                Total: `$${orderDetails.total}`,
                                Estado:
                                    orderDetails.status_id === 1
                                        ? "Pendiente"
                                        : orderDetails.status_id === 2
                                            ? "Enviado"
                                            : orderDetails.status_id === 3
                                                ? "Entregado"
                                                : "Cancelado",
                                "ID de Variación": item.product_variation_id,
                                "Nombre del Producto": item.product_name,
                                Calidad: item.variation.quality,
                                Cantidad: item.quantity,
                                Precio: `$${item.price}`,
                            });
                        });
                    } catch (error) {
                        // Captura el detalle del error para la hoja de errores
                        failedOrders.push({
                            "ID de Orden": order.id,
                            Error: error.response
                                ? error.response.data.message || "Error desconocido"
                                : "No se pudo conectar con la API",
                        });
                    }
                })
            );

            // Crear hojas de trabajo
            const workbook = XLSX.utils.book_new();

            if (detailedOrders.length > 0) {
                const detailedWorksheet = XLSX.utils.json_to_sheet(detailedOrders);
                XLSX.utils.book_append_sheet(
                    workbook,
                    detailedWorksheet,
                    "Pedidos Detallados"
                );
            }

            if (failedOrders.length > 0) {
                const failedWorksheet = XLSX.utils.json_to_sheet(failedOrders);
                XLSX.utils.book_append_sheet(workbook, failedWorksheet, "Errores");
            }

            // Guardar el archivo Excel
            XLSX.writeFile(workbook, "Pedidos_Detallados_y_Errores.xlsx");

            // Mensajes al usuario
            if (detailedOrders.length > 0) {
                message.success("Archivo Excel generado exitosamente.");
            }
            if (failedOrders.length > 0) {
                message.warning(
                    `Algunas órdenes fallaron. Revisa la hoja de errores en el Excel.`
                );
            }
        } catch (error) {
            message.error("Error general al generar el archivo Excel.");
            console.error(error);
        } finally {
            setLoading(false); // Desactivamos la rueda de carga
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
          // Cambiamos la URL para incluir directamente el id y el nuevo estado
          await axios.put(`http://localhost:8080/api/updatestatus/${orderId}/${newStatus}`);
          message.success("Estado del pedido actualizado correctamente.");
          fetchOrders(); // Refresca la lista de pedidos después de actualizar el estado
        } catch (error) {
          message.error("Error al actualizar el estado del pedido.");
          console.error(error);
        }
      };
    

    // Eliminar un pedido
    const deleteOrder = async (orderId) => {
        try {
          await axios.delete(`http://localhost:8080/api/deleteorders/${orderId}`);
          message.success("Pedido eliminado correctamente.");
          fetchOrders();
        } catch (error) {
          message.error("Error al eliminar el pedido.");
          console.error(error);
        }
      };

    const fetchOrderDetailsAndGeneratePDF = async (orderId) => {
        try {
            // Llamar a la API para obtener los detalles de la orden
            const response = await axios.get(`http://localhost:8080/api/orders/${orderId}`);
            const orderData = response.data;

            // Crear el PDF
            const doc = new jsPDF();
            doc.setFontSize(10);

            // Insertar el logo de la empresa (ajustar la ruta según tu archivo)
            const logoUrl = '/images/1.png'; // Ruta correcta si la imagen está en la carpeta 'public'
            doc.addImage(logoUrl, 'PNG', 10, 5, 50, 30); // Ajusta la posición y el tamaño según sea necesario

            // Información del remitente (dividida en partes)
            const senderInfo = [
                'Don Kampo S.A.S',
                'Nit 901.865.742',
                'Chía - Cundinamarca',
                '3117366666'
            ];

            const pageWidth = doc.internal.pageSize.width; // Obtener el ancho de la página
            const senderX = pageWidth - 50; // Ubicar el texto a la derecha, ajusta el margen derecho

            // Insertar la información del remitente, cada línea en una fila separada
            doc.setFont('helvetica', 'bold');
            senderInfo.forEach((line, index) => {
                doc.text(line, senderX, 10 + (index * 5)); // Ajusta el valor de 5 según sea necesario para la separación entre líneas
            });

            // Título del documento
            doc.text("Detalles de la Orden", 10, 35);

            // Información de la orden con etiquetas en negrita
            const yOffset = 40; // Posición inicial en el eje Y
            const lineHeight = 5; // Distancia entre las líneas de texto

            // ID de la Orden
            doc.setFont('helvetica', 'bold');
            doc.text("ID de Orden:", 10, yOffset);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.order.id}`, 33, yOffset); // Valor de ID justo después de la etiqueta, sin desplazamiento en X

            // Estado de la Orden
            const status = orderData.order.status_id === 1
                ? 'Pendiente'
                : orderData.order.status_id === 2
                    ? 'Enviado'
                    : orderData.order.status_id === 3
                        ? 'Entregado'
                        : 'Cancelado';
            doc.setFont('helvetica', 'bold');
            doc.text("Estado:", 10, yOffset + lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(status, 33, yOffset + lineHeight); // Valor de Estado justo después de la etiqueta, sin desplazamiento en X

            // Información del cliente
            doc.setFont('helvetica', 'bold');
            doc.text("Cliente:", 10, yOffset + 2 * lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.userData.user_name} ${orderData.userData.lastname}`, 33, yOffset + 2 * lineHeight); // Valor de Cliente justo después de la etiqueta

            doc.setFont('helvetica', 'bold');
            doc.text("Correo:", 10, yOffset + 3 * lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(orderData.userData.email, 33, yOffset + 3 * lineHeight); // Valor de Correo justo después de la etiqueta

            doc.setFont('helvetica', 'bold');
            doc.text("Teléfono:", 10, yOffset + 4 * lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(orderData.userData.phone, 33, yOffset + 4 * lineHeight); // Valor de Teléfono justo después de la etiqueta

            doc.setFont('helvetica', 'bold');
            doc.text("Dirección:", 10, yOffset + 5 * lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.userData.address}${orderData.userData.neighborhood}, ${orderData.userData.city}`, 33, yOffset + 5 * lineHeight); // Valor de Dirección justo después de la etiqueta


            // Datos de los productos
            const productData = orderData.items.map((item) => ({
                "Producto": `${item.product_name} (${item.variation.quality} ${item.variation.quantity})`,
                "Cantidad": item.quantity,
                "Precio Unitario": `$${item.variation.price_home.toLocaleString()}`,
                "Total": `$${(item.quantity * item.variation.price_home).toLocaleString()}`
            }));

            // Establecer las columnas para la tabla
            const columns = [
                { title: "Producto", dataKey: "Producto" },
                { title: "Cantidad", dataKey: "Cantidad" },
                { title: "Precio Unitario", dataKey: "Precio Unitario" },
                { title: "Total", dataKey: "Total" }
            ];

            // Usar autoTable para crear la tabla de productos con un fondo verde y texto blanco
            autoTable(doc, {
                head: [columns.map(col => col.title)], // Encabezado de la tabla
                body: productData.map(item => Object.values(item)), // Filas de la tabla
                startY: yOffset + 6 * lineHeight, // Posición inicial de la tabla
                theme: 'grid', // Estilo de la tabla
                margin: { top: 10 }, // Margen superior de la tabla
                styles: {
                    head: {
                        fillColor: '#00983a', // Fondo verde para el encabezado
                        textColor: '#ffffff'  // Texto blanco para el encabezado
                    },
                    body: {
                        justify: 'center', // Alineación centrada para el cuerpo de la tabla
                        textColor: '#000000'  // Texto negro para el cuerpo de la tabla
                    }
                }
            });


           /*

            // Agregar al PDF
            doc.text(`Valor envío: $${userType} `, 10, doc.autoTable.previous.finalY + 10); */

            // Total de la orden
            doc.text(`Total de la Orden: $${orderData.order.total.toLocaleString()}`, 10, doc.autoTable.previous.finalY + 17);

            // Descargar el PDF
            doc.save(`Orden_${orderData.order.id}.pdf`);
        } catch (error) {
            console.error("Error al generar el PDF:", error);
        }
    };

    const orderColumns = [
        { title: 'ID de Orden', dataIndex: 'id', key: 'id' },
        { title: 'Cliente', dataIndex: 'email', key: 'email' },
        {
            title: 'Fecha',
            dataIndex: 'order_date',
            key: 'order_date',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        { title: 'Total', dataIndex: 'total', key: 'total' },
        {
            title: 'Estado',
            dataIndex: 'status_id',
            key: 'status_id',
            render: (status) =>
                status === 1
                    ? 'Pendiente'
                    : status === 2
                        ? 'Enviado'
                        : status === 3
                            ? 'Entregado'
                            : 'Cancelado',
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, order) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    
                    <Select
                        defaultValue={order.status_id}
                        onChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                        style={{ width: 120 }}
                    >
                        <Option value={1}>Pendiente</Option>
                        <Option value={2}>Enviado</Option>
                        <Option value={3}>Entregado</Option>
                        <Option value={4}>Cancelado</Option>
                        <Option value={5}>Pagado</Option>
                    </Select>
                    <Popconfirm
                        title="¿Estás seguro de eliminar este pedido?"
                        onConfirm={() => deleteOrder(order.id)}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button danger>Eliminar</Button>
                    </Popconfirm>
                    <Button onClick={() => fetchOrderDetailsAndGeneratePDF(order.id)}>
                        Generar PDF
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Card title="Gestión de Pedidos" style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <Select
                    placeholder="Filtrar por estado"
                    allowClear
                    onChange={handleStatusFilterChange}
                    style={{ width: 200 }}
                >
                    <Option value={null}>Todos</Option>
                    <Option value={1}>Pendiente</Option>
                    <Option value={2}>Enviado</Option>
                    <Option value={3}>Entregado</Option>
                    <Option value={4}>Cancelado</Option>
                    <Option value={5}>Pagado</Option>
                </Select>
                <Button type="primary" onClick={exportFilteredOrdersToExcel}>
                    Descargar Excel
                </Button>
            </div>
            <Spin spinning={loading}>
                <Table
                    dataSource={filteredOrders}
                    columns={orderColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                />
            </Spin>
        </Card>
    );
};

export default OrderManagement;