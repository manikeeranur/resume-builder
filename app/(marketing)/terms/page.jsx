import PolicyPage from "@/components/legal/PolicyPage";

export const metadata = {
  title: "Terms of Service — ResumePro",
  description: "Terms and conditions for using ResumePro.",
};

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service" updated="August 5, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of ResumePro (the &quot;Service&quot;), operated
        by Manikandan Arumugam (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), based in Chennai, Tamil Nadu,
        India. By creating an account or using the Service, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        ResumePro is a web application that lets you create, customize, and download resumes as PDF documents
        using pre-built templates. Some templates and features are free; others require an active paid plan.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for keeping your login credentials confidential.</li>
        <li>You must be at least 16 years old to use the Service.</li>
      </ul>

      <h2>3. Plans and payments</h2>
      <p>
        Free-plan usage is limited (see our <a href="/pricing">Pricing</a> page for current limits). Paid plans
        unlock additional features for a fixed period (monthly or yearly) and are billed as a one-time charge
        per period — plans do not auto-renew or charge you automatically. Payments are processed securely
        through Razorpay; we do not store your card or bank details. See our{" "}
        <a href="/refund-policy">Cancellation &amp; Refund Policy</a> for details on refunds.
      </p>

      <h2>4. Your content</h2>
      <p>
        You retain ownership of the resume content you enter (your work history, education, and other
        personal details). We store this content to provide the Service to you and do not sell it to third
        parties. See our <a href="/privacy-policy">Privacy Policy</a> for details on how we handle your data.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        You agree not to misuse the Service — including attempting to disrupt it, access other users&apos;
        accounts, or use it for unlawful purposes.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        The ResumePro name, templates, and software are our property or licensed to us. You may not copy,
        resell, or redistribute the templates or platform itself outside of using the Service as intended.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or terminate
        accounts that violate these Terms.
      </p>

      <h2>8. Disclaimer and limitation of liability</h2>
      <p>
        The Service is provided &quot;as is&quot;. We do not guarantee that a resume created with ResumePro
        will result in a job offer or interview. To the extent permitted by law, we are not liable for
        indirect or consequential damages arising from your use of the Service.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service after a change means you
        accept the updated Terms.
      </p>

      <h2>10. Governing law</h2>
      <p>These Terms are governed by the laws of India, with courts in Chennai, Tamil Nadu having jurisdiction.</p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Reach us at{" "}
        <a href="mailto:manikandan.arumugam0001@gmail.com">manikandan.arumugam0001@gmail.com</a> or via our{" "}
        <a href="/contact">Contact page</a>.
      </p>
    </PolicyPage>
  );
}
