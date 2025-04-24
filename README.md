# LASSO project website

## LASSO Website (https://softwareobservatorium.github.io/web/)

```bash
cd lasso/

# EXPORT your local node distribution
# e.g.
export PATH=~/Downloads/node-v22.14.0-linux-x64/bin/:$PATH

# install

npm install --force

Note: `--force` because there are some third-party libraries with react version conflicts

# start
npm run start

# build
npm run build

# deploy
cd ..
cp -r lasso/build/ web

# git add, commit, push ...
```

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
