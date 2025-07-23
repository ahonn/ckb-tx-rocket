export interface ChainVizConfig {
  url: string;
  timeout: number;
  autoConnect: boolean;
}

/**
 * Gets environment variable as string with fallback
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @returns Environment variable value or default
 */
const getEnvVar = (key: string, defaultValue: string): string => {
  return import.meta.env[key] || defaultValue;
};

/**
 * Gets environment variable as number with fallback
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @returns Environment variable value parsed as number or default
 */
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

/**
 * Gets environment variable as boolean with fallback
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @returns Environment variable value parsed as boolean or default
 */
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

/**
 * CKB ChainViz service configuration loaded from environment variables
 */
export const chainVizConfig: ChainVizConfig = {
  url: getEnvVar('VITE_CKB_CHAINVIZ_URL', 'http://localhost:3000'),
  timeout: getEnvNumber('VITE_CKB_CHAINVIZ_TIMEOUT', 10000),
  autoConnect: getEnvBoolean('VITE_CKB_CHAINVIZ_AUTO_CONNECT', true),
};

console.log('CKB ChainViz Configuration:', {
  url: chainVizConfig.url,
  timeout: chainVizConfig.timeout,
  autoConnect: chainVizConfig.autoConnect,
});

if (!chainVizConfig.url) {
  console.warn('CKB ChainViz URL not configured. Using default: http://localhost:3000');
}

if (chainVizConfig.timeout < 1000) {
  console.warn('CKB ChainViz timeout too low. Minimum recommended: 1000ms');
}