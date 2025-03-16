import axios from "axios";

const API_URL = "http://localhost:4002/v1";

// Function to handle GET request
export const getBu = async () => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const response = await axios.get(`${API_URL}/business/${org_id}`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const getCategoryList = async () => {
  try {
    const response = await axios.get(`${API_URL}/category`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const referenceRecord = async (refType) => {
  try {
    const response = await axios.get(`${API_URL}/references/${refType}`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const getSellingPriceRecord = async (prod_id) => {
  try {
    const response = await axios.get(`${API_URL}/prodsellingprice/${prod_id}`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};

export const setSellingPrice = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/sellingprice `, {
      sellingprice: payload,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getProducts = async () => {
  try {
    const org_id = JSON.parse(localStorage.getItem("user"))?.org_id;
    const response = await axios.get(`${API_URL}/products/${org_id}`);
    return response.data; // Return only the data from the response
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Rethrow error to be handled by calling components
  }
};
