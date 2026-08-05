import PolicyPage from "@/components/legal/PolicyPage";

export const metadata = {
  title: "Contact Us — ResumePro",
  description: "Get in touch with ResumePro support.",
};

export default function ContactPage() {
  return (
    <PolicyPage title="Contact Us">
      <p>
        ResumePro is operated by Manikandan Arumugam, based in Chennai, Tamil Nadu, India. We&apos;re happy to
        help with account issues, billing questions, or general feedback.
      </p>

      <h2>Support email</h2>
      <p>
        <a href="mailto:manikandan.arumugam0001@gmail.com">manikandan.arumugam0001@gmail.com</a>
      </p>
      <p>We typically respond within 1–2 business days.</p>

      <h2>Business address</h2>
      <p>Chennai, Tamil Nadu, India</p>

      <h2>Before you write in</h2>
      <ul>
        <li>
          For billing or payment issues, include the email address on your account and, if available, the
          payment ID from your invoice.
        </li>
        <li>For refund requests, see our Cancellation &amp; Refund Policy.</li>
      </ul>
    </PolicyPage>
  );
}
