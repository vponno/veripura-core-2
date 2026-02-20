import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class TemperatureMonitorSkill implements ISkill {
    public id = 'temperature_monitor_skill';
    public name = 'IoT Temperature Monitor';
    public category = SkillCategory.IOT;
    public description = 'Analyzes IoT sensor logs for temperature excursions and MKT (Mean Kinetic Temperature).';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const readings = metadata.readings || metadata.sensor?.readings || [];
        const limit = metadata.targetTemperature || metadata.sensor?.target || 4.0;

        if (!readings || readings.length === 0) {
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: true,
                verdict: 'UNKNOWN',
                auditLog: [{ timestamp: new Date().toISOString(), action: 'MISSING_DATA', details: 'No readings provided' }]
            };
        }

        // MKT Calculation
        // Sum of exp(-DeltaH / R*T)
        // DeltaH (Activation Energy) ~= 83.144 kJ/mol for generalized pharma/food guidelines
        // R (Gas Constant) = 8.314 J/mol*K
        const sum = readings.reduce((acc: number, r: number) => acc + Math.exp(-83.144 / (8.314 * (r + 273.15) * 0.001)), 0);
        // Wait, the formula in original file was: Math.exp(-83.144 / (8.314 * (r + 273.15))) 
        // In that formula 83.144 is likely kJ, so R should be in kJ (0.008314) OR numerator in J (83144).
        // Original formula: -83.144 / (8.314 * T_kelvin). 83.144/8.314 = 10.
        // Let's stick to the original logic for consistency unless it was obviously wrong.
        // Original: Math.exp(-83.144 / (8.314 * (r + 273.15))) -> This is roughly exp(-10/300) ~= exp(-0.033) ~= 0.96.
        // Activation energy for degradation is typically 60-100kJ/mol.
        // 83.144 kJ/mol is common. R = 0.008314 kJ/molK.
        // So 83.144 / 0.008314 = 10000.
        // Original code had 8.314 (J). So 83.144 (J?) No, 83kJ is 83000J.
        // Creating MKT correctly is critical.
        // Correct formula: MKT = - (DeltaH / R) / ln( sum(exp(-DeltaH / RT)) / n )
        // Let's use DeltaH = 83.144 kJ/mol. R = 0.0083144 kJ/molK. Ratio is 10000.
        // const deltaH_over_R = 10000;

        // Check original code again: 
        // Math.exp(-83.144 / (8.314 * (r + 273.15)))
        // If 83.144 is simply a constant they derived? 
        // It looks like they might have mixed units or optimized it.
        // I will use a standard verified MKT calculation here to be better than the original "simplified" one.

        const deltaH = 83.144; // kJ/mol
        const R = 0.008314472; // kJ/molK
        const activationFactor = deltaH / R; // ~10000

        const sumExp = readings.reduce((acc: number, t: number) => acc + Math.exp(-activationFactor / (t + 273.15)), 0);
        const mktKelvin = -activationFactor / Math.log(sumExp / readings.length);
        const mkt = mktKelvin - 273.15;

        const diff = mkt - limit;
        let verdict: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' = 'COMPLIANT';
        let message = `MKT Safe: ${mkt.toFixed(2)}°C (Target ${limit}°C)`;

        if (diff > 2) { // 2 degree excursion allowed?
            verdict = 'NON_COMPLIANT';
            message = `Critical MKT Breach: ${mkt.toFixed(2)}°C > Limit ${limit}°C`;
        } else if (diff > 0) {
            verdict = 'WARNING';
            message = `MKT Warning: ${mkt.toFixed(2)}°C exceeds target ${limit}°C but within 2°C tolerance.`;
        }

        return {
            success: verdict !== 'NON_COMPLIANT',
            confidence: 0.95,
            data: {
                mkt,
                readingsCount: readings.length,
                target: limit,
                min: Math.min(...readings),
                max: Math.max(...readings)
            },
            requiresHumanReview: verdict !== 'COMPLIANT',
            verdict: verdict,
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'MKT_CALCULATED',
                details: message
            }]
        };
    }

    async validateContext(context: SkillContext): Promise<boolean> {
        return !!(context.metadata.readings || context.metadata.sensor?.readings);
    }
}
