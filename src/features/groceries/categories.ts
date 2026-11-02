// Grocery categories, in the order they're shown (roughly how you walk a store).
// To add one: add a line here. The database just stores the `key`.
export const CATEGORIES = [
  { key: "produce", label: "Fruit & veg", emoji: "🥦" },
  { key: "bakery", label: "Bakery", emoji: "🍞" },
  { key: "dairy", label: "Dairy & eggs", emoji: "🥛" },
  { key: "meat", label: "Meat & fish", emoji: "🍗" },
  { key: "pantry", label: "Pantry", emoji: "🥫" },
  { key: "frozen", label: "Frozen", emoji: "🧊" },
  { key: "drinks", label: "Drinks", emoji: "🧃" },
  { key: "household", label: "Household", emoji: "🧻" },
  { key: "other", label: "Other", emoji: "🛒" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function categoryInfo(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

// A friendly guess so you rarely have to pick a category yourself.
// Matches whole words, e.g. "oat milk" → dairy. Easy to extend.
// Checked top to bottom, so "frozen peas" and "ice cream" land in Frozen.
const KEYWORDS: Record<Exclude<CategoryKey, "other">, string[]> = {
  frozen: ["frozen", "ice", "pizza", "peas", "fries"],
  produce: ["apple", "banana", "lemon", "lime", "orange", "berries", "strawberries", "grapes", "avocado", "tomato", "tomatoes", "potato", "potatoes", "onion", "onions", "garlic", "carrot", "carrots", "lettuce", "salad", "spinach", "cucumber", "pepper", "peppers", "broccoli", "mushrooms", "herbs", "basil", "ginger", "fruit", "veg", "vegetables", "zucchini"],
  bakery: ["bread", "baguette", "bagels", "bagel", "croissant", "croissants", "buns", "rolls", "tortillas", "wraps", "cake", "muffins", "pita"],
  dairy: ["milk", "cheese", "butter", "yogurt", "yoghurt", "cream", "eggs", "egg", "feta", "mozzarella", "parmesan", "skyr"],
  meat: ["chicken", "beef", "pork", "mince", "bacon", "ham", "sausage", "sausages", "salmon", "tuna", "fish", "shrimp", "prawns", "turkey", "steak", "tofu"],
  pantry: ["pasta", "rice", "flour", "sugar", "salt", "oil", "olive", "vinegar", "beans", "lentils", "cereal", "oats", "honey", "jam", "peanut", "sauce", "spices", "coffee", "tea", "chocolate", "crisps", "chips", "nuts", "soup", "noodles", "ketchup", "mustard", "mayo"],
  drinks: ["water", "juice", "wine", "beer", "soda", "cola", "lemonade", "kombucha", "sparkling"],
  household: ["toilet", "paper", "soap", "detergent", "shampoo", "toothpaste", "sponges", "bin", "bags", "foil", "tissues", "batteries", "candles", "cleaner", "dishwasher"],
};

export function guessCategory(name: string): CategoryKey {
  const words = name.toLowerCase().split(/[^a-z]+/);
  for (const [key, list] of Object.entries(KEYWORDS)) {
    if (words.some((w) => list.includes(w))) return key as CategoryKey;
  }
  return "other";
}
