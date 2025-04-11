import axios from "axios";
import authHeader from "./authheader";
import { LslRequest } from "./models";

const API_URL = "https://odisse.informatik.uni-mannheim.de/";

const getProfile = () => {
  return axios.get(API_URL + "auth/me", { headers: authHeader() });
};

const execute = (request: LslRequest) => {
  return axios.post(API_URL + "api/v1/lasso/execute", request, { headers: authHeader() });
};

const getScriptJobStatus = (executionId: string) => {
  return axios.get(`${API_URL}api/v1/lasso/scripts/${executionId}/status`, { headers: authHeader() });
};

const retrieveParquet = (executionId: string) => {
  return axios.get(API_URL + "publicapi/v1/lasso/analytics/raw/srm/" + executionId + "_all.parquet", {responseType: 'arraybuffer'});
};

const retrieveParquetUrl = (executionId: string) => {
  return API_URL + "publicapi/v1/lasso/analytics/raw/srm/" + executionId + "_all.parquet";
};

const LassoService = {
    getProfile,
    execute,
    getScriptJobStatus,
    retrieveParquet,
    retrieveParquetUrl
};

export default LassoService;