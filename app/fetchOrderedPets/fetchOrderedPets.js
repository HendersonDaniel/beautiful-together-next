function getSavedPreferences() {
  try {
    const savedPreferences = localStorage.getItem("preferences");
    const preferences = savedPreferences ? JSON.parse(savedPreferences) : null;
    return preferences && typeof preferences === "object" && !Array.isArray(preferences)
      ? preferences
      : null;
  } catch {
    // Unavailable storage or an old, malformed value should not hide pets.
    return null;
  }
}

async function fetchAnimals(url, options = {}) {
  const response = await fetch(url, { ...options, cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load pets (${response.status})`);
  const animals = await response.json();
  if (!Array.isArray(animals)) throw new Error("Invalid pet data received");
  return animals;
}

export const fetchOrderedPets = async () => {
  const preferences = getSavedPreferences();
  if (preferences) {
    try {
      return await fetchAnimals("/api/animalsByPreference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error("Failed to rank pets, loading all pets instead:", error);
    }
  }
  return fetchAnimals("/api/animals");
};
