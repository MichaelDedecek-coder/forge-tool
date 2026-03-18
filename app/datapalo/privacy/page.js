"use client";
import { useState } from "react";
import Link from "next/link";

export default function PrivacyPolicy() {
  const [language, setLanguage] = useState("en");

  // ── Section styling helpers ──
  const sectionNumber = (n) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.7rem",
    color: "#E06792",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: "10px",
    display: "block",
  });

  const heading = {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
    color: "rgba(255,255,255,0.95)",
    marginBottom: "8px",
    marginTop: "0",
    lineHeight: 1.15,
  };

  const subheading = {
    fontFamily: "'Satoshi', sans-serif",
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.9)",
    marginTop: "32px",
    marginBottom: "12px",
  };

  const para = {
    fontFamily: "'Satoshi', sans-serif",
    fontSize: "0.95rem",
    lineHeight: 1.75,
    color: "rgba(255,255,255,0.7)",
    marginBottom: "16px",
  };

  const bullet = {
    ...para,
    paddingLeft: "8px",
    marginBottom: "10px",
  };

  const divider = {
    width: "48px",
    height: "3px",
    background: "linear-gradient(90deg, #E06792, #3F51B5)",
    borderRadius: "2px",
    marginBottom: "24px",
    border: "none",
  };

  const card = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "clamp(24px, 4vw, 40px)",
    marginBottom: "40px",
  };

  const tableWrap = {
    overflowX: "auto",
    marginTop: "16px",
    marginBottom: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const thStyle = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "rgba(255,255,255,0.9)",
    background: "linear-gradient(135deg, rgba(63,81,181,0.3), rgba(224,103,146,0.2))",
    padding: "12px 16px",
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    fontFamily: "'Satoshi', sans-serif",
    fontSize: "0.88rem",
    color: "rgba(255,255,255,0.7)",
    padding: "11px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  };

  return (
    <div style={{
      padding: "40px 16px",
      fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
      background: "linear-gradient(168deg, #080818 0%, #0D0D2B 35%, #111133 65%, #0E0E28 100%)",
      minHeight: "100vh",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
    }}>
      {/* Font import */}
      <div dangerouslySetInnerHTML={{ __html: `<style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Satoshi:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap');</style>` }} />

      {/* ── Navigation bar ── */}
      <div style={{
        width: "100%",
        maxWidth: "820px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "48px",
      }}>
        <Link href="/datapalo" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: "1.4rem",
            color: "rgba(255,255,255,0.5)",
            transition: "color 0.2s ease",
          }}>
            <span style={{ color: "rgba(224,103,146,0.6)" }}>Data</span>
            <span>Palo</span>
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.3)",
            marginLeft: "8px",
          }}>
            &larr; {language === "cs" ? "zpět" : "back"}
          </span>
        </Link>

        {/* Language toggle */}
        <div style={{ display: "flex", gap: "4px" }}>
          {["cs", "en"].map(lang => (
            <button key={lang} onClick={() => setLanguage(lang)} style={{
              background: language === lang ? "rgba(224,103,146,0.1)" : "transparent",
              color: "white",
              border: language === lang ? "1px solid rgba(224,103,146,0.25)" : "1px solid transparent",
              padding: "5px 12px",
              borderRadius: "14px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.7rem",
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
            }}>
              {lang === "cs" ? "CZ" : "EN"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Page header ── */}
      <div style={{ width: "100%", maxWidth: "820px", marginBottom: "48px" }}>
        <div style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          marginBottom: "4px",
        }}>
          <span style={{ color: "#E06792" }}>Data</span><span style={{ color: "rgba(255,255,255,0.9)" }}>Palo</span>
        </div>
        <h1 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "clamp(2.4rem, 7vw, 4rem)",
          color: "rgba(255,255,255,0.97)",
          margin: "0 0 16px 0",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}>
          {language === "cs" ? "Zásady ochrany osobních údajů" : "Privacy Policy"}
        </h1>
        <hr style={divider} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", ...para, fontSize: "0.88rem" }}>
          <span><strong style={{ color: "rgba(255,255,255,0.85)" }}>{language === "cs" ? "Platnost od:" : "Effective Date:"}</strong> March 16, 2026</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span><strong style={{ color: "rgba(255,255,255,0.85)" }}>{language === "cs" ? "Verze:" : "Version:"}</strong> 1.0</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span><strong style={{ color: "rgba(255,255,255,0.85)" }}>Website:</strong> <a href="https://www.datapalo.app" style={{ color: "#E06792", textDecoration: "none" }}>www.datapalo.app</a></span>
        </div>
      </div>

      {/* ── Sections ── */}
      <div style={{ width: "100%", maxWidth: "820px" }}>

        {/* Section 1: Introduction */}
        <div style={card}>
          <span style={sectionNumber(1)}>{language === "cs" ? "Sekce 1" : "Section 1"}</span>
          <h2 style={heading}>{language === "cs" ? "Úvod" : "Introduction"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Vítejte v DataPalo. Zavazujeme se chránit vaše soukromí a nakládat s vašimi osobními údaji transparentně a s péčí. Tyto zásady ochrany osobních údajů vysvětlují, jak shromažďujeme, používáme, sdílíme a chráníme vaše osobní informace při používání naší služby na www.datapalo.app."
              : "Welcome to DataPalo. We are committed to protecting your privacy and handling your personal data with transparency and care. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our service at www.datapalo.app."}
          </p>
          <p style={para}>
            {language === "cs"
              ? "DataPalo je SaaS platforma pro analýzu dat, která umožňuje uživatelům nahrávat soubory CSV a Excel a získávat poznatky, grafy a reporty poháněné umělou inteligencí. Tyto zásady se vztahují na všechny uživatele naší služby, včetně uživatelů tarifu Free a předplatného PRO."
              : "DataPalo is a SaaS data analysis platform that enables users to upload CSV and Excel files and receive AI-powered insights, charts, and reports. This policy applies to all users of our service, including those on our Free tier and PRO subscription plan."}
          </p>
          <p style={para}>
            {language === "cs"
              ? "Vytvořením účtu nebo používáním DataPalo berete na vědomí, že jste si přečetli a porozuměli těmto zásadám ochrany osobních údajů. Pokud nesouhlasíte s popsanými postupy, službu prosím nepoužívejte."
              : "By creating an account or using DataPalo, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with the practices described herein, please do not use our service."}
          </p>
        </div>

        {/* Section 2: Data Controller */}
        <div style={card}>
          <span style={sectionNumber(2)}>{language === "cs" ? "Sekce 2" : "Section 2"}</span>
          <h2 style={heading}>{language === "cs" ? "Správce údajů" : "Data Controller"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Správcem vašich osobních údajů je:"
              : "The data controller responsible for your personal data is:"}
          </p>
          <div style={tableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{language === "cs" ? "Organizace" : "Organization"}</th>
                  <th style={thStyle}>{language === "cs" ? "Údaje" : "Details"}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [language === "cs" ? "Název společnosti" : "Company Name", "FORGE CREATIVE | AI Job Agency"],
                  [language === "cs" ? "Kontaktní osoba" : "Contact Person", "Michael Dedecek"],
                  ["Email", <a key="e" href="mailto:michael@agentforge.tech" style={{ color: "#E06792", textDecoration: "none" }}>michael@agentforge.tech</a>],
                  [language === "cs" ? "Alternativní email" : "Alt. Email", <a key="ae" href="mailto:michael@forgecreative.cz" style={{ color: "#E06792", textDecoration: "none" }}>michael@forgecreative.cz</a>],
                  [language === "cs" ? "Země" : "Country", language === "cs" ? "Česká republika (členský stát EU)" : "Czech Republic (EU Member State)"],
                  [language === "cs" ? "Dozorový úřad" : "Supervisory Authority", language === "cs" ? "ÚOOÚ (Úřad pro ochranu osobních údajů)" : "ÚOOÚ — Czech Data Protection Authority"],
                ].map(([label, value], i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>{label}</td>
                    <td style={tdStyle}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: What Data We Collect */}
        <div style={card}>
          <span style={sectionNumber(3)}>{language === "cs" ? "Sekce 3" : "Section 3"}</span>
          <h2 style={heading}>{language === "cs" ? "Jaké údaje shromažďujeme" : "What Data We Collect"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Shromažďujeme různé kategorie osobních údajů v závislosti na tom, jak s DataPalo interagujete."
              : "We collect different categories of personal data depending on how you interact with DataPalo. Below is a comprehensive overview of the data we process."}
          </p>

          <h3 style={subheading}>3.1 {language === "cs" ? "Informace o účtu" : "Account Information"}</h3>
          <p style={para}>{language === "cs" ? "Při vytvoření účtu DataPalo shromažďujeme:" : "When you create a DataPalo account, we collect:"}</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={bullet}><span style={{ color: "#E06792", marginRight: "8px" }}>&#9654;</span> <strong style={{ color: "rgba(255,255,255,0.85)" }}>{language === "cs" ? "Jméno" : "Name"}</strong> — {language === "cs" ? "Vaše celé jméno zadané při registraci" : "Your full name as provided during registration"}</li>
            <li style={bullet}><span style={{ color: "#E06792", marginRight: "8px" }}>&#9654;</span> <strong style={{ color: "rgba(255,255,255,0.85)" }}>Email</strong> — {language === "cs" ? "Používaný pro autentizaci, správu účtu a komunikaci" : "Used for authentication, account management, and communication"}</li>
            <li style={bullet}><span style={{ color: "#E06792", marginRight: "8px" }}>&#9654;</span> <strong style={{ color: "rgba(255,255,255,0.85)" }}>{language === "cs" ? "Autentizační údaje" : "Authentication data"}</strong> — {language === "cs" ? "Spravováno bezpečně přes Supabase, podporuje email/heslo i Google OAuth" : "Managed securely through Supabase, supporting email/password and Google OAuth"}</li>
          </ul>

          <h3 style={subheading}>3.2 {language === "cs" ? "Platební informace" : "Payment Information"}</h3>
          <p style={para}>
            {language === "cs"
              ? "Pokud si předplatíte tarif PRO (29 €/měsíc), zpracování plateb zajišťuje výhradně Stripe, certifikovaný procesor PCI DSS Level 1. DataPalo neukládá, nezpracovává ani nemá přístup k vašim úplným číslům kreditních karet."
              : "If you subscribe to our PRO plan (€29/month), payment processing is handled entirely by Stripe, a PCI DSS Level 1 certified payment processor. DataPalo does not store, process, or have access to your full credit card numbers."}
          </p>

          <h3 style={subheading}>3.3 {language === "cs" ? "Nahrané údaje" : "Uploaded Data"}</h3>
          <p style={para}>
            {language === "cs"
              ? "Při používání DataPalo nahráváte soubory CSV nebo Excel. Tyto soubory mohou obsahovat osobní údaje v závislosti na jejich obsahu. Tyto údaje zpracováváme výhradně za účelem poskytování analýz, poznatků, grafů a reportů."
              : "When you use DataPalo to analyze data, you upload CSV or Excel files. These files may contain personal data depending on their content. We process this data solely to provide you with AI-powered analysis, insights, charts, and reports."}
          </p>
          <div style={{
            background: "rgba(224,103,146,0.06)",
            border: "1px solid rgba(224,103,146,0.15)",
            borderRadius: "10px",
            padding: "14px 18px",
            ...para,
            fontSize: "0.88rem",
          }}>
            <strong style={{ color: "#E06792" }}>{language === "cs" ? "Důležité:" : "Important:"}</strong>{" "}
            {language === "cs"
              ? "Jste zodpovědní za to, že máte právo nahrávat a zpracovávat veškerá data obsažená ve vašich souborech."
              : "You are responsible for ensuring you have the right to upload and process any data contained in your files. Do not upload sensitive personal information unless you have a lawful basis to do so."}
          </div>

          <h3 style={subheading}>3.4 {language === "cs" ? "Výsledky analýz" : "Analysis Results"}</h3>
          <p style={para}>
            {language === "cs"
              ? "Generujeme a ukládáme poznatky, grafy a reporty vytvořené umělou inteligencí na základě vašich nahraných dat."
              : "We generate and store AI-produced insights, charts, and reports based on your uploaded data. These results are associated with your account."}
          </p>

          <h3 style={subheading}>3.5 {language === "cs" ? "Údaje o používání a analytika" : "Usage Data and Analytics"}</h3>
          <p style={para}>{language === "cs" ? "Automaticky shromažďujeme údaje o používání prostřednictvím analytických nástrojů:" : "We automatically collect usage data through analytics tools:"}</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {(language === "cs"
              ? ["Zobrazení stránek, navigační vzorce a používání funkcí", "Kliknutí, hloubka scrollování a data o interakcích", "Nahrávání sessions a heatmapy (přes Hotjar)", "Typ prohlížeče, informace o zařízení, OS a rozlišení obrazovky", "IP adresa (anonymizovaná kde je to možné)", "Zdroj návštěvy a délka relace"]
              : ["Page views, navigation patterns, and feature usage", "Click events, scroll depth, and interaction data", "Session recordings and heatmaps (via Hotjar)", "Browser type, device info, OS, and screen resolution", "IP address (anonymized where possible)", "Referral source and session duration"]
            ).map((item, i) => (
              <li key={i} style={bullet}><span style={{ color: "rgba(161,197,10,0.7)", marginRight: "8px" }}>&#8226;</span> {item}</li>
            ))}
          </ul>
        </div>

        {/* Section 4: How We Use Your Data */}
        <div style={card}>
          <span style={sectionNumber(4)}>{language === "cs" ? "Sekce 4" : "Section 4"}</span>
          <h2 style={heading}>{language === "cs" ? "Jak používáme vaše údaje" : "How We Use Your Data"}</h2>
          <hr style={divider} />
          <ul style={{ listStyle: "none", padding: 0 }}>
            {(language === "cs" ? [
              ["Poskytování služby", "Zpracování a analýza vašich nahraných souborů CSV/Excel pomocí modelů AI (Anthropic Claude a Google Gemini) a sandboxovaného spuštění kódu (E2B)."],
              ["Správa účtu", "Vytváření a údržba vašeho uživatelského účtu, správa autentizace a přístupu k historii analýz."],
              ["Zpracování plateb", "Zpracování předplatného PRO prostřednictvím Stripe, správa stavu předplatného."],
              ["E-mailová komunikace", "Zasílání uvítacích emailů, oznámení o službě a (s vaším souhlasem) marketingové komunikace přes Mailchimp."],
              ["Analytika a zlepšování", "Pochopení interakce uživatelů s DataPalo pro zlepšení funkcí a uživatelského rozhraní pomocí Google Analytics 4 a Hotjar."],
              ["Výzkumem obohacená analýza", "Pro uživatele PRO, obohacení analýzy dat o kontextuální webový výzkum přes Exa Neural Search."],
              ["Právní soulad", "Plnění našich právních povinností, včetně vedení daňových záznamů."],
              ["Bezpečnost", "Detekce, prevence a řešení podvodů, zneužití a bezpečnostních incidentů."],
            ] : [
              ["Service Delivery", "Processing and analyzing your uploaded CSV/Excel files using AI models (Anthropic Claude and Google Gemini) and sandboxed code execution (E2B)."],
              ["Account Management", "Creating and maintaining your user account, managing authentication, and providing access to your analysis history."],
              ["Payment Processing", "Processing PRO subscription payments through Stripe, managing your subscription status."],
              ["Email Communications", "Sending welcome emails, service notifications, and (with your consent) marketing communications via Mailchimp."],
              ["Analytics and Improvement", "Understanding how users interact with DataPalo to improve our features and UI using Google Analytics 4 and Hotjar."],
              ["Research-Augmented Analysis", "For PRO users, enriching data analysis with contextual web research via Exa Neural Search."],
              ["Legal Compliance", "Fulfilling our legal obligations, including tax record-keeping."],
              ["Security", "Detecting, preventing, and addressing fraud, abuse, and security incidents."],
            ]).map(([title, desc], i) => (
              <li key={i} style={{ ...bullet, marginBottom: "14px" }}>
                <span style={{ color: "#E06792", marginRight: "8px" }}>&#9654;</span>
                <strong style={{ color: "rgba(255,255,255,0.85)" }}>{title}</strong> — {desc}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 5: Legal Basis */}
        <div style={card}>
          <span style={sectionNumber(5)}>{language === "cs" ? "Sekce 5" : "Section 5"}</span>
          <h2 style={heading}>{language === "cs" ? "Právní základ pro zpracování" : "Legal Basis for Processing"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Podle obecného nařízení o ochraně osobních údajů (GDPR) zpracováváme vaše osobní údaje na základě následujících právních důvodů stanovených v článku 6(1):"
              : "Under the GDPR, we process your personal data based on the following legal grounds as set out in Article 6(1):"}
          </p>

          <h3 style={subheading}>5.1 {language === "cs" ? "Plnění smlouvy — čl. 6(1)(b)" : "Performance of a Contract — Art. 6(1)(b)"}</h3>
          <p style={para}>
            {language === "cs"
              ? "Zpracování vašich údajů o účtu a nahraných souborů je nezbytné pro plnění naší smlouvy s vámi — tj. pro poskytování služby DataPalo, ke které jste se zaregistrovali."
              : "Processing your account data and uploaded files is necessary to perform our contract with you — i.e., to deliver the DataPalo service you signed up for."}
          </p>

          <h3 style={subheading}>5.2 {language === "cs" ? "Souhlas — čl. 6(1)(a)" : "Consent — Art. 6(1)(a)"}</h3>
          <p style={para}>{language === "cs" ? "Spoléháme na váš výslovný souhlas pro:" : "We rely on your explicit consent for:"}</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {(language === "cs"
              ? ["Nastavení neesenciálních cookies (analytika a sledování chování)", "Zasílání marketingových emailů přes Mailchimp", "Autentizace Google OAuth (pokud se rozhodnete přihlásit přes Google)"]
              : ["Setting non-essential cookies (analytics and behavioral tracking)", "Sending marketing email communications via Mailchimp", "Google OAuth authentication (when you choose to sign in with Google)"]
            ).map((item, i) => (
              <li key={i} style={bullet}><span style={{ color: "rgba(161,197,10,0.7)", marginRight: "8px" }}>&#8226;</span> {item}</li>
            ))}
          </ul>

          <h3 style={subheading}>5.3 {language === "cs" ? "Oprávněné zájmy — čl. 6(1)(f)" : "Legitimate Interests — Art. 6(1)(f)"}</h3>
          <p style={para}>
            {language === "cs"
              ? "Spoléháme na naše oprávněné zájmy pro analýzu agregovaných vzorců používání, udržování bezpečnosti platformy a interní obchodní správu."
              : "We rely on our legitimate interests for analyzing aggregated usage patterns, maintaining platform security, and internal business administration."}
          </p>

          <h3 style={subheading}>5.4 {language === "cs" ? "Právní povinnost — čl. 6(1)(c)" : "Legal Obligation — Art. 6(1)(c)"}</h3>
          <p style={para}>
            {language === "cs"
              ? "Zpracováváme určité údaje tam, kde to vyžaduje zákon, jako je uchovávání platebních záznamů pro daňovou shodu podle českého práva."
              : "We process certain data where required by law, such as retaining payment records for tax compliance under Czech law."}
          </p>
        </div>

        {/* Section 6: Data Sharing & Third-Party Processors */}
        <div style={card}>
          <span style={sectionNumber(6)}>{language === "cs" ? "Sekce 6" : "Section 6"}</span>
          <h2 style={heading}>{language === "cs" ? "Sdílení dat a zpracovatelé" : "Data Sharing & Third-Party Processors"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Vaše osobní údaje neprodáváme. Údaje sdílíme pouze s důvěryhodnými poskytovateli služeb třetích stran (\"zpracovatelé\"), kteří nám pomáhají provozovat DataPalo. Každý zpracovatel je vázán smlouvou o zpracování údajů (DPA)."
              : "We do not sell your personal data. We share data only with trusted third-party service providers (\"processors\") who assist us in operating DataPalo. Each processor is bound by a Data Processing Agreement (DPA)."}
          </p>
          <div style={tableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{language === "cs" ? "Zpracovatel" : "Processor"}</th>
                  <th style={thStyle}>{language === "cs" ? "Účel" : "Purpose"}</th>
                  <th style={thStyle}>{language === "cs" ? "Zpracovávaná data" : "Data Processed"}</th>
                  <th style={thStyle}>{language === "cs" ? "Umístění" : "Location"}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase", language === "cs" ? "Autentizace a databáze" : "Authentication & database", language === "cs" ? "Jméno, email, údaje o účtu" : "Name, email, account data", "US"],
                  ["Stripe", language === "cs" ? "Zpracování plateb" : "Payment processing", language === "cs" ? "Platební a fakturační údaje" : "Payment & billing data", "US"],
                  ["Anthropic (Claude)", language === "cs" ? "AI analýza dat" : "AI data analysis", language === "cs" ? "Obsah nahraných souborů" : "Uploaded file contents", "US"],
                  ["Google (Gemini)", language === "cs" ? "AI analýza dat" : "AI data analysis", language === "cs" ? "Obsah nahraných souborů" : "Uploaded file contents", "US"],
                  ["E2B", language === "cs" ? "Sandboxované spouštění kódu" : "Sandboxed code execution", language === "cs" ? "Data pro analýzu" : "Data for analysis", "EU"],
                  ["Mailchimp (Intuit)", language === "cs" ? "E-mailový marketing" : "Email marketing", language === "cs" ? "Jméno, email" : "Name, email", "US"],
                  ["Vercel", language === "cs" ? "Hosting a nasazení" : "Hosting & deployment", language === "cs" ? "Údaje o používání, IP adresy" : "Usage data, IP addresses", "US"],
                  ["Google Analytics 4", language === "cs" ? "Webová analytika" : "Website analytics", language === "cs" ? "Údaje o používání, info o zařízení" : "Usage data, device info", "US"],
                  ["Hotjar", language === "cs" ? "Behaviorální analytika" : "Behavioral analytics", language === "cs" ? "Kliknutí, scrollování, relace" : "Clicks, scrolls, sessions", "EU (Malta)"],
                  ["Exa Neural Search", language === "cs" ? "Výzkumem obohacená analýza (PRO)" : "Research augmentation (PRO)", language === "cs" ? "Vyhledávací dotazy" : "Search queries", "US"],
                ].map(([proc, purpose, data, loc], i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>{proc}</td>
                    <td style={tdStyle}>{purpose}</td>
                    <td style={tdStyle}>{data}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        background: loc.includes("EU") ? "rgba(161,197,10,0.12)" : "rgba(63,81,181,0.12)",
                        color: loc.includes("EU") ? "#A1C50A" : "rgba(63,81,181,0.9)",
                        border: loc.includes("EU") ? "1px solid rgba(161,197,10,0.2)" : "1px solid rgba(63,81,181,0.2)",
                      }}>{loc}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 7: International Data Transfers */}
        <div style={card}>
          <span style={sectionNumber(7)}>{language === "cs" ? "Sekce 7" : "Section 7"}</span>
          <h2 style={heading}>{language === "cs" ? "Mezinárodní přenosy dat" : "International Data Transfers"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Protože DataPalo je provozováno z České republiky (EU), ale využívá několik poskytovatelů služeb se sídlem v USA, vaše osobní údaje mohou být přeneseny mimo Evropský hospodářský prostor (EHP)."
              : "As DataPalo is operated from the Czech Republic (EU) but relies on several US-based service providers, your personal data may be transferred outside the European Economic Area (EEA)."}
          </p>
          <p style={para}>{language === "cs" ? "Zajišťujeme, aby takové přenosy byly v souladu s požadavky GDPR prostřednictvím:" : "We ensure compliance through:"}</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {(language === "cs" ? [
              ["EU-US Data Privacy Framework (DPF)", "Využíváme zpracovatele certifikované v rámci EU-US Data Privacy Framework."],
              ["Standardní smluvní doložky (SCC)", "Pro přenosy nezajištěné rozhodnutím o přiměřenosti používáme standardní smluvní doložky Evropské komise."],
              ["Doplňková opatření", "V případě potřeby zavádíme další technická a organizační opatření, jako je šifrování při přenosu i v klidu."],
            ] : [
              ["EU-US Data Privacy Framework (DPF)", "We use processors certified under the EU-US Data Privacy Framework."],
              ["Standard Contractual Clauses (SCCs)", "For transfers not covered by an adequacy decision, we rely on the European Commission's SCCs (2021/914)."],
              ["Supplementary Measures", "Where necessary, we implement additional technical and organizational measures, such as encryption in transit and at rest."],
            ]).map(([title, desc], i) => (
              <li key={i} style={{ ...bullet, marginBottom: "14px" }}>
                <span style={{ color: "#E06792", marginRight: "8px" }}>&#9654;</span>
                <strong style={{ color: "rgba(255,255,255,0.85)" }}>{title}</strong> — {desc}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 8: Data Retention */}
        <div style={card}>
          <span style={sectionNumber(8)}>{language === "cs" ? "Sekce 8" : "Section 8"}</span>
          <h2 style={heading}>{language === "cs" ? "Uchovávání údajů" : "Data Retention"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Vaše osobní údaje uchováváme pouze po dobu nezbytnou k naplnění účelů, pro které byly shromážděny, nebo jak vyžaduje zákon."
              : "We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by law."}
          </p>
          <div style={tableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{language === "cs" ? "Kategorie" : "Data Category"}</th>
                  <th style={thStyle}>{language === "cs" ? "Doba uchovávání" : "Retention Period"}</th>
                  <th style={thStyle}>{language === "cs" ? "Odůvodnění" : "Rationale"}</th>
                </tr>
              </thead>
              <tbody>
                {(language === "cs" ? [
                  ["Údaje o účtu", "Do smazání účtu + 30 dní", "Poskytování služby; lhůta pro reaktivaci"],
                  ["Autentizační údaje", "Do smazání účtu", "Spravováno Supabase"],
                  ["Nahrané soubory", "Zpracovány v paměti; neuloženy trvale", "Minimalizace údajů"],
                  ["Výsledky analýz", "Do smazání účtu nebo ručního smazání", "Přístup k minulým analýzám"],
                  ["Platební záznamy", "10 let po transakci", "Český daňový zákon (zákon č. 563/1991 Sb.)"],
                  ["Google Analytics", "14 měsíců (výchozí GA4)", "Zlepšování analytiky"],
                  ["Hotjar data", "365 dní", "Výchozí behaviorální analytiky"],
                  ["Mailchimp data", "Do odvolání souhlasu nebo smazání účtu", "E-mailový marketing"],
                ] : [
                  ["Account data (name, email)", "Until account deletion + 30 days", "Service delivery; grace period for reactivation"],
                  ["Authentication credentials", "Until account deletion", "Managed by Supabase"],
                  ["Uploaded files (CSV/Excel)", "Processed in memory; not permanently stored", "Data minimization"],
                  ["Analysis results", "Until account deletion or manual deletion", "User access to past analyses"],
                  ["Payment records", "10 years after transaction", "Czech tax law (Act No. 563/1991 Coll.)"],
                  ["Google Analytics data", "14 months (GA4 default)", "Analytics improvement"],
                  ["Hotjar data", "365 days", "Behavioral analytics defaults"],
                  ["Mailchimp data", "Until consent withdrawal or account deletion", "Email marketing"],
                ]).map(([cat, period, rationale], i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{cat}</td>
                    <td style={tdStyle}>{period}</td>
                    <td style={{ ...tdStyle, fontSize: "0.82rem" }}>{rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 9: Your Rights Under GDPR */}
        <div style={card}>
          <span style={sectionNumber(9)}>{language === "cs" ? "Sekce 9" : "Section 9"}</span>
          <h2 style={heading}>{language === "cs" ? "Vaše práva podle GDPR" : "Your Rights Under GDPR"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Jako subjekt údajů podle GDPR a českého zákona o zpracování osobních údajů (zákon č. 110/2019 Sb.) máte následující práva:"
              : "As a data subject under the GDPR and the Czech Personal Data Processing Act (Act No. 110/2019 Coll.), you have the following rights:"}
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {(language === "cs" ? [
              ["Právo na přístup (čl. 15)", "Můžete požádat o kopii osobních údajů, které o vás uchováváme."],
              ["Právo na opravu (čl. 16)", "Můžete požádat o opravu nepřesných nebo neúplných údajů."],
              ["Právo na výmaz (čl. 17)", "Můžete požádat o smazání vašich osobních údajů (\"právo být zapomenut\")."],
              ["Právo na omezení zpracování (čl. 18)", "Můžete požádat o omezení zpracování vašich osobních údajů."],
              ["Právo na přenositelnost (čl. 20)", "Můžete požádat o obdržení vašich údajů ve strukturovaném, strojově čitelném formátu."],
              ["Právo vznést námitku (čl. 21)", "Můžete vznést námitku proti zpracování vašich osobních údajů na základě oprávněných zájmů."],
              ["Právo odvolat souhlas (čl. 7)", "Pokud je zpracování založeno na souhlasu, můžete jej kdykoli odvolat."],
              ["Právo podat stížnost", "Máte právo podat stížnost u ÚOOÚ, pokud se domníváte, že vaše práva byla porušena."],
            ] : [
              ["Right of Access (Art. 15)", "You may request a copy of the personal data we hold about you."],
              ["Right to Rectification (Art. 16)", "You may request correction of inaccurate or incomplete personal data."],
              ["Right to Erasure (Art. 17)", "You may request deletion of your personal data (\"right to be forgotten\")."],
              ["Right to Restrict Processing (Art. 18)", "You may request that we limit the processing of your personal data."],
              ["Right to Data Portability (Art. 20)", "You may request to receive your data in a structured, machine-readable format."],
              ["Right to Object (Art. 21)", "You may object to the processing of your personal data based on legitimate interests."],
              ["Right to Withdraw Consent (Art. 7)", "Where processing is based on consent, you may withdraw it at any time."],
              ["Right to Lodge a Complaint", "You have the right to lodge a complaint with the Czech Data Protection Authority (ÚOOÚ)."],
            ]).map(([title, desc], i) => (
              <li key={i} style={{ ...bullet, marginBottom: "12px" }}>
                <span style={{ color: "#3F51B5", marginRight: "8px" }}>&#9654;</span>
                <strong style={{ color: "rgba(255,255,255,0.85)" }}>{title}</strong> — {desc}
              </li>
            ))}
          </ul>

          <h3 style={subheading}>{language === "cs" ? "Jak uplatnit svá práva" : "How to Exercise Your Rights"}</h3>
          <p style={para}>
            {language === "cs"
              ? "Pro uplatnění kteréhokoli z těchto práv nás prosím kontaktujte na "
              : "To exercise any of these rights, please contact us at "}
            <a href="mailto:michael@agentforge.tech" style={{ color: "#E06792", textDecoration: "none" }}>michael@agentforge.tech</a>.
            {language === "cs"
              ? " Na vaši žádost odpovíme do 30 dnů, jak vyžaduje GDPR."
              : " We will respond within 30 days, as required by the GDPR."}
          </p>

          <div style={{
            background: "rgba(63,81,181,0.06)",
            border: "1px solid rgba(63,81,181,0.15)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginTop: "20px",
          }}>
            <p style={{ ...para, marginBottom: "8px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
              {language === "cs" ? "Kontakt na dozorový úřad" : "Supervisory Authority Contact"}
            </p>
            <p style={{ ...para, marginBottom: "4px", fontSize: "0.88rem" }}>ÚOOÚ — Úřad pro ochranu osobních údajů</p>
            <p style={{ ...para, marginBottom: "4px", fontSize: "0.88rem" }}>
              <a href="https://www.uoou.cz" style={{ color: "#E06792", textDecoration: "none" }}>www.uoou.cz</a>{" · "}
              <a href="mailto:posta@uoou.gov.cz" style={{ color: "#E06792", textDecoration: "none" }}>posta@uoou.gov.cz</a>
            </p>
            <p style={{ ...para, marginBottom: 0, fontSize: "0.88rem" }}>Pplk. Sochora 27, 170 00 Prague 7, Czech Republic</p>
          </div>
        </div>

        {/* Section 10: Cookies & Tracking */}
        <div style={card}>
          <span style={sectionNumber(10)}>{language === "cs" ? "Sekce 10" : "Section 10"}</span>
          <h2 style={heading}>{language === "cs" ? "Cookies a sledovací technologie" : "Cookies & Tracking Technologies"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "DataPalo používá cookies a podobné technologie pro poskytování, zabezpečení a zlepšování naší služby. V souladu s českým zákonem vyžadujeme váš výslovný souhlas před nastavením jakýchkoli neesenciálních cookies."
              : "DataPalo uses cookies and similar technologies to provide, secure, and improve our service. In accordance with Czech law, we require your opt-in consent before setting any non-essential cookies."}
          </p>

          <h3 style={subheading}>10.1 {language === "cs" ? "Esenciální cookies" : "Essential Cookies"}</h3>
          <p style={para}>
            {language === "cs"
              ? "Tyto cookies jsou nezbytně nutné pro provoz webu. Nelze je zakázat."
              : "These cookies are strictly necessary. They enable core functionality like authentication. They cannot be disabled."}
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={bullet}><span style={{ color: "rgba(161,197,10,0.7)", marginRight: "8px" }}>&#8226;</span> <strong style={{ color: "rgba(255,255,255,0.85)" }}>Supabase session cookies</strong> — {language === "cs" ? "Udržují váš přihlášený stav" : "Maintain your logged-in state"}</li>
          </ul>

          <h3 style={subheading}>10.2 {language === "cs" ? "Analytické cookies" : "Analytics Cookies"}</h3>
          <p style={para}>{language === "cs" ? "Tyto cookies se nastavují pouze s vaším souhlasem:" : "These cookies are set only with your consent:"}</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={bullet}><span style={{ color: "rgba(161,197,10,0.7)", marginRight: "8px" }}>&#8226;</span> <strong style={{ color: "rgba(255,255,255,0.85)" }}>Google Analytics 4</strong> (G-FQ11DN6HD9) — {language === "cs" ? "Anonymizovaná data o návštěvách" : "Anonymized page views and engagement metrics"}</li>
            <li style={bullet}><span style={{ color: "rgba(161,197,10,0.7)", marginRight: "8px" }}>&#8226;</span> <strong style={{ color: "rgba(255,255,255,0.85)" }}>Hotjar</strong> (6601763) — {language === "cs" ? "Anonymizované nahrávání sessions a heatmapy" : "Anonymized session recordings and heatmaps"}</li>
          </ul>
        </div>

        {/* Section 11: Data Security */}
        <div style={card}>
          <span style={sectionNumber(11)}>{language === "cs" ? "Sekce 11" : "Section 11"}</span>
          <h2 style={heading}>{language === "cs" ? "Zabezpečení dat" : "Data Security"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Implementujeme vhodná technická a organizační opatření k ochraně vašich osobních údajů:"
              : "We implement appropriate technical and organizational measures to protect your personal data:"}
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {(language === "cs" ? [
              ["Šifrování při přenosu", "Veškerá data přenášená mezi vaším prohlížečem a našimi servery jsou šifrována pomocí TLS."],
              ["Šifrování v klidu", "Data uložená v naší databázi (Supabase) jsou šifrována pomocí AES-256."],
              ["Bezpečná autentizace", "Supabase zajišťuje autentizaci s průmyslovými standardy bezpečnosti."],
              ["PCI DSS shoda", "Veškerá platební data zpracovává Stripe s certifikací PCI DSS Level 1."],
              ["Sandboxované spouštění", "Analytický kód běží v izolovaných, sandboxovaných prostředích (E2B)."],
              ["Řízení přístupu", "Přístup k uživatelským datům je přísně omezen principem minimálních oprávnění."],
            ] : [
              ["Encryption in Transit", "All data transmitted between your browser and our servers is encrypted using TLS."],
              ["Encryption at Rest", "Data stored in our database (Supabase) is encrypted at rest using AES-256."],
              ["Secure Authentication", "Supabase handles authentication with industry-standard security practices."],
              ["PCI DSS Compliance", "All payment data is processed by Stripe, PCI DSS Level 1 certified."],
              ["Sandboxed Execution", "Data analysis code runs in isolated, sandboxed environments (E2B)."],
              ["Access Controls", "Access to user data is strictly limited and follows the principle of least privilege."],
            ]).map(([title, desc], i) => (
              <li key={i} style={{ ...bullet, marginBottom: "12px" }}>
                <span style={{ color: "#A1C50A", marginRight: "8px" }}>&#9632;</span>
                <strong style={{ color: "rgba(255,255,255,0.85)" }}>{title}</strong> — {desc}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 12: Children's Privacy */}
        <div style={card}>
          <span style={sectionNumber(12)}>{language === "cs" ? "Sekce 12" : "Section 12"}</span>
          <h2 style={heading}>{language === "cs" ? "Ochrana soukromí dětí" : "Children's Privacy"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "DataPalo není určeno pro děti. V souladu s českým zákonem je minimální věk pro poskytování souhlasu se zpracováním osobních údajů 15 let. Vědomě neshromažďujeme osobní údaje od osob mladších 15 let."
              : "DataPalo is not directed at children. In accordance with Czech law, the minimum age for providing consent is 15 years. We do not knowingly collect personal data from individuals under 15."}
          </p>
        </div>

        {/* Section 13: Changes to This Policy */}
        <div style={card}>
          <span style={sectionNumber(13)}>{language === "cs" ? "Sekce 13" : "Section 13"}</span>
          <h2 style={heading}>{language === "cs" ? "Změny těchto zásad" : "Changes to This Policy"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Tyto zásady ochrany osobních údajů můžeme čas od času aktualizovat. Při podstatných změnách:"
              : "We may update this Privacy Policy from time to time. When we make material changes, we will:"}
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {(language === "cs"
              ? ["Aktualizujeme datum \"Poslední aktualizace\" v záhlaví", "Upozorníme registrované uživatele e-mailem", "Zobrazíme výrazné upozornění na webu"]
              : ["Update the \"Last Updated\" date at the top of this policy", "Notify registered users via email about significant changes", "Display a prominent notice on our website"]
            ).map((item, i) => (
              <li key={i} style={bullet}><span style={{ color: "rgba(161,197,10,0.7)", marginRight: "8px" }}>&#8226;</span> {item}</li>
            ))}
          </ul>
        </div>

        {/* Section 14: Contact Us */}
        <div style={card}>
          <span style={sectionNumber(14)}>{language === "cs" ? "Sekce 14" : "Section 14"}</span>
          <h2 style={heading}>{language === "cs" ? "Kontaktujte nás" : "Contact Us"}</h2>
          <hr style={divider} />
          <p style={para}>
            {language === "cs"
              ? "Máte-li jakékoli dotazy, obavy nebo požadavky ohledně těchto zásad nebo našich datových postupů, neváhejte nás kontaktovat:"
              : "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:"}
          </p>
          <div style={tableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{language === "cs" ? "Metoda" : "Method"}</th>
                  <th style={thStyle}>{language === "cs" ? "Údaje" : "Details"}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [language === "cs" ? "Email (hlavní)" : "Email (Primary)", <a key="p" href="mailto:michael@agentforge.tech" style={{ color: "#E06792", textDecoration: "none" }}>michael@agentforge.tech</a>],
                  [language === "cs" ? "Email (alternativní)" : "Email (Alternative)", <a key="a" href="mailto:michael@forgecreative.cz" style={{ color: "#E06792", textDecoration: "none" }}>michael@forgecreative.cz</a>],
                  ["Website", <a key="w" href="https://www.datapalo.app" style={{ color: "#E06792", textDecoration: "none" }}>www.datapalo.app</a>],
                  [language === "cs" ? "Správce údajů" : "Data Controller", "FORGE CREATIVE | AI Job Agency — Czech Republic"],
                ].map(([label, value], i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>{label}</td>
                    <td style={tdStyle}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...para, marginTop: "16px" }}>
            {language === "cs"
              ? "Na všechny dotazy se snažíme odpovědět do 30 dnů."
              : "We aim to respond to all inquiries within 30 days."}
          </p>
        </div>

        {/* ── Footer ── */}
        <div style={{
          textAlign: "center",
          padding: "40px 0 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          marginTop: "20px",
        }}>
          <div style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: "1.3rem",
            marginBottom: "6px",
          }}>
            <span style={{ color: "#E06792" }}>Data</span><span style={{ color: "rgba(255,255,255,0.9)" }}>Palo</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Satoshi', sans-serif", fontSize: "0.95rem" }}> — AI-Powered Data Analysis</span>
          </div>
          <div style={{ ...para, fontSize: "0.82rem", marginBottom: "8px" }}>
            <a href="https://www.datapalo.app" style={{ color: "#E06792", textDecoration: "none" }}>www.datapalo.app</a>
            <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 8px" }}>|</span>
            <a href="mailto:michael@agentforge.tech" style={{ color: "#E06792", textDecoration: "none" }}>michael@agentforge.tech</a>
          </div>
          <p style={{ ...para, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: 0 }}>
            &copy; 2026 FORGE CREATIVE | AI Job Agency. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
