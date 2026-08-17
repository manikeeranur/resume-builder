import AdminChatInbox from "@/components/admin/AdminChatInbox";

// Full-bleed, unlike every other admin page — cancels the shared layout's
// own padding (see app/admin/(protected)/layout.jsx) and fills all
// remaining viewport height via that layout's flex-1, instead of leaving
// the inbox boxed into a short, padded card.
export default function AdminChatsPage() {
  return (
    <div className="-mx-4 -my-8 flex min-h-0 flex-1 flex-col overflow-hidden sm:-mx-6">
      <AdminChatInbox />
    </div>
  );
}
