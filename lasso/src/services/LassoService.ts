import axios from "axios";
import authHeader from "./authheader";
import { LslRequest, RankRequest, SearchQueryRequest, SearchSrmQueryRequest } from "./models";

const API_URL = "https://odisse.informatik.uni-mannheim.de/";
//const API_URL = "http://localhost:10222/";

const getProfile = () => {
  return axios.get(API_URL + "auth/me", { headers: authHeader() });
};

const execute = (request: LslRequest) => {
  return axios.post(API_URL + "api/v1/lasso/execute", request, { headers: authHeader() });
};

const rank = (request: RankRequest) => {
  return axios.post(API_URL + "api/v1/lasso/rank/apply", request, { headers: authHeader() });
};

const getScriptJobStatus = (executionId: string) => {
  return axios.get(`${API_URL}api/v1/lasso/scripts/${executionId}`, { headers: authHeader() });
};

const getHubScripts = () => {
  return axios.get(`${API_URL}api/v1/lasso/hub`, { headers: authHeader() });
};

const getHubScriptsByUser = (user: string) => {
  return axios.get(`${API_URL}api/v1/lasso/hub/user/${user}`, { headers: authHeader() });
};

const getHubScriptsByTag = (tag: string) => {
  return axios.get(`${API_URL}api/v1/lasso/hub/tag/${tag}`, { headers: authHeader() });
};

const queryScript = (request: SearchSrmQueryRequest) => {
  const executionId = request.executionId
  return axios.post(`${API_URL}api/v1/lasso/scripts/${executionId}/query`, request, { headers: authHeader() });
};

const retrieveParquet = (executionId: string) => {
  return axios.get(API_URL + "publicapi/v1/lasso/analytics/raw/srm/" + executionId + "_all.parquet", {responseType: 'arraybuffer'});
};

const retrieveParquetUrl = (executionId: string) => {
  return API_URL + "publicapi/v1/lasso/analytics/raw/srm/" + executionId + "_all.parquet";
};

const queryImplementationsForDataSource = (dataSource: string, request: SearchQueryRequest) => {
  return axios.post(`${API_URL}api/v1/lasso/datasource/${dataSource}/query`, request, { headers: authHeader() });
};

const LassoService = {
    getProfile,
    execute,
    getHubScripts,
    getHubScriptsByUser,
    getHubScriptsByTag,
    rank,
    getScriptJobStatus,
    queryScript,
    retrieveParquet,
    retrieveParquetUrl,
    queryImplementationsForDataSource,
    API_URL
};

export default LassoService;