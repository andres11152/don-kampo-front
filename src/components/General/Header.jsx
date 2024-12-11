import React, { useEffect, useState } from "react";
import { Menu, Drawer, Button, Badge } from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../pages/products/CartContext"; // Importa el hook de contexto de carrito
import "./General.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  localStorage.setItem("selectedKey", localStorage.getItem('selectedKey' || ''));
  // Obtener el cartValue y cartCount desde el contexto del carrito
  const { cartValue, cartCount } = useCart();

  // Obtener el loginData del localStorage
  const loginData = JSON.parse(localStorage.getItem("loginData"));
  const isLoggedIn = Boolean(loginData && loginData.user);
  const isAdmin = isLoggedIn && loginData.user.user_type === "admin"; // Verifica si el usuario es admin

  // Estado para la ruta seleccionada y para el drawer en pantallas pequeñas
  const [selectedKey, setSelectedKey] = useState(localStorage.getItem('selectedKey'));
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Efecto para actualizar la ruta seleccionada en el menú
  useEffect(() => {
    const path = location.pathname;
    switch (path) {
      case "/":
        setSelectedKey("home");
        break;
      case "/products":
        setSelectedKey("products");
        break;
      case "/profile":
        setSelectedKey("profile");
        break;
      case "/login":
        setSelectedKey("login");
        break;
      case "/register":
        setSelectedKey("register");
        break;
      case "/cart":
        setSelectedKey("cart");
        break;
      case "/createproduct":
        setSelectedKey("createproduct");
        break;
      case "/createorder":
        setSelectedKey("createorder");
        break;
      case "/manageproducts":
        setSelectedKey("manageproducts");
        break;
      case "/checkout":
        setSelectedKey("checkout");
        break;
      case "/adminprofile":
        setSelectedKey("adminprofile");
        break;

      default:
        setSelectedKey("home");
        break;
    }
  }, [location.pathname]);

  // Función para manejar el clic en el menú y cambiar la ruta
  const handleMenuClick = key => {
    localStorage.setItem("selectedKey", key);    
    setSelectedKey(key);
    setDrawerVisible(false); // Cierra el Drawer si se selecciona un elemento
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("loginData");
    localStorage.removeItem("cart");
    handleMenuClick("login", "/login");
  };

  return (
    <header className="header">
      <div>
        <a href="/">
          <img src="/images/1.png" alt="Don Kampo Logo"/>
        </a>

        <div
          className="cart-icon"
          style={{ display: "flex", alignItems: "center" }}
          onClick={() => handleMenuClick("cart", "/cart")}
        >
          <Badge
            count={
              cartValue > 99999
                ? `${(cartValue / 1000).toFixed(1)}K`
                : `$${cartValue.toLocaleString()}`
            }
            offset={[10, 0]}
            style={{
              backgroundColor: "#52c41a",
              fontSize: "14px",
              padding: "0 8px",
            }}
          >
            <ShoppingCartOutlined
              style={{ fontSize: "24px", color: "white", cursor: "pointer" }}
            />
          </Badge>
        </div>
      </div>

      {/* Menú para pantallas grandes */}
      <nav>
        <ul>
          <li>
            <a className={`${selectedKey === 'Inicio' ? 'selected' : ''}`} href="/" onClick={() => handleMenuClick('Inicio')}><i className="fa-solid fa-house" />Inicio</a>
          </li>
          <li className="cosechas">
            <a href="/products?category=Cosecha">Cosechas</a>
          </li>
          <li>
            <a className={`${selectedKey === 'Productos' ? 'selected' : ''}`} href="/products" onClick={() => handleMenuClick('Productos')}><i className="fa-solid fa-grip" />Productos</a>
          </li>
          { isLoggedIn ? 
            <>
              { isAdmin && <li><a className={`${selectedKey === 'Agregar' ? 'selected' : ''}`} href="/createproduct" onClick={() => handleMenuClick('Agregar')}><i className="fa-solid fa-plus" /> Agregar Productos</a></li> }
              { isAdmin && <li><a className={`${selectedKey === 'Gestionar' ? 'selected' : ''}`} href="/manageproducts" onClick={() => handleMenuClick('Gestionar')}><i className="fa-solid fa-sliders" /> Gestionar Productos</a></li> }
              <li><a className={`${selectedKey === 'Perfil' ? 'selected' : ''}`} href="/profile" onClick={() => handleMenuClick('Perfil')}><i className="fa-regular fa-user" /> {loginData.user.user_name} </a></li>
              <li><a onClick={handleLogout}><i className="fa-solid fa-right-from-bracket" /> Cerrar Sesion </a></li>
            </>
          :   
            <>
              <li><a className={`${selectedKey === 'Login' ? 'selected' : ''}`} href="/login" onClick={() => handleMenuClick('Login')}><i className="fa-solid fa-user" /> Iniciar Sesion </a></li>
              <li><a className={`${selectedKey === 'Register' ? 'selected' : ''}`} href="/register" onClick={() => handleMenuClick('Register')}><i className="fa-regular fa-circle-user" /> Registrarse </a></li>
            </>
          }
        </ul>
      </nav>

      {/* Ícono de menú para pantallas pequeñas */}
      <button onClick={() => setDrawerVisible(true)}> <i className="fa-solid fa-bars" /></button>

      {/* Drawer para menú en pantallas pequeñas */}
      <Drawer
        title="Menú"
        placement="right"
        closable
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={200}
      >
        <Menu theme="light" mode="vertical" selectedKeys={[selectedKey]}>
          <Menu.Item
            key="home"
            icon={<HomeOutlined />}
            onClick={() => handleMenuClick("home", "/")}
          >
            Inicio
          </Menu.Item>
          <Menu.Item
            key="products"
            icon={<AppstoreOutlined />}
            onClick={() => handleMenuClick("products", "/products")}
          >
            Productos
          </Menu.Item>

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Menu.Item
                  key="createproduct"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    handleMenuClick("createproduct", "/createproduct")
                  }
                >
                  Agregar Productos
                </Menu.Item>
              )}
              <Menu.Item
                key="profile"
                icon={<UserOutlined />}
                onClick={() => handleMenuClick("profile", "/profile")}
              >
                {loginData.user.user_name}
              </Menu.Item>
              <Menu.Item
                key="logout"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item
                key="login"
                onClick={() => handleMenuClick("login", "/login")}
              >
                Iniciar Sesión
              </Menu.Item>
              <Menu.Item
                key="register"
                onClick={() => handleMenuClick("register", "/register")}
              >
                Registrarse
              </Menu.Item>
            </>
          )}
        </Menu>
      </Drawer>
    </header>
  );
};

export default Header;
