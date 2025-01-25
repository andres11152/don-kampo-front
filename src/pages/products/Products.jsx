import React, { useEffect, useCallback, useState } from "react";
import { Card, Button, message, Select, Input, Pagination, Modal } from "antd";
import axios from "axios";
import { useCart } from "../../pages/products/CartContext";
import Header from "../../components/General/Header";
import CustomFooter from "../../components/General/Footer";
import BotonWhatsapp from "../../components/General/BotonWhatsapp";
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

  const { addToCart } = useCart();
  const userType = JSON.parse(localStorage.getItem("loginData"))?.user?.user_type;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("https://don-kampo-api.onrender.com/api/products", {
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

          const uniqueCategories = [
            ...new Set(updatedProducts.map((product) => product.category)),
          ];
          setCategories(["Todas", ...uniqueCategories]);
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

  const filterProducts = useCallback(
    (category, query) => {
      const filtered = products.filter((product) => {
        const matchesCategory = category === "Todas" || product.category === category;
        const matchesSearch = normalizeString(product.name).includes(normalizeString(query));
        return matchesCategory && matchesSearch;
      });
      setFilteredProducts(filtered);
      setCurrentPage(1);
    },
    [products]
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQueryFromUrl = urlParams.get("search") || "";
    const categoryQueryFromUrl = urlParams.get("category") || "Todas";
    const idQueryFromUrl = urlParams.get("id") || null;

    setSelectedCategory(categoryQueryFromUrl);
    setSearchQuery(searchQueryFromUrl);
    filterProducts(categoryQueryFromUrl, searchQueryFromUrl);

    if (idQueryFromUrl) {
      const product = products.find((p) => p.product_id == idQueryFromUrl);
      if (product) openModal(product);
    }
  }, [products, filterProducts]);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    filterProducts(value, searchQuery);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    filterProducts(selectedCategory, query);
  };

  const normalizeString = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const getBase64Image = (photoUrl) => photoUrl || `${import.meta.env.PUBLIC_URL}/images/icon.png`;

  const getPriceByUserType = (variation) => {
    if (!variation) {
      console.error("Variation is undefined");
      return 0; // Fallback price if variation is undefined
    }

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
    return parseInt(price);
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
    let selectedVariation;

    if (userType === "hogar") {
      // Para "hogar", usar la primera variación
      selectedVariation = product.variations[0];
    } else {
      // Para otros tipos de usuario, usar la variación seleccionada
      selectedVariation = product.variations.find(
        (v) =>
          v.quality === selectedVariations[product.product_id]?.quality &&
          v.quantity === selectedVariations[product.product_id]?.quantity
      );

      if (!selectedVariation) {
        message.error("Por favor selecciona una calidad y cantidad.");
        return;
      }
    }

    if (!selectedVariation) {
      message.error("No se encontró una variación válida para este producto.");
      return;
    }

    const multiplier = quantities[product.product_id] || 1;
    const totalPrice = getPriceByUserType(selectedVariation) * multiplier;

    const productsToAdd = Array.from({ length: multiplier }, () => ({
      ...product,
      selectedVariation: {
        ...selectedVariation,
        quantity: 1,
      },
      totalPrice: getPriceByUserType(selectedVariation),
    }));

    addToCart(productsToAdd);

    setSelectedVariations((prev) => {
      const updatedVariations = { ...prev };
      delete updatedVariations[product.product_id];
      return updatedVariations;
    });

    setQuantities((prev) => {
      const updatedQuantities = { ...prev };
      delete updatedQuantities[product.product_id];
      return updatedQuantities;
    });

    setIsModalVisible(false);
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
    const newValue = Math.max(1, parseInt(value) || 1);
    setQuantities((prev) => ({
      ...prev,
      [productId]: newValue,
    }));
  };

  return (
    <>
      <Header />
      <div className="filters-container">
        <Select
          placeholder="Filtrar por categoría"
          style={{ width: 200, marginRight: 16 }}
          onChange={handleCategoryChange}
          value={selectedCategory}
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
            {currentProducts.map((product) => {
              const firstVariation = product.variations[0];
              const price = firstVariation ? getPriceByUserType(firstVariation) : 0;

              return (
                <Card
                  key={product.product_id}
                  className="product-card"
                  hoverable
                  onClick={() => openModal(product)}
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
                    {userType === "hogar" && firstVariation && (
                      <div className="product-variation-info">
                        <p>
                          <strong>Cantidad:</strong> {firstVariation.quantity}
                        </p>
                        <p>
                          <strong>Precio:</strong> $
                          {price
                            .toFixed(2)
                            .replace(/\.00$/, "")
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                        </p>
                      </div>
                    )}
                    <Button type="primary" onClick={() => openModal(product)}>
                      Ver detalles
                    </Button>
                  </div>
                </Card>
              );
            })}
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

            {userType !== "hogar" && (
              <>
                <Select
                  placeholder="Calidad"
                  style={{ width: "100%", marginBottom: "8px" }}
                  value={selectedVariations[currentProduct.product_id]?.quality}
                  onChange={(value) =>
                    handleVariationChange(currentProduct.product_id, "quality", value)
                  }
                >
                  {currentProduct.variations.map((variation) => (
                    <Option key={variation.variation_id} value={variation.quality}>
                      {variation.quality}
                    </Option>
                  ))}
                </Select>

                <Select
                  placeholder="Cantidad"
                  style={{ width: "100%", marginBottom: "8px" }}
                  value={selectedVariations[currentProduct.product_id]?.quantity}
                  onChange={(value) =>
                    handleVariationChange(currentProduct.product_id, "quantity", value)
                  }
                >
                  {currentProduct.variations.map((variation) => (
                    <Option key={variation.variation_id} value={variation.quantity}>
                      {variation.quantity}
                    </Option>
                  ))}
                </Select>
              </>
            )}

            {userType === "hogar" && currentProduct.variations[0] && (
              <div style={{ marginBottom: "8px" }}>
                <p>
                  <strong>Cantidad:</strong> {currentProduct.variations[0].quantity}
                </p>
              </div>
            )}

            <div className="quantity-controls" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button onClick={() => handleDecrement(currentProduct.product_id)}>-</Button>
              <input
                type="number"
                value={quantities[currentProduct.product_id] || 1}
                onChange={(e) => handleInputChange(currentProduct.product_id, e.target.value)}
                style={{
                  width: "50px",
                  textAlign: "center",
                  border: "1px solid #d9d9d9",
                  borderRadius: "4px",
                  padding: "4px",
                }}
              />
              <Button onClick={() => handleIncrement(currentProduct.product_id)}>+</Button>
            </div>

            <div className="product-price" style={{ marginTop: "8px", textAlign: "center" }}>
              {userType === "hogar" && currentProduct.variations[0] ? (
                <span>
                  Precio: $
                  {(
                    getPriceByUserType(currentProduct.variations[0]) *
                    (quantities[currentProduct.product_id] || 1)
                  )
                    .toFixed(2)
                    .replace(/\.00$/, "")
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                </span>
              ) : selectedVariations[currentProduct.product_id]?.quality &&
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
                    .toFixed(2)
                    .replace(/\.00$/, "")
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                </span>
              ) : (
                <span>Selecciona calidad y cantidad para ver el precio!</span>
              )}
            </div>

            <Button
              type="primary"
              onClick={() => handleAddToCart(currentProduct)}
              style={{ marginTop: "8px", width: "100%" }}
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