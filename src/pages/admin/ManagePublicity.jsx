import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManagePublicity.css";

const ManagePublicity = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [filteredAdvertisements, setFilteredAdvertisements] = useState([]);
  const [newAd, setNewAd] = useState({
    category: "",
    title: "",
    description: "",
    photo_url: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);  // Estado para la imagen del modal
  const [categoryFilter, setCategoryFilter] = useState(""); // Nuevo estado para filtrar

  // Obtener todas las publicidades
  const fetchAdvertisements = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/publicidad");
      setAdvertisements(response.data);
      setFilteredAdvertisements(response.data); // Inicializar con todas las publicidades
    } catch (error) {
      console.error("Error al obtener las publicidades:", error);
      alert("No se pudo cargar la lista de publicidades.");
    }
  };

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  useEffect(() => {
    // Filtrar publicidades según la categoría seleccionada
    if (categoryFilter) {
      setFilteredAdvertisements(
        advertisements.filter((ad) => ad.category === categoryFilter)
      );
    } else {
      setFilteredAdvertisements(advertisements);
    }
  }, [categoryFilter, advertisements]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setNewAd((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // Crear nueva publicidad
  const createAdvertisement = async () => {
    if (!newAd.category || !newAd.title || !newAd.description || !newAd.photo_url) {
      alert("Por favor, complete todos los campos antes de enviar.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.keys(newAd).forEach((key) => formData.append(key, newAd[key]));

      await axios.post("http://localhost:8080/api/publicidad", formData);
      alert("Publicidad creada exitosamente.");
      setNewAd({ category: "", title: "", description: "", photo_url: null });
      fetchAdvertisements();
    } catch (error) {
      console.error("Error al crear la publicidad:", error);
      alert("Ocurrió un error al crear la publicidad.");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar publicidad
  const deleteAdvertisement = async (id) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta publicidad?")) return;

    try {
      await axios.delete(`http://localhost:8080/api/publicidad/${id}`);
      alert("Publicidad eliminada correctamente.");
      fetchAdvertisements();
    } catch (error) {
      console.error("Error al eliminar la publicidad:", error);
      alert("No se pudo eliminar la publicidad.");
    }
  };

  // Abrir modal de edición
  const openEditModal = (ad) => {
    setEditingAd(ad);
    setNewAd({
      category: ad.category,
      title: ad.title,
      description: ad.description,
      photo_url: null, // Resetear archivo al abrir modal
    });
    setShowModal(true);
  };

  // Editar publicidad
  const editAdvertisement = async () => {
    if (!newAd.category || !newAd.title || !newAd.description) {
      alert("Por favor, complete todos los campos antes de enviar.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.keys(newAd).forEach((key) => formData.append(key, newAd[key]));

      await axios.put(`http://localhost:8080/api/publicidad/${editingAd.advertisement_id}`, formData);
      alert("Publicidad actualizada exitosamente.");
      setShowModal(false);
      fetchAdvertisements();
    } catch (error) {
      console.error("Error al editar la publicidad:", error);
      alert("Ocurrió un error al editar la publicidad.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar el modal con la imagen
  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setShowModal(true);
  };

  // Cerrar el modal
  const closeModal = () => {
    setShowModal(false);
    setModalImage(null);
  };

  return (
    <section className="manage-publicity">
      <h2>Gestión de Publicidad</h2>

      {/* Crear nueva publicidad */}
      <div className="create-advertisement">
        <h3>Crear Nueva Publicidad</h3>
        <select
          name="category"
          value={newAd.category}
          onChange={handleInputChange}
        >
          <option value="">Selecciona una categoría</option>
          <option value="hogar">Hogar</option>
          <option value="supermercado">Supermercado</option>
          <option value="restaurante">Restaurante</option>
          <option value="fruver">Fruver</option>
        </select>
        <input
          type="text"
          name="title"
          placeholder="Título"
          value={newAd.title}
          onChange={handleInputChange}
        />
        <textarea
          name="description"
          placeholder="Descripción"
          value={newAd.description}
          onChange={handleInputChange}
        />
        <input
          type="file"
          name="photo_url"
          accept="image/*"
          onChange={handleInputChange}
        />
        <button
          onClick={createAdvertisement}
          className="create-button"
          disabled={isLoading}
        >
          {isLoading ? "Creando..." : "Crear Publicidad"}
        </button>
      </div>

      {/* Filtro por categoría */}
      <div className="category-filter">
        <label htmlFor="categoryFilter">Filtrar por categoría:</label>
        <select
          id="categoryFilter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="hogar">Hogar</option>
          <option value="supermercado">Supermercado</option>
          <option value="restaurante">Restaurante</option>
          <option value="fruver">Fruver</option>
        </select>
      </div>

      {/* Lista de publicidades filtradas */}
      <div className="advertisements-list">
        {filteredAdvertisements.length > 0 ? (
          filteredAdvertisements.map((ad) => (
            <div key={ad.advertisement_id} className="advertisement-item">
              <img
                src={ad.photo_url}
                alt={ad.title}
                className="advertisement-image"
                onClick={() => openImageModal(ad.photo_url)} // Al hacer clic se abre el modal con la imagen
              />
              <div className="advertisement-info">
                <h4>{ad.title}</h4>
                <p>
                  <strong>Categoría:</strong> {ad.category}
                </p>
                <p>{ad.description}</p>
              </div>
              <div className="advertisement-actions">
                <button
                  onClick={() => deleteAdvertisement(ad.advertisement_id)}
                  className="delete-button"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => openEditModal(ad)}
                  className="edit-button"
                >
                  Editar
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No hay publicidades disponibles.</p>
        )}
      </div>

      {/* Modal para la imagen */}
      {showModal && modalImage && (
        <div className="modal">
          <div className="modal-content">
            <img src={modalImage} alt="Publicidad" className="modal-image" />
            <button onClick={closeModal} className="close-button">X</button>
          </div>
        </div>
      )}

      {/* Modal para editar publicidad */}
      {showModal && !modalImage && (
        <div className="modal">
          <div className="modal-content">
            <h3>Editar Publicidad</h3>
            <select
              name="category"
              value={newAd.category}
              onChange={handleInputChange}
            >
              <option value="">Selecciona una categoría</option>
              <option value="hogar">Hogar</option>
              <option value="supermercado">Supermercado</option>
              <option value="restaurante">Restaurante</option>
              <option value="fruver">Fruver</option>
            </select>
            <input
              type="text"
              name="title"
              placeholder="Título"
              value={newAd.title}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Descripción"
              value={newAd.description}
              onChange={handleInputChange}
            />
            <input
              type="file"
              name="photo_url"
              accept="image/*"
              onChange={handleInputChange}
            />
            <button onClick={editAdvertisement} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar Publicidad"}
            </button>
            <button onClick={closeModal} className="close-button">Cerrar</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ManagePublicity;
