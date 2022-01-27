import { EventEmitter } from 'node:events'

import { cleanupHotDownloadDir, downloadDatabases, verifyChecksums } from './download-helpers.js'
import { GeoIpDbName, Path } from './index.js'

const updateTimer = 2 * 24 * 60 * 60 * 1000 // 48 hours in ms

export class AutoUpdater extends EventEmitter {
	dbList: GeoIpDbName[] = [
		GeoIpDbName.ASN,
		GeoIpDbName.Country,
		GeoIpDbName.City
	]

	customStorageDir: string | undefined

	checkingForUpdates: boolean = false
	downloading: boolean = false

	#checker: NodeJS.Timer

	constructor(dbList?: GeoIpDbName[], customStorageDir?: Path) {
		super();

		if (dbList) this.dbList = dbList
		if (this.customStorageDir) this.customStorageDir = customStorageDir

		cleanupHotDownloadDir();

		this.#checker = setInterval(
			this.checkForUpdates.bind(this),
			updateTimer
		)

		// Schedule first update check
		setTimeout(
			this.checkForUpdates.bind(this),
			500
		)

		return this
	}

	async checkForUpdates(secondRun: boolean = false): Promise<void> {
		if (this.checkingForUpdates) return
		this.checkingForUpdates = true

		try {
			const paths = await verifyChecksums(this.dbList, this.customStorageDir)
			this.emit('check-ok', paths)
		} catch (err: any) {
			if (secondRun) throw err
			if (!err.message.startsWith('Checksum mismatch') && !(err.code === 'ENOENT')) throw err
			this.update()
		} finally {
			this.checkingForUpdates = false
		}
	}

	async update(): Promise<void> {
		if (this.downloading) return
		this.downloading = true

		try {
			const paths = await downloadDatabases(this.dbList, this.customStorageDir)
			await this.checkForUpdates(true)
			this.emit('updated', paths)
		} catch (err) {
			throw err
		} finally {
			cleanupHotDownloadDir()
			this.downloading = false
		}
	}

	close(): void {
		clearInterval(this.#checker)
		super.removeAllListeners()
	}
}
