import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Pool Rental Near Me" },
      {
        name: "description",
        content:
          "How PRNM Corp (Pool Rental Near Me) collects, uses, shares, and protects personal information across our marketplace and Pool Host Academy.",
      },
      { property: "og:title", content: "Privacy Policy — Pool Rental Near Me" },
      {
        property: "og:description",
        content:
          "How we handle your data: collection, use, sharing, retention, your rights, and California/EU disclosures.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
});

function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate="May 3, 2026"
      lastUpdated="May 3, 2026"
    >
      <p>
        <strong>PoolRentalNearMe.com / PRNM Corp</strong>
        <br />
        Policy Version: PRNM-2026.01 (supersedes prior versions, including
        PRNM-2025.02 and 855527-EX)
      </p>

      <h2>Who We Are</h2>
      <p>
        This Privacy Policy explains how <strong>PRNM Corp</strong> (doing
        business as "Pool Rental Near Me," "PRNM," "Company," "we," "us," "our")
        collects, uses, shares, protects, and retains personal information
        related to:
      </p>
      <ul>
        <li>The website PoolRentalNearMe.com and any subdomains</li>
        <li>Mobile applications (current and future)</li>
        <li>The Pool Host Academy and educational modules</li>
        <li>Communication channels (email, SMS, chat, phone, social media)</li>
        <li>APIs, integrations, and related services</li>
      </ul>
      <p>
        Collectively referred to as the "Services." By using the Services you
        accept this Privacy Policy. If you do not agree, do not use the
        Services.
      </p>
      <p>
        PRNM Corp is the operator of the Pool Rental Near Me marketplace.
        Certain ancillary services (e.g., Pool Host Academy training content,
        RentalWaivers.com, BookMyPool.com) may be operated by 10,000 Solutions
        LLC, an affiliated but separate entity. Where those services are
        accessed through PRNM marketplace touchpoints, this Policy governs the
        marketplace data flow; the affiliated services maintain their own
        privacy notices.
      </p>

      <h2>Scope and Roles</h2>
      <ul>
        <li>
          <strong>Data Controller (GDPR context):</strong> PRNM Corp for core
          Service operations.
        </li>
        <li>
          <strong>Data Processor:</strong> In limited cases when acting on
          behalf of certain enterprise or integration partners (if applicable).
        </li>
        <li>
          <strong>Hosts and Guests:</strong> Host-selected listing data (e.g.,
          pool photos, approximate location, descriptions) may appear publicly
          once approved.
        </li>
        <li>
          <strong>Recruiters / Acquisition Partners / Affiliates:</strong>{" "}
          Treated as business users with additional compliance expectations.
        </li>
      </ul>

      <h2>Definitions (Plain Language)</h2>
      <ul>
        <li>
          <strong>Personal Information / Personal Data:</strong> Information
          that identifies or can reasonably be linked to an individual.
        </li>
        <li>
          <strong>Sell (CCPA/CPRA):</strong> Transferring personal information
          for monetary or other valuable consideration.
        </li>
        <li>
          <strong>Share (CPRA):</strong> Disclosure of personal information for
          cross-context behavioral advertising.
        </li>
        <li>
          <strong>Sensitive Personal Information (SPI):</strong> Government IDs,
          precise geolocation, financial account numbers, certain verification
          documents.
        </li>
        <li>
          <strong>Global Privacy Control (GPC):</strong> A browser or device
          signal we treat as an opt-out where required.
        </li>
      </ul>

      <h2>Categories of Personal Information We Collect</h2>
      <p>
        We may collect some or all of the following categories. Where a purpose
        is stated it is illustrative rather than exhaustive.
      </p>
      <ul>
        <li>
          <strong>Identifiers:</strong> Name, username, display name, email
          address, phone number, IP address. Used for account creation, login,
          communication, security.
        </li>
        <li>
          <strong>Contact and Profile Details:</strong> Address (billing or
          approximate location), profile photo, biography. Used for listings,
          trust, and support.
        </li>
        <li>
          <strong>Account Credentials:</strong> Password (hashed),
          authentication tokens, session data. Used for secure access.
        </li>
        <li>
          <strong>Payment and Payout Data:</strong> Billing address, transaction
          history, partial card or payment token (stored by processor), payout
          details. Used for bookings, host payouts, accounting, tax compliance.
        </li>
        <li>
          <strong>Demographic Information:</strong> Age (to validate
          eligibility), optional gender or language preferences if provided.
          Used for eligibility and platform localization.
        </li>
        <li>
          <strong>Commercial / Transactional Information:</strong> Booking
          history, host earnings, items purchased (e.g., premium features). Used
          for analytics, service delivery, payouts.
        </li>
        <li>
          <strong>Internet / Network Activity:</strong> Log data, browser type,
          device type, referral URLs, pages viewed, session timestamps. Used for
          performance, security, analytics.
        </li>
        <li>
          <strong>Device and Technical Data:</strong> Operating system, app
          version, unique device identifiers. Used for troubleshooting, feature
          optimization.
        </li>
        <li>
          <strong>Location Data:</strong> Approximate location (IP-based).
          Optional precise geolocation if you grant permission. Used for search
          relevance, fraud prevention.
        </li>
        <li>
          <strong>User-Generated Content:</strong> Listing descriptions, pool
          images, capacity info, pricing, reviews, ratings, messages (where
          stored), course feedback. Used to power the marketplace and
          educational offerings.
        </li>
        <li>
          <strong>Communication Records:</strong> Support tickets, emails, chat
          transcripts, phone logs (where legally permissible). Used for customer
          service and quality assurance.
        </li>
        <li>
          <strong>Education / Learning Data:</strong> Course enrollments, module
          completion status. Used to deliver Pool Host Academy functionality.
        </li>
        <li>
          <strong>Inferences and Preference Segments:</strong> Booking
          propensity, category interests, host performance indicators. Used for
          personalization and product improvement.
        </li>
        <li>
          <strong>Identity Verification Data:</strong> Government ID
          confirmation details or verification tokens. Used for fraud prevention
          and trust.
        </li>
        <li>
          <strong>Sensitive Personal Information (limited):</strong> Identity
          verification fragments, payment token reference, precise geolocation
          (only with explicit permission). Used strictly for security,
          compliance, or core functionality.
        </li>
      </ul>
      <p>
        We do not knowingly collect biometric data. We do not store full payment
        card numbers (our payment processor handles secure tokenization).
      </p>

      <h2>Sources of Personal Information</h2>
      <ul>
        <li>
          <strong>Direct Submission:</strong> Registration forms, booking forms,
          host listing creation, support communications, surveys, feedback
          forms.
        </li>
        <li>
          <strong>Automatic Collection:</strong> Cookies, pixels, SDKs,
          analytics scripts, server logs.
        </li>
        <li>
          <strong>Third Parties:</strong> Payment processors, analytics
          providers, identity verification and anti-fraud vendors, marketing or
          advertising networks, referral and affiliate partners, social
          platforms if you connect accounts.
        </li>
        <li>
          <strong>Publicly Available Information:</strong> Public records or
          publicly posted pool-related details used to validate accuracy or
          legitimacy.
        </li>
        <li>
          <strong>Referral / Recruiter Partners:</strong> Host lead data or
          contact information submitted under partner agreements.
        </li>
      </ul>

      <h2>Lawful Bases for Processing (GDPR / UK GDPR / Similar Frameworks)</h2>
      <p>We rely on one or more of the following lawful bases:</p>
      <ul>
        <li>
          <strong>Contract:</strong> To provide requested Services (accounts,
          bookings, payouts).
        </li>
        <li>
          <strong>Legitimate Interests:</strong> Improve platform, ensure
          security, prevent fraud, analyze usage, enhance user experience
          (balanced against individual rights).
        </li>
        <li>
          <strong>Consent:</strong> Marketing emails/SMS where required,
          non-essential cookies, precise geolocation, certain promotions.
        </li>
        <li>
          <strong>Legal Obligation:</strong> Tax reporting, responding to lawful
          requests, maintaining financial records.
        </li>
        <li>
          <strong>Vital Interests / Safety:</strong> Addressing urgent safety
          incidents or emergencies.
        </li>
        <li>
          <strong>Public Interest (rare):</strong> Only if mandated by binding
          legal authority.
        </li>
      </ul>
      <p>
        You may withdraw consent at any time where consent is the lawful basis.
      </p>

      <h2>How We Use Personal Information</h2>
      <ul>
        <li>Provide and operate the Services (accounts, bookings, payouts, messaging).</li>
        <li>Display and facilitate host listings and guest discovery.</li>
        <li>Personalize search results, recommendations, notifications, dashboards.</li>
        <li>Process payments, issue refunds, manage host payouts, prepare tax documents.</li>
        <li>Communicate transactional notifications, service changes, support responses.</li>
        <li>Marketing (if permitted): offers, promotions, platform updates.</li>
        <li>Pool Host Academy delivery (courses, progress tracking).</li>
        <li>Security and fraud prevention: monitor suspicious activity, block abusive conduct.</li>
        <li>Analytics and product development: usage trends, performance metrics, feature testing.</li>
        <li>Compliance and dispute resolution: investigate disputes, enforce terms, respond to lawful requests.</li>
        <li>Corporate transactions: due diligence for mergers, acquisitions, reorganizations, or asset sales.</li>
        <li>AI / automated assistance (non-determinative): score trust or quality signals with human oversight available.</li>
      </ul>

      <h2>Cookies and Similar Technologies</h2>
      <p>We may use:</p>
      <ul>
        <li><strong>Strictly Necessary Cookies:</strong> Authentication, security, core navigation.</li>
        <li><strong>Functional Cookies:</strong> User preferences, saved filters.</li>
        <li><strong>Performance / Analytics Tools:</strong> Traffic measurement, feature effectiveness, error tracking.</li>
        <li><strong>Advertising / Retargeting Technologies:</strong> Interest-based ads (only where permitted and after opt-in/opt-out compliance).</li>
        <li><strong>Social / Embedded Media Scripts:</strong> Map tiles, video embeds, social sharing.</li>
      </ul>
      <p><strong>Controls you have:</strong></p>
      <ul>
        <li>Regional cookie consent banner (for EU/UK/EEA and certain US states).</li>
        <li>Browser or device settings to clear or block cookies.</li>
        <li>Opt-out of certain analytics or ads where mechanisms exist.</li>
        <li>Global Privacy Control signal honored as an opt-out of "sale" / "share" where required.</li>
      </ul>

      <h2>Data Sharing and Disclosure</h2>
      <p>
        We do not sell personal information for monetary consideration. We may
        "share" identifiers and usage data for cross-context behavioral
        advertising unless you opt out.
      </p>
      <p><strong>Potential disclosures:</strong></p>
      <ul>
        <li><strong>Service Providers / Processors:</strong> Hosting, payments, email/SMS delivery, analytics, identity verification, image moderation, customer support, security tools.</li>
        <li><strong>Advertising / Marketing Partners:</strong> Only for permitted and consented ad use.</li>
        <li><strong>Payment and Payout Partners:</strong> Transaction settlement, fraud checks, tax reporting.</li>
        <li><strong>Legal / Regulatory:</strong> To comply with applicable law, lawful requests, and to protect rights.</li>
        <li><strong>Corporate Transactions:</strong> Transfer to successor entity during mergers, acquisitions, reorganizations, asset sales (with notice).</li>
        <li><strong>Other Users:</strong> Host listing content (photos, approximate location, description), reviews, usernames or display names.</li>
        <li><strong>Aggregated or De-Identified Data:</strong> Market analysis, trends, platform performance.</li>
        <li><strong>Affiliated Entities:</strong> Limited sharing with 10,000 Solutions LLC and its products (Pool Host Academy, RentalWaivers.com, BookMyPool.com) where you opt into or use those services.</li>
        <li><strong>With Consent:</strong> Any additional disclosures you explicitly authorize.</li>
      </ul>

      <h2>International Data Transfers</h2>
      <p>
        Data may be processed in the United States and other jurisdictions.
        Safeguards may include Standard Contractual Clauses (SCCs), UK Addendum,
        or equivalent legal mechanisms. Additional technical and organizational
        measures are applied to protect data. You can request more details
        (subject to redactions).
      </p>

      <h2>Data Security</h2>
      <p>We use organizational, technical, and administrative safeguards including:</p>
      <ul>
        <li>Encryption at rest and in transit (TLS)</li>
        <li>Role-based access controls and least privilege approaches</li>
        <li>Segmented infrastructure and credential management</li>
        <li>Vulnerability management, patching, and monitoring</li>
        <li>Incident response plan and breach notification protocols</li>
      </ul>
      <p>
        Despite safeguards, no method of transmission or storage is 100% secure;
        user diligence (strong password, avoiding credential reuse) is
        encouraged.
      </p>

      <h2>Data Retention</h2>
      <p>
        We retain personal information only as long as necessary for stated
        purposes or legal obligations. Illustrative retention patterns:
      </p>
      <ul>
        <li><strong>Account Profile Data:</strong> Retained while account is active plus a reasonable period (up to 2 years) for reactivation or dispute resolution.</li>
        <li><strong>Transaction and Financial Records:</strong> Typically 7 years (or longer if required) for tax/audit/legal obligations.</li>
        <li><strong>Booking and Messaging Records:</strong> Duration of account plus a limited period for support, fraud, and dispute handling.</li>
        <li><strong>Support Tickets:</strong> Generally 3–5 years for quality assurance and reference.</li>
        <li><strong>Marketing Preferences and Opt-Out Logs:</strong> Retained to demonstrate compliance.</li>
        <li><strong>Host Payout and Tax Documentation:</strong> 7–10 years depending on jurisdictional requirements.</li>
        <li><strong>Security / Fraud Logs:</strong> Retained for extended periods (3–7 years) to detect patterns.</li>
        <li><strong>Analytics Data (pseudonymized or aggregated):</strong> Typically 12–36 months.</li>
        <li><strong>De-Identified Data Sets:</strong> May be retained indefinitely (not reasonably re-identifiable).</li>
      </ul>
      <p>
        Upon verified deletion request and eligibility, we will delete,
        de-identify, or anonymize unless retention is mandated by law or
        necessary for legitimate defense.
      </p>

      <h2>Your Rights and Choices</h2>
      <p>Rights vary based on jurisdiction but may include:</p>
      <ul>
        <li><strong>Access:</strong> Request confirmation and a copy of personal data.</li>
        <li><strong>Correction (Rectification):</strong> Update inaccurate or incomplete data.</li>
        <li><strong>Deletion (Erasure):</strong> Request deletion; exceptions apply (legal obligations, disputes).</li>
        <li><strong>Restrict Processing:</strong> Limit certain processing where legally available.</li>
        <li><strong>Object:</strong> Object to processing based on legitimate interests or direct marketing.</li>
        <li><strong>Data Portability:</strong> Receive certain data in a structured, commonly used, machine-readable format.</li>
        <li><strong>Withdraw Consent:</strong> For activities relying solely on consent (e.g., certain marketing or geolocation).</li>
        <li><strong>Opt-Out of Marketing:</strong> Use unsubscribe links, STOP for SMS, or settings.</li>
        <li><strong>Opt-Out of Sale/Sharing (California and similar states):</strong> Use the "Do Not Sell or Share My Personal Information" link or a recognized GPC signal.</li>
        <li><strong>Limit Use of Sensitive Personal Information (CPRA):</strong> Where SPI use exceeds allowable scope (we currently restrict SPI to essential operations).</li>
        <li><strong>Appeal (Colorado / Connecticut / Virginia / etc.):</strong> Appeal denied rights requests by emailing privacy contact; unresolved issues may be escalated to the state Attorney General.</li>
        <li><strong>EU/UK Specific:</strong> Right to lodge a complaint with a supervisory authority, and right not to be subject to a decision based solely on automated processing producing legal or similarly significant effects (we do not currently engage in such processing).</li>
      </ul>
      <p><strong>How to exercise rights:</strong></p>
      <ul>
        <li>Use our <a href="/p/privacy-request">privacy request form</a> (preferred — routes directly to our privacy team).</li>
        <li>Or email: <a href="mailto:privacy@poolrentalnearme.com">privacy@poolrentalnearme.com</a></li>
        <li>Provide sufficient information for verification.</li>
        <li>We generally respond within 30–45 days (extensions may apply under applicable law).</li>
      </ul>

      <h2>Children's Privacy</h2>
      <p>
        Services are not directed to children under 13 (US) or the minimum
        digital consent age in their jurisdiction (13–16 in the EU/UK depending
        on country). We do not knowingly collect data from minors under these
        thresholds. If you believe we inadvertently collected such data, contact
        us for deletion. Hosts must follow all laws regarding minors attending
        events.
      </p>

      <h2>Marketing Communications</h2>
      <ul>
        <li><strong>Transactional Emails:</strong> Booking confirmations, security alerts, account notices (cannot generally be opted out).</li>
        <li><strong>Promotional Emails / SMS / Push:</strong> You can opt out via unsubscribe link, STOP reply (SMS), device settings (push), or account settings.</li>
        <li><strong>Pool Host Academy Notifications:</strong> May be managed separately within Academy account settings.</li>
      </ul>

      <h2>User-Generated Content</h2>
      <p>
        Content you submit (listings, photos, reviews, public Q&amp;A) may be
        displayed publicly. Avoid providing sensitive data in public fields. We
        may moderate or remove content that violates our policies.
      </p>

      <h2>Third-Party Services and Links</h2>
      <p>
        External websites, integrated widgets, payment processors, or social
        media platforms have independent privacy practices. Review their
        policies. We are not responsible for third-party handling outside our
        control.
      </p>

      <h2>Security Incidents and Breach Notification</h2>
      <p>
        If a data breach materially impacts your personal information, we will
        provide notifications as required by law, which may include recommended
        protective steps (e.g., password reset vigilance).
      </p>

      <h2>International Users</h2>
      <p>
        By using the Services outside the United States you consent to
        transferring and processing your data in the United States and other
        jurisdictions, subject to safeguards described in this Policy.
      </p>

      <h2>Automated Tools and Profiling</h2>
      <p>
        We may apply non-sensitive scoring (e.g., host quality indicators, trust
        signals) to improve platform safety and performance. These do not
        produce decisions with legal or similarly significant effects without
        human involvement. You may request explanation or review.
      </p>

      <h2>Financial and Tax Compliance</h2>
      <p>
        We process host payout information and may produce required tax forms
        (e.g., 1099-K or similar) and share with tax authorities where mandated.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Policy periodically. Material changes may be
        highlighted via banner, email, or dashboard notice. Revised versions are
        effective on the posted Effective Date. Continued use after changes
        signifies acceptance.
      </p>

      <h2>Contact Information</h2>
      <p><strong>Primary Privacy Contact:</strong></p>
      <p>
        PRNM Corp (Pool Rental Near Me)
        <br />
        Attn: Privacy Office
        <br />
        Riverside, CA 92509 USA
      </p>
      <ul>
        <li><strong>General Support:</strong> <a href="mailto:support@poolrentalnearme.com">support@poolrentalnearme.com</a></li>
        <li><strong>Privacy / Rights Requests:</strong> <a href="mailto:privacy@poolrentalnearme.com">privacy@poolrentalnearme.com</a></li>
        <li><strong>Phone:</strong> 888-940-4247 (10am – 5pm PST)</li>
      </ul>
      <p>
        If an EU/UK representative or Data Protection Officer becomes required,
        we will update this section.
      </p>

      <h2>California and Other State Disclosures</h2>
      <ul>
        <li>We do not sell personal information for money. We may "share" data for cross-context behavioral advertising; you can opt out.</li>
        <li>No financial incentive programs are active (if introduced, we will provide a required notice).</li>
        <li>We do not knowingly sell or share data of individuals under 16.</li>
        <li><strong>California Shine the Light:</strong> We do not share personal information with third parties for their own direct marketing in a manner triggering separate disclosure; if that changes, we will revise this Policy.</li>
        <li><strong>Nevada:</strong> We do not sell covered information under Nevada law; requests may be sent to the privacy email.</li>
        <li><strong>Colorado / Connecticut / Virginia / Utah:</strong> Your rights are detailed in the "Your Rights and Choices" section; appeals are accepted via the privacy contact.</li>
      </ul>

      <h2>Data Minimization and Quality</h2>
      <p>
        We collect only data reasonably necessary for stated purposes. We take
        steps to maintain accuracy (user-editable profile fields, correction
        workflows).
      </p>

      <h2>De-Identification Practices</h2>
      <p>
        Where feasible we de-identify or aggregate data by removing direct
        identifiers, hashing or tokenizing linkage keys, and applying access
        controls. We will not attempt to re-identify de-identified data except
        internally to test anonymization effectiveness.
      </p>

      <h2>Request Verification</h2>
      <p>We may verify identity by:</p>
      <ul>
        <li>Sending a confirmation link to the registered email</li>
        <li>Requesting recent booking details or limited account metadata</li>
        <li>Requesting government ID only if strictly necessary (deleted or minimized after verification)</li>
      </ul>

      <h2>Accessibility</h2>
      <p>
        We aim to provide accessible formats (plain-language summary, large
        print) upon request. Contact us if you need an alternative accessible
        version or another language variant.
      </p>

      <h2>Dispute Resolution (Reference to Terms)</h2>
      <p>
        Any privacy-related disputes may also be governed by the Terms of
        Service dispute resolution clause. This Policy does not waive any
        mandatory rights.
      </p>

      <h2>Disclaimer</h2>
      <p>
        This Privacy Policy is for transparency and does not create additional
        contractual rights beyond those in the Terms of Service or applicable
        law.
      </p>

      <h2>Plain-Language Summary</h2>
      <p>
        We collect information you give us plus data about how you use the site
        so we can run bookings, pay hosts, keep things secure, improve features,
        and (if you allow) send marketing or personalized ads. You can opt out
        of marketing and targeted advertising. We don't sell your data for
        money. You can request to see it, fix it, or ask us to delete it.
        Contact <a href="mailto:privacy@poolrentalnearme.com">privacy@poolrentalnearme.com</a>{" "}
        with questions.
      </p>

      <hr />
      <p className="text-sm text-muted-foreground">© 2026 PRNM Corp. All rights reserved.</p>
    </LegalPage>
  );
}
