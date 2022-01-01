import { Service, PlatformAccessory } from 'homebridge';
import { hap } from './hap';
import { errorToString, getOrAddCharacteristic, objectsEqual } from './helpers';
import { UpsAlertHomebridgePlatform } from './platform';
import ApcAccess from 'apcaccess';
import { ServerConfiguration } from './configModels';
import { KnownStatus, OptionalKeys, StandardKeys } from './dataModels';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class UpsPlatformAccessory {
  private service: Service;
  private isOnline: boolean;
  private highestTimeRemaining: number | undefined;

  private get interval(): number {
    return (this.config?.interval ?? 20) * 1000;
  }

  constructor(
    private readonly platform: UpsAlertHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly config: ServerConfiguration,
  ) {
    this.service = this.accessory.getService(hap.Service.LeakSensor) || this.accessory.addService(hap.Service.LeakSensor);

    // set accessory information
    if (this.accessory.context.dataCache !== undefined) {
      this.platform.log.info(`Cached info for ${this.accessory.displayName}: ${JSON.stringify(this.accessory.context.dataCache)}`);
      this.processData(this.accessory.context.dataCache);
    } else {
      this.accessory.getService(hap.Service.AccessoryInformation)!
        .setCharacteristic(hap.Characteristic.Name, config.host)
        .setCharacteristic(hap.Characteristic.Manufacturer, config.manufacturer ?? 'UPS')
        .setCharacteristic(hap.Characteristic.Model, 'Unknown Model')
        .setCharacteristic(hap.Characteristic.SerialNumber, 'SN0000');
    }

    this.isOnline = false;

    setTimeout(() => {
      this.pollForInformation();
    }, this.interval);
  }

  private async pollForInformation(): Promise<void> {
    try {
      const client = new ApcAccess();
      await client.connect(this.config.host, this.config.port ?? 3551);
      const result = await client.getStatusJson();
      await client.disconnect;
      this.processData(result);
    } catch (error) {
      this.platform.log.warn(`Error while polling ${this.config.host}: ${errorToString(error)}`);
    }
    setTimeout(() => {
      this.pollForInformation();
    }, this.interval);
  }

  private static normalizeString(value: string): string {
    return value.trim();
  }

  private static extractNumber(value: string | number): number {
    if (typeof value === 'string') {
      return Number(value.trim().replace(/\s.*/, ''));
    }
    return value;
  }

  private static normalizeProperty(value: string): string {
    return value.replace(' ', '').trim().toUpperCase();
  }

  private processData(data: object): void {

    const accessoryInfo = this.accessory.getService(hap.Service.AccessoryInformation);
    const initialCache = this.accessory.context.dataCache;
    if (this.accessory.context.dataCache === undefined) {
      this.accessory.context.dataCache = {};
    }

    for (const prop in data) {
      const propNormalized = UpsPlatformAccessory.normalizeProperty(prop);
      switch (propNormalized) {
        case StandardKeys.Model:
          this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.normalizeString(data[prop]);
          accessoryInfo?.updateCharacteristic(hap.Characteristic.Model, this.accessory.context.dataCache[propNormalized]);
          break;
        case StandardKeys.UpsName:
          this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.normalizeString(data[prop]);
          accessoryInfo?.updateCharacteristic(hap.Characteristic.Name, this.accessory.context.dataCache[propNormalized]);
          break;
        case StandardKeys.Status:
          {
            const status = UpsPlatformAccessory.normalizeString(data[prop]);
            if (status === KnownStatus.CommunicationLost) {
              this.isOnline = false;
            } else {
              this.isOnline = true;
              if (status === KnownStatus.OnLine) {
                this.service.updateCharacteristic(hap.Characteristic.LeakDetected, hap.Characteristic.LeakDetected.LEAK_NOT_DETECTED);
              } else {
                // Assume on battery
                this.service.updateCharacteristic(hap.Characteristic.LeakDetected, hap.Characteristic.LeakDetected.LEAK_DETECTED);
              }
            }
          }
          break;
        case OptionalKeys.ApcModel:
          this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.normalizeString(data[prop]);
          accessoryInfo?.updateCharacteristic(hap.Characteristic.Model, this.accessory.context.dataCache[propNormalized]);
          accessoryInfo?.updateCharacteristic(hap.Characteristic.Manufacturer, 'APC');
          break;
        case OptionalKeys.SerialNumber:
          this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.normalizeString(data[prop]);
          accessoryInfo?.updateCharacteristic(hap.Characteristic.SerialNumber, this.accessory.context.dataCache[propNormalized]);
          break;
        case OptionalKeys.FirmwareVersion:
          this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.normalizeString(data[prop]);
          accessoryInfo?.updateCharacteristic(hap.Characteristic.FirmwareRevision, this.accessory.context.dataCache[propNormalized]);
          break;
        case OptionalKeys.ManufactureDate:
          this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.normalizeString(data[prop]);
          accessoryInfo?.updateCharacteristic(hap.Characteristic.HardwareRevision, this.accessory.context.dataCache[propNormalized]);
          break;
        case OptionalKeys.BatteryLevel:
          {
            this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.extractNumber(data[prop]);
            this.service.updateCharacteristic(hap.Characteristic.BatteryLevel, this.accessory.context.dataCache[propNormalized]);
            const hasLowBattery = (this.accessory.context.dataCache[propNormalized] <= (this.config.low_battery_threshold ?? 30));
            this.service.updateCharacteristic(hap.Characteristic.StatusLowBattery, hasLowBattery ?
              hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
          }
          break;
        case OptionalKeys.RemainingRuntime:
          {
            this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.extractNumber(data[prop]);
            // minutes to seconds
            const duration = 60 * this.accessory.context.dataCache[propNormalized];
            if ((this.highestTimeRemaining === undefined) || (this.highestTimeRemaining < duration)) {
              getOrAddCharacteristic(this.service, hap.Characteristic.RemainingDuration).setProps({
                minValue: 0,
                maxValue: duration,
              });
              this.highestTimeRemaining = duration;
            }
            this.service.updateCharacteristic(hap.Characteristic.RemainingDuration, duration);
          }
          break;
        case OptionalKeys.InternalTemperature:
          {
            this.accessory.context.dataCache[propNormalized] = UpsPlatformAccessory.extractNumber(data[prop]);
            this.service.updateCharacteristic(hap.Characteristic.CurrentTemperature, this.accessory.context.dataCache[propNormalized]);
          }
          break;
      }

      if (!objectsEqual(initialCache, this.accessory.context.dataCache)) {
        this.platform.log.debug(`Cache updated (${this.accessory.displayName}): ${JSON.stringify(this.accessory.context.dataCache)}`);
      }
    }
  }
}
