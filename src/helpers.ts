import { Characteristic, Service, WithUUID } from 'homebridge';

export function errorToString(e: unknown): string {
  if (typeof e === 'string') {
    return e;
  }
  if (e instanceof Error) {
    e.message; // works, `e` narrowed to Error
  }
  return JSON.stringify(e);
}

export function getOrAddCharacteristic(service: Service, characteristic: WithUUID<{ new(): Characteristic }>): Characteristic {
  return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
}

export function objectsEqual(a: object, b: object): boolean {
  if (a === b) {
    return true;
  }
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false;
  }

  for (const i in a) {
    if (i in b) {
      if (a[i] !== b[i]) {
        return false;
      }
    } else {
      return false;
    }
  }

  return false;
}