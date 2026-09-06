# InvestRI five-minute walkthrough

Reset first so leftover investments and certificates do not remain:

```bash
pnpm demo:reset
```

Password for every seeded account: `DemoPass123!`

| Step | Where | What to show |
| --- | --- | --- |
| 1. Browse | Mobile → Invest | Growth Fund I. Economics and the proposed tax credit stay separate. |
| 2. Onboard | Sign in as `alex.smith@demo.investri.ri` or register | Alex is already Eligible to invest. |
| 3. Invest | Amount → review → fund → sign | $1,000 demo subscription settles immediately. |
| 4. Portfolio | Home / Portfolio | $1,000 invested, $1,032 value, $20 distribution. Credits are not in the chart. |
| 5. Certify | Admin http://localhost:3003 as `reviewer@commerce.ri.gov` | Tax Credits → Certify with reason `DEMO_POC`. |
| 6. Inbox | Mobile notifications | “Your Rhode Island investment tax credit has been certified.” |
| 7. Impact | Impact tab | $13.75M deployed, 182 units, 35 jobs, 40 businesses, 3 municipalities. Do not attribute units to $1,000. |
| 8. Reset | `pnpm demo:reset` | Restores Alex and the four projects for the next presenter. |

Admin: http://localhost:3003 · Manager: http://localhost:3002 · API: http://localhost:3001/api/v1
