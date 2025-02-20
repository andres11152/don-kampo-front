import React from "react";
import "css/General.css";
import { FaMobileAlt } from "react-icons/fa";

const categories = [
  {
    title: "Frutas Nacionales",
    img: "/images/mangostino.webp",
    link: "/products?category=Frutas Nacionales",
  },
  { title: "Verduras", 
    img: "/images/verdurasProducto.jpg", 
    link: "/products?category=verduras" },
  {
    title: "Frutas Importadas",
    img: "/images/frutasImportadas.jpg",
    link: "/products?category=frutas importadas",
  },
  { title: "Hortalizas", 
    img: "/images/hortalizas.jpg", 
    link: "/products?category=hortalizas" 
  },
  { title: "Cosechas", 
    img: "/images/organicas.webp", 
    link: "/products?category=cosechas" 
  },
];


const Footer = (props) => {
  const { setShowInstallModal } = props
  return (
    <footer className="footer">
      <h3>Explora nuestras categorías</h3>

      <nav>
        <ul>
        {categories.map((category, index) => (
          <li key={index}>
            <a href={category.link}>
              <img src={category.img} alt={category.title} />
              <p>{category.title}</p>
            </a>
          </li>
        ))}
        </ul>
      </nav>

      <ul className="contact-info">
        <li className="contact">
          <a href="https://wa.me/3117366666" target="_blank" rel="noopener noreferrer"> <i className="fa-brands fa-whatsapp" /> +573117366666 </a>
          <a href="mailto:info@donkampo.com"><i className="fa-regular fa-envelope" /> info@donkampo.com </a>
          
        </li>
        <li className="copy">
        <span> Diseñado y Desarrollado por <a href="https://www.cre8tive.pro/" target="_blank" rel="noopener noreferrer" className="company"> Cre8tive Agency </a></span>
          <span>&copy; { new Date().getFullYear() } Don Kampo. Todos los derechos reservados</span>
        </li>
      </ul>
      <button onClick={() => setShowInstallModal(true)}><i className="fa-solid fa-mobile-screen"/>  Instalar App</button>
    </footer>
  );
};

export default Footer;
