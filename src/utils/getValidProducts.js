import { userType } from "./getUser";

const getValidProducts = products => {  
  if (userType === 'admin') {    
    return products
  } else {
    const validProducts = products
    .map(product => {
        // Filtrar variaciones con precio mayor a 0 según userType
        const validVariation = product.variations[`price_${userType}`] > 0;

        // Retornar solo si tiene al menos una variación válida
        return validVariation ? product : null;
    })
    .filter(product => product !== null) // Eliminar productos sin variaciones válidas
    .filter(product => product.active && product.variations.some(variation => variation.active)) // Solo productos activos con al menos una variación activa
    .map(product => ({
        ...product,
        variations: product.variations.filter(variation => variation.active) // Solo incluir variaciones activas
    }));
    
    return validProducts
  }
}

export default getValidProducts