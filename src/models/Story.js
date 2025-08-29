import mongoose, { Schema } from 'mongoose'

const StorySchema = new Schema({
	title: String,
	url: String,
	author: String,
})

export default mongoose.model('Story', StorySchema)
