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
	// Get the slug as query param.
	const parsed = url.parse(req.url, true)
	const {slug} = parsed.query

	if (!slug) {
		return {
			description: 'Find broken YouTube videos in a Radio4000 channel',
			usage: 'To use,  /?slug=my-radio. For example: /?slug=good-time-radio'
		}
	}

	// Fetch channel and its tracks from the slug.
	const channel = await findChannelBySlug(slug)
	const tracks = await findTracksByChannel(channel.id)

	// Find broken YouTube videos.
	const results = await Promise.all(tracks.map(testTrack))
	const broken = results.filter(item => !item.available)

	// Human readable status.
	const percentage = Math.round((broken.length / tracks.length) * 100)
	const status = `Analyzed ${tracks.length} tracks. ${broken.length} (${percentage}%) are broken.`

	// Create the data we want to return for each broken track.
	const brokenFormatted = broken.map(item => {
		item.id = item.track.id
		// item.trackModel = `https://radio4000.firebaseio.com/tracks/${id}`
		item.title = item.track.title
		item.editLink = `https://radio4000.com/${slug}/tracks?editTrack=${item.id}`
		delete item.track
		delete item.available
		return item
	})

	return {
		slug,
		status,
		broken: brokenFormatted
	}
}
