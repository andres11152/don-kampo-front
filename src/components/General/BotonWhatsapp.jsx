import React, { useState } from "react";
import { FloatingWhatsApp } from "react-floating-whatsapp";

const BotonWhatsapp = () => {
  const [userMessage, setUserMessage] = useState("");
  const handleMessageChange = (event) => {
    setUserMessage(event.target.value);
  };

  const createWhatsAppLink = () => {
    const encodedMessage = encodeURIComponent(userMessage);
    const phoneNumber = "573117366666"; // Tu número de WhatsApp
    const messageUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    return messageUrl;
  };

  const welcomeMessage = "¡Hola! Bienvenido a Don Kampo, ¿en qué podemos ayudarte?";
  const combinedMessage = `${welcomeMessage}\n\n${userMessage}`;

  return (
    <div>
      <FloatingWhatsApp
        phoneNumber="573117366666"
        accountName="Don Kampo"
        avatar="/images/icon.png"
        statusMessage="En línea"
        chatMessage={combinedMessage}
        placeholder="Escribe tu mensaje..."
        darkMode={false}
        allowClickAway={true}
        color="white"
        url={createWhatsAppLink()} 
      />
    </div>
  );
};

export default BotonWhatsapp;
