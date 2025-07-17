/**
 * Human-like Response Formatter for RAG applications
 * Transforms technical search results into natural, conversational responses
 */

export interface SearchResult {
  content: string;
  similarity: number;
  metadata?: {
    documentType?: string;
    keywords?: string[];
    fileName?: string;
  };
}

export interface FormattedResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sourceCount: number;
}

/**
 * Format search results into a natural, human-like response
 */
export function formatResponse(
  query: string,
  results: SearchResult[],
): FormattedResponse {
  if (!results || results.length === 0) {
    return {
      answer:
        "I couldn't find any information about that in the uploaded documents. Could you try rephrasing your question or upload the relevant documents?",
      confidence: 'low',
      sourceCount: 0,
    };
  }

  // Filter highly relevant results
  const relevantResults = results.filter((r) => r.similarity > 0.75);
  const confidence = determineConfidence(relevantResults, results);

  // Create natural response based on query type
  const answer = createNaturalAnswer(query, relevantResults, results);

  return {
    answer,
    confidence,
    sourceCount: relevantResults.length,
  };
}

/**
 * Create a natural, conversational answer
 */
function createNaturalAnswer(
  query: string,
  relevantResults: SearchResult[],
  allResults: SearchResult[],
): string {
  const queryLower = query.toLowerCase();
  const workingResults =
    relevantResults.length > 0 ? relevantResults : allResults.slice(0, 3);

  // Determine query intent
  const isAllergenQuery = isAllergenQueryType(queryLower);
  const isSafetyQuery = isSafetyQueryType(queryLower);
  const isCertificationQuery = isCertificationQueryType(queryLower);
  const isSpecificationQuery = isSpecificationQueryType(queryLower);

  // Format response based on intent
  if (isAllergenQuery) {
    return formatAllergenResponse(workingResults);
  }
  if (isSafetyQuery) {
    return formatSafetyResponse(workingResults);
  }
  if (isCertificationQuery) {
    return formatCertificationResponse(workingResults);
  }
  if (isSpecificationQuery) {
    return formatSpecificationResponse(workingResults);
  }

  // General response
  return formatGeneralResponse(workingResults);
}

/**
 * Format allergen-specific responses
 */
function formatAllergenResponse(results: SearchResult[]): string {
  const allergenInfo = extractAllergenInfo(results);

  if (
    allergenInfo.contains.length === 0 &&
    allergenInfo.mayContain.length === 0
  ) {
    return "Based on the available documents, I don't see specific allergen information. You may want to check the product's allergen declaration or safety data sheet for complete details.";
  }

  let response = '';

  if (allergenInfo.contains.length > 0) {
    response += `This product contains: ${allergenInfo.contains.join(', ')}. `;
  }

  if (allergenInfo.mayContain.length > 0) {
    response += `It may also contain traces of: ${allergenInfo.mayContain.join(', ')} due to shared processing facilities. `;
  }

  if (allergenInfo.manufacturing) {
    response += `The manufacturing facility ${allergenInfo.manufacturing} `;
  }

  response +=
    'Always check the most current product labeling for complete allergen information.';

  return response;
}

/**
 * Format safety-related responses
 */
function formatSafetyResponse(results: SearchResult[]): string {
  const safetyInfo = extractSafetyInfo(results);

  if (!safetyInfo.hasInfo) {
    return "I couldn't find specific safety information in the uploaded documents. For detailed safety data, please refer to the product's Safety Data Sheet (SDS) or contact the supplier directly.";
  }

  let response = 'For safety: ';

  if (safetyInfo.handling.length > 0) {
    response += `Handle by ${safetyInfo.handling.join(', ')}. `;
  }

  if (safetyInfo.storage.length > 0) {
    response += `Store in ${safetyInfo.storage.join(', ')}. `;
  }

  if (safetyInfo.firstAid.length > 0) {
    response += `If contact occurs: ${safetyInfo.firstAid.join(', ')}. `;
  }

  response +=
    'Always follow the complete Safety Data Sheet for full precautions.';

  return response;
}

/**
 * Format certification responses
 */
function formatCertificationResponse(results: SearchResult[]): string {
  const certInfo = extractCertificationInfo(results);

  if (certInfo.certifications.length === 0) {
    return "I don't see specific certification information in the available documents. You may want to request certification documents directly from the supplier.";
  }

  let response = `This product has the following certifications: ${certInfo.certifications.join(', ')}. `;

  if (certInfo.validUntil) {
    response += `These certifications are ${certInfo.validUntil} `;
  }

  if (certInfo.certifyingBody) {
    response += `issued by ${certInfo.certifyingBody}. `;
  }

  response += 'Always verify current certification status with the supplier.';

  return response;
}

/**
 * Format specification responses
 */
function formatSpecificationResponse(results: SearchResult[]): string {
  const specInfo = extractSpecificationInfo(results);

  if (Object.keys(specInfo).length === 0) {
    return "I couldn't find specific product specifications in the uploaded documents. You may need the product specification sheet or technical data sheet for these details.";
  }

  let response = 'Based on the specifications: ';

  const specs = Object.entries(specInfo)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key} is ${value}`)
    .slice(0, 4); // Limit to most important specs

  if (specs.length > 0) {
    response += `${specs.join(', ')}. `;
  }

  response += 'Check the complete specification sheet for all parameters.';

  return response;
}

/**
 * Format general responses
 */
function formatGeneralResponse(results: SearchResult[]): string {
  // Extract key information from the most relevant result
  const topResult = results[0];
  if (!topResult) {
    return "I couldn't find relevant information in the uploaded documents. Could you be more specific or upload additional documents?";
  }

  // Extract a concise, relevant excerpt
  const excerpt = extractRelevantExcerpt(topResult.content);

  return `Based on the documents: ${excerpt} Let me know if you need more specific information about any aspect.`;
}

/**
 * Helper functions for query classification
 */
function isAllergenQueryType(query: string): boolean {
  return [
    'allergen',
    'allergy',
    'contains',
    'dairy',
    'milk',
    'soy',
    'wheat',
    'gluten',
    'nuts',
    'eggs',
  ].some((term) => query.includes(term));
}

function isSafetyQueryType(query: string): boolean {
  return [
    'safety',
    'hazard',
    'msds',
    'sds',
    'handling',
    'storage',
    'first aid',
    'emergency',
  ].some((term) => query.includes(term));
}

function isCertificationQueryType(query: string): boolean {
  return [
    'certified',
    'certificate',
    'organic',
    'kosher',
    'halal',
    'compliance',
    'standard',
  ].some((term) => query.includes(term));
}

function isSpecificationQueryType(query: string): boolean {
  return [
    'protein',
    'fat',
    'moisture',
    'spec',
    'composition',
    'nutritional',
    'ingredient',
  ].some((term) => query.includes(term));
}

/**
 * Extract specific information types
 */
function extractAllergenInfo(results: SearchResult[]) {
  const info = {
    contains: [] as string[],
    mayContain: [] as string[],
    manufacturing: '',
  };

  const text = results
    .map((r) => r.content)
    .join(' ')
    .toLowerCase();

  // Extract "contains" allergens
  const containsMatch = text.match(/contains[:\s]+([^.]*)/i);
  if (containsMatch) {
    info.contains = parseAllergenList(containsMatch[1]);
  }

  // Extract "may contain" allergens
  const mayContainMatch = text.match(/may contain[:\s]+([^.]*)/i);
  if (mayContainMatch) {
    info.mayContain = parseAllergenList(mayContainMatch[1]);
  }

  // Extract manufacturing info
  if (text.includes('haccp') || text.includes('gmp')) {
    info.manufacturing = 'follows certified safety protocols';
  }

  return info;
}

function parseAllergenList(text: string): string[] {
  return text
    .split(/[,;&]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && item.length < 30)
    .slice(0, 5); // Limit to 5 items
}

function extractSafetyInfo(results: SearchResult[]) {
  const info = {
    hasInfo: false,
    handling: [] as string[],
    storage: [] as string[],
    firstAid: [] as string[],
  };

  const text = results
    .map((r) => r.content)
    .join(' ')
    .toLowerCase();

  if (
    text.includes('handling') ||
    text.includes('storage') ||
    text.includes('first aid')
  ) {
    info.hasInfo = true;

    if (text.includes('ventilated'))
      info.handling.push('ensuring good ventilation');
    if (text.includes('dry place')) info.storage.push('a cool, dry place');
    if (text.includes('flush') && text.includes('water'))
      info.firstAid.push('flush with water');
  }

  return info;
}

function extractCertificationInfo(results: SearchResult[]) {
  const info = {
    certifications: [] as string[],
    validUntil: '',
    certifyingBody: '',
  };

  const text = results
    .map((r) => r.content)
    .join(' ')
    .toLowerCase();

  if (text.includes('organic')) info.certifications.push('Organic');
  if (text.includes('kosher')) info.certifications.push('Kosher');
  if (text.includes('halal')) info.certifications.push('Halal');
  if (text.includes('gmp')) info.certifications.push('GMP');
  if (text.includes('haccp')) info.certifications.push('HACCP');

  const validMatch = text.match(/valid until[:\s]+([^.]*)/i);
  if (validMatch) {
    info.validUntil = `valid until ${validMatch[1].trim()}`;
  }

  return info;
}

function extractSpecificationInfo(results: SearchResult[]) {
  const info: Record<string, string> = {};

  const text = results.map((r) => r.content).join(' ');

  // Extract nutritional specs
  const proteinMatch = text.match(/protein[:\s]*([0-9.-]+[%\s]*)/i);
  if (proteinMatch) info.protein = proteinMatch[1].trim();

  const fatMatch = text.match(/fat[:\s]*([0-9.-]+[%\s]*)/i);
  if (fatMatch) info.fat = fatMatch[1].trim();

  const moistureMatch = text.match(/moisture[:\s]*([0-9.-]+[%\s]*)/i);
  if (moistureMatch) info.moisture = moistureMatch[1].trim();

  return info;
}

function extractRelevantExcerpt(content: string): string {
  // Extract the first complete sentence or meaningful phrase
  const sentences = content.split(/[.!?]+/);
  const relevantSentence = sentences.find(
    (s) => s.trim().length > 20 && s.trim().length < 150,
  );

  if (relevantSentence) {
    return `${relevantSentence.trim()}.`;
  }

  // Fallback to first 100 characters
  return `${content.substring(0, 100).trim()}...`;
}

/**
 * Determine confidence level based on results
 */
function determineConfidence(
  relevantResults: SearchResult[],
  allResults: SearchResult[],
): 'high' | 'medium' | 'low' {
  if (relevantResults.length === 0) return 'low';
  if (relevantResults.length >= 2 && relevantResults[0].similarity > 0.85)
    return 'high';
  if (relevantResults.length >= 1 && relevantResults[0].similarity > 0.75)
    return 'medium';
  return 'low';
}
