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
import { useNavigate } from "react-router-dom";
import Header from "components/General/Header";
import Footer from "components/General/Footer";
import FloatingButtons from "components/General/FloatingButtons";
import InstallPrompt from "components/InstallPrompt";
import getFetch from 'utils/getFetch.js'
import "css/Home.css";

const { Title, Paragraph } = Typography;

const categories = [
  { title: "Frutas nacionales", img: "/images/mangostino.webp" },
  { title: "Verduras", img: "/images/verdurasProducto.jpg" },
  { title: "Frutas importadas", img: "/images/frutasImportadas.jpg" },
  { title: "Hortalizas", img: "/images/hortalizas.jpg" },
]

const Home = () => {  
  const carouselRef = useRef(null);
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(() => {
    const storedValue = localStorage.getItem('modalShown');
    return storedValue !== null ? JSON.parse(storedValue) : true;
  });
  const navigate = useNavigate(); 
    
  const userTypes = ['Hogar', 'Supermercado', 'Restaurante', 'Fruver']
  const [publicity, setPublicity] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [userType, setUserType] = useState(() => {
    return localStorage.getItem("userType") || "Hogar"; // Default: "Hogar"
  });
  
  
  const handleCategoryClick = category => navigate(`/products?category=${encodeURIComponent(category)}`);

  const handleSearch = value => navigate(`/products?search=${encodeURIComponent(value)}`);

  const fetchProducts = async query =>
    getFetch('products', `?search=${query}`)
      .then(fetchedProducts => {
        const filteredProducts = fetchedProducts.filter(product => product.name.toLowerCase().includes(query.toLowerCase()));

        setSearchResults(filteredProducts);
      })
      .catch(error => {
        message.error("Error al cargar los productos.");
        console.error("Error al obtener productos:", error);
      })

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
    !userType &&       
      localStorage.setItem("modalShown", true);
  }, [userType]); 

  // Cargar datos iniciales
  useEffect(() => {
    getFetch('publicidad', '')
      .then(fetchedPublicity => {
        const advertisement = fetchedPublicity.filter(
          advertisement => advertisement.category.toLowerCase() === userType.toLowerCase()
        );
        setPublicity(advertisement);
      })
  }, [userType]); // Se vuelve a llamar cada vez que userType cambia

  const handleNavigate = link => navigate(link);

  const handleUserTypeChange = (type) => {
    localStorage.setItem("userType", type); // Guardar en una clave separada
    setUserType(type);
    setIsModalVisible(false);
  };
  

  return (
    <>
      <Header setShowInstallModal={setShowInstallModal} />
      <main>
      <div className="search-bar">
          <AutoComplete
            className="custom-search-bar" // Agregamos una clase personalizada
            options={searchResults.map((product) => {
              const prices = product.variations.flatMap((variation) => [
                variation.price_fruver,
                variation.price_home,
                variation.price_restaurant,
                variation.price_supermarket,
              ]);

              const minPrice = Math.min(...prices);

              return {
                value: product.name,
                key: product.product_id,
                label: (
                  <div className="search-result-item">
                    <div>
                      <img
                        src={product.photo_url}
                        alt={product.name}
                        style={{ width: "50px", marginRight: "10px" }}
                      />
                      <span>{product.name}</span>
                    </div>
                    <span className="range">Desde: {minPrice}</span>
                  </div>
                ),
              };
            })}
            style={{ width: "500px" }} // Esto es opcional, el estilo puede ir en CSS
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
                      onClick={() => handleNavigate(`/products?id=${item.related_product_id}`)}
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
                  onClick={(e) => {
                    e.preventDefault(); 
                    handleCategoryClick(category.title);
                  }}
                  
                >
                  <Card.Meta title={category.title} />
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* sección de información */}
        <section className="info-section">
          <h3>Calidad garantizada</h3>
          <p>
            En Don Kampo, nuestra pasión es brindar productos frescos y de
            calidad excepcional, cultivados con dedicación y respeto por la
            tierra. <br /><br /> Nos enorgullece llevar lo mejor del campo directamente a
            tu mesa, promoviendo un consumo responsable y sostenible que
            apoya a nuestros agricultores y cuida del medio ambiente.
          </p>
          <Button  type="primary" size="50%" >Conoce más sobre nosotros</Button>

          <div />
        </section>

        <section className="delivery-section">
          <h2> No te Preocupes por el Envío! </h2>
          <h2>Te lo llevamos hasta tu puerta</h2>
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

        <InstallPrompt setShowInstallModal={setShowInstallModal} showInstallModal={showInstallModal} />

      </main>
      <Footer setShowInstallModal={setShowInstallModal} />
      <FloatingButtons />
    </>
  );
};

export default Home;