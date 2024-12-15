import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ManagePublicity.css";

const ManagePublicity = () => {
  // Estado para almacenar las imágenes y datos de cada categoría
  const [data, setData] = useState({});
  const [newCategoryName, setNewCategoryName] = useState(""); // Nombre de la nueva categoría
  const [selectedImage, setSelectedImage] = useState(null); // Para la imagen en el modal

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/publicidad");
        const responseData = await response.json();

        setData(responseData);
      } catch (error) {
        console.error("Error al cargar los datos", error);
      }
    };
    fetchData();
  }, []);

  // Manejar la carga de imágenes
  const handleImageUpload = (e, category, index) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData((prevData) => {
          const updatedPhotos = [...prevData[category].photos];
          updatedPhotos[index] = reader.result;
          return { ...prevData, [category]: { ...prevData[category], photos: updatedPhotos } };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar cambios en título, descripción y datos adicionales
  const handleInputChange = (e, categoryKey, field) => {
    const { value } = e.target;
    setData((prevData) => {
      return { ...prevData, [categoryKey]: { ...prevData[categoryKey], [field]: value } };
    });
  };

  // Eliminar una imagen
  const removeImage = (category, index) => {
    setData((prevData) => {
      const updatedPhotos = [...prevData[category].photos];
      updatedPhotos[index] = null;
      return { ...prevData, [category]: { ...prevData[category], photos: updatedPhotos } };
    });
  };

  const sendPublicity = async () => {
    const formData = new FormData();
  
    // Convertir los datos de cada categoría a un formato serializable
    Object.keys(data).forEach((category) => {
      const categoryData = {
        photos: data[category].photos, // Arreglo de imágenes (como URLs o base64)
        title: data[category].title,
        description: data[category].description,
      };
      // Agregar cada categoría serializada al FormData
      formData.append(category, JSON.stringify(categoryData));
    });
      
    try {
      const response = await axios.post("http://localhost:8080/api/publicidad", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Publicidad enviada exitosamente");
    } catch (error) {
      console.error("Error al enviar la publicidad:", error);
      alert("Error al enviar la publicidad");
    }
  };  
  
  const addPublicity = () => {
    if (!newCategoryName.trim()) {
      alert("Por favor, ingresa un nombre para la categoría.");
      return;
    }

    if (data[newCategoryName]) {
      alert("Esta categoría ya existe.");
      return;
    }

    // Añadir nueva categoría al estado
    setData((prevData) => ({
      ...prevData,
      [newCategoryName]: { photos: [null, null, null, null], title: "", description: "" },
    }));

    // Limpiar el nombre de la nueva categoría
    setNewCategoryName("");
  };

  // Actualizar categoría completa
  const updateCategory = async (categoryKey) => {
    try {
      await fetch(`/api/publicidad/categoria`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [categoryKey]: data[categoryKey] }),
      });
      alert(`${categoryKey} actualizada exitosamente`);
    } catch (error) {
      alert(`Error al actualizar ${categoryKey}`);
    }
  };

  // Actualizar imagen individual
  const updateImage = async (categoryKey, index) => {
    try {
      await fetch(`/api/publicidad/categoria/photo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryKey,
          index,
          photo: data[categoryKey].photos[index],
        }),
      });
      alert(`Imagen ${index + 1} de ${categoryKey} actualizada exitosamente`);
    } catch (error) {
      alert(`Error al actualizar la imagen ${index + 1} de ${categoryKey}`);
    }
  };

  return (
    <section className="manage-publicity">
      <h2> Generar Publicidad </h2>

      <button onClick={sendPublicity} className="send-publicity-button"> Enviar Publicidad </button>

      <div className="add-category">
        <input
          type="text"
          placeholder="Nombre de la nueva categoría"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <button onClick={addPublicity} className="add-publicity-button"> Añadir Publicidad </button>
      </div>
      <div>
      {Object.keys(data).map((categoryKey) => ( 
        <div className="categories" key={categoryKey}>
          <h3>
            {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
            <button
              onClick={() => updateCategory(categoryKey)}
              className="update-category-button"
            >
              Actualizar Categoría
            </button>
          </h3>
          <input
            type="text"
            placeholder="Título de la categoría"
            className="category-title-input"
            value={data[categoryKey].title}
            onChange={(e) => handleInputChange(e, categoryKey, "title")}
          />
          <textarea
            placeholder="Descripción de la categoría"
            className="category-description-input"
            value={data[categoryKey].description}
            onChange={(e) => handleInputChange(e, categoryKey, "description")}
          />
          <div className="category">
            {data[categoryKey].photos.map((photo, index) => (
              <div className="image-container" key={index}>
                {photo ? (
                  <div className="image-preview">
                    <img
                      src={photo}
                      alt={`Previsualización ${index + 1}`}
                      onClick={() => setSelectedImage(photo)} // Abre la imagen en el modal
                    />
                    <button
                      onClick={() => removeImage(categoryKey, index)}
                      className="remove-image-button"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => updateImage(categoryKey, index)}
                      className="update-image-button"
                      style={{ position: "absolute", top: "10px", right: "10px" }}
                    >
                      <i className="fa-solid fa-arrow-up-from-bracket" />
                    </button>
                  </div>
                ) : (
                  <div className="upload-area">
                    <label htmlFor={`image-upload-${categoryKey}-${index}`} className="upload-label">
                      Cargar imagen
                    </label>
                    <input
                      id={`image-upload-${categoryKey}-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, categoryKey, index)}
                      style={{ display: "none" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      </div>

      {/* Modal para mostrar la imagen ampliada */}
      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Vista ampliada" className="modal-image" />
        </div>
      )}
    </section>
  );
};

export default ManagePublicity;
