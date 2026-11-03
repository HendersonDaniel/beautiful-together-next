"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  ThemeProvider,
  createTheme,
  Grid,
} from "@mui/material";
import Navbar from "../navbar/navbar";
import LikedDog from "./LikedDog"; // Add this import
import LikedCat from "./LikedCat"; // Add this import
import { fetchPetData } from "../fetchPetData/fetchPetData";
import {
  getSavedAnimals,
  removeAnimal,
} from "../savedPetsCookie/savedPetsCookie";

// Theme creation
const theme = createTheme({
  palette: {
    primary: {
      main: "#4caf50", // green
    },
    secondary: {
      main: "#f4900c", // btorange
    },
    background: {
      default: "#F8F6F3",
    },
  },
});

export default function SavedPetsPage() {
  const [pets, setPets] = useState([]);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    updatePetData();
  }, []);

  async function updatePetData() {
    try {
      //const data = JSON.parse(localStorage.getItem("pet-data")).data; //replace with whatever middleware they're developing
      const data = await fetchPetData();
      console.log("Fetched data:", data);

      const cookieData = await getSavedAnimals();
      console.log("Cached data:", cookieData);
      if (data) {
        let saved = cookieData.map((id) => data.find((pet) => pet.id == id)).filter(Boolean);
        saved.reverse(); // most recent saved at the top
        setPets(saved);
        console.log("saved", saved);
        setPageLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching pet data", error.message);
    }
  }
  const handleRemovePet = (petId) => {
    setPets((prevPets) => prevPets.filter((pet) => pet.id !== petId)); // Update UI
    removeAnimal(petId); // Update cookies
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          minHeight: "100vh",
          pb: 4, // Add padding at bottom,
        }}
      >
        <Navbar title="Saved Pets" />
        <Container
          maxWidth="lg"
          sx={{ mt: 4, display: "flex", alignContent: "center" }}
        >
          {/* <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              mb: 4, 
              textAlign: 'center',
              color: 'primary.main',
              fontWeight: 'bold'
            }}
          >
            Your Saved Pets
          </Typography> */}

          {pageLoaded && pets.length == 0 && (
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                color: "text.secondary",
                py: 8,
              }}
            >
              No saved pets yet. When you save a pet, they will appear here.
            </Typography>
          )}
          {pageLoaded && pets.length > 0 && (
            <Grid
              container
              spacing={5} // Spacing between grid items
              sx={{
                paddingLeft: "20px",
                paddingRight: "20px",
              }}
            >
              {pets.map((pet) => (
                <Grid
                  item
                  xs={12} // Full width on extra-small screens
                  sm={6} // 2 cards per row on small screens
                  md={6} // 3 cards per row on medium screens
                  lg={6} // 4 cards per row on large screens
                  key={pet.id}
                  sx={{
                    display: "flex", // Flex display to center the card within each grid item
                    justifyContent: "center",
                  }}
                >
                  {pet["dog/cat"] === "dog" ? (
                    <LikedDog dog={pet} onRemove={handleRemovePet} />
                  ) : (
                    <LikedCat cat={pet} onRemove={handleRemovePet} />
                  )}
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
