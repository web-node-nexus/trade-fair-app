export type EventContact = {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  roleLabel?: string | null;
};

export type EventContactDraft = EventContact & { key: string };

export function newContactDraft(): EventContactDraft {
  const key = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { key, name: "", phone: "", email: "", roleLabel: "" };
}

export function contactsToPayload(drafts: EventContactDraft[]): EventContact[] {
  return drafts
    .map((c) => ({
      name: c.name.trim(),
      phone: c.phone.trim(),
      email: c.email?.trim() || null,
      roleLabel: c.roleLabel?.trim() || null,
    }))
    .filter((c) => c.name && c.phone);
}

export function draftsFromContacts(contacts: EventContact[]): EventContactDraft[] {
  if (!contacts.length) return [newContactDraft()];
  return contacts.map((c) => ({
    key: c.id ?? `c-${c.name}-${c.phone}`,
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email ?? "",
    roleLabel: c.roleLabel ?? "",
  }));
}
