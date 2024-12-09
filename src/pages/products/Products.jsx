import React, { useEffect, useState } from "react";
import { Card, Button, message, Select, Input, Pagination, Modal } from "antd";
import axios from "axios";
import { useCart } from "../../pages/products/CartContext";
import Navbar from "../../components/navbar/Navbar";
import CustomFooter from "../../components/footer/Footer";
import BotonWhatsapp from "../../components/botonWhatsapp/BotonWhatsapp";
import "./Products.css";

const { Option } = Select;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});
  const [quantities, setQuantities] = useState({});
  const [isVisible, setIsModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const { addToCart } = useCart();  // Importamos addToCart de CartContext

  const userType = JSON.parse(localStorage.getItem("loginData"))?.user?.user_type;

  // Obtener productos y categorías
  useEffect(() => {
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
          setFilteredProducts(updatedProducts);

          // Extraer categorías únicas
          const uniqueCategories = [
            ...new Set(updatedProducts.map((product) => product.category)),
          ];
          setCategories(["Todas", ...uniqueCategories]); // Agregar "Todas" como opción
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

    fetchProducts();
  }, []);

  

  useEffect(() => {
    // Obtener el parámetro de búsqueda de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQueryFromUrl = urlParams.get("search") || "";
    setSearchQuery(searchQueryFromUrl);
    filterProducts(selectedCategory, searchQueryFromUrl);
  }, [selectedCategory]);
  

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    filterProducts(value, searchQuery);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query) {
      window.location.href = `/products?search=${query}`;
    }
  };
  
  

  const normalizeString = (str) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filterProducts = (category, query) => {
    const filtered = products.filter((product) => {
      const matchesCategory = category === "Todas" || product.category === category;
      const matchesSearch = normalizeString(product.name).includes(normalizeString(query));
      return matchesCategory && matchesSearch;
    });
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reiniciar a la primera página
  };
  

  useEffect(() => {
    filterProducts(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  const getBase64Image = (photoUrl) =>
    photoUrl || `${process.env.PUBLIC_URL}/images/icon.png`;

  const getPriceByUserType = (variation) => {
    let price;
    switch (userType) {
      case "hogar":
        price = variation.price_home;
        break;
      case "supermercado":
        price = variation.price_supermarket;
        break;
      case "restaurante":
        price = variation.price_restaurant;
        break;
      case "fruver":
        price = variation.price_fruver;
        break;
      default:
        price = variation.price_home;
    }
    return parseFloat(price);
  };

  const handleVariationChange = (productId, variationType, value) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [variationType]: value,
      },
    }));
  };

  const handleIncrement = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1,
    }));
  };

  const handleDecrement = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) - 1),
    }));
  };

  const handleAddToCart = (product) => {
    // Buscar la variación seleccionada en función de las opciones elegidas por el usuario
    const selectedVariation = product.variations.find(
      (v) =>
        v.quality === selectedVariations[product.product_id]?.quality &&
        v.quantity === selectedVariations[product.product_id]?.quantity
    );
  
    if (!selectedVariation) {
      message.error("Por favor selecciona una calidad y cantidad.");
      return;
    }
  
    // Obtener la cantidad seleccionada desde el estado `quantities`
    const multiplier = quantities[product.product_id] || 1; // Asegurarse de que haya una cantidad seleccionada
    const totalPrice = getPriceByUserType(selectedVariation) * multiplier; // Precio total basado en la cantidad
    
    // Crear un array de productos a agregar al carrito (el número de productos será igual al valor de `multiplier`)
    const productsToAdd = Array.from({ length: multiplier }, () => ({
      ...product,
      selectedVariation: {
        ...selectedVariation,
        quantity: 1, // Cada unidad tiene su propia cantidad de 1
      },
      totalPrice: getPriceByUserType(selectedVariation), // El precio de cada unidad
    }));
  
    // Agregar al carrito
    addToCart(productsToAdd); // Pasamos el array de productos con las unidades
  
    // Limpiar las selecciones de variaciones y cantidades en el estado
    setSelectedVariations((prev) => {
      const updatedVariations = { ...prev };
      delete updatedVariations[product.product_id]; // Limpiar la variación seleccionada
      return updatedVariations;
    });
  
    setQuantities((prev) => {
      const updatedQuantities = { ...prev };
      delete updatedQuantities[product.product_id]; // Limpiar la cantidad seleccionada
      return updatedQuantities;
    });
  
    setIsModalVisible(false); // Cerrar el modal después de añadir al carrito
  };
  
  

  const openModal = (product) => {
    setCurrentProduct(product);
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setCurrentProduct(null);
  };
  const handleInputChange = (productId, value) => {
    const newValue = Math.max(1, parseInt(value) || 1); // Asegurarse de que el valor sea mínimo 1
    setQuantities((prev) => ({
      ...prev,
      [productId]: newValue,
    }));
  };

  return (
    <>
      <Navbar />
      <div className="filters-container">
        <Select
          placeholder="Filtrar por categoría"
          style={{ width: 200, marginRight: 16 }}
          onChange={handleCategoryChange}
          value={selectedCategory || "Todas"}
          allowClear
          size="large"
        >
          {categories.map((category) => (
            <Option key={category} value={category}>
              {category}
            </Option>
          ))}
        </Select>

        <Input
          placeholder="Buscar productos"
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ width: 300 }}
          allowClear
          size="large"
        />
      </div>

      <div className="products-container">
        {loading ? (
          <p>Cargando productos...</p>
        ) : (
          <>
            {currentProducts.map((product) => (
              <Card
                key={product.product_id}
                className="product-card"
                hoverable
                cover={
                  <img
                    alt={product.name}
                    src={getBase64Image(product.photo_url)}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "250px",
                    }}
                  />
                }
              >
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-description">{product.description}</p>
                  <Button type="primary" onClick={() => openModal(product)}>
                    Ver variaciones
                  </Button>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {!loading && (
        <Pagination
          current={currentPage}
          pageSize={itemsPerPage}
          total={filteredProducts.length}
          onChange={(page) => setCurrentPage(page)}
          className="pagination"
        />
      )}

      {currentProduct && (
        <Modal
          title={currentProduct.name}
          open={isVisible}
          onCancel={handleCancelModal}
          footer={null}
          width={400}
        >
          <img
            alt={currentProduct.name}
            src={getBase64Image(currentProduct.photo_url)}
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
          <Select
            placeholder="Selecciona calidad"
            style={{ width: "200px", marginBottom: 8 }}
            onChange={(value) =>
              handleVariationChange(currentProduct.product_id, "quality", value)
            }
            value={selectedVariations[currentProduct.product_id]?.quality}
          >
            {currentProduct.variations.map((variation) => (
              <Option key={variation.variation_id} value={variation.quality}>
                {variation.quality}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Selecciona cantidad"
            style={{ width: "200px", marginBottom: 8 }}
            onChange={(value) =>
              handleVariationChange(currentProduct.product_id, "quantity", value)
            }
            value={selectedVariations[currentProduct.product_id]?.quantity}
          >
            {currentProduct.variations.map((variation) => (
              <Option key={variation.variation_id} value={variation.quantity}>
                {variation.quantity}
              </Option>
            ))}
          </Select>

          <div className="quantity-controls">
            <Button onClick={() => handleDecrement(currentProduct.product_id)}>-</Button>
            <input
              type="number"
              value={quantities[currentProduct.product_id] || 1}
              onChange={(e) => handleInputChange(currentProduct.product_id, e.target.value)}
              style={{ width: "50px", textAlign: "center" }}
            />
            <Button onClick={() => handleIncrement(currentProduct.product_id)}>+</Button>
          </div>

            

          <div className="product-price">
            {selectedVariations[currentProduct.product_id]?.quality &&
            selectedVariations[currentProduct.product_id]?.quantity ? (
              <span>
                Precio: $
                {(
                  getPriceByUserType(
                    currentProduct.variations.find(
                      (v) =>
                        v.quality === selectedVariations[currentProduct.product_id]?.quality &&
                        v.quantity === selectedVariations[currentProduct.product_id]?.quantity
                    )
                  ) * (quantities[currentProduct.product_id] || 1)
                )
                  .toFixed(2) // Aseguramos que tenga dos decimales
                  .replace(/\.00$/, "") // Eliminamos ".00" si es el caso
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} {/* Agregar separadores de miles */}
              </span>
            ) : (
              <span>Selecciona calidad y cantidad para ver el precio!</span>
            )}
          </div>

          <Button
            type="primary"
            onClick={() =>
              handleAddToCart(currentProduct, quantities[currentProduct.product_id] || 1)
            }
            disabled={
              !selectedVariations[currentProduct.product_id]?.quality ||
              !selectedVariations[currentProduct.product_id]?.quantity
            }
            style={{ marginTop: 8 }}
          >
            Añadir al carrito
          </Button>
        </Modal>
      )}

      <BotonWhatsapp />
      <CustomFooter />
    </>
  );
};

export default Products;
