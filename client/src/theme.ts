import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#0B6E99" },
        secondary: { main: "#005f3c" },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiButton: { defaultProps: { variant: "outlined" } },
        MuiCard: { defaultProps: { variant: "outlined" } },
    },
});

