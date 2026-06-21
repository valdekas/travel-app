export type SubregionType =
  | 'state'
  | 'province'
  | 'territory'
  | 'region'
  | 'autonomous_community'
  | 'federal_state'
  | 'country_division'
  | 'union_territory'
  | 'island'

export interface Subregion {
  code: string
  name: string
  type: SubregionType
}

export interface CountrySubregions {
  /** Human-readable plural label, e.g. "states", "islands" */
  label: string
  regions: Subregion[]
}

/* ── United States ─────────────────────────────────────── */
const US_STATES: Subregion[] = [
  { code: 'AL', name: 'Alabama',              type: 'state' },
  { code: 'AK', name: 'Alaska',               type: 'state' },
  { code: 'AZ', name: 'Arizona',              type: 'state' },
  { code: 'AR', name: 'Arkansas',             type: 'state' },
  { code: 'CA', name: 'California',           type: 'state' },
  { code: 'CO', name: 'Colorado',             type: 'state' },
  { code: 'CT', name: 'Connecticut',          type: 'state' },
  { code: 'DE', name: 'Delaware',             type: 'state' },
  { code: 'DC', name: 'Washington D.C.',      type: 'state' },
  { code: 'FL', name: 'Florida',              type: 'state' },
  { code: 'GA', name: 'Georgia',              type: 'state' },
  { code: 'HI', name: 'Hawaii',               type: 'state' },
  { code: 'ID', name: 'Idaho',                type: 'state' },
  { code: 'IL', name: 'Illinois',             type: 'state' },
  { code: 'IN', name: 'Indiana',              type: 'state' },
  { code: 'IA', name: 'Iowa',                 type: 'state' },
  { code: 'KS', name: 'Kansas',               type: 'state' },
  { code: 'KY', name: 'Kentucky',             type: 'state' },
  { code: 'LA', name: 'Louisiana',            type: 'state' },
  { code: 'ME', name: 'Maine',                type: 'state' },
  { code: 'MD', name: 'Maryland',             type: 'state' },
  { code: 'MA', name: 'Massachusetts',        type: 'state' },
  { code: 'MI', name: 'Michigan',             type: 'state' },
  { code: 'MN', name: 'Minnesota',            type: 'state' },
  { code: 'MS', name: 'Mississippi',          type: 'state' },
  { code: 'MO', name: 'Missouri',             type: 'state' },
  { code: 'MT', name: 'Montana',              type: 'state' },
  { code: 'NE', name: 'Nebraska',             type: 'state' },
  { code: 'NV', name: 'Nevada',               type: 'state' },
  { code: 'NH', name: 'New Hampshire',        type: 'state' },
  { code: 'NJ', name: 'New Jersey',           type: 'state' },
  { code: 'NM', name: 'New Mexico',           type: 'state' },
  { code: 'NY', name: 'New York',             type: 'state' },
  { code: 'NC', name: 'North Carolina',       type: 'state' },
  { code: 'ND', name: 'North Dakota',         type: 'state' },
  { code: 'OH', name: 'Ohio',                 type: 'state' },
  { code: 'OK', name: 'Oklahoma',             type: 'state' },
  { code: 'OR', name: 'Oregon',               type: 'state' },
  { code: 'PA', name: 'Pennsylvania',         type: 'state' },
  { code: 'RI', name: 'Rhode Island',         type: 'state' },
  { code: 'SC', name: 'South Carolina',       type: 'state' },
  { code: 'SD', name: 'South Dakota',         type: 'state' },
  { code: 'TN', name: 'Tennessee',            type: 'state' },
  { code: 'TX', name: 'Texas',                type: 'state' },
  { code: 'UT', name: 'Utah',                 type: 'state' },
  { code: 'VT', name: 'Vermont',              type: 'state' },
  { code: 'VA', name: 'Virginia',             type: 'state' },
  { code: 'WA', name: 'Washington',           type: 'state' },
  { code: 'WV', name: 'West Virginia',        type: 'state' },
  { code: 'WI', name: 'Wisconsin',            type: 'state' },
  { code: 'WY', name: 'Wyoming',              type: 'state' },
]

/* ── Canada ────────────────────────────────────────────── */
const CA_PROVINCES: Subregion[] = [
  { code: 'AB', name: 'Alberta',                        type: 'province' },
  { code: 'BC', name: 'British Columbia',               type: 'province' },
  { code: 'MB', name: 'Manitoba',                       type: 'province' },
  { code: 'NB', name: 'New Brunswick',                  type: 'province' },
  { code: 'NL', name: 'Newfoundland and Labrador',      type: 'province' },
  { code: 'NS', name: 'Nova Scotia',                    type: 'province' },
  { code: 'NT', name: 'Northwest Territories',          type: 'territory' },
  { code: 'NU', name: 'Nunavut',                        type: 'territory' },
  { code: 'ON', name: 'Ontario',                        type: 'province' },
  { code: 'PE', name: 'Prince Edward Island',           type: 'province' },
  { code: 'QC', name: 'Quebec',                         type: 'province' },
  { code: 'SK', name: 'Saskatchewan',                   type: 'province' },
  { code: 'YT', name: 'Yukon',                          type: 'territory' },
]

/* ── Australia ─────────────────────────────────────────── */
const AU_STATES: Subregion[] = [
  { code: 'ACT', name: 'Australian Capital Territory',  type: 'territory' },
  { code: 'NSW', name: 'New South Wales',               type: 'state' },
  { code: 'NT',  name: 'Northern Territory',            type: 'territory' },
  { code: 'QLD', name: 'Queensland',                    type: 'state' },
  { code: 'SA',  name: 'South Australia',               type: 'state' },
  { code: 'TAS', name: 'Tasmania',                      type: 'state' },
  { code: 'VIC', name: 'Victoria',                      type: 'state' },
  { code: 'WA',  name: 'Western Australia',             type: 'state' },
]

/* ── Brazil ────────────────────────────────────────────── */
const BR_STATES: Subregion[] = [
  { code: 'AC', name: 'Acre',                           type: 'state' },
  { code: 'AL', name: 'Alagoas',                        type: 'state' },
  { code: 'AP', name: 'Amapá',                          type: 'state' },
  { code: 'AM', name: 'Amazonas',                       type: 'state' },
  { code: 'BA', name: 'Bahia',                          type: 'state' },
  { code: 'CE', name: 'Ceará',                          type: 'state' },
  { code: 'DF', name: 'Distrito Federal',               type: 'state' },
  { code: 'ES', name: 'Espírito Santo',                 type: 'state' },
  { code: 'GO', name: 'Goiás',                          type: 'state' },
  { code: 'MA', name: 'Maranhão',                       type: 'state' },
  { code: 'MT', name: 'Mato Grosso',                    type: 'state' },
  { code: 'MS', name: 'Mato Grosso do Sul',             type: 'state' },
  { code: 'MG', name: 'Minas Gerais',                   type: 'state' },
  { code: 'PA', name: 'Pará',                           type: 'state' },
  { code: 'PB', name: 'Paraíba',                        type: 'state' },
  { code: 'PR', name: 'Paraná',                         type: 'state' },
  { code: 'PE', name: 'Pernambuco',                     type: 'state' },
  { code: 'PI', name: 'Piauí',                          type: 'state' },
  { code: 'RJ', name: 'Rio de Janeiro',                 type: 'state' },
  { code: 'RN', name: 'Rio Grande do Norte',            type: 'state' },
  { code: 'RS', name: 'Rio Grande do Sul',              type: 'state' },
  { code: 'RO', name: 'Rondônia',                       type: 'state' },
  { code: 'RR', name: 'Roraima',                        type: 'state' },
  { code: 'SC', name: 'Santa Catarina',                 type: 'state' },
  { code: 'SP', name: 'São Paulo',                      type: 'state' },
  { code: 'SE', name: 'Sergipe',                        type: 'state' },
  { code: 'TO', name: 'Tocantins',                      type: 'state' },
]

/* ── India ─────────────────────────────────────────────── */
const IN_STATES: Subregion[] = [
  { code: 'AN', name: 'Andaman and Nicobar Islands',   type: 'union_territory' },
  { code: 'AP', name: 'Andhra Pradesh',                 type: 'state' },
  { code: 'AR', name: 'Arunachal Pradesh',              type: 'state' },
  { code: 'AS', name: 'Assam',                          type: 'state' },
  { code: 'BR', name: 'Bihar',                          type: 'state' },
  { code: 'CH', name: 'Chandigarh',                     type: 'union_territory' },
  { code: 'CT', name: 'Chhattisgarh',                   type: 'state' },
  { code: 'DN', name: 'Dadra and Nagar Haveli',         type: 'union_territory' },
  { code: 'DL', name: 'Delhi',                          type: 'union_territory' },
  { code: 'GA', name: 'Goa',                            type: 'state' },
  { code: 'GJ', name: 'Gujarat',                        type: 'state' },
  { code: 'HR', name: 'Haryana',                        type: 'state' },
  { code: 'HP', name: 'Himachal Pradesh',               type: 'state' },
  { code: 'JK', name: 'Jammu and Kashmir',              type: 'union_territory' },
  { code: 'JH', name: 'Jharkhand',                      type: 'state' },
  { code: 'KA', name: 'Karnataka',                      type: 'state' },
  { code: 'KL', name: 'Kerala',                         type: 'state' },
  { code: 'LA', name: 'Ladakh',                         type: 'union_territory' },
  { code: 'LD', name: 'Lakshadweep',                    type: 'union_territory' },
  { code: 'MP', name: 'Madhya Pradesh',                 type: 'state' },
  { code: 'MH', name: 'Maharashtra',                    type: 'state' },
  { code: 'MN', name: 'Manipur',                        type: 'state' },
  { code: 'ML', name: 'Meghalaya',                      type: 'state' },
  { code: 'MZ', name: 'Mizoram',                        type: 'state' },
  { code: 'NL', name: 'Nagaland',                       type: 'state' },
  { code: 'OR', name: 'Odisha',                         type: 'state' },
  { code: 'PY', name: 'Puducherry',                     type: 'union_territory' },
  { code: 'PB', name: 'Punjab',                         type: 'state' },
  { code: 'RJ', name: 'Rajasthan',                      type: 'state' },
  { code: 'SK', name: 'Sikkim',                         type: 'state' },
  { code: 'TN', name: 'Tamil Nadu',                     type: 'state' },
  { code: 'TG', name: 'Telangana',                      type: 'state' },
  { code: 'TR', name: 'Tripura',                        type: 'state' },
  { code: 'UP', name: 'Uttar Pradesh',                  type: 'state' },
  { code: 'UT', name: 'Uttarakhand',                    type: 'state' },
  { code: 'WB', name: 'West Bengal',                    type: 'state' },
]

/* ── Germany ────────────────────────────────────────────── */
const DE_STATES: Subregion[] = [
  { code: 'BW', name: 'Baden-Württemberg',              type: 'federal_state' },
  { code: 'BY', name: 'Bavaria',                        type: 'federal_state' },
  { code: 'BE', name: 'Berlin',                         type: 'federal_state' },
  { code: 'BB', name: 'Brandenburg',                    type: 'federal_state' },
  { code: 'HB', name: 'Bremen',                         type: 'federal_state' },
  { code: 'HH', name: 'Hamburg',                        type: 'federal_state' },
  { code: 'HE', name: 'Hesse',                          type: 'federal_state' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern',         type: 'federal_state' },
  { code: 'NI', name: 'Lower Saxony',                   type: 'federal_state' },
  { code: 'NW', name: 'North Rhine-Westphalia',         type: 'federal_state' },
  { code: 'RP', name: 'Rhineland-Palatinate',           type: 'federal_state' },
  { code: 'SL', name: 'Saarland',                       type: 'federal_state' },
  { code: 'SN', name: 'Saxony',                         type: 'federal_state' },
  { code: 'ST', name: 'Saxony-Anhalt',                  type: 'federal_state' },
  { code: 'SH', name: 'Schleswig-Holstein',             type: 'federal_state' },
  { code: 'TH', name: 'Thuringia',                      type: 'federal_state' },
]

/* ── Spain ──────────────────────────────────────────────────
   Mainland autonomous communities + individual islands.
   Note: legacy codes IB (Balearic Islands) and CN (Canary Islands)
   were community-level entries; replaced by individual islands below.
   Existing DB records with those codes remain valid.
── */
const ES_REGIONS: Subregion[] = [
  { code: 'AN',  name: 'Andalusia',        type: 'autonomous_community' },
  { code: 'AR',  name: 'Aragon',           type: 'autonomous_community' },
  { code: 'AS',  name: 'Asturias',         type: 'autonomous_community' },
  { code: 'PV',  name: 'Basque Country',   type: 'autonomous_community' },
  { code: 'CB',  name: 'Cantabria',        type: 'autonomous_community' },
  { code: 'CL',  name: 'Castile and León', type: 'autonomous_community' },
  { code: 'CM',  name: 'Castile-La Mancha',type: 'autonomous_community' },
  { code: 'CT',  name: 'Catalonia',        type: 'autonomous_community' },
  { code: 'EX',  name: 'Extremadura',      type: 'autonomous_community' },
  { code: 'GA',  name: 'Galicia',          type: 'autonomous_community' },
  { code: 'RI',  name: 'La Rioja',         type: 'autonomous_community' },
  { code: 'MD',  name: 'Madrid',           type: 'autonomous_community' },
  { code: 'MC',  name: 'Murcia',           type: 'autonomous_community' },
  { code: 'NC',  name: 'Navarre',          type: 'autonomous_community' },
  { code: 'VC',  name: 'Valencia',         type: 'autonomous_community' },
  /* Canary Islands — individual */
  { code: 'CN-TEN', name: 'Tenerife',       type: 'island' },
  { code: 'CN-GC',  name: 'Gran Canaria',   type: 'island' },
  { code: 'CN-LNZ', name: 'Lanzarote',      type: 'island' },
  { code: 'CN-FUE', name: 'Fuerteventura',  type: 'island' },
  /* Balearic Islands — individual */
  { code: 'IB-MAL', name: 'Mallorca',       type: 'island' },
  { code: 'IB-IBZ', name: 'Ibiza',          type: 'island' },
  { code: 'IB-MEN', name: 'Menorca',        type: 'island' },
]

/* ── Italy ──────────────────────────────────────────────────
   Administrative regions (Sicily + Sardinia already included) + Capri island.
── */
const IT_REGIONS: Subregion[] = [
  { code: 'ABR', name: 'Abruzzo',                       type: 'region' },
  { code: 'VDA', name: "Aosta Valley",                  type: 'region' },
  { code: 'PUG', name: 'Apulia',                        type: 'region' },
  { code: 'BAS', name: 'Basilicata',                    type: 'region' },
  { code: 'CAL', name: 'Calabria',                      type: 'region' },
  { code: 'CAM', name: 'Campania',                      type: 'region' },
  { code: 'EMR', name: 'Emilia-Romagna',                type: 'region' },
  { code: 'FVG', name: 'Friuli-Venezia Giulia',         type: 'region' },
  { code: 'LAZ', name: 'Lazio',                         type: 'region' },
  { code: 'LIG', name: 'Liguria',                       type: 'region' },
  { code: 'LOM', name: 'Lombardy',                      type: 'region' },
  { code: 'MAR', name: 'Marche',                        type: 'region' },
  { code: 'MOL', name: 'Molise',                        type: 'region' },
  { code: 'PIE', name: 'Piedmont',                      type: 'region' },
  { code: 'SAR', name: 'Sardinia',                      type: 'region' },
  { code: 'SIC', name: 'Sicily',                        type: 'region' },
  { code: 'TAA', name: 'Trentino-South Tyrol',          type: 'region' },
  { code: 'TOS', name: 'Tuscany',                       type: 'region' },
  { code: 'UMB', name: 'Umbria',                        type: 'region' },
  { code: 'VEN', name: 'Veneto',                        type: 'region' },
  /* Island */
  { code: 'CAPRI', name: 'Capri',                       type: 'island' },
]

/* ── United Kingdom ─────────────────────────────────────── */
const GB_REGIONS: Subregion[] = [
  { code: 'ENG', name: 'England',                       type: 'country_division' },
  { code: 'SCT', name: 'Scotland',                      type: 'country_division' },
  { code: 'WLS', name: 'Wales',                         type: 'country_division' },
  { code: 'NIR', name: 'Northern Ireland',              type: 'country_division' },
  /* English regions */
  { code: 'EE',  name: 'East of England',               type: 'region' },
  { code: 'EM',  name: 'East Midlands',                 type: 'region' },
  { code: 'LON', name: 'London',                        type: 'region' },
  { code: 'NE',  name: 'North East England',            type: 'region' },
  { code: 'NW',  name: 'North West England',            type: 'region' },
  { code: 'SE',  name: 'South East England',            type: 'region' },
  { code: 'SW',  name: 'South West England',            type: 'region' },
  { code: 'WM',  name: 'West Midlands',                 type: 'region' },
  { code: 'YH',  name: 'Yorkshire and the Humber',      type: 'region' },
]

/* ── France ─────────────────────────────────────────────── */
const FR_REGIONS: Subregion[] = [
  { code: 'ARA', name: 'Auvergne-Rhône-Alpes',          type: 'region' },
  { code: 'BFC', name: 'Bourgogne-Franche-Comté',       type: 'region' },
  { code: 'BRE', name: 'Brittany',                      type: 'region' },
  { code: 'CVL', name: 'Centre-Val de Loire',           type: 'region' },
  { code: 'COR', name: 'Corsica',                       type: 'region' },
  { code: 'GES', name: 'Grand Est',                     type: 'region' },
  { code: 'HDF', name: 'Hauts-de-France',               type: 'region' },
  { code: 'IDF', name: 'Île-de-France',                 type: 'region' },
  { code: 'NOR', name: 'Normandy',                      type: 'region' },
  { code: 'NAQ', name: 'Nouvelle-Aquitaine',            type: 'region' },
  { code: 'OCC', name: 'Occitanie',                     type: 'region' },
  { code: 'PDL', name: 'Pays de la Loire',              type: 'region' },
  { code: 'PAC', name: "Provence-Alpes-Côte d'Azur",   type: 'region' },
  /* Overseas */
  { code: 'GUF', name: 'French Guiana',                 type: 'region' },
  { code: 'GLP', name: 'Guadeloupe',                    type: 'region' },
  { code: 'MTQ', name: 'Martinique',                    type: 'region' },
  { code: 'MYT', name: 'Mayotte',                       type: 'region' },
  { code: 'REU', name: 'Réunion',                       type: 'region' },
]

/* ── Greece ─────────────────────────────────────────────── */
const GR_ISLANDS: Subregion[] = [
  { code: 'CRETE',     name: 'Crete',     type: 'island' },
  { code: 'RHODES',    name: 'Rhodes',    type: 'island' },
  { code: 'SANTORINI', name: 'Santorini', type: 'island' },
  { code: 'MYKONOS',   name: 'Mykonos',   type: 'island' },
  { code: 'CORFU',     name: 'Corfu',     type: 'island' },
  { code: 'ZAKYNTHOS', name: 'Zakynthos', type: 'island' },
  { code: 'KOS',       name: 'Kos',       type: 'island' },
]

/* ── Portugal ───────────────────────────────────────────── */
const PT_ISLANDS: Subregion[] = [
  { code: 'MADEIRA', name: 'Madeira', type: 'island' },
  { code: 'AZORES',  name: 'Azores',  type: 'island' },
]

/* ── Master registry ─────────────────────────────────────── */
export const COUNTRY_SUBREGIONS: Record<string, CountrySubregions> = {
  US: { label: 'states',                    regions: US_STATES },
  CA: { label: 'provinces & territories',   regions: CA_PROVINCES },
  AU: { label: 'states & territories',      regions: AU_STATES },
  BR: { label: 'states',                    regions: BR_STATES },
  IN: { label: 'states & territories',      regions: IN_STATES },
  DE: { label: 'federal states',            regions: DE_STATES },
  ES: { label: 'regions & islands',         regions: ES_REGIONS },
  IT: { label: 'regions & islands',         regions: IT_REGIONS },
  GB: { label: 'countries & regions',       regions: GB_REGIONS },
  FR: { label: 'regions',                   regions: FR_REGIONS },
  GR: { label: 'islands',                   regions: GR_ISLANDS },
  PT: { label: 'islands',                   regions: PT_ISLANDS },
}

export function getSubregions(countryCode: string): CountrySubregions | null {
  return COUNTRY_SUBREGIONS[countryCode] ?? null
}

export function hasSubregions(countryCode: string): boolean {
  return countryCode in COUNTRY_SUBREGIONS
}

/** Returns the region label for a country, e.g. "states" for US */
export function subregionLabel(countryCode: string): string {
  return COUNTRY_SUBREGIONS[countryCode]?.label ?? 'regions'
}
