
import { SkillRegistry } from '../services/agent/skills/skillRegistry';
import { ModelRegistry } from '../services/agent/ModelRegistry';
import {
    RegulatoryCheckSkill,
    SanctionsSentrySkill,
    FairLaborMonitorSkill,
    MarketValidatorSkill,
    CostAnalyzerSkill,
    ContainerSealIntegritySkill,
    TemperatureMonitorSkill,
    ConflictScannerSkill,
    DocumentAnalysisSkill
} from '../services/agent/skills';

import { SkillContext } from '../services/agent/types';

async function main() {
    console.log('🛡️  Guardian Skill Ecosystem Verification 🛡️\n');

    const registry = SkillRegistry.getInstance();
    const models = ModelRegistry.getInstance();

    // 1. Register Skills
    console.log('📦 Registering Skills...');
    registry.register(new RegulatoryCheckSkill());
    registry.register(new SanctionsSentrySkill());
    registry.register(new FairLaborMonitorSkill());
    registry.register(new MarketValidatorSkill());
    registry.register(new CostAnalyzerSkill());
    registry.register(new ContainerSealIntegritySkill());
    registry.register(new TemperatureMonitorSkill());
    registry.register(new ConflictScannerSkill());
    registry.register(new DocumentAnalysisSkill());

    console.log(`✅ Registered ${registry.getAllSkills().length} skills.\n`);

    // 2. Define Test Context
    const context: SkillContext = {
        consignmentId: 'TEST-12345',
        files: [],
        metadata: {
            // General Shipment Info (Mirroring to top-level for legacy skill validation)
            containerNumber: 'CNTR-1234567',
            origin: 'Xinjiang, China',
            destination: 'Rotterdam, NL',
            product: 'Solar Panels',
            supplier: 'Sunshine Mfg Co.',
            supplierId: 'SUP-BAD', // Triggers PastPerformance mock

            shipment: {
                origin: 'Xinjiang, China',
                destination: 'Rotterdam, NL',
                product: 'Solar Panels',
                hsCode: '854140',
                value: 50000,
                supplier: 'Sunshine Mfg Co.',
                supplierId: 'SUP-BAD'
            },
            // For IoT Skills
            sealNumber: 'SEAL-999',
            billOfLading: { sealNumber: 'SEAL-999' },
            events: [
                { timestamp: '2025-01-01T10:00:00Z', location: 'Shanghai', eventType: 'sealed' },
                { timestamp: '2025-01-15T12:00:00Z', location: 'Red Sea', eventType: 'tampered', notes: 'Sensor case crack detected' },
                { timestamp: '2025-02-01T08:00:00Z', location: 'Rotterdam', eventType: 'arrived' }
            ],
            readings: [4.0, 4.2, 4.5, 4.1, 8.5, 4.0], // Temp Spike
            targetTemperature: 4.0,

            // For Trade Skills
            declaredPrice: 2000, // Very low compared to market?

            // For Social Skills
            declaredWage: 500 // Low wage
        }
    };

    console.log('🧪 Running Test Scenario: "Risky Solar Panel Shipment from Xinjiang"\n');

    // 3. Execute Skills
    const skillsToTest = [
        'regulatory_check_skill',
        'fair_labor_monitor_skill',
        'conflict_scanner_skill',
        'container_seal_integrity_skill',
        'temperature_monitor_skill',
        'market_validator_skill'
    ];

    for (const skillId of skillsToTest) {
        process.stdout.write(`running ${skillId}... `);
        const result = await registry.executeSkill(skillId, context);

        if (result.success) {
            console.log(`✅ ${result.verdict}`);
        } else {
            console.log(`❌ FAILED`);
        }

        if (result.auditLog.length > 0) {
            console.log(`   📝 Details: ${result.auditLog[0].details}`);
        }
        if (result.errors && result.errors.length > 0) {
            console.log(`   ⚠️ Errors: ${result.errors.join(', ')}`);
        }
        console.log('');
    }
}

main().catch(console.error);
