import React, { useRef, useEffect, useState } from "react";
import {
  Carousel,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Modal,
  AutoComplete,
  message,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/General/Header";
import Footer from "../../components/General/Footer";
import BotonWhatsapp from "../../components/General/BotonWhatsapp";
import InstallPrompt from "../install/InstallPrompt";
import "./Home.css";

const { Title, Paragraph } = Typography;

const categories = [
  { title: "Frutas nacionales", img: "/images/mangostino.webp" },
  { title: "Verduras", img: "/images/verdurasProducto.jpg" },
  { title: "Frutas importadas", img: "/images/frutasImportadas.jpg" },
  { title: "Hortalizas", img: "/images/hortalizas.jpg" },
]

const Home = () => {  
  const carouselRef = useRef(null);
  
  const [isModalVisible, setIsModalVisible] = useState(() => {
    const storedValue = localStorage.getItem('modalShown');
    return storedValue !== null ? JSON.parse(storedValue) : true;
  });

  const [userType, setUserType] = useState(() => {
    const storedValue = localStorage.getItem('userType');
    return storedValue !== null ? storedValue : 'Hogar';
  });
  
  const userTypes = ['Hogar', 'Supermercado', 'Restaurante', 'Fruver']
  const [publicity, setPublicity] = useState({})
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();  
  
  const handleCategoryClick = category => navigate(`/products?category=${encodeURIComponent(category)}`);

  const handleSearch = value => navigate(`/products?search=${encodeURIComponent(value)}`);

  const fetchProducts = async (query) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/products?search=${query}`,
        { withCredentials: true }
      );
  
      if (response.data && Array.isArray(response.data)) {
        // Filtrar productos en el frontend si es necesario
        const filteredProducts = response.data.filter((product) =>
          product.name.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(filteredProducts);
      } else {
        throw new Error("Respuesta inesperada del backend");
      }
    } catch (error) {
      message.error("Error al cargar los productos.");
      console.error("Error al obtener productos:", error);
    }
  };  

  const handleSearchChange = value => {
    setSearchValue(value);
    value ? fetchProducts(value) : setSearchResults([])
  }

  const handleSelect = value => {
    const selectedProduct = searchResults.find( product => product.name === value );
    
    selectedProduct && navigate(`/products?search=${encodeURIComponent(selectedProduct.name)}&id=${encodeURIComponent(selectedProduct.product_id)}`)
  };

  
  useEffect(() => {
    userType &&
      localStorage.setItem("modalShown", false);
      localStorage.setItem("userType", userType);
    !userType &&       
      localStorage.setItem("modalShown", true);
  }, [userType]); 

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/publicidad");
        const responseData = await response.json();
        const publicityData = responseData.filter(publicity => publicity.category === userType.toLowerCase())

        setPublicity(publicityData);
      } catch (error) {
        console.error("Error al cargar los datos", error);
      }
    };
    fetchData();
  }, []);

  const handleNext = () => carouselRef.current.next();
  const handlePrev = () => carouselRef.current.prev();

  const handleNavigate = link => navigate(link);

  const handleUserTypeChange = type => {
    setUserType(type)
    setIsModalVisible(!isModalVisible)
    window.location.reload()
  };

  return (
    <>
      <Header 
        searchResults={searchResults} 
        handleSelect={handleSelect}
        handleSearchChange={handleSearchChange}
        handleSearch={handleSearch}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />
      <main>
        <div className="search-bar">
          <AutoComplete
            options={searchResults.map((product) => {
              // Obtener el mínimo y máximo de los precios en todas las variaciones
              const prices = product.variations.flatMap((variation) => [
                variation.price_fruver,
                variation.price_home,
                variation.price_restaurant,
                variation.price_supermarket,
              ]);

              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);

              return {
                value: product.name, // Usar "name" del backend
                key: product.product_id, // Clave única
                label: (
                  <div className="search-result-item">
                    <div>
                      <img
                        src={product.photo_url} // Usar "photo_url" para la miniatura
                        alt={product.name} // Usar "name" como alt
                        style={{ width: "50px", marginRight: "10px" }}
                      />
                      <span>{product.name}</span> {/* Mostrar el nombre del producto */}
                    </div>
                    <span className="range">
                      {minPrice === maxPrice
                        ? `$${minPrice}` // Si los precios son iguales, mostrar solo uno
                        : `$${minPrice} - $${maxPrice}`} {/* Mostrar el rango de precios */}
                    </span>
                  </div>
                ),
              };
            })}
            style={{ width: 500 }}
            onSelect={handleSelect}
            onSearch={handleSearchChange}
            placeholder="Buscar productos, categorías, etc."
            value={searchValue}
            onChange={setSearchValue}
          />

          <Button
            type="primary"
            className="search-button"
            onClick={() => handleSearch(searchValue)}
          >
            Buscar
          </Button>
        </div>
        {/* Carrusel principal */}
        <div className="carousel-wrapper">
          <Carousel autoplay className="home-carousel" ref={carouselRef}>
            {publicity.length > 0 && publicity.map((item, index) => (
              <div key={index} className="carousel-item">
                <img
                  src={item.photo_url}
                  alt={item.title}
                  className="carousel-image"
                />
                <div className="carousel-overlay">
                  <div className="carousel-left">
                    <Title
                      level={2}
                      className="carousel-title"
                      style={{ color: "white" }}
                    >
                      {item.title}
                    </Title>
                    <Paragraph className="carousel-description">
                      {item.description}
                    </Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      className="carousel-button"
                      onClick={() => handleNavigate('/products')}
                    >
                      Ver más
                    </Button>
                  </div>
                  <div className="carousel-right">
                    <img
                      src="/images/1.png"
                      alt="Logo"
                      className="carousel-logo"
                    />
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>

        {/* Categorías destacadas */}
        <section className="categories-section">
          <h3 style={{ color: "#00983a" }}> Explora nuestras categorías </h3>
          <ul>
            {categories.map((category, index) => (
              <li key={index}>
                <Card
                  hoverable
                  cover={<img alt={category.title} src={category.img} />}
                  className="category-card"
                  onClick={() => handleCategoryClick(category.title)}
                >
                  <Card.Meta title={category.title} />
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Testimonios o sección de información */}
        <section className="info-section">
          <h3>Calidad garantizada</h3>
          <p>
            En Don Kampo, nuestra pasión es brindar productos frescos y de
            calidad excepcional, cultivados con dedicación y respeto por la
            tierra. <br /><br /> Nos enorgullece llevar lo mejor del campo directamente a
            tu mesa, promoviendo un consumo responsable y sostenible que
            apoya a nuestros agricultores y cuida del medio ambiente.
          </p>
          <Button type="primary" size="large">Conoce más sobre nosotros</Button>

          <div />
        </section>

        <section className="delivery-section">
          <h2> No te Preocupes por el Envío! </h2>
          <p>Los envios se despachan al dia siguiente</p>
          <img  alt="Camión Don Kampo" src="/images/37.png"
          />
        </section>

        {/* Modal de selección de usuario */}
        <Modal
          open={isModalVisible}
          closable={false}
          footer={null}
        >
          <img src="/images/1.png" alt="Logo" />
          <div className="modal-text">
            Por el momento, nuestros servicios están disponibles únicamente en
            <span className="modal-body-highlight"> Chía</span> y
            <span className="modal-body-highlight"> Cajicá</span>. ¡Gracias por
            tu comprensión!
          </div>
          <div className="user-type-selection">
            <Title level={5}>Selecciona tu tipo de usuario:</Title>
            <Row gutter={[16, 16]} justify="center">
              {userTypes.map((type, index) => (
                <Col xs={24} sm={12} md={12} key={index}>
                  <Button
                    type={userType === type ? "primary" : "default"}
                    onClick={() => handleUserTypeChange(type)}
                    className="user-type-button"
                  >
                    {type}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>
        </Modal>

        <InstallPrompt />
      </main>
      <Footer />
      <BotonWhatsapp />
    </>
  );
};

export default Home;
