import assert from 'node:assert/strict'
import { EventEmitter, once } from 'node:events'
import test from 'node:test'

import { AutoUpdater } from '../dist/auto-updater.js'
import { GeoIpDbName } from '../dist/primitives.js'
import { wrapReader } from '../dist/reader-wrapper.js'

test('scheduled update-check failures are emitted instead of becoming unhandled rejections', async t => {
	const expected = new Error('GitHub is unavailable')
	const originalCheck = AutoUpdater.prototype.checkForUpdates
	AutoUpdater.prototype.checkForUpdates = async () => {
		throw expected
	}
	t.after(() => {
		AutoUpdater.prototype.checkForUpdates = originalCheck
	})

	const autoUpdater = new AutoUpdater([GeoIpDbName.Country])
	t.after(() => autoUpdater.close())

	const [error] = await once(autoUpdater, 'check-error')
	assert.equal(error, expected)
})

test('the wrapped reader rejects when its initial update check fails', async () => {
	class FakeAutoUpdater extends EventEmitter {
		closed = false

		close() {
			this.closed = true
			this.removeAllListeners()
		}
	}

	const autoUpdater = new FakeAutoUpdater()
	const expected = new Error('GitHub returned 429')
	const reader = wrapReader(
		GeoIpDbName.Country,
		() => ({ close() {} }),
		autoUpdater
	)

	autoUpdater.emit('check-error', expected)

	await assert.rejects(reader, expected)
	assert.equal(autoUpdater.closed, true)
})
