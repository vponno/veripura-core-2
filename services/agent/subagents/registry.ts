import { SubAgent } from '../subAgent';
import { EUDRSpecialist } from './eudrSpecialist';
import { VetSpsExpert } from './vetSpsExpert';
import { AEOCheckpoint } from './aeoCheckpoint';
import { OrganicSentinel } from './organicSentinel';
import { FSMASpecialist } from './fsmaSpecialist';
import { IUUFisheryWatcher } from './iuuFisheryWatcher';
import { SanctionsSentry } from './sanctionsSentry';
import { IncotermsAdvisor } from './incotermsAdvisor';
import { PriceParityAgent } from './priceParityAgent';
import { LabelingInspector } from './labelingInspector';
import { IngredientCryptographer } from './ingredientCryptographer';
import { HalalKosherGuardian } from './halalKosherGuardian';
import { ColdChainDiplomat } from './coldChainDiplomat';
import { BioSecurityBorderGuard } from './bioSecurityBorderGuard';
import { LogisticsLingoInterpreter } from './logisticsLingoInterpreter';
import { CarbonTracker } from './carbonTracker';
import { LivingWageValidator } from './livingWageValidator';
import { SocialComplianceWhistleblower } from './socialComplianceWhistleblower';
import { TariffOptimizer } from './tariffOptimizer';
import { InsuranceClaimsScout } from './insuranceClaimsScout';
import { ChainOfCustodyAuditor } from './chainOfCustodyAuditor';
import { FoodSafetyAuditor } from './foodSafetyAuditor';
import { EthicalSourcingSpecialist } from './ethicalSourcingSpecialist';
import { BRCGSSpecialist } from './brcgsSpecialist';
import { BSCIAuditor } from './bsciAuditor';
import { HACCPSpecialist } from './haccpSpecialist';
import { GMPInspector } from './gmpInspector';
import { FSSC22000Expert } from './fssc22000Expert';
import { EcoMarkerSpecialist } from './ecoMarkerSpecialist';

// Registry Map: ID -> Constructor
export const SubAgentRegistry: Record<string, new () => SubAgent> = {
    'eudr_specialist': EUDRSpecialist,
    'vet_sps_expert': VetSpsExpert,
    'aeo_checkpoint': AEOCheckpoint,
    'organic_sentinel': OrganicSentinel,
    'fsma_specialist': FSMASpecialist,
    'iuu_fishery_watcher': IUUFisheryWatcher,
    'sanctions_sentry': SanctionsSentry,
    'incoterms_advisor': IncotermsAdvisor,
    'price_parity_agent': PriceParityAgent,
    'labeling_inspector': LabelingInspector,
    'ingredient_cryptographer': IngredientCryptographer,
    'halal_kosher_guardian': HalalKosherGuardian,
    'cold_chain_diplomat': ColdChainDiplomat,
    'bio_security_border_guard': BioSecurityBorderGuard,
    'logistics_lingo_interpreter': LogisticsLingoInterpreter,
    'carbon_tracker': CarbonTracker,
    'living_wage_validator': LivingWageValidator,
    'social_compliance_whistleblower': SocialComplianceWhistleblower,
    'tariff_optimizer': TariffOptimizer,
    'insurance_claims_scout': InsuranceClaimsScout,
    'food_safety_auditor': FoodSafetyAuditor,
    'ethical_sourcing_specialist': EthicalSourcingSpecialist,
    'chain_of_custody_auditor': ChainOfCustodyAuditor,
    'brcgs_specialist': BRCGSSpecialist,
    'bsci_auditor': BSCIAuditor,
    'haccp_specialist': HACCPSpecialist,
    'gmp_inspector': GMPInspector,
    'fssc_22000_expert': FSSC22000Expert,
    'eco_marker_specialist': EcoMarkerSpecialist
};
