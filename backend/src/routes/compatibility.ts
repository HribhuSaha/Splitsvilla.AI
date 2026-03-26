import { Router, type IRouter } from "express";
import { db } from "../lib/db/src/index";
import { contestantsTable, splitsTable } from "../lib/db/src/schema/index";
import { eq } from "drizzle-orm";
import { ai } from "../lib/integrations-gemini-ai/src/index";
import {
  AnalyzeCompatibilityBody,
  OraclePredictionBody,
  MlCompatibilityScoreBody,
} from "../lib/api-zod/src/generated/api";

const router: IRouter = Router();

const ZODIAC_COMPATIBILITY: Record<string, string[]> = {
  Aries: ["Leo", "Sagittarius", "Gemini", "Aquarius"],
  Taurus: ["Virgo", "Capricorn", "Cancer", "Pisces"],
  Gemini: ["Libra", "Aquarius", "Aries", "Leo"],
  Cancer: ["Scorpio", "Pisces", "Taurus", "Virgo"],
  Leo: ["Aries", "Sagittarius", "Gemini", "Libra"],
  Virgo: ["Taurus", "Capricorn", "Cancer", "Scorpio"],
  Libra: ["Gemini", "Aquarius", "Leo", "Sagittarius"],
  Scorpio: ["Cancer", "Pisces", "Virgo", "Capricorn"],
  Sagittarius: ["Aries", "Leo", "Libra", "Aquarius"],
  Capricorn: ["Taurus", "Virgo", "Scorpio", "Pisces"],
  Aquarius: ["Gemini", "Libra", "Aries", "Sagittarius"],
  Pisces: ["Cancer", "Scorpio", "Taurus", "Capricorn"],
};

function computeZodiacScore(sign1: string, sign2: string): number {
  const compatible = ZODIAC_COMPATIBILITY[sign1] ?? [];
  if (compatible.includes(sign2)) return 85 + Math.random() * 15;
  return 30 + Math.random() * 40;
}

function computeInterestScore(interests1: string, interests2: string): number {
  const set1 = new Set(interests1.toLowerCase().split(",").map(s => s.trim()));
  const set2 = new Set(interests2.toLowerCase().split(",").map(s => s.trim()));
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  const jaccard = union === 0 ? 0 : intersection / union;
  return Math.round(jaccard * 100);
}

function computePersonalityScore(p1: string, p2: string): number {
  const traits1 = p1.toLowerCase().split(",").map(s => s.trim());
  const traits2 = p2.toLowerCase().split(",").map(s => s.trim());
  const overlap = traits1.filter(t => traits2.includes(t)).length;
  const total = new Set([...traits1, ...traits2]).size;
  const base = total === 0 ? 50 : (overlap / total) * 100;
  return Math.round(Math.min(100, base + Math.random() * 20 + 20));
}

function computeAgeScore(age1: number, age2: number): number {
  const diff = Math.abs(age1 - age2);
  if (diff <= 2) return 95;
  if (diff <= 5) return 80;
  if (diff <= 10) return 60;
  return 40;
}

router.post("/ml-score", async (req, res) => {
  const body = MlCompatibilityScoreBody.parse(req.body);
  const [c1] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, body.contestant1Id));
  const [c2] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, body.contestant2Id));

  if (!c1 || !c2) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  const zodiacCompatibility = Math.round(computeZodiacScore(c1.zodiacSign, c2.zodiacSign));
  const personalityOverlap = computePersonalityScore(c1.personality, c2.personality);
  const interestSimilarity = computeInterestScore(c1.interests, c2.interests);
  const ageCompatibility = computeAgeScore(c1.age, c2.age);

  const score = Math.round(
    zodiacCompatibility * 0.3 +
    personalityOverlap * 0.3 +
    interestSimilarity * 0.25 +
    ageCompatibility * 0.15
  );

  let label: "excellent" | "good" | "moderate" | "poor";
  if (score >= 80) label = "excellent";
  else if (score >= 60) label = "good";
  else if (score >= 40) label = "moderate";
  else label = "poor";

  return res.json({
    score,
    breakdown: { zodiacCompatibility, personalityOverlap, interestSimilarity, ageCompatibility },
    label,
  });
});

router.post("/analyze", async (req, res) => {
  const body = AnalyzeCompatibilityBody.parse(req.body);
  const [c1] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, body.contestant1Id));
  const [c2] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, body.contestant2Id));

  if (!c1 || !c2) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  const zodiacScore = Math.round(computeZodiacScore(c1.zodiacSign, c2.zodiacSign));
  const personalityScore = computePersonalityScore(c1.personality, c2.personality);
  const interestScore = computeInterestScore(c1.interests, c2.interests);
  const overallScore = Math.round(zodiacScore * 0.3 + personalityScore * 0.35 + interestScore * 0.35);

  const prompt = `You are a relationship compatibility expert for the Splitsvilla reality TV show.

Analyze the compatibility between these two contestants:

${c1.name} (${c1.age}, ${c1.hometown})
- Zodiac: ${c1.zodiacSign}
- Personality: ${c1.personality}
- Interests: ${c1.interests}
- Bio: ${c1.bio}

${c2.name} (${c2.age}, ${c2.hometown})
- Zodiac: ${c2.zodiacSign}
- Personality: ${c2.personality}
- Interests: ${c2.interests}
- Bio: ${c2.bio}

Compatibility Scores:
- Zodiac Match: ${zodiacScore}/100
- Personality Match: ${personalityScore}/100
- Interest Match: ${interestScore}/100
- Overall: ${overallScore}/100

Provide analysis in this exact JSON format (no markdown):
{
  "analysis": "2-3 sentence overall analysis",
  "strengths": ["strength1", "strength2", "strength3"],
  "challenges": ["challenge1", "challenge2"],
  "recommendation": "one sentence recommendation"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", maxOutputTokens: 8192 },
  });

  let parsed: { analysis: string; strengths: string[]; challenges: string[]; recommendation: string };
  try {
    parsed = JSON.parse(response.text ?? "{}");
  } catch {
    parsed = {
      analysis: "These two contestants have an interesting dynamic worth exploring.",
      strengths: ["Shared energy", "Complementary traits"],
      challenges: ["Different backgrounds"],
      recommendation: "Give this pairing a chance!",
    };
  }

  return res.json({
    contestant1Name: c1.name,
    contestant2Name: c2.name,
    overallScore,
    personalityMatch: personalityScore,
    interestMatch: interestScore,
    zodiacMatch: zodiacScore,
    analysis: parsed.analysis,
    strengths: parsed.strengths,
    challenges: parsed.challenges,
    recommendation: parsed.recommendation,
  });
});

router.post("/oracle", async (req, res) => {
  const body = OraclePredictionBody.parse(req.body);
  const [c1] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, body.contestant1Id));
  const [c2] = await db.select().from(contestantsTable).where(eq(contestantsTable.id, body.contestant2Id));

  if (!c1 || !c2) {
    return res.status(404).json({ error: "Contestant not found" });
  }

  const prompt = `You are the Oracle of Splitsvilla - a mystical, all-knowing entity who speaks in dramatic, poetic, and prophetic language. You reveal the romantic destiny of contestants.

Reveal the destiny of this split:
${c1.name} (${c1.zodiacSign}, Traits: ${c1.personality}) 
+ 
${c2.name} (${c2.zodiacSign}, Traits: ${c2.personality})

Respond in this exact JSON format (no markdown):
{
  "prediction": "2-3 sentences in dramatic, mystical language about their relationship destiny",
  "verdict": "strong_match OR possible_match OR uncertain OR unlikely_match",
  "confidence": 75,
  "mysticalMessage": "One dramatic, poetic line like a prophecy",
  "advice": "One piece of mystical wisdom for this couple"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", maxOutputTokens: 8192 },
  });

  let parsed: { prediction: string; verdict: string; confidence: number; mysticalMessage: string; advice: string };
  try {
    parsed = JSON.parse(response.text ?? "{}");
  } catch {
    parsed = {
      prediction: "The stars align in mysterious ways for this pairing.",
      verdict: "uncertain",
      confidence: 50,
      mysticalMessage: "Two souls, one destiny yet to be written.",
      advice: "Follow your heart, for it knows what the mind cannot see.",
    };
  }

  return res.json(parsed);
});

router.get("/leaderboard", async (_req, res) => {
  const splits = await db.select().from(splitsTable).where(eq(splitsTable.status, "active"));
  const contestants = await db.select().from(contestantsTable);
  const contestantMap = new Map(contestants.map(c => [c.id, c]));

  const scored = await Promise.all(splits.map(async (split) => {
    const c1 = contestantMap.get(split.contestant1Id);
    const c2 = contestantMap.get(split.contestant2Id);
    if (!c1 || !c2) return null;

    const zodiacScore = Math.round(computeZodiacScore(c1.zodiacSign, c2.zodiacSign));
    const personalityScore = computePersonalityScore(c1.personality, c2.personality);
    const interestScore = computeInterestScore(c1.interests, c2.interests);
    const ageScore = computeAgeScore(c1.age, c2.age);
    const score = Math.round(zodiacScore * 0.3 + personalityScore * 0.3 + interestScore * 0.25 + ageScore * 0.15);

    let label: string;
    if (score >= 80) label = "excellent";
    else if (score >= 60) label = "good";
    else if (score >= 40) label = "moderate";
    else label = "poor";

    return {
      splitId: split.id,
      contestant1Name: c1.name,
      contestant2Name: c2.name,
      score,
      label,
    };
  }));

  const valid = scored.filter(Boolean).sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
  const ranked = valid.map((entry, idx) => ({ rank: idx + 1, ...entry! }));
  return res.json(ranked);
});

export default router;
