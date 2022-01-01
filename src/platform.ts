import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { UpsPlatformAccessory } from './platformAccessory';
import { isPluginConfiguration, ServerConfiguration } from './configModels';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class UpsAlertHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly networkInformationServers: ServerConfiguration[];

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Loading apc-ups-alert platform...');

    if (isPluginConfiguration(config, this.log)) {
      if (config.defaults !== undefined) {
        // Merge defaults into server configurations
        this.networkInformationServers = config.servers.map(s => <ServerConfiguration>{ ...config.defaults, ...s });
      } else {
        this.networkInformationServers = config.servers;
      }
    } else {
      this.networkInformationServers = [];
      log.error(`INVALID CONFIGURATION FOR PLUGIN: ${PLUGIN_NAME}\nThis plugin will NOT WORK until this problem is resolved.`);
      return;
    }

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
 * This function is invoked when homebridge restores cached accessories from disk at startup.
 * It should be used to setup event handlers for characteristics and update respective values.
 */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
 * This is an example method showing how to register discovered accessories.
 * Accessories must only be registered once, previously created accessories
 * must not be registered again to prevent "duplicate UUID" errors.
 */
  discoverDevices() {

    // Used UUIDs
    const usedIds = new Set<string>();

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of this.networkInformationServers) {

      // generate a unique id for the accessory this should be generated from
      const name = `${device.host.trim().toLocaleLowerCase()}:${device.port ?? 3551}`;
      const uuid = this.api.hap.uuid.generate(name);
      usedIds.add(uuid);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', name);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new UpsPlatformAccessory(this, existingAccessory, device);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.host, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new UpsPlatformAccessory(this, accessory, device);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
