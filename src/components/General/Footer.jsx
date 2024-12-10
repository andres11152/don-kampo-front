import React from "react";
import "./General.css";
import { WhatsAppOutlined, MailOutlined } from '@ant-design/icons';


const categories = [
  {
    title: "Frutas nacionales",
    img: "/images/mangostino.webp",
    link: "/products?category=Frutas",
  },
  { title: "Verduras", img: "/images/verdurasProducto.jpg", link: "/products?category=Verdura" },
  {
    title: "Frutas importadas",
    img: "/images/frutasImportadas.jpg",
    link: "/frutas-importadas",
  },
  { title: "Hortalizas", img: "/images/hortalizas.jpg", link: "/products?category=Hortalizas" },
  { title: "Cosecha", img: "/images/organicas.webp", link: "/products?category=Cosecha" },
];

const Footer = () => {
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

      <hr />
      <ul className="contact-info">
        <li className="contact">
          <a href="https://wa.me/3117366666" target="_blank" rel="noopener noreferrer"> <i className="fa-brands fa-whatsapp" /> +573117366666 </a>
          <a href="mailto:info@donkampo.com"><i className="fa-regular fa-envelope" /> info@donkampo.com </a>
        </li>
        <li className="copy">
          <span>&copy; { new Date().getFullYear() } Don Kampo. Todos los derechos reservados</span>
          <span> Diseñado y Desarrollado por <a href="https://www.cre8tive.pro/" target="_blank" rel="noopener noreferrer"> Cre8tive Agency </a></span>
        </li>
      </ul>
    </footer>
  );
};

export default Footer;
