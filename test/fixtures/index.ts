// Mock data fixtures for testing

export const mockConsignment = {
  id: 'test-123',
  exportFrom: 'Thailand',
  importTo: 'USA',
  products: [
    {
      name: 'Jasmine Rice',
      quantity: '1000 kg',
      hsCode: '1006.30',
      isOrganic: false,
    }
  ],
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
};

export const mockDocument = {
  id: 'doc-456',
  name: 'Commercial Invoice',
  category: 'Financial',
  status: 'UPLOADED' as const,
  fileUrl: 'https://example.com/invoice.pdf',
};

export const mockAIResponse = {
  extractedData: {
    sellerName: 'Thai Export Co.',
    buyerName: 'US Import LLC',
    originCountry: 'Thailand',
    destinationCountry: 'USA',
    products: [
      {
        name: 'Jasmine Rice',
        quantity: '1000 kg',
        hsCode: '1006.30',
        isOrganic: false,
        attributes: ['Premium'],
      }
    ],
    securityAnalysis: {
      isSuspicious: false,
      suspicionReason: '',
      tamperScore: 5,
    },
  },
  checklist: [
    {
      id: '1',
      documentName: 'Commercial Invoice',
      description: 'Required for customs clearance',
      issuingAgency: 'CBP',
      agencyLink: 'https://cbp.gov',
      category: 'Financial',
      status: 'MISSING' as const,
      isMandatory: true,
    }
  ],
};

export const sampleBase64 = 'data:application/pdf;base64,JVBERi0xLjQK...';
