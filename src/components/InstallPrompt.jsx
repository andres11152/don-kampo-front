import React, { useEffect, useState } from "react";
import "css/InstallPrompt.css"; // CSS para el modal
import "font-awesome/css/font-awesome.min.css";

const InstallPrompt = props => {
  const { setShowInstallPrompt } = props

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = e => {
      console.log('queso')
      e.preventDefault(); 
      setDeferredPrompt(e);  
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {    
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Muestra el prompt nativo de instalación
      deferredPrompt.userChoice.then((choiceResult) => {

        setDeferredPrompt(null); // Limpia el evento
      });
    }
  };

  const handleCancel = () => {    
    setShowInstallPrompt(false)
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <i className="fa-solid fa-xmark close" onClick={handleCancel} />

        <h2>¿Quieres instalar esta aplicación?</h2>
        <p>¡Puedes instalar esta aplicación en tu dispositivo para un acceso más rápido y una experiencia más cómoda!</p>
        
        <ul>
          {['android', 'apple', 'windows'].map((icon, index) =>  <li key={index}><i className={`fa fa-${icon}`} /></li>)}
        </ul>

        <div className="modal-actions">
          <button onClick={handleCancel}>Cancelar</button>
          <button onClick={handleInstall}>Instalar</button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;