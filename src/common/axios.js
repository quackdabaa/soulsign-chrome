import Axios from "axios";

const axios = Axios.create({timeout: 30e3});
globalThis.axios = axios;

export default axios;
