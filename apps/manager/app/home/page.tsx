import Link from "next/link";

export default function ManagerHome() {
  return (
    <main className="min-h-screen px-8 py-10">
      <p className="label">Manager portal</p>
      <h1 className="font-display text-4xl mt-2">Narragansett Partners</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-navy/70">
        Submit project metrics for Commerce verification. Fund managers cannot certify tax credits
        or verify their own impact reports.
      </p>
      <ul className="mt-12 border-t border-hairline">
        <li className="border-b border-hairline py-4 text-sm">
          <Link href="/impact" className="underline">
            Impact / Projects
          </Link>
        </li>
        {["Organization", "Offerings", "NAV reporting", "Distributions", "Investor updates"].map((item) => (
          <li key={item} className="border-b border-hairline py-4 text-sm">
            {item}
            <span className="ml-3 label">Coming later</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
