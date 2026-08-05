import PolicyPage from "@/components/legal/PolicyPage";

export const metadata = {
  title: "Privacy Policy — ResumePro",
  description: "How ResumePro collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy" updated="August 5, 2026">
      <p>
        This Privacy Policy explains how ResumePro, operated by Manikandan Arumugam (Chennai, Tamil Nadu,
        India), collects, uses, and protects your information.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — name, email address, phone number, and a hashed password (or
          Google account ID if you sign in with Google).
        </li>
        <li>
          <strong>Resume content</strong> — the work history, education, skills, and other details you enter
          to build your resume, plus an optional profile photo.
        </li>
        <li>
          <strong>Payment metadata</strong> — plan purchased, amount, and Razorpay order/payment IDs. We never
          receive or store your card, UPI, or bank account details — those are handled entirely by Razorpay.
        </li>
        <li>
          <strong>Usage data</strong> — basic technical information (such as session cookies) needed to keep
          you signed in.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide the Service — generating and storing your resumes and account.</li>
        <li>To process payments and activate paid plan features.</li>
        <li>To send account-related emails (e.g. payment receipts, password resets).</li>
        <li>To respond to support requests.</li>
      </ul>

      <h2>3. Third-party services we use</h2>
      <p>We rely on the following processors to run the Service. Each only receives the data needed for its role:</p>
      <ul>
        <li>
          <strong>Razorpay</strong> — payment processing for paid plans.
        </li>
        <li>
          <strong>Google OAuth</strong> — optional sign-in with your Google account.
        </li>
        <li>
          <strong>Cloudinary</strong> — hosting for profile photos you upload.
        </li>
        <li>
          <strong>Email delivery (SMTP)</strong> — sending transactional emails such as receipts.
        </li>
        <li>
          <strong>Database hosting</strong> — secure storage of your account and resume data.
        </li>
      </ul>

      <h2>4. Cookies</h2>
      <p>
        We use a session cookie to keep you signed in. We do not use third-party advertising or tracking
        cookies.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We keep your account and resume data for as long as your account is active. You can delete individual
        resumes at any time from your dashboard, or request full account deletion by contacting us.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You can access, correct, or delete your personal data at any time. To request a copy of your data or
        full account deletion, email{" "}
        <a href="mailto:manikandan.arumugam0001@gmail.com">manikandan.arumugam0001@gmail.com</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        Passwords are stored hashed, not in plain text. Payment details are never handled by our servers —
        they go directly to Razorpay over an encrypted connection.
      </p>

      <h2>8. Children&apos;s privacy</h2>
      <p>The Service is not directed at children under 16.</p>

      <h2>9. Changes to this policy</h2>
      <p>We may update this Privacy Policy from time to time. Material changes will be reflected here with an updated date.</p>

      <h2>10. Contact</h2>
      <p>
        Questions about this policy? Reach us at{" "}
        <a href="mailto:manikandan.arumugam0001@gmail.com">manikandan.arumugam0001@gmail.com</a> or via our{" "}
        <a href="/contact">Contact page</a>.
      </p>
    </PolicyPage>
  );
}
