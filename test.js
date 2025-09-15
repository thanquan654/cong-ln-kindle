import {
	scrapeStoryDetails,
	scrapeChapterList,
	scrapeChapterContent,
} from './src/services/scraper.service.js'
async function main() {
	// const data = await scrapeStoryDetails(
	// 	'https://docln.sbs/ai-dich/23025-ban-hang-rong-o-di-gioi-toi-co-the-ve-nha-bat-cu-khi-nao-minh-muon',
	// )
	// console.log(data)

	const volume = await scrapeChapterList(
		'https://docln.sbs/ai-dich/23025-ban-hang-rong-o-di-gioi-toi-co-the-ve-nha-bat-cu-khi-nao-minh-muon',
	)
	console.log(volume[0].chapters[0])

	// const data = await scrapeChapterContent(
	// 	'https://docln.sbs/ai-dich/23025-ban-hang-rong-o-di-gioi-toi-co-the-ve-nha-bat-cu-khi-nao-minh-muon/c226018-minh-hoa',
	// )
	// console.log(data)
}

main()
