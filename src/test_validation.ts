
import { z } from 'zod';
import DOMPurify from 'dompurify';

const sanitize = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    return DOMPurify.sanitize(value).trim();
};

const xssPattern = /<[^>]*>|javascript:|on\w+=/i;

const commonString = (min = 1, max = 255) =>
    z.string()
        .refine(val => !xssPattern.test(val), { message: "Potential security risk detected: Invalid characters" })
        .transform(sanitize)
        .refine(val => val.length >= min, { message: `Must be at least ${min} characters` })
        .refine(val => val.length <= max, { message: `Must be at most ${max} characters` });

const airlineOfficeSchema = z.object({
    name: commonString(2, 100),
    address: z.string()
        .refine(val => !xssPattern.test(val || ''), { message: "Potential security risk detected: Invalid characters" })
        .transform(sanitize)
        .optional()
        .or(z.literal('')),
});

const payloads = [
    '<img src=x onerror=prompt(1)>',
    'Normal text',
    '<script>alert(1)</script>',
    'javascript:alert(1)',
    'onclick=alert(1)'
];

payloads.forEach(async (payload) => {
    try {
        await airlineOfficeSchema.parseAsync({
            name: payload,
            address: ''
        });
        console.log(`Payload "${payload}" - PASSED (UNEXPECTED if malicious)`);
    } catch (e: any) {
        if (e.issues) {
            console.log(`Payload "${payload}" - FAILED: ${e.issues[0].message}`);
        } else {
            console.log(`Payload "${payload}" - FAILED: ${e.message}`);
        }
    }
});
