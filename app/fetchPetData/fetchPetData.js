// Revalidate saved pets so outdated photo URLs do not persist indefinitely.
export const fetchPetData = async () => {
  const response = await fetch("/api/animals", { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to fetch pets: ${response.status}`);
  return response.json();
};
