"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// ============================================
// CAPA SYSTEM 17: MULTI-LANGUAGE DASHBOARD
// ============================================
// Manage translations, view regional compliance

interface Language {
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  rtl?: boolean;
}

export default function MultiLanguagePage() {
  const { data: session } = useSession();
  const [languages, setLanguages] = useState<Record<string, Language>>({});
  const [regionalCompliance, setRegionalCompliance] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [capaNumberToTranslate, setCapaNumberToTranslate] = useState("");
  const [translatedReport, setTranslatedReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLanguages();
    fetchCompliance();
    fetchStats();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await fetch("/api/capa/i18n?action=languages");
      const data = await response.json();
      setLanguages(data.languages);
    } catch (error) {
      console.error("Failed to fetch languages:", error);
    }
  };

  const fetchCompliance = async () => {
    try {
      const response = await fetch("/api/capa/i18n?action=compliance");
      const data = await response.json();
      setRegionalCompliance(data.allCompliance);
    } catch (error) {
      console.error("Failed to fetch compliance:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/capa/i18n");
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const translateCapaReport = async () => {
    if (!capaNumberToTranslate || !selectedLanguage) {
      alert("Please enter CAPA number and select language");
      return;
    }

    try {
      setLoading(true);

      // Find CAPA ID by number
      const searchResponse = await fetch(
        `/api/capa?capaNumber=${capaNumberToTranslate}`,
      );
      const searchData = await searchResponse.json();

      if (!searchData.capa) {
        alert("CAPA not found");
        return;
      }

      // Translate report
      const response = await fetch("/api/capa/i18n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRANSLATE_CAPA_REPORT",
          capaId: searchData.capa.id,
          targetLanguage: selectedLanguage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTranslatedReport(result.translatedReport);
        alert(`Report translated to ${languages[selectedLanguage]?.name}!`);
      } else {
        alert(result.error || "Translation failed");
      }
    } catch (error) {
      console.error("Translation error:", error);
      alert("Failed to translate report");
    } finally {
      setLoading(false);
    }
  };

  const setUserLanguage = async (language: string) => {
    try {
      const response = await fetch("/api/capa/i18n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_USER_LANGUAGE",
          language,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Language preference updated to ${languages[language]?.name}`);
        window.location.reload(); // Reload to apply new language
      }
    } catch (error) {
      console.error("Set language error:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌍 Multi-Language Support</h1>
        <p className="text-gray-600 mt-1">
          Translate CAPAs for global operations - 14 languages supported
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">
              Supported Languages
            </div>
            <div className="text-3xl font-bold text-blue-700 mt-1">
              {Object.keys(languages).length}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-sm font-medium">
              Total Translations
            </div>
            <div className="text-3xl font-bold text-green-700 mt-1">
              {stats.totalTranslations}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-medium">
              Languages in Use
            </div>
            <div className="text-3xl font-bold text-purple-700 mt-1">
              {stats.languageCount}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-orange-600 text-sm font-medium">
              Compliance Regions
            </div>
            <div className="text-3xl font-bold text-orange-700 mt-1">
              {regionalCompliance ? Object.keys(regionalCompliance).length : 0}
            </div>
          </div>
        </div>
      )}

      {/* Translate CAPA Report */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-bold text-lg mb-4">📄 Translate CAPA Report</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                CAPA Number
              </label>
              <input
                type="text"
                value={capaNumberToTranslate}
                onChange={(e) => setCapaNumberToTranslate(e.target.value)}
                placeholder="e.g., CAPA-2026-001"
                className="w-full border rounded px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full border rounded px-4 py-2"
              >
                {Object.entries(languages).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={translateCapaReport}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Translating..." : "🌐 Translate Report"}
          </button>

          {/* Translated Report Display */}
          {translatedReport && (
            <div className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Translated Report</h3>
                <span className="text-2xl">
                  {languages[selectedLanguage]?.flag}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    CAPA Number:
                  </span>
                  <div className="font-bold">{translatedReport.capaNumber}</div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Title:
                  </span>
                  <div className="font-medium">{translatedReport.title}</div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Description:
                  </span>
                  <div className="text-gray-700">
                    {translatedReport.description}
                  </div>
                </div>

                {translatedReport.rootCause && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Root Cause:
                    </span>
                    <div className="text-gray-700">
                      {translatedReport.rootCause}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Status:
                    </span>
                    <div className="font-bold text-blue-600">
                      {translatedReport.status}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Priority:
                    </span>
                    <div className="font-bold text-orange-600">
                      {translatedReport.priority}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">
                  📥 Download PDF
                </button>
                <button className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
                  📧 Email Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supported Languages Grid */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-bold text-lg mb-4">🌐 Supported Languages</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(languages).map(([code, lang]) => (
            <div
              key={code}
              className="border rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => setUserLanguage(code)}
              title={`Set as your preferred language`}
            >
              <div className="text-3xl mb-2">{lang.flag}</div>
              <div className="font-bold">{lang.nativeName}</div>
              <div className="text-sm text-gray-600">{lang.name}</div>
              <div className="text-xs text-gray-500 mt-1">{lang.region}</div>
              {lang.rtl && (
                <div className="mt-1">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    RTL
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Regional Compliance */}
      {regionalCompliance && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-bold text-lg mb-4">
            🏛️ Regional Compliance Requirements
          </h2>
          <div className="space-y-4">
            {Object.entries(regionalCompliance).map(
              ([key, compliance]: [string, any]) => (
                <div
                  key={key}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg">{key}</div>
                      <div className="text-gray-600">{compliance.region}</div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                      {compliance.closureTimeframe}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Agency: </span>
                      <span className="text-gray-700">{compliance.agency}</span>
                    </div>

                    <div>
                      <span className="font-medium">Regulation: </span>
                      <span className="text-gray-700">
                        {compliance.regulation}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">Languages: </span>
                      <div className="flex gap-1 mt-1">
                        {compliance.languages.map((lang: string) => (
                          <span
                            key={lang}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                          >
                            {languages[lang]?.flag} {languages[lang]?.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium">Required Fields: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {compliance.requiredFields.map((field: string) => (
                          <span
                            key={field}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                      <div className="font-medium text-blue-900">
                        📝 Documentation Requirements:
                      </div>
                      <div className="text-blue-800 text-xs mt-1">
                        {compliance.documentationRequirements}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Implementation Guide */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">✨ Multi-Language Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold text-green-900 mb-2">
              🌍 Language Support:
            </div>
            <ul className="space-y-1 text-green-800">
              <li>
                • 14 languages (English, Spanish, French, German, Chinese,
                Japanese, etc.)
              </li>
              <li>• Right-to-left (RTL) support for Arabic</li>
              <li>• Native character sets (中文, 日本語, العربية)</li>
              <li>• Regional dialects and variations</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-green-900 mb-2">
              📄 Translation Capabilities:
            </div>
            <ul className="space-y-1 text-green-800">
              <li>• Auto-translate CAPA reports</li>
              <li>• Cached translations for speed</li>
              <li>• Technical terminology dictionary</li>
              <li>• Compliance-specific language</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-green-900 mb-2">
              🏛️ Regulatory Compliance:
            </div>
            <ul className="space-y-1 text-green-800">
              <li>• FDA (US), EMA (EU), PMDA (Japan)</li>
              <li>• MHRA (UK), NMPA (China)</li>
              <li>• Region-specific requirements</li>
              <li>• Multi-language audit support</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-green-900 mb-2">💡 Use Cases:</div>
            <ul className="space-y-1 text-green-800">
              <li>• Global manufacturing sites</li>
              <li>• International supplier communication</li>
              <li>• Regulatory submissions</li>
              <li>• Multi-regional audits</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-green-300">
          <div className="text-sm text-green-800">
            <strong>Pro Tip:</strong> Click any language card to set it as your
            preferred language. All future CAPAs will default to your chosen
            language!
          </div>
        </div>
      </div>
    </div>
  );
}
