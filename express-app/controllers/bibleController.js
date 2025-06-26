const fs = require("fs");
const path = require("path");
const BibleVerse = require("../models/bibleVerse");
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

const newTestamentBooks = [
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

const API_BASE_URL = "https://bible.helloao.org/api";

exports.compareTranslations = async (req, res) => {
  try {
    const { translation1 = "BSB", translation2 = "BSB" } = req.query;

    // Fetch all books for both translations
    const [books1Response, books2Response] = await Promise.all([
      fetch(`${API_BASE_URL}/${translation1}/books`),
      fetch(`${API_BASE_URL}/${translation2}/books`),
    ]);

    // Check for HTTP errors
    if (!books1Response.ok || !books2Response.ok) {
      throw new Error("Failed to fetch books");
    }

    const books1 = await books1Response.json();
    const books2 = await books2Response.json();

    const verses1 = new Set();
    const verses2 = new Set();

    // Fetch verses for each book in translation1
    for (const book of books1.books) {
      const chaptersResponse = await fetch(
        `${API_BASE_URL}/${translation1}/books/${book.id}/chapters`
      );
      if (!chaptersResponse.ok) {
        throw new Error(`Failed to fetch chapters for ${book.name}`);
      }
      const chapters = await chaptersResponse.json();

      for (const chapter of chapters.chapters) {
        const versesResponse = await fetch(
          `${API_BASE_URL}/${translation1}/books/${book.id}/chapters/${chapter.id}/verses`
        );
        if (!versesResponse.ok) {
          throw new Error(
            `Failed to fetch verses for ${book.name} ${chapter.id}`
          );
        }
        const verses = await versesResponse.json();
        verses.verses.forEach((verse) => {
          verses1.add(`${book.name}-${chapter.number}-${verse.number}`);
        });
      }
    }

    // Fetch verses for each book in translation2
    for (const book of books2.books) {
      const chaptersResponse = await fetch(
        `${API_BASE_URL}/${translation2}/books/${book.id}/chapters`
      );
      if (!chaptersResponse.ok) {
        throw new Error(`Failed to fetch chapters for ${book.name}`);
      }
      const chapters = await chaptersResponse.json();

      for (const chapter of chapters.chapters) {
        const versesResponse = await fetch(
          `${API_BASE_URL}/${translation2}/books/${book.id}/chapters/${chapter.id}/verses`
        );
        if (!versesResponse.ok) {
          throw new Error(
            `Failed to fetch verses for ${book.name} ${chapter.id}`
          );
        }
        const verses = await versesResponse.json();
        verses.verses.forEach((verse) => {
          verses2.add(`${book.name}-${chapter.number}-${verse.number}`);
        });
      }
    }

    const missingInFirst = [...verses2].filter((key) => !verses1.has(key));
    const missingInSecond = [...verses1].filter((key) => !verses2.has(key));

    res.status(200).json({
      missingInFirst,
      missingInSecond,
    });
  } catch (error) {
    console.error("Error comparing translations:", error);
    res.status(500).json({ error: "Error comparing translations." });
  }
};

exports.getRandomVerse = async (req, res) => {
  try {
    const { chapter, verse, translation } = req.query;

    if (!chapter || !verse) {
      return res
        .status(400)
        .json({ error: "Chapter and verse parameters are required" });
    }

    // validate chapter and verse as numbers
    const chapterNum = parseInt(chapter, 10);
    const verseNum = parseInt(verse, 10);
    if (isNaN(chapterNum) || isNaN(verseNum)) {
      return res.status(400).json({
        error: "Chapter and verse must be valid numbers",
      });
    }
    // we need to fetch a random verse from the bible.
    // first find all books in the translation
    // find BibleVerse documents that match based on translation so a mongoose query to get all books in that translation.
    const books = await BibleVerse.find({ translation }).distinct("book");
    // we need to validate that the chapter and verse exist in each book in that translation getting us a list of valid verses.
    const validVerses = await BibleVerse.find({
      book: { $in: books },
      chapter: chapterNum,
      verse: verseNum,
      translation,
    });
    // randomly select verse from validVerses
    if (validVerses.length === 0) {
      return res
        .status(404)
        .json({ error: "No verses found for the given chapter and verse" });
    }
    // Randomly select a verse from the valid verses
    const randomIndex = Math.floor(Math.random() * validVerses.length);
    const randomVerse = validVerses[randomIndex];
    console.log(randomVerse);
    let verseData = {
      book: randomVerse.book,
      chapter: randomVerse.chapter,
      verse: randomVerse.verse,
      text: randomVerse.text,
      translation: randomVerse.translation,
    };

    res.status(200).json(verseData);
  } catch (error) {
    console.error("Error fetching random verse:", error);
    res.status(500).json({ error: "Server error" });
  }
};
