export enum GeoIpDbName { // Supported MaxMind databases
	ASN = 'GeoLite2-ASN',
	Country = 'GeoLite2-Country',
	City = 'GeoLite2-City'
}

export type Checksum = string; // sha384
export type Path = string; // absolute local filesystem path
