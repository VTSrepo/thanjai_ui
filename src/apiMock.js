import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

const mock = new AxiosMockAdapter(axios, { delayResponse: 500 });
const API_URL = process.env.REACT_APP_MODE  === "development" ?process.env.REACT_APP_API_URL_DEV:process.env.REACT_APP_API_URL_PROD;
// Mock POST /login
mock.onPost(`${API_URL}/login`).reply(200, {
    "status": 200,
    "code": 200,
    "message": "Success",
    "developerMessage": "Success",
    "user": {
        "user_id": "kumar",
        "user_name": "Kumaresan",
        "user_status": "A",
        "org_id": "TR",
        "branch_id": "TR001",
        "user_type": "A"
    }
});

// Mock other endpoints as needed
// mock.onGet('/api/something').reply(200, { ... });

console.log('[axios-mock-adapter] Mock API enabled');

export default mock;
