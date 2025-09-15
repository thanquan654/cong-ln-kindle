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
		lastReadChapter: {
			url: { type: String },
			chapterTitle: { type: String },
			volumeTitle: { type: String },
			updatedAt: { type: Date, default: Date.now },
		},
	},
	{ timestamps: true },
)

export default mongoose.model('Story', storySchema)
