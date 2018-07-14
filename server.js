const url = require('url')
const got = require('got')
const {findChannelBySlug, findTracksByChannel} = require('radio4000-sdk')

const testTrack = async function (track) {
	const url = `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${track.ytid}`
	try {
		const response = await got(url, {json: true})
		return {available: true, status: response.body, track}
	} catch (err) {
		return {available: false, status: err.response.body, track}
	}
}

module.exports = async req => {
	// Find tracks from a channel slug.
	const parsed = url.parse(req.url, true)
	const {slug} = parsed.query
	if (!slug) {
		return {help: '?slug=my-radio'}
	}
	const channel = await findChannelBySlug(slug)
	const tracks = await findTracksByChannel(channel.id)

	// Find broken YouTube videos.
	const results = await Promise.all(tracks.map(testTrack))
	const broken = results.filter(item => !item.available)

	// Human readable status.
	const percentage = Math.round((broken.length / tracks.length) * 100)
	const status = `Analyzed ${tracks.length} tracks. ${
		broken.length
	} (${percentage}%) are broken.`

	return {slug, status, broken}
}

