const loginData = JSON.parse(localStorage.getItem("loginData"))

const userData = loginData?.user

let userType = userData?.user_type;

userType = 
    (userType === 'hogar' || userType === undefined) ? 'home' 
    : userType === 'supermercado' ? 'supermarket'
    : userType === 'restaurante' ? 'restaurant'
    : userType

export { userData, userType }