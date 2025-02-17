import { extendTheme } from "@mui/material/styles";

// General MUI theme
const extTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#137481;",
        },
        background: {
          paper: "hsl(240, 15%, 95%)",
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: "#25c2a0",
        },
        background: {
          paper: "hsl(210, 3%, 15%)",
        },
      },
    },
  },
});

export default extTheme;