# InvestRI — Master Cursor Implementation Plan
## Working product: A Rhode Island alternative-investment marketplace for everyday residents

> **Status:** Product/engineering plan for a proof of concept and procurement demonstration.  
> **Important:** All securities structures, tax-credit percentages, eligibility rules, return targets, liquidity terms, and offering terms in the POC are illustrative and must be configurable. Do not encode them as legal facts. No real-money investing should be enabled until securities counsel, tax counsel, the Rhode Island Commerce Corporation, the Rhode Island Division of Taxation, and the selected regulated intermediary approve the production structure.

---

# 1. Product thesis

Build **InvestRI**, a mobile-first alternative-investment marketplace that feels like a Rhode-Island-specific version of Yieldstreet / Willow Wealth.

The citizen experience should be consumer-grade:
- browse investments
- understand return, risk, term, minimum, liquidity, fees, and impact
- understand the separate Rhode Island tax incentive
- verify identity and Rhode Island residency
- complete investor suitability / eligibility workflow
- subscribe to an investment
- fund the investment through a regulated intermediary
- track portfolio value, cash distributions, tax-credit status, documents, and local impact
- receive updates from fund managers
- download statements and tax documents

The government experience should be a separate **InvestRI Commerce Console**:
- approve and publish investment products
- monitor investor enrollment
- monitor capital raised and deployed
- certify tax-credit eligibility
- issue or reconcile tax-credit certificates
- enforce program caps
- monitor project and fund compliance
- review recapture exposure
- track geographic and economic impact
- export data for the Division of Taxation and other oversight bodies
- maintain a complete audit trail

The InvestRI software company should ideally remain a **technology provider**, not the party holding investor funds, custodying securities, providing individualized investment advice, or executing securities transactions.

---

# 2. Product positioning

## Citizen-facing promise

**Invest in Rhode Island. Own a stake in its future.**

Residents can put money into professionally managed Rhode Island investments and, when authorized by law and certified by the State, receive a Rhode Island tax incentive in addition to the economic return of the investment.

Never present the tax credit as investment return.

Always display these separately:

1. **Investment economics**
   - amount invested
   - current value
   - distributions
   - target return
   - realized / unrealized performance

2. **State incentive**
   - potential credit
   - earned credit
   - certified credit
   - available credit
   - claimed credit
   - recaptured / forfeited credit

3. **Community impact**
   - dollars invested in Rhode Island
   - housing units
   - businesses financed
   - jobs created / retained
   - historic square footage restored
   - municipalities reached
   - other program-defined outcomes

---

# 3. V1 scope — keep it intentionally narrow

Do **not** build all five proposed funds in V1.

Build the platform so it can support many products later, but launch the POC with one illustrative product:

## InvestRI Growth Fund I — DEMO ONLY

Illustrative POC terms:
- Category: Diversified Rhode Island private markets
- Minimum investment: $100
- Target term: 5 years
- Target return: 7–10% annually
- Distribution schedule: Annual
- Liquidity: Illiquid / no guaranteed early redemption
- Rhode Island resident requirement: Yes
- Illustrative state tax credit: 20% of qualified invested capital
- Illustrative credit schedule: 5% per year for four years
- Credit status: “Subject to enabling legislation and Commerce certification”
- Example underlying allocations:
  - 35% housing / workforce housing
  - 25% small business lending
  - 15% historic redevelopment
  - 10% manufacturing
  - 10% innovation
  - 5% resiliency / clean energy

These are seed-data values only.

The database and UI must allow every field above to be changed without code.

---

# 4. Regulatory architecture principle

InvestRI must be designed so the **software is separated from regulated financial activities**.

## Preferred production boundary

### InvestRI platform
Responsible for:
- user experience
- education
- offering discovery
- Commerce workflow
- program administration
- impact reporting
- tax-credit ledger
- document presentation
- notifications
- integration orchestration

### Regulated intermediary / broker-dealer / funding portal
Responsible for whatever is legally required for the selected exemption or offering structure, potentially including:
- securities transaction execution
- escrow
- investor eligibility
- required investment-limit calculations
- AML / KYC
- offering-document acceptance
- subscription approval
- regulated books and records
- communications required by securities law

### Custodian / transfer agent / fund administrator
Potentially responsible for:
- investor ownership records
- NAV
- capital account records
- distributions
- statements
- tax reporting
- transfer-agent functions
- custody where applicable

### Fund / investment manager
Responsible for:
- investment decisions
- portfolio management
- asset valuation
- investment updates
- fund-level reporting

### Rhode Island Commerce
Responsible for program-specific public oversight, potentially including:
- program approval
- product eligibility
- tax-credit allocation
- tax-credit certification
- program caps
- economic-development compliance
- impact reporting
- recapture decisions

## Hard rule for implementation

Create provider interfaces for regulated services.

The POC uses mock providers.

Production can replace mocks without rewriting the citizen app.

---

# 5. Legal structure must remain configurable

The application must not assume one securities exemption.

Store the offering framework as data:

```ts
type OfferingFramework =
  | "REG_CF"
  | "REG_A_TIER_1"
  | "REG_A_TIER_2"
  | "RULE_147"
  | "RULE_147A"
  | "REGISTERED_FUND"
  | "MUNICIPAL_OR_QUASI_PUBLIC"
  | "OTHER";
```

Each offering includes:
- framework
- governing regulator
- investor eligibility rules
- residency rules
- investment limits
- minimum investment
- maximum investment
- disclosures
- transfer restrictions
- resale restrictions
- suitability questionnaire requirements
- accreditation requirements
- required documents
- settlement workflow
- intermediary provider

The POC should use `OTHER` or `DEMO` internally if counsel has not selected the production route.

---

# 6. Proposed tax-credit policy model

The app must support a future Rhode Island statute modeled around a simple concept:

> A qualified resident who makes and maintains a qualified investment earns a Rhode Island tax credit based on qualified invested capital.

Do not hard-code the percentage or schedule.

## Tax-credit program configuration

Create:

```ts
TaxCreditProgram {
  id
  name
  authorityCitation
  status
  effectiveDate
  sunsetDate
  totalProgramCap
  annualProgramCap
  minimumInvestment
  creditRate
  vestingMethod
  carryforwardYears
  refundable
  transferable
  residencyRequired
  minimumHoldingPeriodMonths
  recaptureEnabled
  eligibleTaxTypes[]
}
```

Supported vesting methods:
- immediate
- annual equal installments
- custom schedule
- milestone based

## Citizen tax-credit status model

```ts
TaxCreditEntitlement {
  id
  investorId
  investmentId
  programId
  qualifiedBasis
  potentialCredit
  earnedCredit
  certifiedCredit
  claimedCredit
  remainingCredit
  forfeitedCredit
  recapturedCredit
  status
}
```

Statuses:
- estimated
- pending_investment_settlement
- pending_residency_verification
- pending_commerce_review
- certified
- partially_available
- fully_available
- partially_claimed
- fully_claimed
- suspended
- recapture_review
- forfeited
- recaptured

## Critical UX rule

Every screen showing a tax incentive must distinguish:
- **Estimated**
- **Earned**
- **Certified**
- **Available to claim**
- **Claimed**

Never show “You received a $200 tax credit” until the certificate status is certified.

---

# 7. User personas

## A. Rhode Island resident investor
Wants:
- low minimum
- simple explanation
- confidence the offering is legitimate
- visible tax benefit
- portfolio tracking
- easy documents
- local impact

## B. Sophisticated / accredited Rhode Island investor
Wants:
- deeper diligence
- larger allocations
- offering documents
- historical performance
- manager information
- cash-flow details
- tax information

## C. Rhode Island Commerce program manager
Wants:
- program controls
- compliance
- tax-credit certification
- capital raised
- impact
- auditability
- downloadable reports

## D. Fund manager
Wants:
- submit product
- upload diligence
- update NAV
- report distributions
- report deployment
- publish investor updates
- submit impact metrics

## E. Compliance reviewer
Wants:
- exceptions queue
- KYC/residency flags
- offering limits
- certificates
- recapture cases
- immutable logs

## F. Auditor / oversight user
Read-only access to:
- program history
- approvals
- certificates
- fund-level data
- transaction history
- change logs

---

# 8. Citizen mobile navigation

Bottom navigation:

1. **Home**
2. **Invest**
3. **Portfolio**
4. **Impact**
5. **Profile**

Global:
- notifications
- support
- disclosure center

---

# 9. Mobile screen specification

## 9.1 Splash / welcome

Elements:
- InvestRI logo
- “Invest in Rhode Island. Own a stake in its future.”
- Create account
- Sign in
- Explore investments

Allow users to browse public offering summaries before KYC.

---

## 9.2 Home

Sections:
- Total portfolio value
- Total invested
- Distributions received
- Tax credits
- Featured investment
- Recent activity
- “Your Rhode Island impact”
- Latest fund update

Tax-credit card:
- Estimated / certified amount
- Next vesting date
- CTA: View tax credit details

---

## 9.3 Invest marketplace

Willow / Yieldstreet-style offering cards.

Filters:
- category
- minimum
- target term
- target return
- distribution frequency
- liquidity
- risk level
- tax-credit eligibility
- municipality
- impact category
- open / coming soon / closed

Card fields:
- fund / offering name
- hero image
- investment category
- short thesis
- target return
- minimum investment
- target term
- distribution schedule
- tax-credit badge
- residency badge
- funding progress
- close date
- risk label

Do not use gamified urgency.

---

## 9.4 Offering detail

Tabs:
1. Overview
2. Portfolio
3. Returns & Cash Flow
4. Rhode Island Impact
5. Risks
6. Documents
7. Updates

### Header
- offering name
- manager
- status
- target raise
- capital raised
- minimum
- target term
- target return
- liquidity
- distribution schedule
- fees
- tax treatment
- state tax-credit treatment

### Investment thesis
Plain-English explanation.

### Tax-credit panel
Show example:

> Illustrative: A $1,000 qualifying investment could be eligible for up to $200 of Rhode Island tax credits under the current program configuration. Eligibility, timing, certification and ability to use the credit depend on applicable law and your circumstances.

Button:
- “How the tax credit works”

### Portfolio allocation
Chart + underlying projects.

### Local project cards
Each:
- project name
- municipality
- investment type
- amount deployed
- sector
- status
- impact metrics

### Risk section
Must be visually prominent.

### Documents
- offering memorandum
- subscription agreement
- risk factors
- audited financial statements if applicable
- tax disclosure
- Commerce approval / certification
- manager documents

### CTA
“Start investment”

---

# 10. Investment workflow

State machine:

```txt
BROWSING
  -> ACCOUNT_REQUIRED
  -> IDENTITY_REQUIRED
  -> RESIDENCY_REQUIRED
  -> INVESTOR_PROFILE_REQUIRED
  -> ELIGIBILITY_CHECK
  -> REVIEW_OFFERING_DOCUMENTS
  -> ENTER_AMOUNT
  -> LIMIT_CHECK
  -> TAX_CREDIT_ESTIMATE
  -> FUNDING_SOURCE
  -> E_SIGNATURE
  -> SUBMITTED
  -> COMPLIANCE_REVIEW
  -> FUNDING_PENDING
  -> SETTLED
  -> TAX_CREDIT_PENDING
  -> TAX_CREDIT_CERTIFIED
```

## Investment amount screen

Display:
- investment amount
- minimum
- maximum permitted
- estimated fees
- estimated tax-credit eligibility
- estimated net cash outlay after future tax credit

Important:
“Net cash outlay” must be labeled illustrative and should not imply the credit is cash back.

Example:
- Investment: $1,000
- Potential RI tax credit: $200
- Cash transferred today: $1,000

---

# 11. Identity, residency and investor onboarding

## POC
Use mock verification.

## Production provider abstraction

```ts
interface IdentityProvider {
  createApplicant()
  startVerification()
  getVerificationStatus()
}

interface ResidencyProvider {
  verifyResidence()
  getEvidence()
}

interface InvestorEligibilityProvider {
  calculateInvestmentLimit()
  verifyAccreditation()
  verifySuitability()
}
```

Collect:
- legal name
- DOB
- primary residence
- SSN last four or provider token only
- phone
- email
- citizenship / required securities fields
- employment fields if required
- investment experience
- income / net-worth range when legally required
- accreditation status when legally required
- trusted contact when required
- Rhode Island residency attestation

Avoid storing full SSN if a regulated provider can tokenize it.

---

# 12. Portfolio experience

## Portfolio summary

Cards:
- Current estimated value
- Total contributions
- Total distributions
- Net investment gain/loss
- Tax credits certified
- Tax credits available
- Total local impact

Charts:
- portfolio value over time
- cash flows
- allocation by sector
- allocation by municipality

Keep tax credits OUT of investment performance charts.

---

## Individual position detail

Show:
- invested amount
- current balance / NAV
- ownership / units if relevant
- distributions
- target return
- realized performance
- estimated unrealized performance
- investment term
- maturity estimate
- next expected distribution
- status
- latest update

Tax-credit section:
- qualified basis
- potential total credit
- earned
- certified
- available
- claimed
- remaining
- next credit date
- certificate download

Documents:
- statements
- tax forms
- notices
- subscription agreement
- Commerce certificate

Activity:
- contribution
- settlement
- distribution
- valuation update
- credit earned
- certificate issued
- document published
- manager update

---

# 13. Tax Center

Create a Willow-style consolidated document center.

Categories:
- Federal tax documents
- Rhode Island tax-credit certificates
- Statements
- Offering documents
- Legal notices

Filters:
- tax year
- account
- investment
- document type

Each Rhode Island credit certificate should include:
- certificate number
- taxpayer
- tax year
- investment
- certified amount
- statutory authority
- issue date
- carryforward expiration if applicable
- Commerce approval metadata
- QR / validation code if Commerce wants external verification

---

# 14. Impact experience

This is a major differentiator from Willow.

## Impact dashboard

Hero:
**Your money at work in Rhode Island**

Metrics:
- $ invested in RI
- projects supported
- housing units
- jobs
- small businesses
- historic buildings
- municipalities

Map:
- project pins
- click-through to project detail

Project detail:
- before / after images
- description
- use of capital
- investment amount
- municipality
- project status
- key milestones
- public incentives layered into capital stack
- impact metrics
- latest update

Impact metrics must have:
- source
- reporting period
- verified / self-reported status

---

# 15. Notifications

Types:
- investment settled
- distribution received
- new NAV
- tax credit certified
- tax credit available
- statement available
- tax document available
- new manager update
- project milestone
- offering closing soon
- required action
- compliance issue

Allow notification preferences:
- push
- email
- SMS only for high-priority account security / required-action notices if legally and operationally appropriate

---

# 16. Commerce Admin Console

Separate web application.

Primary navigation:
- Dashboard
- Programs
- Offerings
- Fund Managers
- Investors
- Investments
- Tax Credits
- Projects
- Compliance
- Impact
- Reports
- Audit Log
- Configuration

---

## 16.1 Commerce dashboard

KPIs:
- registered residents
- verified RI residents
- active investors
- capital committed
- capital settled
- capital deployed
- distributions
- active offerings
- tax credits reserved
- tax credits earned
- tax credits certified
- tax credits claimed
- remaining statutory cap
- compliance exceptions
- recapture exposure

Breakdowns:
- municipality
- ZIP code
- investor size band
- age band if legally appropriate and privacy-reviewed
- investment category
- impact category

Never expose citizen PII in aggregate dashboards unnecessarily.

---

## 16.2 Offering approval workflow

States:

```txt
DRAFT
SUBMITTED
UNDER_REVIEW
CHANGES_REQUESTED
COMMERCE_APPROVED
REGULATORY_APPROVED
SCHEDULED
LIVE
PAUSED
CLOSED
MATURED
ARCHIVED
```

Commerce reviewer can:
- view manager submission
- review offering terms
- review eligibility
- review tax-credit allocation request
- approve / reject
- request changes
- set maximum credit authority
- publish
- pause

Require reason codes and audit logging for every material action.

---

## 16.3 Tax-credit console

Queues:
- pending qualification
- pending certification
- nearing annual cap
- missing evidence
- recapture review
- certificate corrections

Actions:
- approve certificate
- reject
- adjust qualified basis
- suspend
- initiate recapture review
- void / supersede certificate with reason

Bulk operations:
- annual certificate generation
- Division of Taxation export
- reconciliation import
- carryforward roll
- annual cap closeout

---

# 17. Fund-manager portal

Web app or role-scoped section of admin.

Features:
- organization profile
- team / track record
- offering creation
- upload diligence
- project pipeline
- deployment reporting
- NAV reporting
- distribution reporting
- investor update publishing
- impact reporting
- compliance attestations

Fund manager cannot directly edit certified tax credits.

---

# 18. Core data model

Use PostgreSQL.

## Identity / access

```txt
User
Role
Permission
UserRole
Session
MfaMethod
TrustedContact
```

## Investor

```txt
InvestorProfile
InvestorAccount
IdentityVerification
ResidencyVerification
InvestorEligibility
AccreditationVerification
InvestorAttestation
BankAccountReference
```

## Programs

```txt
Program
ProgramRule
TaxCreditProgram
TaxCreditSchedule
ProgramCap
ProgramCapLedger
```

## Offerings

```txt
Offering
OfferingVersion
OfferingTerm
OfferingEligibilityRule
OfferingDocument
OfferingUpdate
OfferingRisk
OfferingFee
OfferingAllocation
OfferingManager
```

## Investments

```txt
InvestmentOrder
InvestmentSubscription
InvestmentPosition
InvestmentCashFlow
Distribution
Valuation
CapitalAccount
```

## Tax credits

```txt
TaxCreditEntitlement
TaxCreditVestingEvent
TaxCreditCertificate
TaxCreditClaim
TaxCreditAdjustment
TaxCreditRecaptureCase
```

## Projects / impact

```txt
Project
ProjectLocation
ProjectInvestment
ImpactMetricDefinition
ImpactMetricReport
ImpactEvidence
```

## Compliance

```txt
ComplianceCase
ComplianceCheck
ReviewTask
Attestation
AuditEvent
```

## Documents

```txt
Document
DocumentVersion
DocumentAcknowledgement
SignatureEnvelope
```

## Integrations

```txt
ProviderConnection
ProviderEvent
WebhookEvent
ReconciliationRun
```

---

# 19. Key database fields

## Offering

```ts
Offering {
  id: UUID
  slug: string
  name: string
  shortName: string
  managerId: UUID
  framework: OfferingFramework
  status: OfferingStatus
  category: string
  description: string
  thesis: string
  minInvestment: Decimal
  maxInvestment: Decimal | null
  targetRaise: Decimal
  raisedAmount: Decimal
  targetReturnLow: Decimal | null
  targetReturnHigh: Decimal | null
  targetTermMonths: number | null
  liquidityDescription: string
  distributionFrequency: string
  riskLevel: string
  residentOnly: boolean
  taxCreditProgramId: UUID | null
  taxFormType: string | null
  openAt: DateTime | null
  closeAt: DateTime | null
}
```

## InvestmentPosition

```ts
InvestmentPosition {
  id: UUID
  investorAccountId: UUID
  offeringId: UUID
  settledAmount: Decimal
  units: Decimal | null
  costBasis: Decimal
  currentValue: Decimal
  totalDistributions: Decimal
  status: string
  openedAt: DateTime
  closedAt: DateTime | null
}
```

## TaxCreditCertificate

```ts
TaxCreditCertificate {
  id: UUID
  entitlementId: UUID
  certificateNumber: string
  taxYear: number
  certifiedAmount: Decimal
  availableAmount: Decimal
  claimedAmount: Decimal
  carryforwardExpirationYear: number | null
  issuedAt: DateTime
  status: string
  documentId: UUID
  commerceApprovedBy: UUID
  supersedesCertificateId: UUID | null
}
```

---

# 20. Domain events

Use event-driven internal workflows.

Events:
- `user.created`
- `identity.verified`
- `residency.verified`
- `investor.eligibility_updated`
- `offering.approved`
- `offering.published`
- `investment.submitted`
- `investment.approved`
- `investment.funded`
- `investment.settled`
- `position.valued`
- `distribution.posted`
- `tax_credit.entitlement_created`
- `tax_credit.vested`
- `tax_credit.certified`
- `tax_credit.claim_recorded`
- `tax_credit.recapture_review_started`
- `document.published`
- `impact.reported`
- `compliance.exception_created`

All financial and tax-credit events must be idempotent.

---

# 21. API design

REST for V1.

Base:
`/api/v1`

Citizen:
```txt
GET  /offerings
GET  /offerings/:id
POST /onboarding/identity
POST /onboarding/residency
POST /investor-profile
POST /investments/quote
POST /investments
GET  /investments/:id
GET  /portfolio
GET  /portfolio/positions/:id
GET  /tax-credits
GET  /tax-credits/:id
GET  /documents
GET  /impact
GET  /notifications
```

Commerce:
```txt
GET  /admin/dashboard
GET  /admin/offerings
POST /admin/offerings/:id/approve
POST /admin/offerings/:id/request-changes
POST /admin/offerings/:id/pause
GET  /admin/tax-credits
POST /admin/tax-credits/:id/certify
POST /admin/tax-credits/:id/adjust
POST /admin/tax-credits/:id/recapture-review
GET  /admin/compliance
GET  /admin/reports
GET  /admin/audit-events
```

Fund manager:
```txt
POST /manager/offerings
PATCH /manager/offerings/:id
POST /manager/offerings/:id/documents
POST /manager/offerings/:id/updates
POST /manager/offerings/:id/valuations
POST /manager/offerings/:id/distributions
POST /manager/projects/:id/impact
```

---

# 22. Provider adapter architecture

Create these interfaces in `/packages/providers`.

```ts
interface KycProvider {}
interface ResidencyProvider {}
interface BrokerageProvider {}
interface FundingProvider {}
interface CustodyProvider {}
interface TransferAgentProvider {}
interface FundAdminProvider {}
interface ESignatureProvider {}
interface DocumentProvider {}
interface NotificationProvider {}
interface TaxAgencyProvider {}
```

Create mock implementations for all of them.

Use feature flags:

```txt
USE_MOCK_KYC=true
USE_MOCK_BROKERAGE=true
USE_MOCK_FUNDING=true
USE_MOCK_TAX_AGENCY=true
```

The POC must run end-to-end with no third-party credentials.

---

# 23. Tech stack

## Monorepo

Turborepo + TypeScript.

```txt
/apps
  /mobile        Expo + React Native
  /admin         Next.js
  /manager       Next.js
  /api           NestJS
/packages
  /domain
  /database
  /providers
  /ui
  /config
  /validation
  /analytics
  /testing
```

## Mobile
- Expo
- React Native
- Expo Router
- TanStack Query
- React Hook Form
- Zod
- secure token storage

## Admin / manager
- Next.js
- React
- server-side role enforcement
- TanStack Table
- accessible component library

## API
- NestJS
- Prisma
- PostgreSQL
- OpenAPI
- background jobs

## Production-oriented infrastructure
Design for AWS:
- ECS / Fargate or equivalent
- RDS PostgreSQL
- S3 private buckets
- KMS
- Secrets Manager
- CloudFront
- WAF
- CloudWatch
- Cognito or enterprise identity provider
- immutable / append-only audit retention pattern

POC can run locally with Docker Compose.

---

# 24. Authentication and authorization

Citizen:
- email + password or passwordless
- MFA
- device/session management

Commerce:
- enterprise SSO
- MFA
- RBAC

Roles:
```txt
CITIZEN_INVESTOR
COMMERCE_REVIEWER
COMMERCE_PROGRAM_ADMIN
COMMERCE_TAX_ADMIN
COMPLIANCE_OFFICER
FUND_MANAGER
FUND_MANAGER_EDITOR
AUDITOR_READ_ONLY
SYSTEM_ADMIN
```

Every admin endpoint must validate permissions server-side.

---

# 25. Security requirements

Implement from day one:
- encryption in transit
- encryption at rest
- field-level encryption where appropriate
- no full SSN in logs
- no bank credentials stored
- provider tokens instead of raw secrets
- MFA
- rate limiting
- IP / device risk hooks
- audit logs
- secret rotation
- secure webhook signatures
- CSRF protections for web
- short-lived access tokens
- refresh-token rotation
- session revocation
- least-privilege IAM
- document access authorization
- private object storage
- vulnerability scanning
- dependency scanning
- SAST
- incident-event logging

Target:
- SOC 2 Type II readiness
- WCAG 2.2 AA
- NIST-aligned security controls
- state procurement security questionnaire readiness

---

# 26. Audit log

Every sensitive event records:

```ts
AuditEvent {
  id
  actorUserId
  actorRole
  action
  entityType
  entityId
  beforeJson
  afterJson
  reasonCode
  sourceIp
  userAgent
  correlationId
  createdAt
}
```

Audit events are append-only.

Important events:
- offering approval
- terms change
- tax-credit certification
- certificate void
- adjustment
- recapture
- investor eligibility override
- compliance override
- document replacement
- role change

---

# 27. Financial calculations

Use Decimal. Never binary floating point for money.

Functions:
- total contributions
- total distributions
- current position value
- unrealized gain/loss
- realized gain/loss
- XIRR for actual investment cash flows
- tax-credit qualified basis
- credit vesting
- remaining program cap

Investment returns must exclude state tax credits by default.

Allow a separate “Illustrative after-tax economic view” only if policy/legal review approves it.

---

# 28. Tax-credit calculation engine

Pure function:

```ts
calculateTaxCredit({
  qualifiedBasis,
  creditRate,
  vestingSchedule,
  holdingPeriod,
  certificationStatus,
  priorClaims,
  adjustments
})
```

Output:
```ts
{
  potentialCredit,
  earnedCredit,
  certifiedCredit,
  currentlyAvailable,
  claimedCredit,
  remainingCredit,
  nextVestingDate
}
```

Add exhaustive unit tests for:
- partial years
- early exit
- over-cap
- certificate adjustment
- carryforward
- recapture
- duplicate event
- superseded certificate

---

# 29. Program-cap engine

Commerce must never accidentally certify more credits than statutory authority.

Ledger:

```txt
AUTHORIZED
RESERVED
EARNED
CERTIFIED
CLAIMED
RELEASED
RECAPTURED
```

Rules:
- an approved offering may reserve authority
- a funded investment may reserve an investor allocation
- certification consumes available authority
- canceled / disqualified allocations release authority
- adjustments are double-entry-like ledger events, never destructive edits

---

# 30. Content and disclosure system

Do not hard-code disclosure copy into screens.

CMS-style tables:
- DisclosureTemplate
- DisclosureVersion
- OfferingDisclosure
- InvestorAcknowledgement

Every acknowledgement stores the exact document/version shown.

Examples:
- private investment risk
- illiquidity
- loss of principal
- target return disclaimer
- tax-credit disclaimer
- residency attestation
- conflicts
- privacy
- electronic delivery
- investment-specific risk factors

---

# 31. Accessibility and public-sector UX

Requirements:
- WCAG 2.2 AA
- VoiceOver / TalkBack labels
- dynamic type
- high contrast
- keyboard accessible admin
- plain-language disclosures
- no color-only status indicators
- localization-ready strings

V1 language:
- English

Architecture should support:
- Spanish
- Portuguese

---

# 32. Analytics

Citizen funnel:
- account created
- identity started
- identity passed
- residency passed
- offering viewed
- document opened
- investment started
- investment submitted
- funded
- settled

Program metrics:
- capital by municipality
- investor count
- median investment
- repeat investment rate
- dollars deployed
- tax-credit leverage ratio
- public dollars / private dollars
- economic impact
- investor retention

Do not send PII into generic analytics tools.

---

# 33. Seed data for POC

## Offering

**InvestRI Growth Fund I**

```json
{
  "name": "InvestRI Growth Fund I",
  "status": "LIVE",
  "category": "Rhode Island Growth",
  "minInvestment": 100,
  "targetRaise": 25000000,
  "raisedAmount": 7425000,
  "targetReturnLow": 0.07,
  "targetReturnHigh": 0.10,
  "targetTermMonths": 60,
  "liquidityDescription": "Long-term investment. No guaranteed early redemption.",
  "distributionFrequency": "Annual",
  "riskLevel": "Moderate-High",
  "residentOnly": true
}
```

## Tax credit — illustrative

```json
{
  "name": "InvestRI Resident Investment Credit",
  "status": "PROPOSED",
  "creditRate": 0.20,
  "vestingMethod": "ANNUAL_EQUAL",
  "carryforwardYears": 5,
  "refundable": false,
  "transferable": false,
  "residencyRequired": true,
  "minimumHoldingPeriodMonths": 48,
  "recaptureEnabled": true
}
```

## Demo projects

1. **Main Street Housing Redevelopment**
   - Pawtucket
   - historic mixed-use
   - 72 housing units
   - $3.5M InvestRI allocation

2. **Ocean Technology Expansion**
   - Newport
   - advanced manufacturing / ocean tech
   - 35 jobs
   - $1.25M InvestRI allocation

3. **Workforce Housing Fund**
   - Providence
   - multifamily housing
   - 110 units
   - $4M InvestRI allocation

4. **Rhode Island Small Business Credit Pool**
   - statewide
   - small-business loans
   - 40 businesses
   - $5M InvestRI allocation

All demo projects must be clearly labeled fictional / illustrative in the POC unless real projects have been formally approved for use.

---

# 34. Demo investor

Create seeded user:
- Name: Alex Smith
- RI resident
- Investment: $1,000
- Potential credit: $200
- Certified to date: $50
- Current value: $1,032
- Distribution received: $20
- Projects supported: 4

Demo portfolio should make the product instantly understandable.

---

# 35. Procurement demo storyline

The finished POC should support this exact 5-minute demonstration:

### 1. Citizen opens InvestRI
Sees:
- Invest in Rhode Island
- one featured fund
- $100 minimum
- local impact
- proposed tax-credit badge

### 2. Citizen explores the investment
Sees:
- return target
- term
- liquidity
- fees
- risk
- tax credit
- underlying Rhode Island projects

### 3. Citizen starts a $1,000 investment
Completes:
- mock KYC
- RI residency
- investor profile
- document review
- amount
- tax-credit illustration
- mock funding
- e-sign

### 4. Investment settles
Portfolio updates:
- $1,000 invested
- position created
- credit shown as pending Commerce certification

### 5. Commerce reviewer opens console
Sees:
- new investment
- residency verified
- tax-credit entitlement
- available program cap

Reviewer clicks:
**Certify tax credit**

### 6. Citizen receives push notification
“Your Rhode Island investment tax credit has been certified.”

Portfolio shows:
- qualified basis
- certified credit
- certificate
- vesting schedule

### 7. Citizen opens Impact
Sees a Rhode Island map with funded projects and project-level outcomes.

### 8. Commerce dashboard
Shows:
- residents investing
- private capital raised
- tax-credit authority used
- leverage
- municipalities
- housing / business / jobs impact

This is the core sales demo.

---

# 36. Phase plan for Cursor

## Phase 0 — foundation
Build:
- monorepo
- local Docker
- PostgreSQL
- Prisma
- auth skeleton
- RBAC
- shared design system
- seed command
- test framework
- OpenAPI

Done when:
- all apps boot locally
- citizen and admin can sign in
- roles work
- seed data loads

---

## Phase 1 — marketplace
Build:
- offering list
- filters
- offering detail
- docs
- risk content
- tax-credit explainer
- demo projects

Done when:
- anonymous user can browse
- logged-in user can see full offering detail
- content comes from database

---

## Phase 2 — citizen onboarding
Build:
- investor profile
- mock KYC
- mock RI residency verification
- suitability / eligibility
- acknowledgements

Done when:
- user reaches “eligible to invest”
- failed checks produce required-action states

---

## Phase 3 — invest flow
Build:
- quote
- amount validation
- tax-credit estimate
- mock bank
- mock e-sign
- investment submission
- settlement

Done when:
- $1,000 demo investment creates a position and cash-flow record
- retries are idempotent

---

## Phase 4 — portfolio
Build:
- portfolio summary
- position detail
- activity feed
- distribution records
- valuation records
- documents
- statement center

Done when:
- seeded portfolio renders
- settled investment immediately appears

---

## Phase 5 — tax-credit engine
Build:
- program config
- entitlements
- vesting
- certificate records
- certificate PDF generation
- citizen Tax Center

Done when:
- settled investment generates pending entitlement
- certification updates citizen view
- cap is enforced

---

## Phase 6 — Commerce console
Build:
- dashboard
- offering workflow
- tax-credit queue
- program cap
- compliance queue
- investor / investment search
- audit log

Done when:
- Commerce can approve a tax credit from the demo workflow
- every action is audited

---

## Phase 7 — impact
Build:
- project data
- map
- impact metrics
- manager submission
- Commerce verification
- citizen impact dashboard

Done when:
- citizen can trace investment → fund → RI projects → impact

---

## Phase 8 — polish
Build:
- notifications
- error states
- empty states
- accessibility
- responsive admin
- loading skeletons
- telemetry
- demo reset command

Done when:
- POC is presentation-ready

---

# 37. Out of scope for POC

Do not build yet:
- actual movement of money
- production brokerage integration
- real tax filing
- IRA accounts
- secondary market
- automated investment advice
- individualized recommendations
- multiple funds
- actual NAV calculation engine from raw accounting
- tax return preparation
- public trading
- crypto
- referral commissions
- social investment feed
- gamification

---

# 38. Future roadmap

## V2
- multiple funds
- direct project offerings
- recurring investment
- ACH production provider
- production KYC
- production intermediary integration
- real fund administrator statements
- annual tax reconciliation
- multilingual UI

## V3
- income fund
- historic redevelopment fund
- innovation fund
- Reg A / retail evergreen product if selected
- institutional accounts
- foundations
- family offices

## V4
- outside-state investor products
- secondary liquidity where legally permitted
- automated allocation / managed portfolio
- API for RI banks / credit unions
- employer payroll investment
- white-label version for other states

---

# 39. Product rules Cursor must never violate

1. Never represent a target return as guaranteed.
2. Never combine the value of a tax credit with investment performance.
3. Never represent a proposed tax credit as enacted.
4. Never say a user “received” a credit before certification.
5. Never allow an investment above provider / program limits.
6. Never store raw bank credentials.
7. Never log full SSN.
8. Never permit a fund manager to certify its own tax credit.
9. Never hard-delete financial, certificate, or audit records.
10. Never make admin permissions client-side only.
11. Never use floats for money.
12. Never overwrite a signed or acknowledged disclosure version.
13. Never use fake countdown timers or casino-like gamification.
14. Never make personalized investment recommendations in the POC.
15. Every regulated workflow must go through a replaceable provider adapter.

---

# 40. Recommended first prompt to Cursor

Use this after placing this file at the root of the repository:

```text
Read INVESTRI_MASTER_PLAN.md in full.

Act as the lead architect for InvestRI.

Do not implement the whole application at once.

First:
1. Produce a proposed monorepo structure.
2. Produce the Prisma schema for the Phase 0 + Phase 1 domain only.
3. Define the main domain enums and state machines.
4. Define the provider interfaces and mock-provider approach.
5. Define the authentication/RBAC approach.
6. Define the API endpoints required for Phase 1.
7. Define the seed data.
8. Identify any ambiguity or architectural risk that would block implementation.

Maintain these architectural rules:
- mobile = Expo/React Native
- admin/manager = Next.js
- API = NestJS
- Postgres + Prisma
- TypeScript monorepo
- money uses Decimal
- tax credits are separate from investment returns
- compliance logic is configurable
- securities-framework logic is data-driven
- all external regulated services use provider adapters
- POC uses mocks and no real money
- complete audit logging for material administrative actions

After you return the plan, wait for approval before writing code.
```

---

# 41. Recommended implementation sequence after architecture approval

Give Cursor one phase at a time.

Prompt pattern:

```text
Implement Phase 1 from INVESTRI_MASTER_PLAN.md.

Before coding:
- state the exact files you will create or modify
- list database migrations
- list API contracts
- list UI routes/screens
- list tests

Then implement only Phase 1.

Run:
- typecheck
- lint
- unit tests
- API tests
- build

Fix all failures.

At the end:
- summarize completed work
- show remaining Phase 1 gaps
- do not begin Phase 2
```

Repeat for each phase.

---

# 42. Product design direction

Visual tone:
- institutional, trustworthy, modern
- premium fintech rather than government portal
- Rhode Island identity without looking like a tourism app
- white / warm neutral backgrounds
- deep navy / ocean-inspired primary palette
- restrained green for positive financial status
- strong typography
- large numeric portfolio summaries
- polished investment cards
- generous spacing
- excellent charts
- real project photography

Do not copy Willow assets, logos, copy, illustrations, or proprietary visual identity.

Borrow the product conventions:
- clean investment marketplace
- high-information offering cards
- detailed diligence pages
- portfolio + activity
- tax / statement center
- professional alternative-investment feel

Then make InvestRI distinctly public-purpose through:
- Rhode Island project map
- state tax-credit ledger
- municipal impact
- Commerce certification
- transparency / public oversight

---

# 43. North-star product outcome

A Rhode Island resident should be able to open InvestRI and understand in under 60 seconds:

1. **What can I invest in?**
2. **What return might I earn?**
3. **How long is my money tied up?**
4. **What could I lose?**
5. **What Rhode Island tax benefit might I receive?**
6. **Where is my money going in Rhode Island?**
7. **How do I track my investment, documents, distributions, and tax credit?**

A Commerce executive should be able to open the admin console and understand in under 60 seconds:

1. **How much private capital has been mobilized?**
2. **Who is participating?**
3. **Where is the capital going?**
4. **How much tax-credit authority has been used?**
5. **Are funds and projects compliant?**
6. **What measurable economic impact has been created?**

That is InvestRI.
