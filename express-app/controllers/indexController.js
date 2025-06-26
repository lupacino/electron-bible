const fs = require("fs");
const path = require("path");
const BibleVerse = require("../models/bibleVerse");

exports.getIndex = async (req, res) => {
  console.log("welcome to the index route");
  res.render("index");
};

exports.getOutLiers = async (req, res) => {
  const validPairs = new Set();
  const verses = await BibleVerse.find({}, { chapter: 1, verse: 1 });
  verses.forEach((v) => validPairs.add(`${v.chapter}:${v.verse}`));

  const outliers = [];
  for (let h = 1; h <= 12; h++) {
    for (let m = 1; m <= 59; m++) {
      if (!validPairs.has(`${h}:${m}`)) {
        outliers.push(`${h}:${m}`);
      }
    }
  }
  console.log("Outlier times:", outliers);
  res.send(outliers);
};
