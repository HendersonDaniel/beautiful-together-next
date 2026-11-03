import { getPetData } from "@/utils/indexedDB";
import { getSavedAnimals, removeAnimal } from "../savedPetsCookie/savedPetsCookie";

export const cleanSavedAnimalsFromIndexedDB = async (pets) => {
    try {
      const savedAnimals = getSavedAnimals();
      const allPets = pets ?? await getPetData();
      if (!Array.isArray(allPets)) return;
      const validPetIds = new Set(allPets.map((pet) => pet.id));
  
      const invalidIds = savedAnimals.filter((id) => !validPetIds.has(id));
  
      for (const id of invalidIds) {
        removeAnimal(id);
      }
  
      if (invalidIds.length > 0) {
        console.log(`Removed invalid saved pet IDs:`, invalidIds);
      }
    } catch (error) {
      console.error("Error cleaning saved pets from cookies:", error);
    }
  };
  