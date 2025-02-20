import { userType } from "./getUser";

const getProductsWithPrice = products => {  
  if (userType === 'admin') {    
    return products
  } else {
    const validProducts = products.map(product => {
      const validVariations = product.variations.filter(variation => variation[`price_${userType}`] > 0);    
      
      if (validVariations.length > 0) return {...product, variations: validVariations }
      else return null
    }).filter(product => product !== null)
    
    return validProducts
  }
}

export default getProductsWithPrice