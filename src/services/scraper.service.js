import axios from 'axios'
import * as cheerio from 'cheerio'

const BASE_URL = 'https://docln.sbs'

export async function scrapeStoryDetails(storyUrl) {
	const { data } = await axios.get(storyUrl)
	const $ = cheerio.load(data)

	const title = $('span.series-name a').text().trim()
	const coverImageUrl = $('meta[property="og:image"]').attr('content')
	const summary = $('.summary-content p').text().trim()
	const author = $(
		'.series-information div.info-item:nth-child(2) > span:nth-child(2) > a',
	)
		.text()
		.trim()
	const artist = $(
		'.series-information div.info-item:nth-child(3) > span:nth-child(2) > a',
	)
		.text()
		.trim()

	return { storyUrl, title, coverImageUrl, summary, author, artist }
}

export async function scrapeChapterList(storyUrl) {
	const volumes = []

	const { data } = await axios.get(storyUrl)
	const $ = cheerio.load(data)

	$('section.volume-list').each((index, element) => {
		const volumeElement = $(element)

		// Lấy tên volume
		const volumeTitle = volumeElement.find('.sect-title').text().trim()

		// Lấy danh sách chương trong volume này
		const chapters = []
		volumeElement
			.find('ul.list-chapters li')
			.each((chapIndex, chapElement) => {
				const chapterLinkElement =
					$(chapElement).find('.chapter-name a')

				const chapterTitle = chapterLinkElement.text().trim()
				const chapterUrl = BASE_URL + chapterLinkElement.attr('href')

				chapters.push({
					title: chapterTitle,
					url: chapterUrl,
				})
			})

		// Thêm volume đã xử lý vào mảng
		volumes.push({
			order: index + 1,
			title: volumeTitle,
			chapters: chapters,
		})
	})
	return volumes // Trả về mảng volumes
}

export async function scrapeChapterContent(chapterUrl) {
	const fullUrl = chapterUrl.startsWith(BASE_URL)
		? chapterUrl
		: BASE_URL + chapterUrl

	// 1. Dùng axios để tải HTML
	const html = await axios.get(fullUrl)

	// 2. Dùng cheerio để phân tích HTML
	const $ = cheerio.load(html.data)

	// Xóa banner quảng cáo
	$('a[target="__blank"] > img[src*="/series/chapter-banners/"]')
		.parent()
		.remove()

	// 3. Bóc tách dữ liệu cần thiết
	const volumeTitle = $('.title-top h2.title-item').text().trim()
	const chapterTitle = $('.title-top h4.title-item').text().trim()
	const storyUrl = $('a.rd_sd-button_item:nth-child(2)').attr('href')

	// Lấy toàn bộ nội dung HTML bên trong div#chapter-content
	const contentHtml = $('#chapter-content')

	// Thay đổi link ảnh từ proxy cho link trên server
	// 1. Chọn tất cả thẻ <img> bên trong div nội dung
	contentHtml.find('img').each(function () {
		const oldSrc = $(this).attr('src')

		if (oldSrc) {
			// 2. Tạo src mới trỏ về proxy của bạn
			const newSrc = `/proxy-image?url=${encodeURIComponent(oldSrc)}`

			// 3. Cập nhật thuộc tính src
			$(this).attr('src', newSrc)
		}
	})

	const modifiedContentHtml = contentHtml.html()

	// Lấy link chương trước và sau
	const prevChapterUrl = $('section.rd-basic_icon a:first-child').attr('href')
	const nextChapterUrl = $('section.rd-basic_icon a:last-child').attr('href')

	return {
		volumeTitle,
		chapterTitle,
		contentHtml: modifiedContentHtml,
		prevChapterUrl: prevChapterUrl === storyUrl ? null : prevChapterUrl,
		nextChapterUrl: nextChapterUrl === storyUrl ? null : nextChapterUrl,
	}
}
