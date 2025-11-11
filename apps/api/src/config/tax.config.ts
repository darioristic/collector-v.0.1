/**
 * Tax Configuration
 *
 * Centralized tax rate configuration for the application.
 * These rates can be overridden per customer via customer settings.
 */

export const TAX_CONFIG = {
  /**
   * Default VAT/Tax rate as a decimal (0.20 = 20%)
   */
  DEFAULT_RATE: 0.20,

  /**
   * Default VAT/Tax rate as a percentage (20%)
   */
  DEFAULT_RATE_PERCENTAGE: 20,

  /**
   * Currency configuration
   */
  DEFAULT_CURRENCY: "EUR",

  /**
   * Supported tax rates for different regions/countries
   */
  RATES: {
    // EU Standard rates
    EU_STANDARD: 0.20,      // 20% - Most EU countries
    EU_REDUCED: 0.10,       // 10% - Reduced rate
    EU_SUPER_REDUCED: 0.05, // 5%  - Super reduced rate

    // Country-specific rates
    SERBIA: 0.20,           // 20% - PDV
    GERMANY: 0.19,          // 19% - MwSt
    UK: 0.20,               // 20% - VAT
    FRANCE: 0.20,           // 20% - TVA
    ITALY: 0.22,            // 22% - IVA
    SPAIN: 0.21,            // 21% - IVA

    // Zero rate
    ZERO: 0.00,             // 0%  - Exempt/zero rated
  } as const,

  /**
   * Get tax rate as decimal
   */
  getRate(rate?: number): number {
    return rate !== undefined ? rate / 100 : this.DEFAULT_RATE;
  },

  /**
   * Get tax rate as percentage
   */
  getRatePercentage(rate?: number): number {
    return rate !== undefined ? rate : this.DEFAULT_RATE_PERCENTAGE;
  },

  /**
   * Calculate tax amount from subtotal
   */
  calculateTax(subtotal: number, rate?: number): number {
    const taxRate = this.getRate(rate);
    return subtotal * taxRate;
  },

  /**
   * Calculate total with tax
   */
  calculateTotal(subtotal: number, rate?: number): number {
    return subtotal + this.calculateTax(subtotal, rate);
  }
} as const;

/**
 * Type for tax rate as decimal
 */
export type TaxRate = number;

/**
 * Type for tax rate as percentage
 */
export type TaxRatePercentage = number;