import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Select, Popconfirm, Spin, message, Card, DatePicker, Modal, Alert } from 'antd';
import { Option } from 'antd/es/mentions';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import "css/Orders.css";

const { RangePicker } = DatePicker;


const OrderManagement = () => {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [shippingCosts, setShippingCosts] = useState({});
    const [dateFilter, setDateFilter] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [statusFilter, setStatusFilter] = useState(null);
    const [dateRange, setDateRange] = useState([null, null]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);

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




    useEffect(() => {
        if (statusFilter === null) {
            setFilteredOrders(orders); // Si no hay filtro, muestra todas las órdenes
        } else {
            const filtered = orders.filter((order) => order.status_id === statusFilter);
            setFilteredOrders(filtered); // Filtra las órdenes según el estado seleccionado
        }
    }, [statusFilter, orders]); // Se ejecuta cuando cambia el filtro o las órdenes

    useEffect(() => {
        let filtered = [...orders];

        if (statusFilter !== null) {
            filtered = filtered.filter(order => order.status_id === statusFilter);
        }

        if (dateRange[0] && dateRange[1]) {
            const [start, end] = dateRange;
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.order_date);
                return orderDate >= start && orderDate <= end;
            });
        }

        setFilteredOrders(filtered);
    }, [statusFilter, dateRange, orders]);

    const handleStatusFilterChange = (value) => {
        setStatusFilter(value); // Actualiza el estado del filtro
    };

    const handleDateRangeChange = (dates) => {
        setDateRange(dates || [null, null]);
    };

    const showModal = async (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);

        try {
            const response = await axios.get(`http://localhost:8080/api/orders/${order.id}`);
            setOrderDetails(response.data); // Almacenar los detalles de la orden
        } catch (error) {
            message.error("Error al cargar los detalles de la orden.");
            console.error(error);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const renderModalContent = () => {
        if (!orderDetails) return null; // Si no hay detalles de la orden, no renderizar nada

        const { order, items, userData } = orderDetails;

        return (
            <div>
                <p><strong>ID de Orden:</strong> {order.id}</p>
                <p><strong>Cliente:</strong> {userData.user_name} {userData.lastname}</p>
                <p><strong>Correo:</strong> {userData.email}</p>
                <p><strong>Teléfono:</strong> {userData.phone}</p>
                <p><strong>Dirección:</strong> {userData.address}, {userData.neighborhood}, {userData.city}</p>
                <p><strong>Fecha de Pedido:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                <p><strong>Total (incluye envío):</strong> ${Math.floor(order.total).toLocaleString()}</p>
                <p><strong>Estado:</strong>
                    {order.status_id === 1
                        ? "Pendiente"
                        : order.status_id === 2
                            ? "Enviado"
                            : order.status_id === 3
                                ? "Entregado"
                                : "Cancelado"}
                </p>

                <h3>Productos:</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Producto</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Cantidad</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Precio Unitario</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const priceHome = parseFloat(item.variation.price_home);
                            const unitPrice = Math.trunc(priceHome);
                            const total = item.quantity * unitPrice;

                            return (
                                <tr key={index}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.product_name} ({item.variation.quality} {item.variation.quantity})</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>${unitPrice.toLocaleString()}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>${total.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <Alert
                    message="Información importante"
                    description="El precio del envío se calcula automáticamente y se incluye en el PDF."
                    type="warning"
                    showIcon
                    style={{
                        marginTop: '16px',
                        marginBottom: '16px',
                        backgroundColor: '#fffbe6',
                        padding: '4px 8px', // Padding más pequeño
                        fontSize: '12px',   // Tamaño de fuente más pequeño
                    }}
                    className="small-alert" // Clase adicional para personalización
                />
            </div>

        );
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

            // Llamar a la API para obtener los tipos de cliente y costos de envío
            const customerTypeResponse = await axios.get("http://localhost:8080/api/customer-types");
            const customerTypes = customerTypeResponse.data.reduce((acc, type) => {
                acc[type.type_name.toLowerCase()] = parseInt(type.shipping_cost, 10);
                return acc;
            }, {});

            // Verificar si existe el campo user_type o type_name en userData
            const userType = orderData.userData?.user_type?.toLowerCase() || orderData.userData?.type_name?.toLowerCase();

            if (!userType) {
                throw new Error("El tipo de usuario (type_name o user_type) no está definido en los datos de la orden.");
            }

            // Obtener el porcentaje de envío y calcular el costo
            const subtotal = Math.floor(orderData.order.total);
            const shippingPercentage = customerTypes[userType] || 0;

            let shippingCost = Math.floor((subtotal * shippingPercentage) / 100);

            // Aplicar reglas específicas según el tipo de usuario y condiciones
            if (userType === "hogar") {
                if (!orderData.userData?.isLoggedIn) {
                    shippingCost = 5000; // Hogar sin registrarse
                } else if (orderData.isFirstOrder) {
                    shippingCost = 0; // Hogar registrado en su primer pedido
                }
            } else if (userType === "restaurante" && orderData.isFirstOrder) {
                shippingCost /= 2; // Restaurante en su primer pedido
            }

            // Crear el PDF
            const doc = new jsPDF();
            doc.setFontSize(10);

            // Insertar el logo de la empresa
            const logoUrl = '/images/1.png';
            doc.addImage(logoUrl, 'PNG', 10, 5, 50, 30);

            // Información del remitente
            const senderInfo = ['Don Kampo S.A.S', 'Nit 901.865.742', 'Chía - Cundinamarca', '3117366666'];
            const pageWidth = doc.internal.pageSize.width;
            const senderX = pageWidth - 50;

            doc.setFont('helvetica', 'bold');
            senderInfo.forEach((line, index) => {
                doc.text(line, senderX, 10 + (index * 5));
            });

            // Título del documento
            doc.text("Detalles de la Orden", 10, 35);

            // Información de la orden
            const yOffset = 40;
            const lineHeight = 5;

            doc.setFont('helvetica', 'bold');
            doc.text("ID de Orden:", 10, yOffset);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.order.id}`, 33, yOffset);

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
            doc.text(status, 33, yOffset + lineHeight);

            doc.setFont('helvetica', 'bold');
            doc.text("Cliente:", 10, yOffset + 2 * lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.userData.user_name} ${orderData.userData.lastname}`, 33, yOffset + 2 * lineHeight);

            doc.setFont('helvetica', 'bold');
            doc.text("Correo:", 10, yOffset + 3 * lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(orderData.userData.email, 33, yOffset + 3 * lineHeight);

            doc.setFont('helvetica', 'bold');
            doc.text("Teléfono:", 10, yOffset + 4 * lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(orderData.userData.phone, 33, yOffset + 4 * lineHeight);

            doc.setFont('helvetica', 'bold');
            doc.text("Dirección:", 10, yOffset + 5 * lineHeight);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.userData.address}${orderData.userData.neighborhood}, ${orderData.userData.city}`, 33, yOffset + 5 * lineHeight);

            // Datos de los productos y la tabla
            const productData = orderData.items.map((item) => {
                // Convertir el precio a número flotante y truncar a la parte entera
                const priceHome = parseFloat(item.variation.price_home); // Convierte correctamente con punto decimal
                const unitPrice = Math.trunc(priceHome); // Ignorar los decimales y tomar solo la parte entera

                return {
                    "Producto": `${item.product_name} (${item.variation.quality} ${item.variation.quantity})`,
                    "Cantidad": item.quantity,
                    "Precio Unitario": `$${unitPrice.toLocaleString()}`, // Formatear como moneda
                    "Total": `$${(item.quantity * unitPrice).toLocaleString()}` // Total calculado
                };
            });


            const columns = [
                { title: "Producto", dataKey: "Producto" },
                { title: "Cantidad", dataKey: "Cantidad" },
                { title: "Precio Unitario", dataKey: "Precio Unitario" },
                { title: "Total", dataKey: "Total" }
            ];

            autoTable(doc, {
                head: [columns.map(col => col.title)],
                body: productData.map(item => Object.values(item)),
                startY: yOffset + 6 * lineHeight,
                theme: 'grid',
                margin: { top: 10 },
                styles: {
                    head: {
                        fillColor: '#00983a',
                        textColor: '#ffffff'
                    },
                    body: {
                        justify: 'center',
                        textColor: '#000000'
                    }
                }
            });

            // Agregar el costo de envío al PDF
            doc.text(`Valor envío: $${shippingCost.toLocaleString()}`, 10, doc.autoTable.previous.finalY + 10);

            // Valor productos
            doc.text(`Valor productos: $${subtotal.toLocaleString()}`, 10, doc.autoTable.previous.finalY + 17);

            // Total de la Orden
            const totalPedido = Math.floor(subtotal + shippingCost); // Suma y elimina los decimales
            doc.text(`Total Pedido: $${totalPedido.toLocaleString()}`, 10, doc.autoTable.previous.finalY + 25);

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
            sorter: (a, b) => new Date(b.order_date) - new Date(a.order_date),
        },
        { title: 'Total', dataIndex: 'total', key: 'total' },
        {
            title: 'Estado',
            dataIndex: 'status_id',
            key: 'status_id',
            render: (status) => {
                const statusLabels = {
                    1: 'Pendiente',
                    2: 'Enviado',
                    3: 'Entregado',
                    4: 'Cancelado',
                    5: 'Pagado',
                };
                return statusLabels[status] || 'Desconocido';
            },
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

    useEffect(() => {
        let filtered = orders.filter(order => order.status_id === 1); // Mostrar solo pendientes por defecto
        filtered.sort((a, b) => new Date(b.order_date) - new Date(a.order_date)); // Orden descendente por fecha
        setFilteredOrders(filtered);
    }, [orders]);

    return (
        <Card title="Gestión de Pedidos" style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
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
                <RangePicker
                    onChange={handleDateRangeChange}
                    format="YYYY-MM-DD"
                />
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
                    onRow={(record) => ({
                        onClick: () => showModal(record),
                    })}
                />
            </Spin>
            <Modal
                title="Detalles de la Orden"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button onClick={() => fetchOrderDetailsAndGeneratePDF(order.id)}>
                        Generar PDF
                    </Button>,
                ]}
                width={800}
            >
                {renderModalContent()}
            </Modal>
        </Card>
    );
};

export default OrderManagement;