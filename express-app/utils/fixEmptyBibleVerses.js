const axios = require("axios");
const BibleVerse = require("../models/bibleVerse");

const BASE_URL = "https://bible.helloao.org/api";
let translation = "ENG_LSV";

async function fixEmptyBibleVerses() {
  const emptyVerses = await BibleVerse.find({
    text: "",
    translation: translation,
  });
  console.log(`🔍 Found ${emptyVerses.length} verses with empty text.`);
  translation = translation.toLowerCase();
  const bookData = await axios.get(`${BASE_URL}/${translation}/books.json`);
  const books = bookData.data.books;
  console.log(`📚 Found ${books}".`);
  const stillEmpty = [];

  for (const verse of emptyVerses) {
    const { book: bookName, chapter, verse: verseNum } = verse;

    const bookMatch = books.find((b) => b.name === bookName);
    if (!bookMatch) {
      console.warn(`⚠️ Book not found: ${bookName}`);
      stillEmpty.push({
        book: bookName,
        chapter,
        verse: verseNum,
        reason: "Book not found",
      });
      continue;
    }

    const chapterUrl = `${BASE_URL}/${translation}/${bookMatch.id}/${chapter}.json`;

    try {
      const res = await axios.get(chapterUrl);
      const verses = res.data.chapter.content;
      const verseEntries = verses.filter((v) => v.type === "verse");
      const matchingVerse = verseEntries.find((v) => v.number === verseNum);

      if (!matchingVerse) {
        console.warn(
          `❌ Verse not found in API: ${bookName} ${chapter}:${verseNum}`
        );
        stillEmpty.push({
          book: bookName,
          chapter,
          verse: verseNum,
          reason: "Verse not in API",
        });
        continue;
      }

      // Extract both string and object `.text` values
      const verseText = matchingVerse.content
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item.text) return item.text;
          return ""; // fallback for unrecognized structure
        })
        .join(" ")
        .trim();

      if (verseText) {
        verse.text = verseText;
        await verse.save();
        console.log(`✅ Fixed: ${bookName} ${chapter}:${verseNum}`);
      } else {
        console.log(
          `⚠️ Still empty after API fetch: ${bookName} ${chapter}:${verseNum}`
        );
        stillEmpty.push({
          book: bookName,
          chapter,
          verse: verseNum,
          reason: "API content empty or unparseable",
        });
      }
    } catch (err) {
      console.error(
        `❌ Error fetching ${bookName} ${chapter}:${verseNum}:`,
        err.message
      );
      stillEmpty.push({
        book: bookName,
        chapter,
        verse: verseNum,
        reason: err.message,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 25)); // throttle
  }

  // Log summary
  if (stillEmpty.length) {
    console.log(`\n🛑 ${stillEmpty.length} verses still empty:`);
    stillEmpty.forEach((v) => {
      console.log(`- ${v.book} ${v.chapter}:${v.verse} (${v.reason})`);
    });
  } else {
    console.log("🎉 All empty verses fixed successfully!");
  }
}

module.exports = fixEmptyBibleVerses;
