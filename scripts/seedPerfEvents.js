import mongoose from 'mongoose';
import Account from '../src/models/account.js';
import Event from '../src/models/event.js';

/**
 * Retrieves the value of a command-line argument.
 * @param {string} flag - The command-line flag (e.g., '--count').
 * @returns {string|undefined} The value of the argument, or undefined if not found.
 */
function getArgValue(flag) {
	const idx = process.argv.indexOf(flag);
	if (idx === -1) return undefined;
	return process.argv[idx + 1];
}

/**
 * Checks if a command-line flag is present.
 * @param {string} flag - The flag to check for.
 * @returns {boolean} True if the flag is present, false otherwise.
 */
function hasFlag(flag) {
	return process.argv.includes(flag);
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes a string to be used in an email address.
 * @param {string} str - The string to sanitize.
 * @returns {string} The sanitized string.
 */
function sanitizeForEmail(str) {
	return String(str).toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

/**
 * Main function to seed the database with performance test data.
 * It can either clean up existing data or create new events and a creator account.
 * @async
 */
async function main() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		console.error('Missing MONGO_URI');
		process.exit(1);
	}

	const cleanup = hasFlag('--cleanup');
	const count = Number(getArgValue('--count') || 100);
	const rawPrefix = getArgValue('--prefix') || process.env.PERF_SEED_PREFIX || 'ci-perf-seed';
	const titlePrefix = rawPrefix;
	const emailPrefix = sanitizeForEmail(rawPrefix);
	const seedEmail = `${emailPrefix}@example.com`;
	const seedUsername = `seed-${emailPrefix}`.slice(0, 60);

	await mongoose.connect(mongoUri);

	try {
		if (cleanup) {
			// If the --cleanup flag is present, delete events and accounts with the specified prefix.
			const titleRegex = new RegExp(`^${escapeRegExp(titlePrefix)}`);
			const deleteEventsRes = await Event.deleteMany({ title: titleRegex });
			const deleteAccountRes = await Account.deleteMany({ email: seedEmail });

			console.log(
				JSON.stringify(
					{
						action: 'cleanup',
						prefix: rawPrefix,
						eventsDeleted: deleteEventsRes.deletedCount || 0,
						accountsDeleted: deleteAccountRes.deletedCount || 0,
					},
					null,
					2
				)
			);
			return;
		}

		// Find or create a creator account for the new events.
		let creator = await Account.findOne({ email: seedEmail });
		if (!creator) {
			creator = await Account.create({
				email: seedEmail,
				username: seedUsername,
				password: 'ci-seed-password-not-used',
				role: 'admin',
			});
		}

		const categories = ['music', 'party', 'festival', 'live'];
		const locations = ['CI Venue A', 'CI Venue B', 'CI Venue C', 'CI Venue D'];

		// Generate a specified number of new events.
		const now = Date.now();
		const events = Array.from({ length: count }, (_, i) => {
			const dateTime = new Date(now + i * 60 * 60 * 1000);
			return {
				creatorId: creator._id,
				title: `${titlePrefix}-${i}`,
				description: 'Seeded event for CI performance tests',
				location: locations[i % locations.length],
				dateTime,
				category: [categories[i % categories.length]],
				imageUrl: 'https://example.com/seed.jpg',
			};
		});

		// Insert the new events into the database.
		await Event.insertMany(events, { ordered: false });

		console.log(
			JSON.stringify(
				{
					action: 'seed',
					prefix: rawPrefix,
					count,
					creatorEmail: seedEmail,
					creatorId: creator._id?.toString(),
				},
				null,
				2
			)
		);
	} finally {
		await mongoose.disconnect();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
