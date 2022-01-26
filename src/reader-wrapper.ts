import type { AutoUpdater } from './auto-updater.js'
import type { GeoIpDbName, Path } from './primitives.js'

export type WrappedReader<Reader extends Record<string, unknown>> = Reader & {
	close: Reader['close'] extends (...args: unknown[]) => unknown ? Reader['close'] : () => void
}

export function wrapReader<DbReaderInstance extends Record<string, unknown>>(
	dbName: GeoIpDbName,
	readerInitializer: (path: Path) => DbReaderInstance | Promise<DbReaderInstance>,
	autoUpdater: AutoUpdater
): Promise<WrappedReader<DbReaderInstance>> {
	// ugly typings, but this is quite the hack so typescript would lose it!
	let reader: any = {}

	const proxy = new Proxy({}, {
		get: (_, prop) => {
			if (prop === 'close') {
				return (...args: unknown[]) => {
					autoUpdater.close()
					;(reader.close as any)?.(...args)
				}
			}
			return reader[prop]
		},
		set: (_, prop, value) => {
			reader[prop] = value
			return true
		}
	})

	return new Promise(resolve => {
		autoUpdater.once('check-ok', async (paths: Record<GeoIpDbName, Path>) => {
			const dbPath = paths[dbName]
			reader = await readerInitializer(dbPath)

			autoUpdater.on('updated', async (paths: Record<GeoIpDbName, Path>) => {
				const dbPath = paths[dbName]
				reader = await readerInitializer(dbPath)
			})
			
			resolve(proxy as WrappedReader<DbReaderInstance>)
		})
	})
}
