import express from 'express'
import { engine } from 'express-handlebars'
import axios from 'axios'
import * as cheerio from 'cheerio'
import dotenv from 'dotenv'
import sharp from 'sharp'
import connectDB from './configs/db.js'
import Story from './models/Story.js'

dotenv.config()
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.engine(
	'handlebars',
	engine({
		runtimeOptions: {
			allowProtoPropertiesByDefault: true,
			allowProtoMethodsByDefault: true,
		},
	}),
)
app.set('view engine', 'handlebars')
app.set('views', './src/views')

connectDB()

// Constants
const PORT = process.env.PORT || 3000
const BASE_URL = 'https://docln.sbs'

// Routes
app.get('/', async (req, res) => {
	const stories = await Story.find()

	res.render('home', { stories })
})

app.post('/add-story', async (req, res) => {
	const { storyLink } = req.body

	const html = await axios.get(storyLink)

	const $ = cheerio.load(html.data)

	const storyTitle = $('span.series-name a').text().trim()

	const storyUrl = storyLink
	const storyAuthor = $(
		'div.info-item:nth-child(2) > span:nth-child(2) > a:nth-child(1)',
	)
		.text()
		.trim()

	const newStory = {
		title: storyTitle,
		url: storyUrl,
		author: storyAuthor,
	}

	const savedStory = await Story.create(newStory)

	res.status(200).redirect('/').json(savedStory)
})

app.get('/story', async (req, res) => {
	let url = req.query.url

	if (!url.startsWith(BASE_URL)) {
		url = BASE_URL + url
	}

	const html = await axios.get(url)

	const $ = cheerio.load(html.data)

	// Bắt đầu cào dữ liệu
	// 1. Lấy thông tin cơ bản của truyện
	const storyTitle = $('span.series-name a').text().trim()

	// 2. Lấy danh sách các volume
	const volumes = []
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
				const chapterUrl = chapterLinkElement.attr('href')
				const chapterTime = $(chapElement)
					.find('.chapter-time')
					.text()
					.trim()

				chapters.push({
					title: chapterTitle,
					url: chapterUrl,
					time: chapterTime,
				})
			})

		// Thêm volume đã xử lý vào mảng
		volumes.push({
			title: volumeTitle,
			chapters: chapters,
		})
	})

	// 3. Tổng hợp kết quả cuối cùng
	const storyData = {
		title: storyTitle,
		url: url,
		volumes: volumes,
	}

	res.render('story', storyData)
})

app.get('/read', async (req, res) => {
	// Lấy URL tương đối của chương từ query parameter
	const fullUrl = BASE_URL + req.query.url

	if (!fullUrl) {
		return res.status(400).send('Không tìm thấy URL của chương')
	}

	try {
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
		const prevChapterUrl = $('section.rd-basic_icon a:first-child').attr(
			'href',
		)
		const nextChapterUrl = $('section.rd-basic_icon a:last-child').attr(
			'href',
		)

		// 4. Render template `chapter.hbs` với dữ liệu đã cào
		res.render('chapter', {
			storyUrl,
			volumeTitle,
			chapterTitle,
			contentHtml: modifiedContentHtml,
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
})

app.get('/proxy-image', async (req, res) => {
	const imageUrl = req.query.url

	try {
		const response = await axios.get(imageUrl, {
			responseType: 'stream',
			headers: {
				Referer: BASE_URL,
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
				'Accept-Language': 'en-US,en;q=0.5',
				Connection: 'keep-alive',
				'Accept-Encoding': 'gzip, deflate, br, zstd',
			},
		})

		// Thiết lập bộ xử lý ảnh của sharp
		// - resize(): Thay đổi chiều rộng ảnh không quá 800px (quá đủ cho Kindle)
		// - jpeg(): Chuyển ảnh sang định dạng JPEG và nén chất lượng xuống 80%
		// - toFormat('jpeg'): Đảm bảo định dạng đầu ra là jpeg, thân thiện với các thiết bị cũ.
		const imageProcessor = sharp()
			.resize({ width: 800, withoutEnlargement: true }) // withoutEnlargement: không phóng to ảnh nhỏ hơn 800px
			.toFormat('jpeg', { quality: 80 })

		// Thiết lập Content-Type là image/jpeg vì chúng ta luôn chuyển đổi về định dạng này
		res.setHeader('Content-Type', 'image/jpeg')

		// Pipe stream: response.data -> sharp -> res
		// Dữ liệu từ axios sẽ chảy qua bộ xử lý của sharp, sau đó chảy về cho client.
		response.data.pipe(imageProcessor).pipe(res)

		// Bắt lỗi từ sharp nếu có
		imageProcessor.on('error', (err) => {
			console.error('Sharp processing error:', err)
			// Nếu có lỗi, không gửi response nữa vì pipe đã có thể bị hỏng
			// res.status(500).send('Error processing image')
		})
	} catch (error) {
		console.error(`Error proxying image ${imageUrl}:`, error.message)
		if (error.response) {
			res.status(error.response.status).send('Failed to load image')
		} else {
			res.status(500).send('Internal Server Error')
		}
	}
})

app.listen(3000, () => {
	console.log('Server is running on http://localhost:3000')
})
