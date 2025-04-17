/**
 * Template for sheet questions with key, label and source tracking
 */
export interface Question {
  key: string;
  label: string;
  answer: string;
  source: 'LLM' | 'user' | 'import' | '';
}

/**
 * Static list of questions extracted from the JSON
 */
export const QUESTIONS: Array<Omit<Question, 'answer' | 'source'>> = [
  { key: "C_SUPPLIERLEGALLABEL", label: "Legal Label Description" },
  { key: "C_SUPPLIERINGRSTMT", label: "Ingredient Statement" },
  { key: "C_SUPPLIERUOM", label: "Unit of Measure" },
  { key: "C_SUPPLIERNETWEIGHT", label: "Net Weight" },
  { key: "C_SUPPLIERDESCRIPTION", label: "Product Description" },
  { key: "C_SUPPLIERUPC", label: "UPC" },
  { key: "C_SUPPLIERITEMREF", label: "Item Reference ID" },
  { key: "C_SUPPLIERPACKQTY", label: "Package Quantity" },
  { key: "C_SUPPLIERPACKQTYUOM", label: "Package Quantity UOM" },
  { key: "C_SUPPLIERSERVINGSPERCONTAINER", label: "Servings Per Container" },
  { key: "C_SUPPLIERPREPMETHOD", label: "Preparation Method" },
  { key: "C_SUPPLIERSERVESIZE", label: "Serving Size" },
  { key: "C_SUPPLIERSHARPMETAL", label: "Contains Sharp Metal?" },
  { key: "C_SUPPLIERDATECODED", label: "Date Coded?" },
  { key: "C_SUPPLIERDATECODETYPE", label: "Date Code Type" },
  { key: "C_SUPPLIERPRODUCTCAT", label: "Product Category" },
  { key: "C_SUPPLIERPRODUCTSOURCE", label: "Product Source" },
  { key: "C_SUPPLIERCOUNTRYOFORIGIN", label: "Country of Origin" },
  { key: "C_SUPPLIERORGANIC", label: "Organic?" },
  { key: "C_SUPPLIERSTORAGE", label: "Storage Requirements" },
  { key: "C_SUPPLIERSHELFLIFE", label: "Shelf Life" },
  { key: "C_SUPPLIERSHELFUNIT", label: "Shelf Life Unit" },
  { key: "C_SUPPLIERWARRANTY", label: "Warranty?" },
  { key: "C_SUPPLIERWARRANTYLENGTH", label: "Warranty Length" },
  { key: "C_SUPPLIERWARRANTYUNIT", label: "Warranty Unit" },
  { key: "C_SUPPLIERALLERGENWHEAT", label: "Contains Wheat Allergen?" },
  { key: "C_SUPPLIERALLERGENCRUSTACEAN", label: "Contains Crustacean Allergen?" },
  { key: "C_SUPPLIERALLERGENEGG", label: "Contains Egg Allergen?" },
  { key: "C_SUPPLIERALLERGENFISH", label: "Contains Fish Allergen?" },
  { key: "C_SUPPLIERALLERGENPEANTUS", label: "Contains Peanut Allergen?" },
  { key: "C_SUPPLIERALLERGENSOY", label: "Contains Soy Allergen?" },
  { key: "C_SUPPLIERALLERGENMILK", label: "Contains Milk Allergen?" },
  { key: "C_SUPPLIERALLERGENTREENUT", label: "Contains Tree Nut Allergen?" },
  { key: "C_SUPPLIERALLERGENWHEATFACILITY", label: "Made in Facility with Wheat?" },
  { key: "C_SUPPLIERALLERGENCRUSTACEANFACILITY", label: "Made in Facility with Crustacean?" },
  { key: "C_SUPPLIERALLERGENEGGFACILITY", label: "Made in Facility with Egg?" },
  { key: "C_SUPPLIERALLERGENFISHFACILITY", label: "Made in Facility with Fish?" },
  { key: "C_SUPPLIERALLERGENPEANUSFACILITY", label: "Made in Facility with Peanut?" },
  { key: "C_SUPPLIERALLERGENSOYFALICITY", label: "Made in Facility with Soy?" },
  { key: "C_SUPPLIERALLERGENMILKFACILITY", label: "Made in Facility with Milk?" },
  { key: "C_SUPPLIERALLERGENTREENUTFACILITY", label: "Made in Facility with Tree Nut?" }
];