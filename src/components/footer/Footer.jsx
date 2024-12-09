import React from "react";
import { Layout, Row, Col } from "antd";
import "./Footer.css";
import { WhatsAppOutlined, MailOutlined } from '@ant-design/icons';

const { Footer } = Layout;

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

const CustomFooter = () => {
  return (
    <Footer className="footer">
      <div className="footer-content">
        <h3 className="footer-title">Explora nuestras categorías</h3>
        <div className="category-container">
          {categories.map((category, index) => (
            <a href={category.link} className="category-link" key={index}>
              <img
                src={category.img}
                alt={category.title}
                className="category-image"
              />
              <p className="category-title">{category.title}</p>
            </a>
          ))}
        </div>
        <div className="contact-info">
          <a href="https://wa.me/3117366666" className="contact-link" target="_blank" rel="noopener noreferrer">
            WhatsApp: 3117366666
          </a>
          <a href="mailto:info@donkampo.com" className="contact-link">
            Email: info@donkampo.com
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2024 Don Kampo. Todos los derechos reservados.</p>
        <p>
          Diseñado y Desarrollado por{" "}
          <a
            href="https://www.cre8tive.pro/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cre8tive Agency
          </a>
          .
        </p>
      </div>
    </Footer>
  );
};

export default CustomFooter;
