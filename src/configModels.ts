import { PlatformConfig, Logger } from 'homebridge';

export interface PluginConfiguration extends PlatformConfig {
  defaults?: BaseServerConfiguration;
  servers: ServerConfiguration[];
}

export const isPluginConfiguration = (x: PlatformConfig, logger: Logger | undefined = undefined): x is PluginConfiguration => {
  if (x.defaults !== undefined && !isBaseServerConfiguration(x.defaults)) {
    logger?.error('Incorrect configuration: defaults are invalid.');
    return false;
  }

  if (x.servers === undefined || !Array.isArray(x.servers) || x.servers.length === 0) {
    logger?.error('Incorrect configuration: servers must be an array of servers and contain at least one server.');
  }
  for (const server of x.servers) {
    if (!isServerConfiguration(server)) {
      logger?.error('Incorrect configuration: Entry for server is not correct: ' + JSON.stringify(server));
      return false;
    }
  }
  return true;
};

export interface BaseServerConfiguration extends Record<string, unknown> {
  interval?: number;
  low_battery_threshold?: number;
  manufacturer?: string;
}

export interface ServerConfiguration extends BaseServerConfiguration {
  host: string;
  port?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isBaseServerConfiguration = (x: any): x is BaseServerConfiguration => {
  // Optional boolean exclude property
  if (x.interval !== undefined && typeof x.interval !== 'number') {
    return false;
  }

  // Optional low_battery_threshold property
  if (x.low_battery_threshold !== undefined && typeof x.low_battery_threshold !== 'number') {
    return false;
  }

  // Optional manufacturer name
  if (x.manufacturer !== undefined && (typeof x.manufacturer !== 'string' || x.manufacturer.length < 1)) {
    return false;
  }

  return true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isServerConfiguration = (x: any): x is ServerConfiguration => {
  // Required host name
  if (x.host === undefined || typeof x.host !== 'string' || x.host.length < 1) {
    return false;
  }

  if (x.port !== undefined && typeof x.port !== 'number') {
    return false;
  }
  return isBaseServerConfiguration(x);
};