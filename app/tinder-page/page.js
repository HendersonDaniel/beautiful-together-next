"use client";

import React, { useState, useEffect } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PetCard from "./PetCard";
import { fetchOrderedPets } from "../fetchOrderedPets/fetchOrderedPets";
import Notification from "./Notification";
import Navbar from "../navbar/navbar";
import { getSavedAnimals } from "../savedPetsCookie/savedPetsCookie";
import { cleanSavedAnimalsFromIndexedDB } from "../SavedPets/petDataManager";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4caf50",
    },
    secondary: {
      main: "#f44336",
    },
    background: {
      default: "#F8F6F3",
    },
  },
});

export default function Home() {
  const [petsQueue, setPetsQueue] = useState([]); // State to store petsQueue
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedPets = await getSavedAnimals(); // Get saved pets from cookies
        const petsData = await fetchOrderedPets(); // Fetch ordered pets

        await cleanSavedAnimalsFromIndexedDB(petsData);

        // Filter out pets that are already saved
        const filteredPets = petsData.filter(
          (pet) => !savedPets.includes(pet.id),
        );

        setPetsQueue(filteredPets); // Update state with filtered pets
      } catch (error) {
        console.error("Error fetching pets data:", error);
        setError("We couldn't load pets right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const adoptNotification = (name) => {
    console.log("Adopted pet!");
    addNotification(name);
  };

  const addNotification = (name) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, name }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  const handlePass = () => {
    console.log("Passed on pet");
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Loading pets...
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{ flexGrow: 1, bgcolor: "background.default", minHeight: "100vh" }}
      >
        <Navbar />
        {!loading && (
          <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "90%", maxWidth: "400px" }}>
                {error ? (
                  <Box role="alert" sx={{ textAlign: "center", mt: 4, p: 4 }}>
                    <Typography>{error}</Typography>
                    <Button onClick={() => window.location.reload()}>Try again</Button>
                  </Box>
                ) : petsQueue[0] ? (
                  <div>
                    <PetCard
                      petsQueue={petsQueue}
                      adoptNotification={adoptNotification}
                    />
                    <Box sx={{ bottom: 20, right: 20, zIndex: 1000 }}>
                      {notifications.map((n) => (
                        <Notification
                          key={n.id}
                          name={n.name}
                          onClose={() => removeNotification(n.id)}
                        />
                      ))}
                    </Box>
                  </div>
                ) : (
                  <Box
                    sx={{
                      textAlign: "center",
                      mt: 4,
                      p: 4,
                      bgcolor: "white",
                      borderRadius: "16px",
                      boxShadow: 1,
                    }}
                  >
                    <Typography variant="h6">No more pets to show!</Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      Check back later for more furry friends.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Container>
        )}
      </Box>
    </ThemeProvider>
  );
}
