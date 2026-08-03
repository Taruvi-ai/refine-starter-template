import { useEffect } from "react";
import { useRegister } from "@refinedev/core";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

export const Register = () => {
  const { mutate: register } = useRegister();

  useEffect(() => {
    const callbackUrl = window.location.origin + "/";
    register({ redirect: true, callbackUrl });
  }, [register]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1">Redirecting to registration...</Typography>
    </Box>
  );
};
