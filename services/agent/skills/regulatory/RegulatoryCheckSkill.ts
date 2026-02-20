import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';
import complianceRules from '../../../rules/complianceRules.json';
// Assuming logger is available at this path based on project structure
// If not, we'll need to fix imports later, but this standardizes the skill.
import { logger } from '../../../lib/logger';

type DocCategory = 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other';

export class RegulatoryCheckSkill implements ISkill {
  public id = 'regulatory_check_skill';
  public name = 'Regulatory Compliance Check';
  public category = SkillCategory.REGULATORY;
  public description = 'Validates compliance with specific regulations based on origin, destination, and product data.';

  async execute(context: SkillContext): Promise<SkillResult> {
    const { metadata } = context;
    const product = metadata.product || 'unknown_product';
    const origin = metadata.origin || 'any';
    const destination = metadata.destination || 'unknown_destination';
    const regulation = metadata.regulation;

    // Logic from original regulatoryCheck.ts
    let applicableRules = complianceRules.filter((rule: any) => {
      const destMatch = rule.destination === 'any' ||
        rule.destination === destination ||
        (rule.destination === 'EU' && this.isEU(destination));

      const originMatch = rule.origin === 'any' || rule.origin === origin;

      const prodMatch = rule.product_category === 'General' ||
        product.toLowerCase().includes(rule.product_category.toLowerCase());

      const regMatch = !regulation || rule.rule_id.includes(regulation.toLowerCase()) || rule.regulation.includes(regulation);

      return destMatch && originMatch && prodMatch && regMatch;
    });

    if (applicableRules.length === 0) {
      return {
        success: true,
        confidence: 0.9,
        data: {
          compliant: true,
          rulesChecked: 0,
          message: 'No specific regulatory blocking rules found.'
        },
        requiresHumanReview: false,
        verdict: 'COMPLIANT',
        auditLog: [{
          timestamp: new Date().toISOString(),
          action: 'CHECK_COMPLETE',
          details: 'No applicable rules found.'
        }]
      };
    }

    const violations: string[] = [];
    const requiredDocs: Array<{ name: string; description: string; category: DocCategory; agency: string; agencyLink: string }> = [];

    for (const rule of applicableRules) {
      if (rule.required_documents) {
        rule.required_documents.forEach((doc: any) => {
          requiredDocs.push({
            name: doc.name,
            description: doc.description || `Required by ${rule.regulation}`,
            category: this.mapCategory(doc.category),
            agency: 'Regulatory Authority',
            agencyLink: ''
          });
        });
      }

      // Specific Rule Checks
      if (rule.rule_id === 'rule_eudr_eu_import') {
        if (!metadata.geolocation) violations.push(`${rule.regulation}: Missing Geolocation.`);
        if (metadata.deforestationFree === false) violations.push(`${rule.regulation}: Product is not deforestation-free.`);
      }

      if (rule.rule_id === 'rule_fsma_usa_import') {
        if (!metadata.fsvp) violations.push(`${rule.regulation}: Missing FSVP records.`);
      }
    }

    if (violations.length > 0) {
      return {
        success: true,
        confidence: 1.0,
        data: {
          compliant: false,
          violations,
          rulesChecked: applicableRules.length
        },
        requiresHumanReview: true,
        verdict: 'NON_COMPLIANT',
        auditLog: [{
          timestamp: new Date().toISOString(),
          action: 'VIOLATION_DETECTED',
          details: violations.join('; ')
        }],
        errors: violations
      };
    }

    return {
      success: true,
      confidence: 0.95,
      data: {
        compliant: true,
        rulesChecked: applicableRules.length,
        requiredDocuments: requiredDocs
      },
      requiresHumanReview: false,
      verdict: 'COMPLIANT',
      auditLog: [{
        timestamp: new Date().toISOString(),
        action: 'CHECK_PASSED',
        details: `Passed ${applicableRules.length} rules.`
      }]
    };
  }

  async validateContext(context: SkillContext): Promise<boolean> {
    return !!context.metadata.destination;
  }

  private mapCategory(category: string): DocCategory {
    const map: Record<string, DocCategory> = {
      'Customs': 'Customs',
      'Regulatory': 'Regulatory',
      'Food Safety': 'Food Safety',
      'Quality': 'Quality',
      'Organic': 'Quality'
    };
    return map[category] || 'Other';
  }

  private isEU(country: string): boolean {
    const euCountries = ['Netherlands', 'Germany', 'France', 'Spain', 'Italy', 'Belgium', 'Austria', 'Poland', 'Sweden', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Greece'];
    return euCountries.includes(country) || country === 'EU';
  }
}
