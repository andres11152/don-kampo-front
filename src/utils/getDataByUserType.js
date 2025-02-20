import { userType } from "./getUser";

const getPrice = variation => {
    const price = variation[`price_${userType === 'admin' ? 'fruver' : userType}`]
    return parseInt(price);
};

const getShippingCost = shippingData => {
    const formattedUserType = 
        userType === 'home' ? 'Hogar'
        : userType === 'supermarket' ? 'Supermercado'
        : userType === 'restaurant' ? 'Restaurante'
        : 'Fruver'
 
    const shippingCost = shippingData.filter(data => data.type_name === formattedUserType)[0].shipping_cost
    return shippingCost
}

const isAmountCheckout = amount => { 
    const isAmount = (userType === 'home' && amount >= 50000) || amount >= 100000
    let content
    if (!isAmount) content = `Necesitas un minimo de $${userType === 'home' ? '5' : '10'}0.000`
    return { isAmount, content }
}

export { getPrice, getShippingCost, isAmountCheckout }