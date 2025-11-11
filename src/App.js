import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Your local API URL
// const API_URL = "http://http://135.181.181.109/:3000";
const API_URL = "https://place-name.onrender.com";

function App() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("en");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);

  const debounceTimer = useRef(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setMetadata(null);
      return;
    }

    setLoading(true);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, language]);

  const performSearch = async () => {
    try {
      setError(null);

      const response = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(
          query
        )}&lang=${language}&size=10`
      );

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setMetadata({
          total: data.total,
          responseTime: data.responseTime,
          source: data.source,
          metadata: data.metadata, // ← NEW: Include full metadata
        });
      } else {
        setError(data.error || "Search failed");
        setResults([]);
      }
    } catch (err) {
      setError(
        "Cannot connect to API. Make sure it's running on localhost:3000"
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    console.log("Selected:", result);
    // TODO: Call selection endpoint when implemented
  };

  // ============================================
  // HELPER: Get display name for result
  // ============================================
  const getDisplayName = (result) => {
    // Google POI results
    if (result.source === "google_places") {
      return result.placenameEN || result.description;
    }

    // ES results (hotels/airports)
    return result.primaryName;
  };

  // ============================================
  // HELPER: Get result icon
  // ============================================
  const getResultIcon = (result) => {
    if (result.source === "google_places") {
      return "📍"; // POI
    }
    if (result.type === "airport") {
      return "✈️";
    }
    if (result.type === "hotel") {
      return "🏨";
    }
    return "📍";
  };

  // ============================================
  // HELPER: Check if result has coordinates
  // ============================================
  const hasCoordinates = (result) => {
    return result.lat != null && result.lng != null;
  };

  return (
    <div className="App">
      <div className="container">
        <h1>🌍 Places Autocomplete Search</h1>

        {/* Language Selector */}
        <div className="language-selector">
          <label>Language:</label>
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            🇬🇧 English
          </button>
          <button
            className={language === "ar" ? "active" : ""}
            onClick={() => setLanguage("ar")}
          >
            🇸🇦 Arabic
          </button>
          <button
            className={language === "es" ? "active" : ""}
            onClick={() => setLanguage("es")}
          >
            🇪🇸 Spanish
          </button>
        </div>

        {/* Search Input */}
        <div className="search-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === "ar"
                ? "ابحث عن مكان..."
                : language === "es"
                ? "Buscar lugar..."
                : "Search for a place..."
            }
            className="search-input"
            autoFocus
          />
          {loading && <div className="spinner">⏳</div>}
        </div>

        {/* Metadata */}
        {metadata && (
          <div className="metadata">
            <span>Found {metadata.total.toLocaleString()} results</span>
            {" • "}

            {metadata.metadata?.googleSearch?.called && <>{" • "}</>}
          </div>
        )}

        {/* Error */}
        {error && <div className="error">❌ {error}</div>}

        {/* Results */}
        <div className="results">
          {results.length === 0 && query.length >= 3 && !loading && !error && (
            <div className="no-results">No results found for "{query}"</div>
          )}

          {results.map((result, index) => (
            <div
              key={result._id || result.place_id || index}
              className={`result-item ${
                result.source === "google_places" ? "google-result" : ""
              }`}
              onClick={() => handleResultClick(result)}
            >
              <div className="result-main">
                <div className="result-primary">
                  {getResultIcon(result)} {getDisplayName(result)}
                </div>
                {result.secondaryName && (
                  <div className="result-secondary">{result.secondaryName}</div>
                )}
              </div>

              <div className="result-meta">
                {/* Source badge */}

                {/* Type badge */}
                <span className="result-type">{result.type || "poi"}</span>

                {/* IATA code if exists */}
                {result.iata && (
                  <span className="result-iata">{result.iata}</span>
                )}

                {/* Coordinates status */}

                {/* Score for ES results */}
              </div>
            </div>
          ))}
        </div>

        {/* Query Info */}
        {query.length > 0 && (
          <div className="query-info">
            Query: "{query}" • Length: {query.length} chars • Language:{" "}
            {language.toUpperCase()}
            {metadata?.metadata?.googleTrigger && (
              <>
                {" "}
                • Google Trigger:{" "}
                {metadata.metadata.googleTrigger.trigger ? "✅" : "❌"}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
