import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import stream from 'node:stream'
import crypto from 'node:crypto'

import rimraf from 'rimraf'
import tar from 'tar'

import { buildObjectFromEntries } from './ts-helpers.js'
import { GeoIpDbName, Path, Checksum } from './primitives.js'

const REDIST_MIRROR_URL = 'https://raw.githubusercontent.com/GitSquared/node-geolite2-redist/master/redist/'

const pRimraf = promisify(rimraf)

interface MirrorUrls {
	checksum: Record<GeoIpDbName, string>;
	download: Record<GeoIpDbName, string>;
}

const mirrorUrls: MirrorUrls = {
	checksum: buildObjectFromEntries(
		Object.values(GeoIpDbName).map((dbName): [GeoIpDbName, string] =>
			[dbName, `${REDIST_MIRROR_URL}${dbName}.mmdb.sha384`]
		)
	),
	download: buildObjectFromEntries(
		Object.values(GeoIpDbName).map((dbName): [GeoIpDbName, string] =>
			[dbName, `${REDIST_MIRROR_URL}${dbName}.tar.gz`]
		)
	)
}

const defaultTargetDownloadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dbs')

export async function cleanupHotDownloadDir(dirPath?: Path): Promise<void> {
	return pRimraf(dirPath ?? defaultTargetDownloadDir+'.geodownload', { disableGlob: true })
}

export async function fetchChecksums(dbList: undefined): Promise<Record<GeoIpDbName, Checksum>>
export async function fetchChecksums<T extends GeoIpDbName>(dbList?: readonly T[]): Promise<Record<T, Checksum>>
export async function fetchChecksums<T extends GeoIpDbName>(dbList?: readonly T[]): Promise<Record<T, Checksum> | Record<GeoIpDbName, Checksum>> {
	const dbListToFetch = dbList ?? Object.values(GeoIpDbName)

	const checksums = await Promise.all(
		dbListToFetch.map(async (dbName): Promise<[T | GeoIpDbName, string]> => [
			dbName,
			await import('got')
				.then(({ got }) => got(mirrorUrls.checksum[dbName]).text())
				.then(checksum => checksum.trim())
		])
	)

	return buildObjectFromEntries(checksums)
}

export async function computeLocalChecksums(dbList: undefined, customStorageDir?: Path): Promise<Record<GeoIpDbName, Checksum>>
export async function computeLocalChecksums<T extends GeoIpDbName>(dbList?: readonly T[], customStorageDir?: Path): Promise<Record<T, Checksum>>
export async function computeLocalChecksums<T extends GeoIpDbName>(dbList?: readonly T[], customStorageDir?: Path): Promise<Record<T, Checksum> | Record<GeoIpDbName, Checksum>> {
	const dbListToCheck = dbList ?? Object.values(GeoIpDbName)
	const storageDir = customStorageDir ?? defaultTargetDownloadDir

	const checksums = await Promise.all(
		dbListToCheck.map(async (dbName): Promise<[T | GeoIpDbName, string]> => [
			dbName,
			await promisify(fs.readFile)(path.join(storageDir, `${dbName}.mmdb`)).then(buffer =>
				crypto.createHash('sha384').update(buffer).digest('hex'))
		])
	)

	return buildObjectFromEntries(checksums)
}

export async function verifyChecksums(dbList: undefined, customStorageDir?: Path): Promise<Record<GeoIpDbName, Path>>
export async function verifyChecksums<T extends GeoIpDbName>(dbList?: readonly T[], customStorageDir?: Path): Promise<Record<T, Path>>
export async function verifyChecksums<T extends GeoIpDbName>(dbList?: readonly T[], customStorageDir?: Path): Promise<Record<T, Path> | Record<GeoIpDbName, Path>> {
	const [remote, local] = await Promise.all([
		fetchChecksums(dbList),
		computeLocalChecksums(dbList, customStorageDir)
	])

	for (const db in local) {
		if (remote[db] !== local[db]) {
			throw new Error(`Checksum mismatch for ${db}`)
		}
	}

	const dbListToMap = dbList ?? Object.values(GeoIpDbName)

	return buildObjectFromEntries(
		dbListToMap.map((dbName): [T | GeoIpDbName, Path] => [
			dbName,
			path.join(customStorageDir ?? defaultTargetDownloadDir, `${dbName}.mmdb`)
		])
	)
}

export async function downloadDatabases(dbList: undefined, customStorageDir?: Path): Promise<Record<GeoIpDbName, Path>>
export async function downloadDatabases<T extends GeoIpDbName>(dbList?: readonly T[], customStorageDir?: Path): Promise<Record<T, Path>>
export async function downloadDatabases<T extends GeoIpDbName>(dbList?: readonly T[], customStorageDir?: Path): Promise<Record<T, Path> | Record<GeoIpDbName, Path>> {
	const dbListToFetch = dbList ?? Object.values(GeoIpDbName)
	const targetDownloadDir = customStorageDir ?? defaultTargetDownloadDir

	const hotDownloadDir = targetDownloadDir + '.geodownload'

	await cleanupHotDownloadDir(hotDownloadDir)
	try {
		fs.mkdirSync(targetDownloadDir)
	} catch (e: any) {
		if (e.code !== 'EEXIST') throw e
	}

	try {
		fs.mkdirSync(hotDownloadDir)
	} catch (e: any) {
		if (e.code !== 'EEXIST') throw e
	}

	const pipeline = promisify(stream.pipeline)

	const downloadedPaths = await Promise.all(
		dbListToFetch.map(async (dbName): Promise<[T | GeoIpDbName, string]> => [
			dbName,
			await (async (): Promise<Path> => {
				const hotDownloadPath: Path = path.join(hotDownloadDir, `${dbName}.mmdb`)
				const coldCachePath: Path = path.join(targetDownloadDir, `${dbName}.mmdb`)

				const { got } = await import('got')

				await pipeline(
					got.stream(mirrorUrls.download[dbName]),
					tar.x({
						cwd: hotDownloadDir,
						filter: (entryPath: Path): boolean => path.basename(entryPath) === `${dbName}.mmdb`,
						strip: 1
					})
				)

				fs.renameSync(hotDownloadPath, coldCachePath)

				return coldCachePath
			})()
		])
	)

	await cleanupHotDownloadDir(hotDownloadDir)

	return buildObjectFromEntries(downloadedPaths)
}
