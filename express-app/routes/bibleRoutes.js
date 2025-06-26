const express = require("express");
const router = express.Router();
const bibleController = require("../controllers/bibleController");

// Route to trigger the import of ASV verses
// router.get("/import", bibleController.importASV);

// router.get("/importKJV", bibleController.importKJV);

// New endpoint to fetch a random verse by chapter and verse
router.get("/random", bibleController.getRandomVerse);

router.get("/compare", bibleController.compareTranslations);

module.exports = router;
