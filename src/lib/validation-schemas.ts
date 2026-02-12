import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Sanitize a string by removing potential XSS content.
 * This is a transformation, not just a validation.
 */
const sanitize = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    return DOMPurify.sanitize(value).trim();
};

const xssPattern = /<[^>]*>|javascript:|on\w+=/i;

/**
 * Common string schema with STRICT XSS validation.
 * Rejects input containing potential XSS patterns.
 */
export const commonString = (min = 1, max = 255) =>
    z.string()
        .refine(val => !xssPattern.test(val), { message: "Potential security risk detected: Invalid characters" })
        .transform(sanitize)
        .refine(val => val.length >= min, { message: `Must be at least ${min} characters` })
        .refine(val => val.length <= max, { message: `Must be at most ${max} characters` });

/**
 * Email validation schema.
 */
export const emailSchema = z.string()
    .email("Invalid email address")
    .transform(sanitize);

/**
 * URL validation schema.
 */
export const urlSchema = z.string()
    .url("Invalid URL")
    .transform(sanitize);

/**
 * JSON string validation schema.
 * Ensures the string is valid JSON.
 */
export const jsonStringSchema = z.string()
    .refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, "Invalid JSON format")
    .transform(sanitize);

/**
 * Phone number validation (basic).
 */
export const phoneSchema = z.string()
    .min(10, "Phone number too short")
    .max(20, "Phone number too long")
    .regex(/^\+?[0-9\s-()]+$/, "Invalid phone number format")
    .transform(sanitize);

/**
 * Role Management Schema
 */
export const roleSchema = z.object({
    name: commonString(2, 50),
    description: z.string()
        .refine(val => !xssPattern.test(val || ''), { message: "Potential security risk detected: Invalid characters" })
        .transform(sanitize)
        .optional(),
    organizationId: z.string().optional()
});

/**
 * API Provider Schema
 */
export const apiProviderSchema = z.object({
    name: commonString(2, 100),
    baseUrl: urlSchema,
    headers: jsonStringSchema.optional().or(z.literal('')),
    isActive: z.boolean().optional()
});

export const integrationSchema = z.object({
    providerId: z.string().min(1, "Provider is required"),
    triggerEvent: z.string().min(1, "Trigger event is required"),
    endpoint: commonString(1, 200).refine(val => /^\//.test(val), { message: "Endpoint must start with /" }),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    requestMapping: jsonStringSchema.optional().or(z.literal('')),
    responseMapping: jsonStringSchema.optional().or(z.literal('')),
    order: z.number().int().min(0).optional()
});

export const organizationSchema = z.object({
    name: commonString(2, 100),
    description: z.string()
        .refine(val => !xssPattern.test(val || ''), { message: "Potential security risk detected: Invalid characters" })
        .transform(sanitize)
        .optional(),
    // Logo is handled separately as a File object, or we can validate it here if we pass the FileList
});

export const airlineOfficeSchema = z.object({
    name: commonString(2, 100),
    address: z.string()
        .refine(val => !xssPattern.test(val || ''), { message: "Potential security risk detected: Invalid characters" })
        .transform(sanitize)
        .optional()
        .or(z.literal('')),
    city: z.string()
        .refine(val => !xssPattern.test(val || ''), { message: "Potential security risk detected: Invalid characters" })
        .transform(sanitize)
        .optional()
        .or(z.literal('')),
    contactPhone: phoneSchema.optional().or(z.literal('')),
    contactEmail: emailSchema,
    countryIds: z.array(z.number()).default([])
});
