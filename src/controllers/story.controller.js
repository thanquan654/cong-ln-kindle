import Story from '../models/Story.js'
import {
	scrapeStoryDetails,
	scrapeChapterList,
	scrapeChapterContent,
} from '../services/scraper.service.js'

export async function getAllStory(req, res) {
	const stories = await Story.find().sort({ favorite: -1 }).lean()

	res.render('home', { webTitle: 'Cổng LN - Kindle Version', stories })
}

export async function addStory(req, res) {
	const { storyLink } = req.body

	const storyInfo = await scrapeStoryDetails(storyLink)

	const savedStory = await Story.create(storyInfo)

	res.status(200).redirect('/').json(savedStory)
}

export async function deleteStory(req, res) {
	const { storyId } = req.params

	await Story.findByIdAndDelete(storyId)
	res.redirect('/story')
}

export async function updateStoryChapter(req, res) {
	const { storyId } = req.params

	const story = await Story.findById(storyId)

	const volumes = await scrapeChapterList(story.storyUrl)

	await Story.updateOne(
		{ _id: storyId },
		{ volumes: volumes, numberOfVolumes: volumes.length },
	)

	res.redirect('/story')
}

export async function favoriteStory(req, res) {
	const { storyId } = req.params

	const story = await Story.findById(storyId)

	await Story.updateOne({ _id: storyId }, { favorite: !story.favorite })

	res.redirect('/story')
}

export async function getStoryChapterList(req, res) {
	const { storyId } = req.params
	const { vol } = req.query

	const indexVol = vol ? vol - 1 : 0

	const story = await Story.findById(storyId).lean()

	let volumes = []

	if (story.volumes.length === 0) {
		volumes = await scrapeChapterList(story.storyUrl)

		await Story.updateOne(
			{ _id: storyId },
			{ volumes: volumes, numberOfVolumes: volumes.length },
		)
	}

	const volumeChapters = volumes.length
		? volumes[indexVol]
		: story.volumes[indexVol]

	res.render('story', {
		webTitle: story.title,
		story: story,
		currentVolume: vol ? vol : 1,
		volume: volumeChapters,
	})
}

export async function getStoryDetails(req, res) {
	const storyId = req.query.storyId
	const chapterUrl = req.query.url

	if (!chapterUrl) {
		return res.status(400).json({ error: 'Missing required parameters' })
	}

	try {
		const {
			volumeTitle,
			chapterTitle,
			contentHtml,
			prevChapterUrl,
			nextChapterUrl,
		} = await scrapeChapterContent(chapterUrl)

		await Story.findByIdAndUpdate(storyId, {
			lastReadChapter: {
				url: chapterUrl,
				chapterTitle: chapterTitle,
				volumeTitle: volumeTitle,
				updatedAt: Date.now(),
			},
		})

		res.render('chapter', {
			webTitle: chapterTitle,
			storyId,
			volumeTitle,
			chapterTitle,
			contentHtml,
			prevChapterUrl,
			nextChapterUrl,
			layout: 'main',
		})
	} catch (error) {
		console.error('Lỗi khi cào dữ liệu chương:', error.message)
		res.status(500).send(
			'Không thể tải nội dung chương. Vui lòng thử lại sau.',
		)
	}
}

export async function updateAllStory(req, res) {
	const stories = await Story.find().lean()

	for (const story of stories) {
		const volumes = await scrapeChapterList(story.storyUrl)

		await Story.updateOne(
			{ _id: story._id },
			{ volumes: volumes, numberOfVolumes: volumes.length },
		)
	}

	res.status(200).json({ message: 'Updated all stories' })
}
