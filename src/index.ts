import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { UpsAlertHomebridgePlatform } from './platform';
import { setHap } from './hap';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  setHap(api.hap);
  api.registerPlatform(PLATFORM_NAME, UpsAlertHomebridgePlatform);
};
