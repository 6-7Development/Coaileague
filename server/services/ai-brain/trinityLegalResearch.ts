/**
 * TRINITY LEGAL RESEARCH SERVICE
 * ==============================
 *
 * Trinity can research laws she does not already know by visiting authoritative
 * government (.gov) and state-legislature websites, extracting the relevant
 * statute via Gemini, and persisting it to `regulatory_rules` with a proper
 * citation. When she doesn't know something, she looks it up — and remembers.
 *
 * DESIGN PRINCIPLES
 *   - Only official government / legislature sources. No third-party aggregators
 *     (except Justia's state-codes mirror, which is commonly linked by .gov sites).
 *   - No raw page content is stored — only Gemini-validated extractions.
 *   - Every call is non-blocking from the chat path. Failures are logged, never thrown.
 *   - An annual cron re-verifies stale rules (see autonomousScheduler).
 */

import { db } from '../../db';
import { regulatoryRules } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { createLogger } from '../../lib/logger';

const log = createLogger('trinityLegalResearch');

/**
 * Authoritative source URLs keyed by state + category slug. Categories in the
 * slug (before the first underscore) map to `regulatory_rules.category`.
 */
const AUTHORITATIVE_SOURCES: Record<string, Record<string, string>> = {
  // ── Federal (always applicable) ─────────────────────────────────────────────
  federal: {
    flsa:              'https://www.dol.gov/agencies/whd/flsa',
    fcra:              'https://www.ftc.gov/legal-library/browse/statutes/fair-credit-reporting-act',
    ada:               'https://www.ada.gov/resources/ada-requirements/',
    title7:            'https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964',
    nlra:              'https://www.nlrb.gov/guidance/key-reference-materials/national-labor-relations-act',
    i9:                'https://www.uscis.gov/i-9-central',
    // Security-specific federal case law
    uof_graham:        'https://www.law.cornell.edu/supremecourt/text/490/386', // Graham v Connor 1989
    uof_garner:        'https://www.law.cornell.edu/supremecourt/text/471/1',   // Tennessee v Garner 1985
  },

  // ── TIER 1 — High security workforce density states ──────────────────────────
  TX: {
    licensing:         'https://www.dps.texas.gov/section/private-security',
    uof_penal_ch9:     'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.9.htm',    // §9.31 self-defense, §9.32 deadly force
    trespass_penal30:  'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.30.htm',   // criminal trespass
    shopkeeper_penal31:'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.31.htm',   // theft/merchant detention
    citizens_arrest:   'https://statutes.capitol.texas.gov/Docs/CR/htm/CR.14.htm',   // Code Criminal Procedure §14.01
    labor_wages:       'https://statutes.capitol.texas.gov/Docs/LA/htm/LA.61.htm',
    // Stand Your Ground: YES (no duty to retreat §9.31(b)(5))
    // Merchant Detention: YES — explicit statute (Penal Code §31.03 + CCP §14.01)
    // Citizen's Arrest: YES — felony or breach of peace in officer's presence
  },
  CA: {
    licensing:         'https://www.bsis.ca.gov/forms_pubs/lic_req_armed_priv.shtml',
    uof_penal87:       'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=197.&lawCode=PEN',
    trespass_penal602: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=602.&lawCode=PEN',
    shopkeeper_penal490:'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=490.5.&lawCode=PEN',
    citizens_arrest:   'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=837.&lawCode=PEN',
    // Stand Your Ground: NO — duty to retreat applies
    // Merchant Detention: YES — Penal Code §490.5 (explicit statute)
    // Citizen's Arrest: Penal Code §837 — RESTRICTED POST-2021 (SB 2, effective 2022)
    // CRITICAL: CA severely restricted citizen's arrest in 2021 — Trinity must flag this
    labor_iwa:         'https://www.dir.ca.gov/iwc/wageorderindustries.htm',
  },
  FL: {
    licensing:         'https://www.myfloridalicense.com/intentions2.asp?chBoard=true&boardid=74',
    uof_chapter776:    'https://www.flsenate.gov/Laws/Statutes/2023/Chapter776',     // Stand Your Ground
    trespass_810:      'https://www.flsenate.gov/Laws/Statutes/2023/810.08',
    shopkeeper_812:    'https://www.flsenate.gov/Laws/Statutes/2023/812.015',
    citizens_arrest:   'https://www.flsenate.gov/Laws/Statutes/2023/901.15',
    // Stand Your Ground: YES — Chapter 776 (no duty to retreat anywhere)
    // Merchant Detention: YES — §812.015 (Retail Theft — explicit merchant statute)
  },
  NY: {
    licensing:         'https://www.dos.ny.gov/licensing/security_guard/security_guard.html',
    uof_penal35:       'https://www.nysenate.gov/legislation/laws/PEN/A35',           // Justification
    trespass_penal140: 'https://www.nysenate.gov/legislation/laws/PEN/P3TG140S140.05',
    shopkeeper_penal_alt: 'https://www.nysenate.gov/legislation/laws/PEN/P3TG155S155.30',
    citizens_arrest:   'https://www.nysenate.gov/legislation/laws/CPL/140.30',
    // Stand Your Ground: NO — strong duty to retreat in NY
    // Merchant Detention: No explicit statute — common law only (Trinity must note)
    // Citizen's Arrest: CPL §140.30 — felony only, must present to officer immediately
  },
  IL: {
    licensing:         'https://www.idfpr.com/Profs/PrivateDetective.asp',
    uof_penal720_7:    'https://www.ilga.gov/legislation/ilcs/ilcs4.asp?ActID=1876&ChapterID=53',
    trespass_penal720: 'https://www.ilga.gov/legislation/ilcs/fulltext.asp?Name=720-ILCS-5%2F21-3',
    shopkeeper:        'https://www.ilga.gov/legislation/ilcs/fulltext.asp?Name=720-ILCS-5%2F16-26',
    citizens_arrest:   'https://www.ilga.gov/legislation/ilcs/fulltext.asp?Name=725-ILCS-5%2F107-3',
    // Stand Your Ground: NO — duty to retreat
    // Merchant Detention: YES — 720 ILCS 5/16-26 (explicit)
  },
  AZ: {
    licensing:         'https://www.azag.gov/licensing',
    uof_penal13_4:     'https://www.azleg.gov/ars/13/00404.htm',                     // Justification
    shopkeeper:        'https://www.azleg.gov/ars/13/01805.htm',
    trespass:          'https://www.azleg.gov/ars/13/01502.htm',
    citizens_arrest:   'https://www.azleg.gov/ars/13/03884.htm',
    // Stand Your Ground: YES — ARS 13-405
  },
  GA: {
    licensing:         'https://sos.ga.gov/page/private-detective-and-security-agencies',
    uof_code16_3:      'https://law.justia.com/codes/georgia/title-16/chapter-3/',
    shopkeeper:        'https://law.justia.com/codes/georgia/title-51/chapter-7/section-51-7-60/',
    citizens_arrest:   'https://law.justia.com/codes/georgia/title-17/chapter-4/section-17-4-60/',
    // Stand Your Ground: YES — OCGA 16-3-23.1
    // Citizen's Arrest: HEAVILY RESTRICTED post-Ahmaud Arbery case (HB 479, 2021)
    // Trinity MUST: flag GA as post-2021 restricted jurisdiction
  },
  NC: {
    licensing:         'https://nclpb.nc.gov/',
    statutes:          'https://www.ncleg.gov/Laws/GeneralStatuteSections/Chapter15A',
    shopkeeper:        'https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_15A/GS_15A-1225.html',
    // Stand Your Ground: YES — NCGS 14-51.3
  },
  WA: {
    licensing:         'https://app.leg.wa.gov/rcw/default.aspx?cite=18.170',
    uof_9a_16:         'https://app.leg.wa.gov/rcw/default.aspx?cite=9A.16',
    shopkeeper:        'https://app.leg.wa.gov/rcw/default.aspx?cite=9A.46.110',
    citizens_arrest:   'https://app.leg.wa.gov/rcw/default.aspx?cite=10.88.060',
    // Stand Your Ground: NO — strong duty to retreat
  },
  CO: {
    licensing:         'https://dora.colorado.gov/pls/real/licensing_web.agency_info?p_agency_id=170',
    uof_18_1_7:        'https://leg.colorado.gov/sites/default/files/images/olls/crs2022-title-18.pdf',
    shopkeeper:        'https://leg.colorado.gov/sites/default/files/images/olls/crs2022-title-18.pdf',
    // Stand Your Ground: NO — duty to retreat (CRS 18-1-704)
  },
  NV: {
    licensing:         'https://nv.gov/Licensing_and_Certification/Private_Investigator/',
    uof_nrs200:        'https://www.leg.state.nv.us/NRS/NRS-200.html',
    shopkeeper:        'https://www.leg.state.nv.us/NRS/NRS-178.html',
    // Stand Your Ground: YES — NRS 200.120 castle doctrine extends outside home
  },
  OH: {
    licensing:         'https://www.com.ohio.gov/divisions-and-programs/industrial-compliance/private-investigation-and-security-services',
    uof_2901_09:       'https://codes.ohio.gov/ohio-revised-code/section-2901.09',
    shopkeeper:        'https://codes.ohio.gov/ohio-revised-code/section-2935.041',
    // Stand Your Ground: YES (SB 175, effective 2021) — no duty to retreat
  },
  MI: {
    licensing:         'https://www.michigan.gov/lara/bureau-list/bpl/occ/priv-sec',
    uof_780_951:       'https://legislature.mi.gov/Laws/MichiganLegislature/Act?legislativeId=MCL-776-Act-313-of-2006',
    shopkeeper:        'https://legislature.mi.gov/Laws/MichiganLegislature/Act?legislativeId=MCL-600-Act-236-of-1961',
    // Stand Your Ground: YES — MCL 780.972 (castle doctrine)
  },
  PA: {
    licensing:         'https://www.dos.pa.gov/ProfessionalLicensing/BoardsCommissions/PrivateDetective/Pages/default.aspx',
    uof_title18_5_505: 'https://www.legis.state.pa.us/cfdocs/legis/LI/consCheck.cfm?txtType=HTM&ttl=18',
    shopkeeper:        'https://www.legis.state.pa.us/cfdocs/legis/LI/consCheck.cfm?txtType=HTM&ttl=18',
    // Stand Your Ground: YES — 18 Pa.C.S. §505
  },
};

/**
 * Domain allowlist. Fetching is denied for any URL not matching one of these
 * substrings, guarding against prompt-injection attempts that feed Trinity
 * a malicious "source" URL.
 */
const ALLOWED_DOMAINS = [
  'statutes.capitol.texas.gov', 'www.sos.state.tx.us',
  'www.dps.texas.gov', 'www.dol.gov', 'www.eeoc.gov',
  'www.ftc.gov', 'www.ada.gov', 'www.nlrb.gov', 'www.uscis.gov',
  'leginfo.legislature.ca.gov', 'www.leg.state.fl.us',
  'law.justia.com/codes', 'www.ilga.gov',
];

export interface LegalResearchResult {
  found: boolean;
  citation?: string;
  sourceUrl?: string;
  summary?: string;
}

class TrinityLegalResearchService {

  private isAllowedSource(url: string): boolean {
    return ALLOWED_DOMAINS.some(d => url.includes(d));
  }

  private async fetchPage(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'CoAIleague Legal Research Bot (compliance@coaileague.com)',
        },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) return null;
      const html = await res.text();
      // Strip HTML tags and collapse whitespace so Gemini sees readable text.
      return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 12_000);
    } catch (err) {
      log.warn(`[LegalResearch] fetch failed for ${url}:`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  private async extractStatute(
    question: string,
    content: string,
    state: string,
  ): Promise<{
    statuteNumber: string;
    text: string;
    summary: string;
    citation: string;
  } | null> {
    try {
      const { unifiedGeminiClient } = await import('./unifiedGeminiClient');
      const resp = await unifiedGeminiClient.generate({
        featureKey: 'trinity_legal_research',
        systemPrompt:
          'You are a legal research assistant. You extract statutes from government source text and return strictly-valid JSON. If nothing directly relevant, return the literal word "null" (no quotes, no JSON) and nothing else.',
        userMessage:
          `Question: "${question}"\nState/Scope: ${state}\n\n` +
          `From the following official legal source text, extract the statute MOST directly relevant to the question.\n\n` +
          `TEXT:\n${content}\n\n` +
          `Return ONLY valid JSON matching exactly this shape:\n` +
          `{"statuteNumber":"e.g. Tex. Occ. Code §1702.301","text":"exact statutory text (max 400 chars)","summary":"plain-English explanation (2-3 sentences)","citation":"full formal legal citation"}\n` +
          `If nothing directly relevant exists in the text, return: null`,
        temperature: 0.05,
        maxTokens: 600,
      });
      const cleaned = resp.text.replace(/```json|```/g, '').trim();
      if (cleaned === 'null' || cleaned === '') return null;
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      if (!parsed?.statuteNumber || !parsed?.text) return null;
      return parsed;
    } catch (err) {
      log.warn('[LegalResearch] extraction failed (non-fatal):', err instanceof Error ? err.message : err);
      return null;
    }
  }

  /**
   * Research a specific legal question for a given state + category.
   * Idempotent: if a matching rule already exists, it is refreshed in place.
   */
  async researchAndLearn(params: {
    question: string;
    state: string;
    category: string;
    workspaceId: string;
  }): Promise<LegalResearchResult> {
    const { question, state, category } = params;

    const sourceMap = AUTHORITATIVE_SOURCES[state] ?? {};
    const categoryKey = Object.keys(sourceMap).find(k => k.startsWith(category) || k.includes(category));
    const url = categoryKey ? sourceMap[categoryKey] : null;

    if (!url || !this.isAllowedSource(url)) {
      return { found: false };
    }

    const content = await this.fetchPage(url);
    if (!content) return { found: false };

    const extracted = await this.extractStatute(question, content, state);
    if (!extracted) return { found: false };

    try {
      // Look up existing rule by (state, rule_name) — no unique constraint in the
      // schema, so we update-or-insert manually rather than onConflictDoUpdate.
      const existing = await db
        .select({ id: regulatoryRules.id })
        .from(regulatoryRules)
        .where(and(
          eq(regulatoryRules.state, state),
          eq(regulatoryRules.ruleName, extracted.statuteNumber),
        ))
        .limit(1);

      const lastVerified = new Date().toISOString().substring(0, 10); // `date` column

      if (existing.length > 0) {
        await db.update(regulatoryRules)
          .set({
            ruleText: extracted.text,
            plainEnglishSummary: extracted.summary,
            statuteReference: extracted.citation,
            lastVerified,
          })
          .where(eq(regulatoryRules.id, existing[0].id));
      } else {
        await db.insert(regulatoryRules).values({
          state,
          category,
          ruleName: extracted.statuteNumber,
          ruleText: extracted.text,
          plainEnglishSummary: extracted.summary,
          statuteReference: extracted.citation,
          lastVerified,
          severity: 'informational',
          appliesTo: 'both',
        });
      }
    } catch (err) {
      log.warn('[LegalResearch] persist failed (non-fatal):', err instanceof Error ? err.message : err);
      // We still consider the research "found" — the extraction succeeded even
      // if persistence failed. The caller can still return the citation.
    }

    log.info(`[LegalResearch] Learned/refreshed: ${extracted.citation}`);
    return {
      found: true,
      citation: extracted.citation,
      sourceUrl: url,
      summary: extracted.summary,
    };
  }

  /**
   * Bootstrap every authoritative source for a state the org just expanded
   * into. Called when `workspaces.operatingStates` gains a new entry.
   * Also bootstraps federal law, which every workspace needs.
   */
  async bootstrapStateKnowledge(state: string, workspaceId: string): Promise<void> {
    const stateSources = AUTHORITATIVE_SOURCES[state] ?? {};
    for (const [key] of Object.entries(stateSources)) {
      const [category] = key.split('_');
      await this.researchAndLearn({
        question: `Core requirements for ${key.replace(/_/g, ' ')}`,
        state,
        category,
        workspaceId,
      }).catch(err => log.warn(`[LegalResearch] Bootstrap ${state}:${key} failed:`, err?.message));
    }

    for (const [key] of Object.entries(AUTHORITATIVE_SOURCES.federal ?? {})) {
      await this.researchAndLearn({
        question: `Federal ${key} requirements for security companies`,
        state: 'federal',
        category: key,
        workspaceId,
      }).catch(err => log.warn(`[LegalResearch] Bootstrap federal:${key} failed:`, err?.message));
    }

    log.info(`[LegalResearch] Bootstrapped ${state} + federal for workspace ${workspaceId}`);
  }
}

export const trinityLegalResearch = new TrinityLegalResearchService();
