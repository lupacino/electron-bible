const mongoose = require("mongoose");
const { Schema } = mongoose;

const bibleVerseSchema = new Schema(
  {
    book: {
      type: String,
      required: true,
      index: true,
    },
    chapter: {
      type: Number,
      required: true,
      index: true,
    },
    verse: {
      type: Number,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    translation: {
      type: String,
      default: "ASV",
    },
    // Useful for filtering by Old or New Testament
    testament: {
      type: String,
      enum: ["Old Testament", "New Testament"],
    },
    // An array to store cross references; these could be ObjectIds referencing other verses
    crossReferences: [
      {
        type: Schema.Types.ObjectId,
        ref: "BibleVerse",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// // Compound index to ensure each verse is unique
// bibleVerseSchema.index(
//   { book: 1, chapter: 1, verse: 1, translation: 1 },
//   { unique: true }
// );

bibleVerseSchema.index(
  { book: 1, chapter: 1, verse: 1, translation: 1 },
  { unique: true }
);

module.exports = mongoose.model("BibleVerse", bibleVerseSchema);
