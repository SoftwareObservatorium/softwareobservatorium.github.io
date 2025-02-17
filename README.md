# LASSO project website


## Jupyter Lite

Static data is located in `files/`.

```bash
python3 -m venv jupyterlite
source jupyterlite/bin/activate

mkdir lasso
cd lasso/

pip install jupyterlite-core
jupyter lite --version
pip install jupyterlite-core[all] 
pip install jupyterlite-pyodide-kernel
# optional
pip install jupyterlab-open-url-parameter


mkdir files
# copy over ...

jupyter lite build --output-dir dist

# or serve
jupyter lite serve  --output-dir dist
```
