---
sidebar_position: 1
---

# SRMs/SRHs Analysis

The LSL pipeline script executions result in one or more SRMs that are stored in LASSO's distributed database (based on Apache Ignite). The collection of SRMs effectively results in an SRM data warehouse, which we refer to as stimulus response hypercube (SRH).

Internally, LASSO uses duckdb to reason about SRMs.

## SRHs including SRMs are accessible

External data analytic tools can access the SRHs, enabling observational records analysis.

### **Export to Parquet**

SRM-related data can be exported to the popular Parquet format (supported by all popular analytics tools including Jupyter and duckdb):

* `http://localhost:10222/publicapi/v1/lasso/analytics/raw/srm/{LSL_SCRIPT_EXECUTION_ID}_all.parquet`

see [AnalyticsController.java](https://github.com/SoftwareObservatorium/lasso/blob/develop/service/src/main/java/de/uni_mannheim/swt/lasso/service/controller/analytics/AnalyticsController.java) for RESTful endpoint details.

### **Export to Jupyter Notebooks / Python (pandas)**

As an experimental feature, basic Jupyter notebooks can be generated automatically for individual LSL script executions. This is currently used to open SRM data in LASSO's web application using JupyterLite, allowing analytics using Pandas that run entirely in the browser (limited with respect to dataset size).

see [AnalyticsController.java](https://github.com/SoftwareObservatorium/lasso/blob/develop/service/src/main/java/de/uni_mannheim/swt/lasso/service/controller/analytics/AnalyticsController.java) for RESTful endpoint details.

### **Jupyterlite Integration in LASSO (experimental)**

As an experimental feature, SRMs obtained from LSL pipeline script executions can be analyzed using JupyterLite. Note that JupyterLite runs entirely in the browser, which means it is limited compared to classic JupyterLab deployments with a Python backend.

### **Advanced: Python (pyignite)**

Since LASSO uses Apache Ignite, an official Python module `pyignite` is available to access SRHs in Python based on Ignite's concept of thin clients. The client can be used to manipulate SRMs/SRHs using popular data frame libraries including pandas.

This also offers the possibility to interactively explore SRMs as part of Jupyter notebooks.

```python
from pyignite import Client
import pandas as pd

# LASSO manager node (IP, DNS)
lasso_host = '127.0.0.1'
lasso_port = 10800

# Ignite thin client
client = Client()
client.connect(lasso_host, lasso_port)

# LSL script execution ID
my_script_id = 'd884938e-8c30-4549-8185-26ac3f95a3b2'

# use pyignite to access SRHs and manipulate data
```

## **Advanced: R (tidyverse)**

You can also analyze SRMs in R using popular packages from the tidyverse ecosystem.

```r
library(dplyr)
library(tidyr)

# assume srm_data is a dataframe containing SRM data
srm_data %>%
  group_by(col1, col2) %>%
  summarise(mean_value = mean(value)) %>%
  arrange(desc(mean_value))
```