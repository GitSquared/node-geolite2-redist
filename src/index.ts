import { AutoUpdater } from './auto-updater.js'
import { downloadDatabases, verifyChecksums } from './download-helpers.js'
import { WrappedReader, wrapReader } from './reader-wrapper.js'
import { GeoIpDbName, Path } from './primitives.js'

export { GeoIpDbName, WrappedReader };

/**
	Updates the local copy of the selected GeoLite databases, downloading new files if needed, or performing checksum validation of exiting ones.

	@param options - Configuration options.

	@param options.dbList - The list of databases to download. You can find available databases in the {@linkcode GeoIpDbName} enum or use string names directly in JS. Defaults to downloading all the databases.

	@param options.path - The path to the directory where the databases will be downloaded and stored. Defaults to `./node_modules/node-geolite2-redist/dbs`.

	@returns A Promise that resolves when the databases have been successfully downloaded, and rejects otherwise.
*/
export async function downloadDbs(options?: {
	path: Path;
	dbList: GeoIpDbName[];
}): Promise<void> {
	try {
		await verifyChecksums(options?.dbList, options?.path)
	} catch (err: any) {
		if (
			!err.message.startsWith('Checksum mismatch') &&
			!(err.code === 'ENOENT')
		) throw err

		await downloadDatabases(options?.dbList, options?.path)
	}
}

/**
	Pre-fetches databases from the mirror.

	@typeParam DbReaderInstance - The type of a database reader instance. You can either supply it manually or let Typescript infer it from the `readerInitializer` param.

	@param dbName - The database to open. You can find available databases in the {@linkcode GeoIpDbName} enum or use string names directly in JS. Will be downloaded if it hasn't already been fetched (see {@linkcode downloadDbs} to pre-fetch at an earlier time).

	@param readerInitializer - A function that takes the absolute path to the downloaded `.mmmdb` database and returns a new `DbReaderInstance`. You need to supply it to this library so we can re-initialize your reader when the databases are auto-updated.

	@param downloadDirPath - The path to the directory where the database should be stored. Defaults to `./node_modules/node-geolite2-redist/dbs`. See {@linkcode downloadDbs} for more information.

	@returns A Promise that resolves with your reader instance when the databases have been successfully downloaded and your reader initialized. Calling `.close()` on the reader will gracefully stop the background databases auto-updater, and run the reader's actual `close()` method if there is one, supporting arguments passthrough.
*/
export async function open<DbReaderInstance extends {}>(
	dbName: GeoIpDbName,
	readerInitializer: (path: Path) => DbReaderInstance | Promise<DbReaderInstance>,
	downloadDirPath?: Path
): Promise<WrappedReader<DbReaderInstance>> {
	const autoUpdater = new AutoUpdater([dbName], downloadDirPath)

	const wrappedReader = await wrapReader(dbName, readerInitializer, autoUpdater)

	return wrappedReader
}
