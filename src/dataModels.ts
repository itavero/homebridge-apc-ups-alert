export enum StandardKeys {
   // Hostname of the computer running apcupsd
   HostName = 'HOSTNAME',
   // UPS name from configuration file (dumb) or EEPROM (smart)
   UpsName = 'UPSNAME',
   // UPS model derived from UPS information
   Model = 'MODEL',
   // Status (see KnownStatus)
   Status = 'STATUS',
}

export enum OptionalKeys {
   // Remaining runtime left on battery as estimated by the UPS
   RemainingRuntime = 'TIMELEFT',
   // Current battery capacity charge (percentage)
   BatteryLevel = 'BCHARGE',
   // UPS firmware version
   FirmwareVersion = 'FIRMWARE',
   // UPS serial number
   SerialNumber = 'SERIALNO',
   // UPS data of manufacture
   ManufactureDate = 'MANDATE',
   // APC model information
   ApcModel = 'APCMODEL',
   // UPS internal temperature in degrees Celcius
   InternalTemperature = 'ITEMP',
}

export enum KnownStatus {
   CommunicationLost = 'COMMLOST',
   OnLine = 'ONLINE',
   OnBattery = 'ONBATT',
}