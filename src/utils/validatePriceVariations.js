import { message } from "antd";

const validatePriceVariations = variations => {
    const validPriceVariation = variation => variation !== "" && variation !== null && variation > 0;

    // Validar que al menos una variación tenga un precio
    const hasValidPrice = variations.some(variation => 
        validPriceVariation(variation.price_home) || validPriceVariation(variation.price_supermarket) ||
        validPriceVariation(variation.price_restaurant) || validPriceVariation(variation.price_fruver)
    );

    if (!hasValidPrice) { message.error('Debe ingresar al menos un precio en alguna variación') }
    
    return hasValidPrice
}
    
export default validatePriceVariations