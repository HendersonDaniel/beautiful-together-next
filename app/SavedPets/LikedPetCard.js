"use client";
import React from "react";
import { getPetImages, handlePetImageError } from "../../utils/petImages";
import {
  Card,
  Box,
  CardMedia,
  Typography,
  IconButton,
  Button,
  CardContent,
} from "@mui/material";
import { NavigateBefore, NavigateNext, Close } from "@mui/icons-material";
import { removeAnimal } from "../savedPetsCookie/savedPetsCookie";

export const LikedPetCard = ({ pet, children }) => {
  const [currentPic, setCurrentPic] = React.useState(0);
  const images = getPetImages(pet);
  const numpics = images.length;

  const prevPic = () => {
    setCurrentPic((currentPic - 1 + numpics) % numpics);
  };

  const nextPic = () => {
    setCurrentPic((currentPic + 1) % numpics);
  };

  return (
    <Card
      sx={{
        width: "90%",
        maxWidth: "400px",
        borderRadius: "16px",
        bgcolor: "#FFFFFF",
        overflow: "hidden",
        boxShadow: 3,
        position: "relative", // Allow positioning of the "X" button inside the card
        display: "flex", 
        flexDirection: "column"
      }}
    >
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height="400"
          image={images[currentPic] || images[0]}
          onError={handlePetImageError}
          alt={pet.name}
          sx={{ objectFit: "cover" }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
          }}
        >
          <IconButton
            onClick={prevPic}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.9)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.8)" },
            }}
          >
            <NavigateBefore />
          </IconButton>
          <IconButton
            onClick={nextPic}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.9)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.8)" },
            }}
          >
            <NavigateNext />
          </IconButton>
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "rgba(76, 175, 80, 0.9)",
            color: "white",
            padding: "8px 16px",
          }}
        >
          <Typography variant="h6" component="span">
            {pet.name}
          </Typography>
        </Box>
      </Box>

      <Box // this item
        sx={{
          padding: "8px 16px",
          display: "flex",        
          flexDirection: "column",
          height: "100%"
        }}
      >
        <CardContent
          sx={{ flexGrow: 1 }}
        >{children}</CardContent>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: 2,
            gap: 2
          }}
        >
          <Button
            component="a"
            href={pet.link}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            color="secondary"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: "none",
              color: "white",
            }}
          >
            More Information
          </Button>
          <Button
            component="a"
            href={`https://beautifultogethersanctuary.com/${pet["dog/cat"]}-adoption/`}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: "none",
              color: "white",
            }}
          >
            Adopt {pet.name}!
          </Button>
        </Box>
      </Box>

      
    </Card>
  );
};
