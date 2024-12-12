import React, { useEffect, useState } from "react";
import "./InstallPrompt.css"; // CSS para el modal
import "font-awesome/css/font-awesome.min.css";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
      setShowModal(true); 
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", () => {});
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Muestra el prompt nativo de instalación
      deferredPrompt.userChoice.then((choiceResult) => {

        setDeferredPrompt(null); // Limpia el evento
        setShowModal(false); // Cierra el modal
      });
    }
  };

  const handleCancel = () => {
    setShowModal(false); // Cierra el modal si el usuario decide no instalar
  };

  if (!showModal) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>¿Quieres instalar esta aplicación?</h2>
        <p>Puedes instalar esta aplicación en tu dispositivo para un acceso más rápido y una experiencia más cómoda.</p>
        
        <ul>
          {['android', 'apple', 'windows'].map((icon, index) =>  <li key={index}><i className={`fa fa-${icon}`} /></li>)}
        </ul>

        <div className="modal-actions">
          <button onClick={handleInstall}>Instalar</button>
          <button onClick={handleCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
