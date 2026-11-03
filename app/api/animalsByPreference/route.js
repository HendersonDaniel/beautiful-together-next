import { NextResponse } from "next/server";
import { fetchAnimals } from "../../../utils/animals.mjs";


const preferenceTagMap = {
  "Pet Preference": {
    "Dogs": ["dog"],
    "Cats": ["cat"],
  },
  Gender: {
    Male: ["male"],
    Female: ["female"],
  },
  Age: {
    "Baby (0-5 Months)": [
      "baby (0-5 months)",
      "kitten (under 1 year)",
      "puppy (under 1 year)",
    ],
    "Puppy (5-24 Months)": ["puppy (5-24 months)", "youth (24-60 months)"],
    "Youth (2-5 Years)": ["youth (2-5 years)"],
    "Adult (5-9 Years)": ["adult (5-9 years)"],
    "Senior (9+ Years)": ["senior (9+ years)"],
  },
  "Good With Kids?": {
    "Kids Over 6": ["i like kids over 6", "i like all kids"],
    "Kids Over 10": ["i like kids over 6", "i like kids over 10", "i like all kids"],
    "I Like All Kids": ["i like kids over 6", "i like kids over 10", "i like all kids"],
  },
  "Good With Pets?": {
    "Big Dogs": ["i like all big dogs", "i like select dogs", "i like all dogs"],
    "Small Dogs": ["i like all small dogs", "i like select dogs", "i like all dogs"],
  },
  "Good With Dogs?": {
    "Big Dogs": ["i like all big dogs", "i like select dogs", "i like all dogs"],
    "Small Dogs": ["i like all small dogs", "i like select dogs", "i like all dogs"],
  },
  "Good With Cats?": {
    "Cats": ["i like all cats", "some"],

  },
  "Special Needs": {
    Yes: ["yes"],
    No: ["no"],
  },
};

// Map of categories to their negation tags
const negationTagMap = {
  "Good With Kids?": ["i don't like kids", "i don't like any kids"],
  "Good With Pets?": ["i don't like dogs", "i don't like any dogs"],
  "Good With Dogs?": ["i don't like dogs", "i don't like any dogs"],
  "Good With Cats?": ["i don't like cats", "i don't like any cats"],
};

/**
 * Normalize a string value for comparison
 * @param {string} value - The value to normalize
 * @returns {string} Normalized string
 */
const normalize = (value) => (value ? value.toString().trim().toLowerCase() : "");


/**
 * Calculate string similarity score between two strings
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Similarity score between 0 and 1
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1;
  
  // Check for substring matches
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Split into words and check for word matches
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  if (commonWords.length > 0) {
    return 0.5 * (commonWords.length / Math.max(words1.length, words2.length));
  }
  
  return 0;
}

/**
 * Check if an animal's value matches any of the preferred values
 * @param {string} animalValue - The animal's value for a category
 * @param {string[]} preferredValues - Array of preferred values
 * @returns {Object} Match result with score and isExactMatch flag
 */
function findBestMatch(animalValue, preferredValues) {
  if (!animalValue || !preferredValues?.length) {
    return { score: 0, isExactMatch: false };
  }
  
  let bestScore = 0;
  let isExactMatch = false;
  
  for (const pref of preferredValues) {
    const similarity = calculateStringSimilarity(animalValue, pref);
    if (similarity > bestScore) {
      bestScore = similarity;
      isExactMatch = normalize(animalValue) === normalize(pref);
    }
  }
  
  return { score: bestScore, isExactMatch };
}

/**
 * Check if an animal has a negation tag for a category
 * @param {Object} animal - The animal object
 * @param {string} category - The category to check
 * @returns {boolean} Whether the animal has a negation tag
 */
function hasNegationTag(animal, category) {
  if (!negationTagMap[category]) return false;
  
  const animalValue = getAnimalValue(animal, category);
  if (!animalValue) return false;
  
  return negationTagMap[category].some(negTag => 
    normalize(animalValue).includes(normalize(negTag))

  );
}

/**
 * Get the animal's value for a category, handling special cases
 * @param {Object} animal - The animal object
 * @param {string} category - The category to get the value for
 * @returns {string} The animal's value for the category
 */
function getAnimalValue(animal, category) {
  if (category === "Pet Preference") {
    return animal["dog/cat"];

  }
  
  // For dog compatibility, check both "Good With Pets?" and "Good With Dogs?"
  if (category === "Good With Pets?" || category === "Good With Dogs?") {
    return animal.tags?.["Good With Pets?"] || animal.tags?.["Good With Dogs?"];
  }
  
  return animal.tags?.[category];
}

/**
 * Calculate how closely an animal matches the user preferences
 * @param {Object} animal - The animal object to evaluate
 * @param {Object} preferences - User preferences object
 * @returns {Object} Score details including total score and match counts
 */

function calculateClosenessScore(animal, preferences) {
  const WEIGHTS = {
    "Pet Preference": 20,
    "Gender": 5,
    "Age": 10,

    "Good With Kids?": 3,
    "Good With Pets?": 3,
    "Good With Dogs?": 3,
    "Good With Cats?": 3,
    "Special Needs": 10,
  };

  let totalScore = 0;
  let exactMatches = 0;
  let partialMatches = 0;
  let totalCategories = 0;


  // Check each preference category
  Object.entries(preferences).forEach(([category, userChoices]) => {
    if (!Array.isArray(userChoices) || userChoices.length === 0) return;
    
    totalCategories++;

    // Get the animal's value for this category
    const animalValue = getAnimalValue(animal, category);

    // Check for negation tags first
    if (hasNegationTag(animal, category)) {
      // Add a significant penalty for negation tags
      totalScore += WEIGHTS[category] * 2;
      return;
    }

    // Get all valid tags for this category and user choices
    const validTags = userChoices
      .map(choice => preferenceTagMap[category]?.[choice])
      .filter(Boolean)
      .flat();

    // Find the best match for this category
    const { score, isExactMatch } = findBestMatch(animalValue, validTags);
    
    if (isExactMatch) {
      exactMatches++;
      // Exact matches get no penalty
      totalScore += 0;
    } else if (score > 0) {
      partialMatches++;
      // Partial matches get a reduced penalty
      totalScore += (1 - score) * (WEIGHTS[category] || 0);
    } else {
      // No match gets full penalty
      totalScore += WEIGHTS[category] || 0;
    }
  });

  return {
    score: totalScore,
    exactMatches,
    partialMatches,
    totalCategories,
    matchPercentage: (exactMatches + partialMatches) / totalCategories
  };
}

/**
 * Handle POST requests to rank animals by user preferences
 */

export async function POST(req) {
  try {
    const preferences = await req.json();

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' }, 
        { status: 400 }
      );
    }

    const animals = await fetchAnimals();

    // Score and sort animals
    const rankedAnimals = animals
      .map(animal => ({
        ...animal,
        ...calculateClosenessScore(animal, preferences)
      }))
      .sort((a, b) => {
        // First sort by exact matches
        if (a.exactMatches !== b.exactMatches) {
          return b.exactMatches - a.exactMatches;
        }
        // Then by partial matches
        if (a.partialMatches !== b.partialMatches) {
          return b.partialMatches - a.partialMatches;
        }
        // Finally by score (lower is better)
        return a.score - b.score;
      });

    return NextResponse.json(rankedAnimals, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
