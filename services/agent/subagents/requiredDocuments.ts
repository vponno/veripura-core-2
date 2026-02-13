export interface RequiredDoc {
    name: string;
    description: string;
    category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other';
    agency: string;
    agencyLink: string;
    reason?: string;
}

export const REQUIRED_DOCS = {
    FSMA: [
        {
            name: 'FSVP (Foreign Supplier Verification Program)',
            description: 'Importer must verify foreign suppliers meet FDA food safety standards',
            category: 'Food Safety' as const,
            agency: 'FDA',
            agencyLink: 'https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-foreign-supplier-verification-program'
        },
        {
            name: 'PCQI Certificate',
            description: 'Preventive Controls Qualified Individual certification',
            category: 'Food Safety' as const,
            agency: 'FDA',
            agencyLink: 'https://www.fda.gov/food/food-safety-modernization-act-fsma/preventive-controls-human-food'
        }
    ],
    EUDR: [
        {
            name: 'EUDR Geolocation Statement',
            description: 'Geolocation data of production plot confirming deforestation-free status',
            category: 'Regulatory' as const,
            agency: 'EU Commission',
            agencyLink: 'https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en'
        },
        {
            name: 'Due Diligence Statement',
            description: 'Operator due diligence statement per EUDR Article 9',
            category: 'Regulatory' as const,
            agency: 'EU Commission',
            agencyLink: 'https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en'
        }
    ],
    HALAL: [
        {
            name: 'Halal Certificate',
            description: 'Halal certification from recognized Islamic authority',
            category: 'Quality' as const,
            agency: 'Jakim/MUI',
            agencyLink: 'https://www.halal.gov.my/'
        }
    ],
    KOSHER: [
        {
            name: 'Kosher Certificate',
            description: 'Kosher certification from recognized authority',
            category: 'Quality' as const,
            agency: 'OU Kosher',
            agencyLink: 'https://www.ou.org/kosher/'
        }
    ],
    ORGANIC: [
        {
            name: 'Organic Certificate',
            description: 'Organic certification (USDA NOP, EU Organic, etc.)',
            category: 'Quality' as const,
            agency: 'USDA/EU',
            agencyLink: 'https://www.ams.usda.gov/about-ams/programs-offices/national-organic-program'
        },
        {
            name: 'Transaction Certificate',
            description: 'Organic transaction certificate from certifier',
            category: 'Quality' as const,
            agency: 'Certifier',
            agencyLink: ''
        }
    ],
    HACCP: [
        {
            name: 'HACCP Plan',
            description: 'Hazard Analysis Critical Control Points plan',
            category: 'Food Safety' as const,
            agency: 'Internal/Certifier',
            agencyLink: 'https://www.foodsafety.gov/'
        },
        {
            name: 'HACCP Certificate',
            description: 'Third-party HACCP certification',
            category: 'Food Safety' as const,
            agency: 'GFSI',
            agencyLink: 'https://www.mygfsi.com/'
        }
    ],
    BRCGS: [
        {
            name: 'BRCGS Food Safety Certificate',
            description: 'British Retail Consortium Global Standard for Food Safety',
            category: 'Food Safety' as const,
            agency: 'BRCGS',
            agencyLink: 'https://www.brcgs.com/'
        }
    ],
    FSSC22000: [
        {
            name: 'FSSC 22000 Certificate',
            description: 'Food Safety System Certification 22000',
            category: 'Food Safety' as const,
            agency: 'FSSC 22000',
            agencyLink: 'https://www.fssc22000.com/'
        }
    ],
    GMP: [
        {
            name: 'GMP Certificate',
            description: 'Good Manufacturing Practice certification',
            category: 'Food Safety' as const,
            agency: 'FDA',
            agencyLink: 'https://www.fda.gov/'
        }
    ],
    IUU: [
        {
            name: 'Catch Certificate',
            description: 'IUU catch certificate proving legal origin',
            category: 'Regulatory' as const,
            agency: 'Flag State',
            agencyLink: 'https://www.fao.org/iuu-fishing/en/'
        },
        {
            name: 'Vessel License',
            description: 'Valid fishing vessel license/authorization',
            category: 'Regulatory' as const,
            agency: 'Flag State',
            agencyLink: ''
        }
    ],
    SANITARY: [
        {
            name: 'Health Certificate',
            description: 'Veterinary/health certificate for animal products',
            category: 'Food Safety' as const,
            agency: 'Origin Country Veterinary Authority',
            agencyLink: ''
        },
        {
            name: 'Phytosanitary Certificate',
            description: 'Plant health certificate for plant products',
            category: 'Food Safety' as const,
            agency: 'NAPPO',
            agencyLink: 'https://www.nappo.org/'
        }
    ],
    AEO: [
        {
            name: 'AEO Certificate',
            description: 'Authorized Economic Operator certification',
            category: 'Customs' as const,
            agency: 'Customs Authority',
            agencyLink: 'https://www.wcoomd.org/'
        }
    ],
    INCOTERMS: [
        {
            name: 'Commercial Invoice',
            description: 'Standard commercial invoice with Incoterms',
            category: 'Customs' as const,
            agency: 'Exporter',
            agencyLink: ''
        },
        {
            name: 'Packing List',
            description: 'Detailed packing list with weights and measures',
            category: 'Customs' as const,
            agency: 'Exporter',
            agencyLink: ''
        }
    ],
    ETHICAL: [
        {
            name: 'SMETA Audit Report',
            description: 'Sedex Members Ethical Trade Audit',
            category: 'Quality' as const,
            agency: 'Sedex',
            agencyLink: 'https://www.sedex.com/'
        },
        {
            name: 'SA8000 Certificate',
            description: 'Social Accountability certification',
            category: 'Quality' as const,
            agency: 'SAI',
            agencyLink: 'https://www.sa-intl.org/'
        }
    ],
    BSCI: [
        {
            name: 'BSCI Audit Report',
            description: 'Business Social Compliance Initiative audit',
            category: 'Quality' as const,
            agency: 'BSCI',
            agencyLink: 'https://www.amfori.org/'
        }
    ],
    LABELS: [
        {
            name: 'Label Mockup',
            description: 'Product label showing required information',
            category: 'Regulatory' as const,
            agency: 'Destination Country',
            agencyLink: ''
        }
    ],
    IOT: [
        {
            name: 'Temperature Log',
            description: 'IoT temperature data log for cold chain',
            category: 'Quality' as const,
            agency: 'Carrier',
            agencyLink: ''
        }
    ],
    GENERAL: [
        {
            name: 'Bill of Lading',
            description: 'Ocean/Air transport document',
            category: 'Customs' as const,
            agency: 'Carrier',
            agencyLink: ''
        },
        {
            name: 'Insurance Certificate',
            description: 'Cargo insurance certificate',
            category: 'Customs' as const,
            agency: 'Insurance Provider',
            agencyLink: ''
        },
        {
            name: 'Certificate of Origin',
            description: 'Certificate of origin for customs',
            category: 'Customs' as const,
            agency: 'Chamber of Commerce',
            agencyLink: ''
        }
    ]
};
