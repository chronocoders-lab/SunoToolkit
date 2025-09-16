// scripts/api-client.js
const axios = require('axios');

class SunoAPIClient {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
    }
    
    async generateSong(options) {
        const response = await axios.post(`${this.baseURL}/generate`, options);
        return response.data;
    }
    
    async batchUpload(csvFile) {
        const formData = new FormData();
        formData.append('csvFile', csvFile);
        
        const response = await axios.post(`${this.baseURL}/batch-upload`, formData);
        return response.data;
    }
}