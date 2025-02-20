import axios from "axios";
import getProductsWithPrice from 'utils/getProductsWithPrice'

const getFetch = async (endpoint, params) => {  
    const response = await axios.get(`http://localhost:8080/api/${endpoint}${params}`, { withCredentials: true });
    
    if (response.data) {
        if (endpoint === 'products') return getProductsWithPrice(response.data)
        else return response.data
    } 
};

export default getFetch