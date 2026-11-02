// Shared by the server page and the browser code, so it lives in its own file
// (values exported from a "use client" file can't be used on the server).

export type GroceryItem = {
  id: string;
  name: string;
  category: string;
  is_checked: boolean;
  checked_by: string | null;
  created_by: string | null;
  created_at: string;
};

// The columns we load for each item.
export const GROCERY_COLUMNS = "id, name, category, is_checked, checked_by, created_by, created_at";
