
// IOTA Rebased Constants
export const PACKAGE_ID = import.meta.env.VITE_IOTA_PACKAGE_ID || '0xpackage_id_placeholder';
export const MOCK_PRIVATE_KEY_USER = 'dummy_private_key_base64';
export const SPONSOR_ADDRESS = '0xsponsor_address_placeholder';

// Mock Addresses for demo/fallback
export const MOCK_BUYER_ADDRESS = '0xbuyer_address_placeholder';
export const MOCK_FARMER_ADDRESS = '0xfarmer_address_placeholder';

export const COUNTRIES = [
    // ASEAN
    "Brunei", "Cambodia", "Indonesia", "Laos", "Malaysia", "Myanmar", "Philippines", "Singapore", "Thailand", "Vietnam",
    // EU
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France",
    "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
    "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
    // Americas
    "United States", "Canada", "Brazil", "Mexico", "Argentina", "Chile", "Peru", "Colombia", "Ecuador",
    // Middle East
    "United Arab Emirates", "Saudi Arabia", "Oman", "Qatar", "Kuwait", "Bahrain", "Jordan", "Lebanon", "Turkey", "Israel",
    // Asia Pacific
    "China", "Japan", "South Korea", "India", "Australia", "New Zealand", "Taiwan", "Hong Kong", "Pakistan", "Bangladesh",
    // Africa
    "South Africa", "Nigeria", "Kenya", "Egypt", "Morocco", "Ghana", "Ethiopia", "Tanzania",
    // Other
    "United Kingdom", "Switzerland", "Norway", "Iceland", "Russia", "Kazakhstan"
].sort();