export const defaultPetImage = "/images/pet-placeholder.svg";

export function getPetImages(pet) {
  const images = Array.isArray(pet?.images) ? pet.images : [];
  const urls = images.flatMap((image) => {
    if (typeof image !== "string" || !image.trim()) return [];
    try {
      const url = new URL(image.trim(), pet.link || "https://beautifultogethersanctuary.com/");
      return ["http:", "https:"].includes(url.protocol) ? [url.href] : [];
    } catch {
      return [];
    }
  });
  return urls.length ? [...new Set(urls)] : [defaultPetImage];
}

export function handlePetImageError(event) {
  const image = event.currentTarget;
  if (image.getAttribute("src") !== defaultPetImage) image.src = defaultPetImage;
}
