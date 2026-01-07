import configLib from 'config';

export interface AppConfig {
  port: number;
  env: string;
  dashboard: {
    caller: string;
    apikey: string;
  };
  strapi: {
    baseUrl: string;
    apiToken: string;
  };
  corsOrigins: string[];
}

export const config: AppConfig = {
  port: configLib.get<number>('port'),
  env: configLib.get<string>('env'),
  dashboard: {
    caller: configLib.get<string>('dashboard.caller'),
    apikey: configLib.get<string>('dashboard.apikey'),
  },
  strapi: {
    baseUrl: configLib.get<string>('strapi.baseUrl'),
    apiToken: configLib.get<string>('strapi.apiToken'),
  },
  corsOrigins: configLib.get<string[]>('corsOrigins'),
};
