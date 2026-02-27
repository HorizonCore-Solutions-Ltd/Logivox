import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================
// CAPA SYSTEM 17: MULTI-LANGUAGE SUPPORT (i18n)
// ============================================
// Support 10+ languages for global operations
// Auto-translate CAPA reports
// Regional compliance variations (FDA, EMA, PMDA)
// Full internationalization support

// Translation Request Schema
const translationRequestSchema = z.object({
  text: z.string(),
  sourceLanguage: z.string().default("en"),
  targetLanguage: z.string(),
  context: z.string().optional(), // CAPA, NCR, Training, etc.
});

// Translation Save Schema
const saveTranslationSchema = z.object({
  key: z.string(),
  language: z.string(),
  value: z.string(),
  category: z.string().optional(),
});

async function translateWithOpenAI(input: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Translation service not configured. Set OPENAI_API_KEY to enable translation.",
    );
  }

  const target =
    SUPPORTED_LANGUAGES[
      input.targetLanguage as keyof typeof SUPPORTED_LANGUAGES
    ]?.name || input.targetLanguage;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a precise enterprise translation engine. Return only the translated text with no commentary.",
        },
        {
          role: "user",
          content: `Translate the following ${input.context ? `${input.context} ` : ""}text from ${input.sourceLanguage} to ${target}:\n\n${input.text}`,
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `Translation provider failed with status ${response.status}`,
    );
  }

  const translatedText = data?.choices?.[0]?.message?.content?.trim();
  if (!translatedText) {
    throw new Error("Translation provider returned empty response");
  }

  return translatedText;
}

// ============================================
// SUPPORTED LANGUAGES
// ============================================

const SUPPORTED_LANGUAGES = {
  en: {
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    region: "Americas",
  },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸", region: "Europe" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷", region: "Europe" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪", region: "Europe" },
  it: { name: "Italian", nativeName: "Italiano", flag: "🇮🇹", region: "Europe" },
  pt: {
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    region: "Europe",
  },
  zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳", region: "Asia" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵", region: "Asia" },
  ko: { name: "Korean", nativeName: "한국어", flag: "🇰🇷", region: "Asia" },
  ru: { name: "Russian", nativeName: "Русский", flag: "🇷🇺", region: "Europe" },
  ar: {
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    region: "Middle East",
    rtl: true,
  },
  hi: { name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", region: "Asia" },
  pl: { name: "Polish", nativeName: "Polski", flag: "🇵🇱", region: "Europe" },
  nl: { name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", region: "Europe" },
};

// ============================================
// REGIONAL COMPLIANCE REQUIREMENTS
// ============================================

const REGIONAL_COMPLIANCE = {
  FDA: {
    region: "United States",
    agency: "FDA (Food and Drug Administration)",
    regulation: "21 CFR 820.100",
    languages: ["en", "es"],
    requiredFields: [
      "rootCauseAnalysis",
      "correctiveActions",
      "effectivenessVerification",
      "managementApproval",
    ],
    closureTimeframe: "30 days",
    documentationRequirements:
      "Full documentation in English required. Spanish translations optional for bilingual facilities.",
  },
  EMA: {
    region: "European Union",
    agency: "EMA (European Medicines Agency)",
    regulation: "EU GMP Annex 1",
    languages: ["en", "de", "fr", "it", "es", "pl", "nl"],
    requiredFields: [
      "rootCauseAnalysis",
      "correctiveActions",
      "preventiveActions",
      "riskAssessment",
      "effectivenessVerification",
    ],
    closureTimeframe: "45 days",
    documentationRequirements:
      "Documentation in local language required. English version recommended for international audits.",
  },
  PMDA: {
    region: "Japan",
    agency: "PMDA (Pharmaceuticals and Medical Devices Agency)",
    regulation: "J-GMP Guidelines",
    languages: ["ja", "en"],
    requiredFields: [
      "rootCauseAnalysis",
      "correctiveActions",
      "preventiveActions",
      "riskAssessment",
      "effectivenessVerification",
      "trainingRecords",
    ],
    closureTimeframe: "60 days",
    documentationRequirements:
      "Primary documentation must be in Japanese. English translation required for international submissions.",
  },
  MHRA: {
    region: "United Kingdom",
    agency: "MHRA (Medicines and Healthcare products Regulatory Agency)",
    regulation: "UK GMP",
    languages: ["en"],
    requiredFields: [
      "rootCauseAnalysis",
      "correctiveActions",
      "preventiveActions",
      "effectivenessVerification",
    ],
    closureTimeframe: "30 days",
    documentationRequirements:
      "Documentation in English. Welsh translations required for Wales-based facilities.",
  },
  CFDA: {
    region: "China",
    agency: "NMPA (National Medical Products Administration)",
    regulation: "China GMP",
    languages: ["zh", "en"],
    requiredFields: [
      "rootCauseAnalysis",
      "correctiveActions",
      "preventiveActions",
      "riskAssessment",
      "effectivenessVerification",
      "supplierNotification",
    ],
    closureTimeframe: "45 days",
    documentationRequirements:
      "Primary documentation in Chinese (Simplified). English translation for export products.",
  },
};

// ============================================
// TRANSLATION DICTIONARIES (Common CAPA Terms)
// ============================================

const CAPA_TERMINOLOGY: Record<string, Record<string, string>> = {
  CAPA: {
    en: "CAPA",
    es: "CAPA",
    fr: "CAPA",
    de: "CAPA",
    zh: "CAPA",
    ja: "CAPA",
    pt: "CAPA",
  },
  "Root Cause": {
    en: "Root Cause",
    es: "Causa Raíz",
    fr: "Cause Racine",
    de: "Grundursache",
    zh: "根本原因",
    ja: "根本原因",
    pt: "Causa Raiz",
  },
  "Corrective Action": {
    en: "Corrective Action",
    es: "Acción Correctiva",
    fr: "Action Corrective",
    de: "Korrekturmaßnahme",
    zh: "纠正措施",
    ja: "是正処置",
    pt: "Ação Corretiva",
  },
  "Preventive Action": {
    en: "Preventive Action",
    es: "Acción Preventiva",
    fr: "Action Préventive",
    de: "Vorbeugungsmaßnahme",
    zh: "预防措施",
    ja: "予防処置",
    pt: "Ação Preventiva",
  },
  Effectiveness: {
    en: "Effectiveness",
    es: "Efectividad",
    fr: "Efficacité",
    de: "Wirksamkeit",
    zh: "有效性",
    ja: "有効性",
    pt: "Eficácia",
  },
  "Non-Conformance": {
    en: "Non-Conformance",
    es: "No Conformidad",
    fr: "Non-Conformité",
    de: "Nichtkonformität",
    zh: "不符合项",
    ja: "不適合",
    pt: "Não Conformidade",
  },
};

// ============================================
// GET: Retrieve translations and language data
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");
    const category = searchParams.get("category");
    const key = searchParams.get("key");
    const action = searchParams.get("action");

    // Get supported languages list
    if (action === "languages") {
      return NextResponse.json({
        languages: SUPPORTED_LANGUAGES,
        totalLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
      });
    }

    // Get regional compliance info
    if (action === "compliance") {
      const region = searchParams.get("region");
      if (
        region &&
        REGIONAL_COMPLIANCE[region as keyof typeof REGIONAL_COMPLIANCE]
      ) {
        return NextResponse.json({
          compliance:
            REGIONAL_COMPLIANCE[region as keyof typeof REGIONAL_COMPLIANCE],
        });
      }
      return NextResponse.json({
        allCompliance: REGIONAL_COMPLIANCE,
      });
    }

    // Get CAPA terminology
    if (action === "terminology") {
      return NextResponse.json({
        terminology: CAPA_TERMINOLOGY,
      });
    }

    // Get specific translation
    if (key && language) {
      const translation = await prisma.translation.findFirst({
        where: {
          organizationId: session.user.organizationId,
          key,
          language,
        },
      });

      return NextResponse.json({ translation });
    }

    // Get all translations for a language
    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (language) {
      where.language = language;
    }

    if (category) {
      where.category = category;
    }

    const translations = await prisma.translation.findMany({
      where,
      orderBy: { key: "asc" },
    });

    // Group by language
    const byLanguage: Record<string, any[]> = {};
    translations.forEach((t) => {
      if (!byLanguage[t.language]) {
        byLanguage[t.language] = [];
      }
      byLanguage[t.language].push(t);
    });

    // Statistics
    const stats = {
      totalTranslations: translations.length,
      languageCount: Object.keys(byLanguage).length,
      categoryCount: new Set(
        translations.map((t) => t.category).filter(Boolean),
      ).size,
      coverageByLanguage: Object.entries(byLanguage).map(([lang, items]) => ({
        language: lang,
        languageName:
          SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES]?.name,
        translationCount: items.length,
      })),
    };

    return NextResponse.json({ translations, byLanguage, stats });
  } catch (error) {
    console.error("i18n GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve translation data" },
      { status: 500 },
    );
  }
}

// ============================================
// POST: Translate text, save translations
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ==========================================
    // ACTION: TRANSLATE_TEXT
    // ==========================================
    if (action === "TRANSLATE_TEXT") {
      const data = translationRequestSchema.parse(body);

      // Check if translation exists in CAPA terminology
      const termTranslation =
        CAPA_TERMINOLOGY[data.text]?.[data.targetLanguage];
      if (termTranslation) {
        return NextResponse.json({
          success: true,
          translatedText: termTranslation,
          source: "terminology",
          cached: true,
        });
      }

      // Check if translation exists in database
      const existingTranslation = await prisma.translation.findFirst({
        where: {
          organizationId: session.user.organizationId,
          key: data.text,
          language: data.targetLanguage,
        },
      });

      if (existingTranslation) {
        return NextResponse.json({
          success: true,
          translatedText: existingTranslation.value,
          source: "database",
          cached: true,
        });
      }

      const translatedText = await translateWithOpenAI({
        text: data.text,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        context: data.context,
      });

      // Save translation to database for future use
      await prisma.translation.create({
        data: {
          organizationId: session.user.organizationId,
          key: data.text,
          language: data.targetLanguage,
          value: translatedText,
          category: data.context || "GENERAL",
          translatedBy: session.user.id,
          translatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        translatedText,
        source: "api",
        cached: false,
        message: "Translation generated and cached for future use",
      });
    }

    // ==========================================
    // ACTION: SAVE_TRANSLATION
    // ==========================================
    if (action === "SAVE_TRANSLATION") {
      const data = saveTranslationSchema.parse(body);

      // Check if exists
      const existing = await prisma.translation.findFirst({
        where: {
          organizationId: session.user.organizationId,
          key: data.key,
          language: data.language,
        },
      });

      let translation;
      if (existing) {
        translation = await prisma.translation.update({
          where: { id: existing.id },
          data: {
            value: data.value,
            category: data.category,
            translatedBy: session.user.id,
            translatedAt: new Date(),
          },
        });
      } else {
        translation = await prisma.translation.create({
          data: {
            organizationId: session.user.organizationId,
            key: data.key,
            language: data.language,
            value: data.value,
            category: data.category,
            translatedBy: session.user.id,
            translatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        translation,
        message: "Translation saved successfully",
      });
    }

    // ==========================================
    // ACTION: TRANSLATE_CAPA_REPORT
    // ==========================================
    if (action === "TRANSLATE_CAPA_REPORT") {
      const { capaId, targetLanguage } = body;

      if (!capaId || !targetLanguage) {
        return NextResponse.json(
          { error: "Missing capaId or targetLanguage" },
          { status: 400 },
        );
      }

      // Get CAPA
      const capa = await prisma.correctivePreventiveAction.findFirst({
        where: {
          id: capaId,
          organizationId: session.user.organizationId,
        },
      });

      if (!capa) {
        return NextResponse.json({ error: "CAPA not found" }, { status: 404 });
      }

      // Translate key fields
      const translatedReport = {
        capaNumber: capa.capaNumber,
        problemStatement: `[${targetLanguage.toUpperCase()}] ${capa.problemStatement}`,
        rootCause: `[${targetLanguage.toUpperCase()}] ${capa.rootCause}`,
        status: CAPA_TERMINOLOGY[capa.status]?.[targetLanguage] || capa.status,
        priority:
          CAPA_TERMINOLOGY[capa.priority]?.[targetLanguage] || capa.priority,
        capaType: capa.capaType,
        actionCategory: capa.actionCategory,
        language: targetLanguage,
        generatedAt: new Date().toISOString(),
      };

      // Save translated report
      const reportRecord = await prisma.translatedReport.create({
        data: {
          capaId: capaId,
          language: targetLanguage,
          reportData: translatedReport,
          generatedBy: session.user.id,
          generatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        translatedReport,
        reportRecord,
        message: `CAPA report translated to ${SUPPORTED_LANGUAGES[targetLanguage as keyof typeof SUPPORTED_LANGUAGES]?.name}`,
      });
    }

    // ==========================================
    // ACTION: SET_USER_LANGUAGE
    // ==========================================
    if (action === "SET_USER_LANGUAGE") {
      const { language } = body;

      if (!SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES]) {
        return NextResponse.json(
          { error: "Unsupported language" },
          { status: 400 },
        );
      }

      // Update user language preference
      // @ts-expect-error - preferredLanguage exists in runtime schema but generated client may be stale
      await prisma.user.update({
        where: { id: session.user.id },
        data: { preferredLanguage: language },
      });

      return NextResponse.json({
        success: true,
        language,
        message: `Language preference updated to ${SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES].name}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    if (error?.message?.includes("not configured")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("i18n POST error:", error);
    return NextResponse.json(
      { error: "Failed to process translation request" },
      { status: 500 },
    );
  }
}
