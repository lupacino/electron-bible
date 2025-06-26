const mongoose = require("mongoose");
const axios = require("axios");
const BibleVerse = require("../models/bibleVerse"); // adjust the path as needed

// const BASE_URL = "https://bible.helloao.org/v1";

const BASE_URL = "https://bible.helloao.org/api";

const getTestament = (bookName) => {
  const oldTestamentBooks = [
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel",
    "2 Samuel",
    "1 Kings",
    "2 Kings",
    "1 Chronicles",
    "2 Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Proverbs",
    "Ecclesiastes",
    "Song of Solomon",
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
  ];

  return oldTestamentBooks.includes(bookName)
    ? "Old Testament"
    : "New Testament";
};

const translation = "eng_bbe";

async function fetchAndStoreBible() {
  const booksRes = await axios.get(`${BASE_URL}/${translation}/books.json`);
  const books = booksRes.data;
  console.log(
    `Found ${booksRes.data} books in the ${translation} translation.`
  );
  await importAllVerses(booksRes.data.books);
  async function importAllVerses(books) {
    for (const book of books) {
      const { id: bookId, name: bookName, numberOfChapters } = book;
      const testament = getTestament(bookName);

      for (let chapterNum = 1; chapterNum <= numberOfChapters; chapterNum++) {
        const url = `${BASE_URL}/${translation}/${bookId}/${chapterNum}.json`;

        try {
          const res = await axios.get(url);
          const verses = res.data.chapter.content;
          const rawContent = res.data.chapter.content;

          // Filter out only the verse entries
          const verseEntries = rawContent.filter(
            (entry) => entry.type === "verse"
          );
          const sleep = (ms) =>
            new Promise((resolve) => setTimeout(resolve, ms));
          for (const entry of verseEntries) {
            const verseNum = entry.number;

            // Flatten the `content` array and remove anything that's not a string
            const verseText = entry.content
              .filter((c) => typeof c === "string")
              .join(" ");

            const doc = {
              book: bookName,
              chapter: chapterNum,
              verse: verseNum,
              text: verseText,
              translation: translation.toUpperCase(),
              testament,
            };
            // console.log(`Processing verse: ${doc.text}`);
            await BibleVerse.findOneAndUpdate(
              {
                book: doc.book,
                chapter: doc.chapter,
                verse: doc.verse,
                translation: doc.translation,
              },
              doc,
              { upsert: true, new: true }
            );
          }

          console.log(`Saving verse:${doc.book} ${doc.chapter}:${doc.verse}`);
          await sleep(15); // slow down 50ms between writes
          //   console.log(`✅ Saved ${bookName} chapter ${chapterNum}`);
        } catch (err) {
          console.error(
            `❌ Error with ${bookName} chapter ${chapterNum}:`,
            err.message
          );
        }
      }
    }

    console.log("🎉 Finished importing all verses!");
  }
}

//export default fetchAndStoreBible;
module.exports = fetchAndStoreBible;
