import express from 'express'
import { engine } from 'express-handlebars'
import axios from 'axios'
import * as cheerio from 'cheerio'
import dotenv from 'dotenv'
import sharp from 'sharp'
import connectDB from './configs/db.js'
import Story from './models/Story.js'
import helmet from 'helmet'

import {
	addStory,
	getAllStory,
	deleteStory,
	updateStoryChapter,
	favoriteStory,
	getStoryChapterList,
	getStoryDetails,
} from './controllers/story.controller.js'

dotenv.config()
const app = express()

app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: ["'self'"], // Chỉ cho phép tải tài nguyên từ chính domain của bạn theo mặc định
			scriptSrc: ["'self'"], // Chỉ cho phép script từ domain của bạn (quan trọng cho script Local Storage)
			styleSrc: ["'self'"], // Chỉ cho phép CSS từ domain của bạn
			imgSrc: [
				"'self'",
				'data:',
				'https://i2.hako.vip',
				'https://i.hako.vn',
			], // Cho phép ảnh từ domain của bạn, ảnh dạng data: (inline), và các domain ảnh gốc
			connectSrc: ["'self'"], // Cho phép kết nối (fetch, XHR) đến domain của bạn
			fontSrc: ["'self'"], // Cho phép font từ domain của bạn
			objectSrc: ["'none'"], // Không cho phép các plugin như <object>, <embed>
			upgradeInsecureRequests: [], // Tự động chuyển http sang https
		},
	}),
)

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
		helpers: {
			ifeq: function (a, b, opts) {
				if (a == b) {
					return opts.fn(this)
				} else {
					return opts.inverse(this)
				}
			},
			add: function (a, b) {
				return parseInt(a) + parseInt(b)
			},
			encodeURIComponent: function (str) {
				return encodeURIComponent(str)
			},
			truncate: function (str, len) {
				if (str.length > len && str.length > 0) {
					var new_str = str + ' '
					new_str = str.substr(0, len)
					new_str = str.substr(0, new_str.lastIndexOf(' '))
					new_str = new_str.length > 0 ? new_str : str.substr(0, len)
					return new_str + '...'
				}
				return str
			},
			distanceTime: function (date) {
				const differenceInMs = Date.now() - date.getTime()

				const differenceInSeconds = differenceInMs / 1000
				const differenceInMinutes = differenceInMs / (1000 * 60)
				const differenceInHours = differenceInMs / (1000 * 60 * 60)
				const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24)
				if (differenceInDays >= 1)
					return `${Math.floor(differenceInDays)} ngày trước`

				if (differenceInHours >= 1)
					return `${Math.floor(differenceInHours)} giờ trước`

				if (differenceInMinutes >= 1)
					return `${Math.floor(differenceInMinutes)} phút trước`

				return `${Math.ceil(differenceInSeconds)} giây trước`
			},
		},
	}),
)
app.set('view engine', 'handlebars')
app.set('views', './src/views')

connectDB()

// Constants
const PORT = process.env.PORT || 3000
const BASE_URL = 'https://docln.sbs'

// Route
app.get('/', (req, res) => {
	res.redirect('/story')
})
app.get('/story', getAllStory)
app.post('/add-story', addStory)
app.post('/story/:storyId', deleteStory)
app.post('/update-story/:storyId', updateStoryChapter)
app.post('/favorite-story/:storyId', favoriteStory)

app.get('/story/:storyId', getStoryChapterList)

app.get('/read', getStoryDetails)

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

app.listen(PORT, () => {
	console.log('Server is running on http://localhost:3000')
})
