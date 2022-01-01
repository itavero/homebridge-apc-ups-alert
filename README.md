
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# homebridge-apc-ups-alert

<!-- [![NPM Latest version](https://flat.badgen.net/npm/v/homebridge-apc-ups-alert/latest?icon=npm&label=%40latest&color=blue)](https://www.npmjs.com/package/homebridge-apc-ups-alert/v/latest) -->
<!-- [![NPM Downloads](https://flat.badgen.net/npm/dt/homebridge-apc-ups-alert/?icon=npm&color=blue)](https://www.npmjs.com/package/homebridge-apc-ups-alert) -->
[![GitHub Checks status](https://flat.badgen.net/github/checks/itavero/homebridge-apc-ups-alert?icon=github)](https://github.com/itavero/homebridge-apc-ups-alert)

Provide information (and alerts) for apcupsd connected Uninterruptible Power Supplies.

This plugin periodically checks the configured APCUPSD Network Information Server(s) using [apcaccess](https://github.com/mapero/apcaccess#readme).

## Prerequisites

As mentioned in the documentation of `apcaccess`, you must have an APC UPS Daemon running on a local or remote machine and it has to be
configured as network information server (NIS). For more information visit the apcupsd website.

* [APC UPS Daemon](http://www.apcupsd.org/) - The APC UPS Daemon
* [APCUPSD User Manual](https://maven.apache.org/) - The User Manual for the APC UPS Daemon containing installation instructions
* [APCUPSD NIS Example Configuration](http://www.apcupsd.org/manual/manual.html#nis-server-client-configuration-using-the-net-driver) - Howto configure the APCUPSD as NIS

## Contribute
This project is open to contributions. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.
