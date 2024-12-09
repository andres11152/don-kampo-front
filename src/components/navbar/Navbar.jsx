import React, { useEffect, useState } from "react";
import { Layout, Menu, Drawer, Button, Badge, Input } from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../pages/products/CartContext"; // Importa el hook de contexto de carrito
import "./Navbar.css";

const { Header } = Layout;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener el cartValue y cartCount desde el contexto del carrito
  const { cartValue, cartCount } = useCart();

  // Obtener el loginData del localStorage
  const loginData = JSON.parse(localStorage.getItem("loginData"));
  const isLoggedIn = Boolean(loginData && loginData.user);
  const isAdmin = isLoggedIn && loginData.user.user_type === "admin"; // Verifica si el usuario es admin

  // Estado para la ruta seleccionada y para el drawer en pantallas pequeñas
  const [selectedKey, setSelectedKey] = useState("");
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
  const handleMenuClick = (key, route) => {
    setSelectedKey(key);
    navigate(route);
    setDrawerVisible(false); // Cierra el Drawer si se selecciona un elemento
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("loginData");
    localStorage.removeItem("cart");
    handleMenuClick("login", "/login");
  };

 

  return (
    <Header className="navbar">
      <div className="navbar-left">
        {/* Logo */}
        <div className="logo" onClick={() => handleMenuClick("home", "/")}>
          <img
            src="/images/1.png"
            alt="Don Kampo Logo"
            style={{ height: "88px" }}
          />
        </div>

        
      </div>

      {/* Carrito */}
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

      {/* Menú para pantallas grandes */}
      <div className="menu-desktop">
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          className="menu"
        >
          <Menu.Item
            key="home"
            icon={<HomeOutlined />}
            onClick={() => handleMenuClick("home", "/")}
          >
            Inicio
          </Menu.Item>
          <Button
            type="secondary"
            className="cosechas-button"
            onClick={() => navigate("/products?category=Cosecha")}
            style={{
              marginLeft: "0px",
              backgroundColor: "#00983A",
              borderColor: "#FF914D",
              color: "#fff",
              marginTop: "17px",
            }}
          >
            Cosechas
          </Button>
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
              {isAdmin && (
                <Menu.Item
                  key="manageproducts"
                  icon={<AppstoreOutlined />}
                  onClick={() =>
                    handleMenuClick("manageproducts", "/manageproducts")
                  }
                >
                  Gestionar Productos
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
      </div>

      {/* Ícono de menú para pantallas pequeñas */}
      <Button
        className="menu-mobile-button"
        type="text"
        icon={<MenuOutlined />}
        onClick={() => setDrawerVisible(true)}
      />

      {/* Drawer para menú en pantallas pequeñas */}
      <Drawer
        title="Menú"
        placement="right"
        closable
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
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
    </Header>
  );
};

export default Navbar;
