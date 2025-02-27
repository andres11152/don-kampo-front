const loginData = JSON.parse(localStorage.getItem("loginData"))

const userData = loginData?.user

let userType = userData?.user_type;

userType = 
    userType === 'hogar' ? 'home' 
    : userType === 'supermercado' ? 'supermarket'
    : userType === 'restuarante' ? 'restaurant'
    : userType

export { userData, userType }