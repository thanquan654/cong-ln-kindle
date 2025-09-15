import mongoose from 'mongoose'

const storySchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		storyUrl: { type: String, required: true, unique: true }, // URL gốc của truyện
		author: { type: String },
		artist: { type: String },
		numberOfVolumes: { type: Number },
		coverImageUrl: { type: String }, // URL ảnh bìa gốc
		summary: { type: String },
		lastScraped: { type: Date, default: Date.now }, // Lần cuối cào dữ liệu
		volumes: [
			{
				title: { type: String },
				chapters: [
					{
						title: { type: String },
						url: { type: String },
					},
				],
			},
		],
		favorite: { type: Boolean, default: false },
	},
	{ timestamps: true },
)

export default mongoose.model('Story', storySchema)
