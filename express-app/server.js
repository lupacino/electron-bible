require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const mongoose = require("mongoose");
const expressSanitizer = require("express-sanitizer");
const path = require("path");
const bibleRoutes = require("./routes/bibleRoutes");
const indexRoutes = require("./routes/indexRoutes");
// const annotateRoutes = require("./routes/annotateRoutes");
const session = require("express-session");
const flash = require("connect-flash");
// const fetchAndStoreBible = require("./utils/bibleImport");
const bibleVerse = require("./models/bibleVerse");
const fixEmptyBibleVerses = require("./utils/fixEmptyBibleVerses");

const app = express();

// Set EJS as the templating engine and define the views folder
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  // path.join(__dirname, "views/bible"),
  // path.join(__dirname, "views/annotate"),
]);

// Set up session middleware (needed for flash messages)
app.use(
  session({
    secret: "your_secret_key", // Change this to a strong random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Set up flash messages middleware
app.use(flash());

// Middleware to make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});

// Middleware: Body Parser (IMPORTANT: Move these to the top before static)
app.use(express.urlencoded({ extended: true })); // For form data
app.use(express.json()); // For JSON requests
app.use(expressSanitizer());

// Debug middleware to log the request method and URL
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Serve static assets from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

mongoose.Promise = global.Promise;

// Retrieve the connection string from the environment
const mongoURI = process.env.mongoURI;
if (!mongoURI) {
  console.error("mongoURI is not defined in your .env file");
  process.exit(1);
}
// Connect to MongoDB
mongoose
  .connect(mongoURI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mount Bible-related routes under /bible
app.use("/", indexRoutes);
app.use("/bible", bibleRoutes);
// app.use("/annotate", annotateRoutes);

// 🟢 Call your import function
// fetchAndStoreBible();
// fixEmptyBibleVerses();

// const translation = "BSB";
// const book = "GEN";
// const chapter = 1;

// fetch(`https://bible.helloao.org/api/${translation}/${book}/${chapter}.json`)
//   .then((res) => res.json())
//   .then((data) => {
//     const verses = data.chapter?.content;

//     if (!Array.isArray(verses)) {
//       console.warn("No verses found in chapter.");
//       return;
//     }

//     verses.forEach((verse) => {
//       if (verse.type === "verse") {
//         const verseText = verse.content
//           .map((item) => {
//             if (typeof item === "string") return item;
//             if (typeof item === "object" && item.text) return item.text;
//             return "";
//           })
//           .join(" ")
//           .trim();

//         if (verseText) {
//           console.log(`Verse ${verse.number}: ${verseText}`);
//           // optionally: save this to the DB here
//         } else {
//           console.warn(`Verse ${verse.number} is empty or invalid.`);
//           // optionally: log or handle missing verse here
//         }
//       }
//     });
//   })
//   .catch((err) => {
//     console.error("Error fetching chapter:", err.message);
//   });

// get available translations of the bible:
fetch("https://bible.helloao.org/api/available_translations.json")
  .then((res) => res.json())
  .then((availableTranslations) => {
    console.log(
      "Top-level keys in response:",
      Object.keys(availableTranslations)
    );

    // Let's say the translations are under availableTranslations.translations (adjust if needed)
    const translationsArray =
      availableTranslations.translations || availableTranslations.data || [];

    if (Array.isArray(translationsArray)) {
      const englishTranslations = translationsArray.filter(
        (t) =>
          t.languageEnglishName &&
          t.languageEnglishName.toLowerCase() === "english"
      );

      console.log("English translations available from the API:");
      englishTranslations.forEach((t) => {
        console.log(`${t.shortName} - ${t.name} (${t.id})`);
      });
    } else {
      console.error(
        "Translations are not in array format:",
        typeof translationsArray
      );
    }
  })
  .catch((err) => console.error("Failed to fetch translations:", err));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
